import {
  confirmPendingTransactionUseCase,
  discardPendingTransactionUseCase,
} from "../../../src/application/use-cases/ConfirmPendingTransactionUseCase";
import type { CreditCardRecord } from "../../../src/domain/entities/CreditCard";
import type { PendingTransactionRecord } from "../../../src/domain/entities/PendingTransaction";
import { NotFoundError } from "../../../src/domain/errors";
import type {
  CategoryRecord,
  ICategoryRepository,
} from "../../../src/domain/repositories/ICategoryRepository";
import type { ICreditCardPurchaseRepository } from "../../../src/domain/repositories/ICreditCardPurchaseRepository";
import type { IMerchantCategoryMemory } from "../../../src/domain/repositories/IMerchantCategoryMemory";
import type { IPendingTransactionRepository } from "../../../src/domain/repositories/IPendingTransactionRepository";
import type { ITransactionRepository } from "../../../src/domain/repositories/ITransactionRepository";

const PENDING: PendingTransactionRecord = {
  id: "pending-1",
  personId: "person-1",
  amount: 12.5,
  occurredAt: new Date("2026-11-17T01:30:00Z"),
  occurredOn: new Date("2026-11-16"),
  merchant: "Padaria Sao Joao",
  cardName: "Nubank",
  creditCardId: "card-1",
  suggestedCategoryId: "cat-leaf",
  status: "PENDING",
  createdAt: new Date("2026-11-16T12:00:00Z"),
  resolvedAt: null,
};

const FIXED_CARD: CreditCardRecord = {
  id: "card-1",
  name: "Nubank",
  closureType: "FIXED",
  fixedClosureDay: 10,
  fixedClosurePreviousMonth: false,
  dueDayOfMonth: 17,
  closureNextMonth: false,
  createdAt: new Date("2026-01-01"),
};

const VARIABLE_CARD: CreditCardRecord = {
  ...FIXED_CARD,
  closureType: "VARIABLE",
  fixedClosureDay: null,
};

const CATEGORIES: CategoryRecord[] = [
  {
    id: "cat-parent",
    name: "Food",
    parentId: null,
    level: 0,
    householdId: "default",
    createdAt: new Date(),
  },
  {
    id: "cat-leaf",
    name: "Bakery",
    parentId: "cat-parent",
    level: 1,
    householdId: "default",
    createdAt: new Date(),
  },
];

const baseInput = {
  id: "pending-1",
  recordId: "record-1",
  categoryId: "cat-leaf" as string | null,
  creditCardId: null as string | null,
};

function makeDeps(
  options: {
    pending?: PendingTransactionRecord | null;
    claimed?: boolean;
    card?: CreditCardRecord;
  } = {},
) {
  const pending = {
    saveIfNew: jest.fn(),
    findById: jest
      .fn()
      .mockResolvedValue(options.pending === undefined ? PENDING : options.pending),
    findPending: jest.fn(),
    resolve: jest.fn().mockResolvedValue(options.claimed ?? true),
    reopen: jest.fn().mockResolvedValue(undefined),
  } satisfies IPendingTransactionRepository;

  const transactions = {
    findById: jest.fn(),
    findByMonth: jest.fn(),
    findByPersonAndMonth: jest.fn().mockResolvedValue([]),
    findByYear: jest.fn(),
    findByPersonAndYear: jest.fn(),
    save: jest.fn().mockImplementation(async (record: object) => ({ ...record })),
    update: jest.fn(),
    delete: jest.fn(),
  } satisfies ITransactionRepository;

  const purchases = {
    save: jest.fn().mockImplementation(async (purchase: object) => ({ ...purchase })),
    findPurchasesByPersonAndMonth: jest.fn().mockResolvedValue([]),
  };

  const creditCards = {
    findById: jest.fn().mockResolvedValue(options.card ?? FIXED_CARD),
  };

  const categories = {
    findAll: jest.fn().mockResolvedValue(CATEGORIES),
    findById: jest.fn(),
    findRootByName: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } satisfies ICategoryRepository;

  const memory = {
    suggest: jest.fn(),
    learn: jest.fn().mockResolvedValue(undefined),
  } satisfies IMerchantCategoryMemory;

  return {
    mocks: { pending, transactions, purchases, creditCards, categories, memory },
    deps: {
      pending,
      transactions,
      categories,
      purchases: purchases as unknown as ICreditCardPurchaseRepository,
      creditCards: creditCards as never,
      categoryMemory: memory,
    } as Parameters<typeof confirmPendingTransactionUseCase>[1],
  };
}

