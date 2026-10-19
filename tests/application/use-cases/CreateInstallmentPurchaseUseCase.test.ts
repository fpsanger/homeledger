import { createInstallmentPurchaseUseCase } from "../../../src/application/use-cases/CreateInstallmentPurchaseUseCase";
import type { CreditCardRecord } from "../../../src/domain/entities/CreditCard";
import type {
  CreditCardPurchaseRecord,
  ICreditCardPurchaseRepository,
} from "../../../src/domain/repositories/ICreditCardPurchaseRepository";
import type { ICreditCardRepository } from "../../../src/domain/repositories/ICreditCardRepository";

const BASE_INPUT = {
  id: "purchase-1",
  personId: "person-1",
  totalAmount: 100,
  numberOfInstallments: 1,
  description: "",
  categoryId: null,
  creditCardId: "card-1",
};

const VARIABLE_CARD: CreditCardRecord = {
  id: "card-1",
  name: "C6 Bank",
  closureType: "VARIABLE",
  fixedClosureDay: null,
  dueDayOfMonth: 10,
  closureNextMonth: false,
  fixedClosurePreviousMonth: false,
  createdAt: new Date(),
};

function makeCardRepo(card: CreditCardRecord): ICreditCardRepository {
  return {
    findById: jest.fn().mockResolvedValue(card),
    save: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn(),
    delete: jest.fn(),
    hasPurchases: jest.fn(),
  };
}

type DueInstallment = { dueYear: number; dueMonth: number };

function installmentsOf(record: unknown): DueInstallment[] {
  return (record as { installments: DueInstallment[] }).installments;
}

function makePurchaseRepo(): ICreditCardPurchaseRepository {
  return {
    save: jest
      .fn()
      .mockImplementation((_purchase: unknown, installments: unknown[]) =>
        Promise.resolve({ ...(_purchase as object), installments }),
      ),
    findAllInstallmentsByMonth: jest.fn(),
    findInstallmentsByMonth: jest.fn(),
    findAllInstallmentsByPurchaseMonth: jest.fn(),
    findInstallmentsByPurchaseMonth: jest.fn(),
    findAllInstallmentsByTransactionMonth: jest.fn(),
    findInstallmentsByTransactionMonth: jest.fn(),
    findAllInstallmentsByYear: jest.fn(),
    findInstallmentsByYear: jest.fn(),
    findAllInstallmentsByTransactionYear: jest.fn(),
    findInstallmentsByTransactionYear: jest.fn(),
    updatePurchase: jest.fn(),
    deletePurchase: jest.fn(),
    markInstallmentPaid: jest.fn(),
    markInstallmentsPaid: jest.fn(),
    markInstallmentsUnpaid: jest.fn(),
    deleteInstallment: jest.fn(),
    findByPurchaseId: jest.fn(),
    updateInstallment: jest.fn(),
    findAllPurchasesWithInstallments: jest.fn(),
    findPurchasesByPersonAndMonth: jest.fn().mockResolvedValue([]),
    findPurchaseById: jest.fn().mockResolvedValue(null),
  };
}

const FIXED_CARD: CreditCardRecord = {
  id: "card-1",
  name: "Nubank",
  closureType: "FIXED",
  fixedClosureDay: 10,
  dueDayOfMonth: 17,
  closureNextMonth: false,
  fixedClosurePreviousMonth: false,
  createdAt: new Date(),
};

const FIXED_CARD_PREV_MONTH: CreditCardRecord = {
  id: "card-1",
  name: "Nubank",
  closureType: "FIXED",
  fixedClosureDay: 27,
  dueDayOfMonth: 10,
  closureNextMonth: false,
  fixedClosurePreviousMonth: true,
  createdAt: new Date(),
};

