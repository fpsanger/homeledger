import { getCreditCardBillUseCase } from "../../../src/application/use-cases/GetCreditCardBillUseCase";
import type { CreditCardRefundRecord } from "../../../src/domain/entities/CreditCardRefund";
import type { ICreditCardPurchaseRepository } from "../../../src/domain/repositories/ICreditCardPurchaseRepository";
import type { ICreditCardRefundRepository } from "../../../src/domain/repositories/ICreditCardRefundRepository";
import type { ICreditCardRepository } from "../../../src/domain/repositories/ICreditCardRepository";

const card1 = {
  id: "card-1",
  name: "Nubank",
  closureType: "FIXED" as const,
  fixedClosureDay: 25,
  dueDayOfMonth: 10,
  closureNextMonth: false,
  createdAt: new Date(),
};
const card2 = {
  id: "card-2",
  name: "Itaú",
  closureType: "FIXED" as const,
  fixedClosureDay: 20,
  dueDayOfMonth: 5,
  closureNextMonth: false,
  createdAt: new Date(),
};

const installment1 = {
  id: "i-1",
  creditCardPurchaseId: "p-1",
  personId: "person-1",
  installmentNumber: 1,
  amount: 100,
  dueYear: 2026,
  dueMonth: 5,
  isPaid: false,
};
const installment2 = {
  id: "i-2",
  creditCardPurchaseId: "p-2",
  personId: "person-1",
  installmentNumber: 1,
  amount: 200,
  dueYear: 2026,
  dueMonth: 5,
  isPaid: false,
};

const purchase1 = {
  id: "p-1",
  personId: "person-1",
  creditCardId: "card-1",
  description: "TV",
  totalAmount: 1200,
  numberOfInstallments: 12,
  purchaseDate: new Date("2026-04-10"),
  categoryId: null,
  createdAt: new Date(),
};
const purchase2 = {
  id: "p-2",
  personId: "person-1",
  creditCardId: "card-2",
  description: "Phone",
  totalAmount: 200,
  numberOfInstallments: 2,
  purchaseDate: new Date("2026-04-10"),
  categoryId: null,
  createdAt: new Date(),
};

function makeCreditCardRepo(): ICreditCardRepository {
  return {
    save: jest.fn(),
    update: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn().mockResolvedValue([card1, card2]),
    delete: jest.fn(),
    hasPurchases: jest.fn(),
  };
}

function makeRefundRepo(refunds: CreditCardRefundRecord[] = []): ICreditCardRefundRepository {
  return {
    save: jest.fn(),
    findByMonth: jest.fn().mockResolvedValue(refunds),
    findByPersonAndMonth: jest.fn(),
    findById: jest.fn(),
    deleteById: jest.fn(),
  };
}

function makePurchaseRepo(): ICreditCardPurchaseRepository {
  return {
    save: jest.fn(),
    findAllInstallmentsByMonth: jest.fn().mockResolvedValue([installment1, installment2]),
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
    findAllPurchasesWithInstallments: jest.fn().mockResolvedValue([purchase1, purchase2]),
    findPurchasesByPersonAndMonth: jest.fn().mockResolvedValue([]),
    findPurchaseById: jest.fn().mockResolvedValue(null),
  };
}

describe("getCreditCardBillUseCase", () => {
  it("groups installments by card for the given month", async () => {
    const result = await getCreditCardBillUseCase(
      { year: 2026, month: 5 },
      makeCreditCardRepo(),
      makePurchaseRepo(),
      makeRefundRepo(),
    );

    expect(result).toHaveLength(2);
    const nubank = result.find((r) => r.card.id === "card-1");
    expect(nubank).toBeDefined();
    expect(nubank!.installments).toHaveLength(1);
    expect(nubank!.installments[0].id).toBe("i-1");
  });

  it("includes card due date info", async () => {
    const result = await getCreditCardBillUseCase(
      { year: 2026, month: 5 },
      makeCreditCardRepo(),
      makePurchaseRepo(),
      makeRefundRepo(),
    );
    const nubank = result.find((r) => r.card.id === "card-1")!;
    expect(nubank.dueDayOfMonth).toBe(10);
  });

  it("excludes cards with no installments and no refunds for the month", async () => {
    const purchaseRepo = makePurchaseRepo();
    (purchaseRepo.findAllInstallmentsByMonth as jest.Mock).mockResolvedValue([installment1]);
    (purchaseRepo.findAllPurchasesWithInstallments as jest.Mock).mockResolvedValue([purchase1]);

    const result = await getCreditCardBillUseCase(
      { year: 2026, month: 5 },
      makeCreditCardRepo(),
      purchaseRepo,
      makeRefundRepo(),
    );

    expect(result).toHaveLength(1);
    expect(result[0].card.id).toBe("card-1");
  });

  it("subtracts refunds from the card total", async () => {
    const refund: CreditCardRefundRecord = {
      id: "r-1",
      creditCardId: "card-1",
      personId: "person-1",
      description: "Estorno",
      amount: 30,
      refundDate: new Date("2026-05-04"),
      dueYear: 2026,
      dueMonth: 5,
      categoryId: null,
      source: "MANUAL",
      createdAt: new Date(),
    };

    const result = await getCreditCardBillUseCase(
      { year: 2026, month: 5 },
      makeCreditCardRepo(),
      makePurchaseRepo(),
      makeRefundRepo([refund]),
    );

    const nubank = result.find((r) => r.card.id === "card-1")!;
    expect(nubank.refunds).toHaveLength(1);
    expect(nubank.total).toBe(70); // 100 (installment1) - 30 (refund)
  });

  it("includes a card that only has a refund and no installments for the month", async () => {
    const refund: CreditCardRefundRecord = {
      id: "r-2",
      creditCardId: "card-2",
      personId: "person-1",
      description: "Estorno",
      amount: 50,
      refundDate: new Date("2026-05-04"),
      dueYear: 2026,
      dueMonth: 5,
      categoryId: null,
      source: "MANUAL",
      createdAt: new Date(),
    };
    const purchaseRepo = makePurchaseRepo();
    (purchaseRepo.findAllInstallmentsByMonth as jest.Mock).mockResolvedValue([]);
    (purchaseRepo.findAllPurchasesWithInstallments as jest.Mock).mockResolvedValue([]);

    const result = await getCreditCardBillUseCase(
      { year: 2026, month: 5 },
      makeCreditCardRepo(),
      purchaseRepo,
      makeRefundRepo([refund]),
    );

    expect(result).toHaveLength(1);
    expect(result[0].card.id).toBe("card-2");
    expect(result[0].installments).toHaveLength(0);
    expect(result[0].total).toBe(-50);
  });

  it("filters refunds by personId when provided", async () => {
    const refund: CreditCardRefundRecord = {
      id: "r-3",
      creditCardId: "card-1",
      personId: "person-2",
      description: "Estorno",
      amount: 30,
      refundDate: new Date("2026-05-04"),
      dueYear: 2026,
      dueMonth: 5,
      categoryId: null,
      source: "MANUAL",
      createdAt: new Date(),
    };

    const result = await getCreditCardBillUseCase(
      { year: 2026, month: 5, personId: "person-1" },
      makeCreditCardRepo(),
      makePurchaseRepo(),
      makeRefundRepo([refund]),
    );

    const nubank = result.find((r) => r.card.id === "card-1")!;
    expect(nubank.refunds).toHaveLength(0);
    expect(nubank.total).toBe(100);
  });
});
