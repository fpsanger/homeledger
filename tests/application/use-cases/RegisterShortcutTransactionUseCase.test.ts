import { registerShortcutTransactionUseCase } from "../../../src/application/use-cases/RegisterShortcutTransactionUseCase";
import type { CreditCardRecord } from "../../../src/domain/entities/CreditCard";
import type { PendingTransactionRecord } from "../../../src/domain/entities/PendingTransaction";
import type { ICreditCardRepository } from "../../../src/domain/repositories/ICreditCardRepository";
import type { IMerchantCategoryMemory } from "../../../src/domain/repositories/IMerchantCategoryMemory";
import type { IPendingTransactionRepository } from "../../../src/domain/repositories/IPendingTransactionRepository";

const NUBANK: CreditCardRecord = {
  id: "card-nu",
  name: "Nubank",
  closureType: "FIXED",
  fixedClosureDay: 10,
  fixedClosurePreviousMonth: false,
  dueDayOfMonth: 17,
  closureNextMonth: false,
  createdAt: new Date("2026-01-01"),
};

const baseInput = {
  id: "pending-1",
  personId: "person-1",
  amount: "R$ 12,50",
  merchant: "Padaria Sao Joao",
  cardName: "Nubank Mastercard 1234",
  occurredAt: new Date("2026-11-17T01:30:00Z"),
  occurredOn: new Date("2026-11-16"),
};

function makePendingRepo(created = true): IPendingTransactionRepository {
  return {
    saveIfNew: jest.fn().mockImplementation(async (record: PendingTransactionRecord) => ({
      record,
      created,
    })),
    findById: jest.fn(),
    findPending: jest.fn(),
    resolve: jest.fn(),
    reopen: jest.fn(),
  };
}

function makeCardRepo(cards: CreditCardRecord[]): ICreditCardRepository {
  return {
    save: jest.fn(),
    update: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn().mockResolvedValue(cards),
    delete: jest.fn(),
    hasPurchases: jest.fn(),
  };
}

function makeMemory(suggestion: string | null): IMerchantCategoryMemory {
  return {
    suggest: jest.fn().mockResolvedValue(suggestion),
    learn: jest.fn().mockResolvedValue(undefined),
  };
}

describe("registerShortcutTransactionUseCase", () => {
  it("stores a PENDING purchase with the parsed amount, matched card and suggested category", async () => {
    const pending = makePendingRepo();
    const memory = makeMemory("cat-food");

    const result = await registerShortcutTransactionUseCase(baseInput, {
      pending,
      creditCards: makeCardRepo([NUBANK]),
      categoryMemory: memory,
    });

    expect(result.created).toBe(true);
    expect(result.record).toMatchObject({
      id: "pending-1",
      personId: "person-1",
      amount: 12.5,
      merchant: "Padaria Sao Joao",
      cardName: "Nubank Mastercard 1234",
      creditCardId: "card-nu",
      suggestedCategoryId: "cat-food",
      status: "PENDING",
    });
    expect(memory.suggest).toHaveBeenCalledWith("Padaria Sao Joao");
    expect(pending.saveIfNew).toHaveBeenCalledTimes(1);
  });

  it("leaves the card empty when the wallet card matches no registered card", async () => {
    const result = await registerShortcutTransactionUseCase(
      { ...baseInput, cardName: "Santander Visa" },
      {
        pending: makePendingRepo(),
        creditCards: makeCardRepo([NUBANK]),
        categoryMemory: makeMemory(null),
      },
    );

    expect(result.record.creditCardId).toBeNull();
  });

  it("leaves the category empty when nothing is known about the merchant", async () => {
    const result = await registerShortcutTransactionUseCase(baseInput, {
      pending: makePendingRepo(),
      creditCards: makeCardRepo([NUBANK]),
      categoryMemory: makeMemory(null),
    });

    expect(result.record.suggestedCategoryId).toBeNull();
  });

  it("still stores the purchase when the category suggestion lookup fails", async () => {
    const memory = makeMemory(null);
    (memory.suggest as jest.Mock).mockRejectedValue(new Error("db down"));

    const result = await registerShortcutTransactionUseCase(baseInput, {
      pending: makePendingRepo(),
      creditCards: makeCardRepo([NUBANK]),
      categoryMemory: memory,
    });

    expect(result.created).toBe(true);
    expect(result.record.suggestedCategoryId).toBeNull();
  });

  it("reports created=false when the same purchase was already reported", async () => {
    const result = await registerShortcutTransactionUseCase(baseInput, {
      pending: makePendingRepo(false),
      creditCards: makeCardRepo([NUBANK]),
      categoryMemory: makeMemory(null),
    });

    expect(result.created).toBe(false);
  });

  it.each([
    ["an unreadable amount", { amount: "abc" }, "Amount must be a positive number"],
    ["a blank merchant", { merchant: "  " }, "Merchant is required"],
    ["a missing person", { personId: "" }, "Person is required"],
  ])("stores nothing for %s", async (_label, override, message) => {
    const pending = makePendingRepo();

    await expect(
      registerShortcutTransactionUseCase(
        { ...baseInput, ...override },
        { pending, creditCards: makeCardRepo([NUBANK]), categoryMemory: makeMemory(null) },
      ),
    ).rejects.toThrow(message);
    expect(pending.saveIfNew).not.toHaveBeenCalled();
  });
});