describe("confirmPendingTransactionUseCase", () => {
  it("records a debit-card expense from the pending purchase and marks it confirmed", async () => {
    const { deps, mocks } = makeDeps();

    const result = await confirmPendingTransactionUseCase(baseInput, deps);

    expect(result).toMatchObject({ kind: "expense", recordId: "record-1", isDuplicate: false });
    expect(mocks.transactions.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "record-1",
        type: "EXPENSE",
        personId: "person-1",
        amount: 12.5,
        description: "Padaria Sao Joao",
        paymentMethod: "DEBIT_CARD",
        categoryId: "cat-leaf",
      }),
    );
    expect(mocks.pending.resolve).toHaveBeenCalledWith("pending-1", "CONFIRMED", expect.any(Date));
    expect(mocks.memory.learn).toHaveBeenCalledWith("Padaria Sao Joao", "cat-leaf");
  });

  it("uses the payment method the user chose", async () => {
    const { deps, mocks } = makeDeps();

    await confirmPendingTransactionUseCase({ ...baseInput, paymentMethod: "PIX" }, deps);

    expect(mocks.transactions.save).toHaveBeenCalledWith(
      expect.objectContaining({ paymentMethod: "PIX" }),
    );
  });

  it("records a single-installment credit card purchase when a card is chosen", async () => {
    const { deps, mocks } = makeDeps();

    const result = await confirmPendingTransactionUseCase(
      { ...baseInput, creditCardId: "card-1" },
      deps,
    );

    expect(result).toMatchObject({ kind: "credit", recordId: "record-1" });
    expect(mocks.transactions.save).not.toHaveBeenCalled();
    expect(mocks.purchases.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "record-1",
        personId: "person-1",
        totalAmount: 12.5,
        numberOfInstallments: 1,
        creditCardId: "card-1",
        categoryId: "cat-leaf",
        description: "Padaria Sao Joao",
      }),
      [expect.objectContaining({ installmentNumber: 1, amount: 12.5 })],
    );
  });

  it("bills a variable-closure card on the month the user picked", async () => {
    const { deps, mocks } = makeDeps({ card: VARIABLE_CARD });

    await confirmPendingTransactionUseCase(
      { ...baseInput, creditCardId: "card-1", billingMonth: { year: 2026, month: 12 } },
      deps,
    );

    expect(mocks.purchases.save).toHaveBeenCalledWith(expect.anything(), [
      expect.objectContaining({ dueYear: 2026, dueMonth: 12 }),
    ]);
  });

  it("reopens the pending purchase when a variable-closure card has no billing month", async () => {
    const { deps, mocks } = makeDeps({ card: VARIABLE_CARD });

    await expect(
      confirmPendingTransactionUseCase({ ...baseInput, creditCardId: "card-1" }, deps),
    ).rejects.toThrow("Billing month is required for variable-closure cards");

    expect(mocks.pending.reopen).toHaveBeenCalledWith("pending-1");
    expect(mocks.purchases.save).not.toHaveBeenCalled();
    expect(mocks.memory.learn).not.toHaveBeenCalled();
  });

  it("reopens the pending purchase when the category is not a leaf", async () => {
    const { deps, mocks } = makeDeps();

    await expect(
      confirmPendingTransactionUseCase({ ...baseInput, categoryId: "cat-parent" }, deps),
    ).rejects.toThrow("Expense must use the most specific category");

    expect(mocks.pending.reopen).toHaveBeenCalledWith("pending-1");
  });

  it("reopens the pending purchase when a credit card purchase uses a non-leaf category", async () => {
    const { deps, mocks } = makeDeps();

    await expect(
      confirmPendingTransactionUseCase(
        { ...baseInput, creditCardId: "card-1", categoryId: "cat-parent" },
        deps,
      ),
    ).rejects.toThrow("Expense must use the most specific category");

    expect(mocks.pending.reopen).toHaveBeenCalledWith("pending-1");
    expect(mocks.purchases.save).not.toHaveBeenCalled();
  });

  it("flags a possible duplicate without blocking the entry", async () => {
    const { deps, mocks } = makeDeps();
    mocks.transactions.findByPersonAndMonth.mockResolvedValue([
      {
        id: "old",
        personId: "person-1",
        type: "EXPENSE",
        amount: 12.5,
        date: new Date("2026-11-16"),
        description: "Other",
        paymentMethod: "CASH",
        source: null,
        categoryId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await confirmPendingTransactionUseCase(baseInput, deps);

    expect(result.isDuplicate).toBe(true);
    expect(mocks.transactions.save).toHaveBeenCalledTimes(1);
  });

  it("does not learn anything when confirmed without a category", async () => {
    const { deps, mocks } = makeDeps();

    await confirmPendingTransactionUseCase({ ...baseInput, categoryId: null }, deps);

    expect(mocks.memory.learn).not.toHaveBeenCalled();
    expect(mocks.transactions.save).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: null }),
    );
  });

  it("still confirms when remembering the category fails", async () => {
    const { deps, mocks } = makeDeps();
    mocks.memory.learn.mockRejectedValue(new Error("db down"));

    await expect(confirmPendingTransactionUseCase(baseInput, deps)).resolves.toMatchObject({
      kind: "expense",
    });
    expect(mocks.pending.reopen).not.toHaveBeenCalled();
  });

  it("throws NotFoundError for an unknown pending purchase", async () => {
    const { deps, mocks } = makeDeps({ pending: null });

    await expect(confirmPendingTransactionUseCase(baseInput, deps)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(mocks.pending.resolve).not.toHaveBeenCalled();
  });

  it("refuses a purchase that was already resolved", async () => {
    const { deps, mocks } = makeDeps({ pending: { ...PENDING, status: "CONFIRMED" } });

    await expect(confirmPendingTransactionUseCase(baseInput, deps)).rejects.toThrow(
      "already resolved",
    );
    expect(mocks.pending.resolve).not.toHaveBeenCalled();
    expect(mocks.transactions.save).not.toHaveBeenCalled();
  });

  it("creates nothing when another request resolved the purchase first", async () => {
    const { deps, mocks } = makeDeps({ claimed: false });

    await expect(confirmPendingTransactionUseCase(baseInput, deps)).rejects.toThrow(
      "already resolved",
    );
    expect(mocks.transactions.save).not.toHaveBeenCalled();
    expect(mocks.pending.reopen).not.toHaveBeenCalled();
  });
});

describe("discardPendingTransactionUseCase", () => {
  it("marks the pending purchase discarded", async () => {
    const { mocks } = makeDeps();

    await discardPendingTransactionUseCase("pending-1", mocks.pending);

    expect(mocks.pending.resolve).toHaveBeenCalledWith("pending-1", "DISCARDED", expect.any(Date));
  });

  it("throws NotFoundError for an unknown pending purchase", async () => {
    const { mocks } = makeDeps({ pending: null });

    await expect(discardPendingTransactionUseCase("nope", mocks.pending)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("refuses a purchase that was already resolved", async () => {
    const { mocks } = makeDeps({ claimed: false });

    await expect(discardPendingTransactionUseCase("pending-1", mocks.pending)).rejects.toThrow(
      "already resolved",
    );
  });
});
