import { createInstallmentPurchaseUseCase } from "../../../src/application/use-cases/CreateInstallmentPurchaseUseCase";
import type {
  CreditCardClosureRecord,
  CreditCardRecord,
} from "../../../src/domain/entities/CreditCard";
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
  alwaysNextMonth: false,
  closureNextMonth: false,
  fixedClosurePreviousMonth: false,
  createdAt: new Date(),
};

function makeClosure(
  month: number,
  closureDay: number,
  previousMonth: boolean,
  year = 2026,
): CreditCardClosureRecord {
  return { id: `closure-${month}`, creditCardId: "card-1", year, month, closureDay, previousMonth };
}

function makeCardRepo(
  card: CreditCardRecord,
  closuresByBillingMonth: Record<number, CreditCardClosureRecord>,
): ICreditCardRepository {
  return {
    findById: jest.fn().mockResolvedValue(card),
    findClosure: jest
      .fn()
      .mockImplementation((_cardId: string, _year: number, month: number) =>
        Promise.resolve(closuresByBillingMonth[month] ?? null),
      ),
    save: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn(),
    delete: jest.fn(),
    hasPurchases: jest.fn(),
    setClosure: jest.fn(),
    findClosuresByCard: jest.fn(),
    deleteClosure: jest.fn(),
  };
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
  alwaysNextMonth: false,
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
  alwaysNextMonth: false,
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
    const cardRepo = makeCardRepo(FIXED_CARD, {});
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
    const cardRepo = makeCardRepo(FIXED_CARD, {});
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
    const cardRepo = makeCardRepo(FIXED_CARD, {});
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
    const cardRepo = makeCardRepo(FIXED_CARD, {});
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
    const cardRepo = makeCardRepo(FIXED_CARD_PREV_MONTH, {});
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
    const cardRepo = makeCardRepo(FIXED_CARD_PREV_MONTH, {});
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

describe("createInstallmentPurchaseUseCase — billing month assignment (previousMonth=true)", () => {
  // Card: April billing closes March 27, May billing closes April 28
  const closures: Record<number, CreditCardClosureRecord> = {
    3: makeClosure(3, 27, true), // March billing closes Feb 27
    4: makeClosure(4, 27, true), // April billing closes March 27
    5: makeClosure(5, 28, true), // May billing closes April 28
    6: makeClosure(6, 28, true), // June billing closes May 28
  };

  it("purchase on March 26 (before April closure March 27) → April billing", async () => {
    const cardRepo = makeCardRepo(VARIABLE_CARD, closures);
    const purchaseRepo = makePurchaseRepo();
    const result = await createInstallmentPurchaseUseCase(
      { ...BASE_INPUT, purchaseDate: new Date("2026-03-26T12:00:00Z") },
      purchaseRepo,
      cardRepo,
    );
    const installments = (
      result.record as unknown as { installments: { dueYear: number; dueMonth: number }[] }
    ).installments;
    expect(installments[0].dueMonth).toBe(4); // April
    expect(installments[0].dueYear).toBe(2026);
  });

  it("purchase on March 27 (on April closure) → May billing", async () => {
    const cardRepo = makeCardRepo(VARIABLE_CARD, closures);
    const purchaseRepo = makePurchaseRepo();
    const result = await createInstallmentPurchaseUseCase(
      { ...BASE_INPUT, purchaseDate: new Date("2026-03-27T12:00:00Z") },
      purchaseRepo,
      cardRepo,
    );
    const installments = (
      result.record as unknown as { installments: { dueYear: number; dueMonth: number }[] }
    ).installments;
    expect(installments[0].dueMonth).toBe(5); // May
    expect(installments[0].dueYear).toBe(2026);
  });

  it("purchase on April 27 (before May closure April 28) → May billing", async () => {
    const cardRepo = makeCardRepo(VARIABLE_CARD, closures);
    const purchaseRepo = makePurchaseRepo();
    const result = await createInstallmentPurchaseUseCase(
      { ...BASE_INPUT, purchaseDate: new Date("2026-04-27T12:00:00Z") },
      purchaseRepo,
      cardRepo,
    );
    const installments = (
      result.record as unknown as { installments: { dueYear: number; dueMonth: number }[] }
    ).installments;
    expect(installments[0].dueMonth).toBe(5); // May
    expect(installments[0].dueYear).toBe(2026);
  });

  it("purchase on April 28 (on May closure) → June billing", async () => {
    const cardRepo = makeCardRepo(VARIABLE_CARD, closures);
    const purchaseRepo = makePurchaseRepo();
    const result = await createInstallmentPurchaseUseCase(
      { ...BASE_INPUT, purchaseDate: new Date("2026-04-28T12:00:00Z") },
      purchaseRepo,
      cardRepo,
    );
    const installments = (
      result.record as unknown as { installments: { dueYear: number; dueMonth: number }[] }
    ).installments;
    expect(installments[0].dueMonth).toBe(6); // June
    expect(installments[0].dueYear).toBe(2026);
  });

  it("purchase on April 29 (after May closure) → June billing", async () => {
    const cardRepo = makeCardRepo(VARIABLE_CARD, closures);
    const purchaseRepo = makePurchaseRepo();
    const result = await createInstallmentPurchaseUseCase(
      { ...BASE_INPUT, purchaseDate: new Date("2026-04-29T12:00:00Z") },
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