describe("createInstallmentPurchaseUseCase — duplicate detection", () => {
  it("returns isDuplicate=true when same amount, date, and card exist", async () => {
    const existingPurchase: CreditCardPurchaseRecord = {
      id: "purchase-existing",
      personId: "person-1",
      creditCardId: "card-1",
      description: "Other purchase",
      totalAmount: 100,
      numberOfInstallments: 1,
      purchaseDate: new Date("2026-05-04"),
      categoryId: null,
      createdAt: new Date(),
    };
    const cardRepo = makeCardRepo(FIXED_CARD);
    const purchaseRepo = {
      ...makePurchaseRepo(),
      findPurchasesByPersonAndMonth: jest.fn().mockResolvedValue([existingPurchase]),
    };

    const result = await createInstallmentPurchaseUseCase(
      { ...BASE_INPUT, purchaseDate: new Date("2026-05-04") },
      purchaseRepo,
      cardRepo,
    );
    expect(result.isDuplicate).toBe(true);
    expect(result.record.id).toBe("purchase-1");
  });

  it("returns isDuplicate=false when same amount but different card", async () => {
    const existingPurchase: CreditCardPurchaseRecord = {
      id: "purchase-existing",
      personId: "person-1",
      creditCardId: "card-2",
      description: "Other purchase",
      totalAmount: 100,
      numberOfInstallments: 1,
      purchaseDate: new Date("2026-05-04"),
      categoryId: null,
      createdAt: new Date(),
    };
    const cardRepo = makeCardRepo(FIXED_CARD);
    const purchaseRepo = {
      ...makePurchaseRepo(),
      findPurchasesByPersonAndMonth: jest.fn().mockResolvedValue([existingPurchase]),
    };

    const result = await createInstallmentPurchaseUseCase(
      { ...BASE_INPUT, purchaseDate: new Date("2026-05-04") },
      purchaseRepo,
      cardRepo,
    );
    expect(result.isDuplicate).toBe(false);
    expect(result.record.id).toBe("purchase-1");
  });
});

describe("createInstallmentPurchaseUseCase — split purchases", () => {
  it("persists one installment per person per installment number", async () => {
    const cardRepo = makeCardRepo(FIXED_CARD);
    const purchaseRepo = makePurchaseRepo();

    const result = await createInstallmentPurchaseUseCase(
      {
        id: "purchase-1",
        splits: [
          { personId: "ana", amount: 200 },
          { personId: "bob", amount: 100 },
        ],
        totalAmount: 300,
        numberOfInstallments: 3,
        description: "",
        categoryId: null,
        creditCardId: "card-1",
        purchaseDate: new Date("2026-05-04"),
      },
      purchaseRepo,
      cardRepo,
    );

    const installments = (
      result.record as unknown as { installments: { personId: string; amount: number }[] }
    ).installments;
    expect(installments.filter((i) => i.personId === "ana")).toHaveLength(3);
    expect(installments.filter((i) => i.personId === "bob")).toHaveLength(3);
  });

  it("flags a duplicate when any split person already has a matching purchase", async () => {
    const existingPurchase: CreditCardPurchaseRecord = {
      id: "purchase-existing",
      personId: "bob",
      creditCardId: "card-1",
      description: "Other purchase",
      totalAmount: 300,
      numberOfInstallments: 3,
      purchaseDate: new Date("2026-05-04"),
      categoryId: null,
      createdAt: new Date(),
    };
    const cardRepo = makeCardRepo(FIXED_CARD);
    const purchaseRepo = {
      ...makePurchaseRepo(),
      findPurchasesByPersonAndMonth: jest
        .fn()
        .mockImplementation((personId: string) =>
          Promise.resolve(personId === "bob" ? [existingPurchase] : []),
        ),
    };

    const result = await createInstallmentPurchaseUseCase(
      {
        id: "purchase-1",
        splits: [
          { personId: "ana", amount: 200 },
          { personId: "bob", amount: 100 },
        ],
        totalAmount: 300,
        numberOfInstallments: 3,
        description: "",
        categoryId: null,
        creditCardId: "card-1",
        purchaseDate: new Date("2026-05-04"),
      },
      purchaseRepo,
      cardRepo,
    );

    expect(result.isDuplicate).toBe(true);
  });
});

describe("createInstallmentPurchaseUseCase — FIXED card with fixedClosurePreviousMonth=true", () => {
  // fixedClosureDay=27, fixedClosurePreviousMonth=true
  // April billing closes March 27; May billing closes April 27
  it("purchase on April 20 (before April 27 closure) → May billing", async () => {
    const cardRepo = makeCardRepo(FIXED_CARD_PREV_MONTH);
    const purchaseRepo = makePurchaseRepo();
    const result = await createInstallmentPurchaseUseCase(
      { ...BASE_INPUT, purchaseDate: new Date("2026-04-20T12:00:00Z") },
      purchaseRepo,
      cardRepo,
    );
    const installments = (
      result.record as unknown as { installments: { dueYear: number; dueMonth: number }[] }
    ).installments;
    expect(installments[0].dueMonth).toBe(5); // May
    expect(installments[0].dueYear).toBe(2026);
  });

  it("purchase on April 27 (on closure day) → June billing", async () => {
    const cardRepo = makeCardRepo(FIXED_CARD_PREV_MONTH);
    const purchaseRepo = makePurchaseRepo();
    const result = await createInstallmentPurchaseUseCase(
      { ...BASE_INPUT, purchaseDate: new Date("2026-04-27T12:00:00Z") },
      purchaseRepo,
      cardRepo,
    );
    const installments = (
      result.record as unknown as { installments: { dueYear: number; dueMonth: number }[] }
    ).installments;
    expect(installments[0].dueMonth).toBe(6); // June
    expect(installments[0].dueYear).toBe(2026);
  });
});

describe("createInstallmentPurchaseUseCase — explicit billing month", () => {
  it("VARIABLE card: installments start at the billing month the user chose", async () => {
    const purchaseRepo = makePurchaseRepo();
    const result = await createInstallmentPurchaseUseCase(
      {
        ...BASE_INPUT,
        numberOfInstallments: 3,
        totalAmount: 300,
        purchaseDate: new Date("2026-11-20T12:00:00Z"),
        billingMonth: { year: 2026, month: 12 },
      },
      purchaseRepo,
      makeCardRepo(VARIABLE_CARD),
    );
    expect(installmentsOf(result.record)).toEqual([
      expect.objectContaining({ dueYear: 2026, dueMonth: 12 }),
      expect.objectContaining({ dueYear: 2027, dueMonth: 1 }),
      expect.objectContaining({ dueYear: 2027, dueMonth: 2 }),
    ]);
  });

  it("VARIABLE card without a billing month is rejected and nothing is saved", async () => {
    const purchaseRepo = makePurchaseRepo();
    await expect(
      createInstallmentPurchaseUseCase(
        { ...BASE_INPUT, purchaseDate: new Date("2026-04-20T12:00:00Z") },
        purchaseRepo,
        makeCardRepo(VARIABLE_CARD),
      ),
    ).rejects.toThrow("Billing month is required for variable-closure cards");
    expect(purchaseRepo.save).not.toHaveBeenCalled();
  });

  it("FIXED card: an explicit billing month overrides the computed one", async () => {
    const result = await createInstallmentPurchaseUseCase(
      {
        ...BASE_INPUT,
        purchaseDate: new Date("2026-04-02T12:00:00Z"), // computed would be April
        billingMonth: { year: 2026, month: 6 },
      },
      makePurchaseRepo(),
      makeCardRepo(FIXED_CARD),
    );
    expect(installmentsOf(result.record)[0]).toMatchObject({ dueYear: 2026, dueMonth: 6 });
  });

  it("split purchase: every person's installments use the chosen billing month", async () => {
    const result = await createInstallmentPurchaseUseCase(
      {
        id: "purchase-1",
        splits: [
          { personId: "ana", amount: 60 },
          { personId: "bob", amount: 40 },
        ],
        totalAmount: 100,
        numberOfInstallments: 1,
        description: "",
        categoryId: null,
        creditCardId: "card-1",
        purchaseDate: new Date("2026-04-20T12:00:00Z"),
        billingMonth: { year: 2026, month: 5 },
      },
      makePurchaseRepo(),
      makeCardRepo(VARIABLE_CARD),
    );
    for (const inst of installmentsOf(result.record)) {
      expect(inst).toMatchObject({ dueYear: 2026, dueMonth: 5 });
    }
  });
});
