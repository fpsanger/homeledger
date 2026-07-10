import { reconcileStatementUseCase } from "../../../src/application/use-cases/ReconcileStatementUseCase";
import type { ICreditCardPurchaseRepository, InstallmentRecord } from "../../../src/domain/repositories/ICreditCardPurchaseRepository";
import type { ITransactionRepository, TransactionRecord } from "../../../src/domain/repositories/ITransactionRepository";
import type { ICreditCardRefundRepository } from "../../../src/domain/repositories/ICreditCardRefundRepository";
import type { CreditCardRefundRecord } from "../../../src/domain/entities/CreditCardRefund";
import type { BillingItem } from "../../../src/domain/entities/BillingItem";

function makeCreditCardPurchaseRepo(
  installments: InstallmentRecord[] = [],
): ICreditCardPurchaseRepository {
  return {
    findInstallmentsByMonth: jest.fn().mockResolvedValue(installments),
    save: jest.fn(),
    findAllInstallmentsByMonth: jest.fn(),
    findAllInstallmentsByPurchaseMonth: jest.fn(),
    findInstallmentsByPurchaseMonth: jest.fn(),
    findAllInstallmentsByYear: jest.fn(),
    findInstallmentsByYear: jest.fn(),
    updatePurchase: jest.fn(),
    deletePurchase: jest.fn(),
    markInstallmentPaid: jest.fn(),
    markInstallmentsPaid: jest.fn(),
    markInstallmentsUnpaid: jest.fn(),
    deleteInstallment: jest.fn(),
    findByPurchaseId: jest.fn(),
    updateInstallment: jest.fn(),
    findAllPurchasesWithInstallments: jest.fn(),
    findPurchasesByPersonAndMonth: jest.fn(),
  } as unknown as ICreditCardPurchaseRepository;
}

function makeTransactionRepo(
  transactions: TransactionRecord[] = [],
): ITransactionRepository {
  return {
    findByPersonAndMonth: jest.fn().mockResolvedValue(transactions),
    findById: jest.fn(),
    findByMonth: jest.fn(),
    findByYear: jest.fn(),
    findByPersonAndYear: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  } as unknown as ITransactionRepository;
}

function makeRefundRepo(refunds: CreditCardRefundRecord[] = []): ICreditCardRefundRepository {
  return {
    findByPersonAndMonth: jest.fn().mockResolvedValue(refunds),
    save: jest.fn(),
    findByMonth: jest.fn(),
    findById: jest.fn(),
    deleteById: jest.fn(),
  } as unknown as ICreditCardRefundRepository;
}

function makeRefundRecord(overrides: Partial<CreditCardRefundRecord> = {}): CreditCardRefundRecord {
  return {
    id: "refund-1",
    creditCardId: "card-1",
    personId: "person-1",
    description: "Estorno",
    amount: 30.0,
    refundDate: new Date("2025-05-10"),
    dueYear: 2025,
    dueMonth: 5,
    categoryId: null,
    source: "MANUAL",
    createdAt: new Date(),
    ...overrides,
  };
}

function makeInstallmentRecord(overrides: Partial<InstallmentRecord> = {}): InstallmentRecord {
  return {
    id: "inst-1",
    creditCardPurchaseId: "purchase-1",
    installmentNumber: 1,
    amount: 100.0,
    dueYear: 2025,
    dueMonth: 5,
    transactionYear: 2025,
    transactionMonth: 5,
    isPaid: false,
    categoryId: null,
    purchaseDescription: "Notebook",
    creditCardId: "card-1",
    personId: "person-1",
    ...overrides,
  };
}

function makeTransactionRecord(overrides: Partial<TransactionRecord> = {}): TransactionRecord {
  return {
    id: "tx-1",
    personId: "person-1",
    type: "EXPENSE",
    amount: 50.0,
    date: new Date("2025-05-10"),
    description: "Supermercado",
    paymentMethod: null,
    source: null,
    categoryId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const PERSON_ID = "person-1";
const YEAR = 2025;
const MONTH = 5;
const CARD_ID = "card-1";

describe("reconcileStatementUseCase", () => {
  test("1. empty items array returns []", async () => {
    const result = await reconcileStatementUseCase(
      makeCreditCardPurchaseRepo(),
      makeTransactionRepo(),
      makeRefundRepo(),
      [],
      PERSON_ID,
      YEAR,
      MONTH,
    );
    expect(result).toEqual([]);
  });

  test("2. installment item with matching existing installment → status matched", async () => {
    const item: BillingItem = {
      kind: "installment",
      description: "Notebook",
      amount: 100.0,
      date: new Date("2025-05-01"),
      installmentNumber: 1,
      totalInstallments: 12,
    };
    const existing = makeInstallmentRecord({ purchaseDescription: "Notebook", amount: 100.0 });
    const repo = makeCreditCardPurchaseRepo([existing]);

    const result = await reconcileStatementUseCase(
      repo,
      makeTransactionRepo(),
      makeRefundRepo(),
      [item],
      PERSON_ID,
      YEAR,
      MONTH,
      CARD_ID,
    );

    expect(result).toEqual([{ billingItem: item, status: "matched", matchedRecordId: "inst-1" }]);
  });

  test("3. installment item with no match → status missing", async () => {
    const item: BillingItem = {
      kind: "installment",
      description: "Notebook",
      amount: 100.0,
      date: new Date("2025-05-01"),
      installmentNumber: 1,
      totalInstallments: 12,
    };
    const result = await reconcileStatementUseCase(
      makeCreditCardPurchaseRepo([]),
      makeTransactionRepo(),
      makeRefundRepo(),
      [item],
      PERSON_ID,
      YEAR,
      MONTH,
      CARD_ID,
    );

    expect(result).toEqual([{ billingItem: item, status: "missing" }]);
  });

  test("4. installment matching with ±0.01 amount tolerance → matched", async () => {
    const item: BillingItem = {
      kind: "installment",
      description: "Notebook",
      amount: 100.0,
      date: new Date("2025-05-01"),
      installmentNumber: 1,
      totalInstallments: 12,
    };
    const existing = makeInstallmentRecord({ purchaseDescription: "Notebook", amount: 100.009 });
    const result = await reconcileStatementUseCase(
      makeCreditCardPurchaseRepo([existing]),
      makeTransactionRepo(),
      makeRefundRepo(),
      [item],
      PERSON_ID,
      YEAR,
      MONTH,
      CARD_ID,
    );

    expect(result[0].status).toBe("matched");
  });

  test("5. installment matching ignores 'Parcela X/Y' suffix in description", async () => {
    const item: BillingItem = {
      kind: "installment",
      description: "Notebook Parcela 2/12",
      amount: 100.0,
      date: new Date("2025-05-01"),
      installmentNumber: 2,
      totalInstallments: 12,
    };
    const existing = makeInstallmentRecord({ purchaseDescription: "Notebook", amount: 100.0, installmentNumber: 2 });
    const result = await reconcileStatementUseCase(
      makeCreditCardPurchaseRepo([existing]),
      makeTransactionRepo(),
      makeRefundRepo(),
      [item],
      PERSON_ID,
      YEAR,
      MONTH,
      CARD_ID,
    );

    expect(result[0].status).toBe("matched");
  });

  test("6. installment matching ignores 'X/Y' suffix in description", async () => {
    const item: BillingItem = {
      kind: "installment",
      description: "Notebook 2/12",
      amount: 100.0,
      date: new Date("2025-05-01"),
      installmentNumber: 2,
      totalInstallments: 12,
    };
    const existing = makeInstallmentRecord({ purchaseDescription: "Notebook", amount: 100.0, installmentNumber: 2 });
    const result = await reconcileStatementUseCase(
      makeCreditCardPurchaseRepo([existing]),
      makeTransactionRepo(),
      makeRefundRepo(),
      [item],
      PERSON_ID,
      YEAR,
      MONTH,
      CARD_ID,
    );

    expect(result[0].status).toBe("matched");
  });

  test("7. transaction item with matching existing transaction → status matched", async () => {
    const item: BillingItem = {
      kind: "transaction",
      description: "Supermercado",
      amount: 50.0,
      date: new Date("2025-05-10"),
      transactionType: "EXPENSE",
    };
    const existing = makeTransactionRecord({ type: "EXPENSE", amount: 50.0, date: new Date("2025-05-10") });
    const result = await reconcileStatementUseCase(
      makeCreditCardPurchaseRepo(),
      makeTransactionRepo([existing]),
      makeRefundRepo(),
      [item],
      PERSON_ID,
      YEAR,
      MONTH,
    );

    expect(result).toEqual([{ billingItem: item, status: "matched", matchedRecordId: "tx-1" }]);
  });

  test("8. transaction item with no match → status missing", async () => {
    const item: BillingItem = {
      kind: "transaction",
      description: "Supermercado",
      amount: 50.0,
      date: new Date("2025-05-10"),
      transactionType: "EXPENSE",
    };
    const result = await reconcileStatementUseCase(
      makeCreditCardPurchaseRepo(),
      makeTransactionRepo([]),
      makeRefundRepo(),
      [item],
      PERSON_ID,
      YEAR,
      MONTH,
    );

    expect(result).toEqual([{ billingItem: item, status: "missing" }]);
  });

  test("9. transaction matching checks transactionType (INCOME does not match EXPENSE)", async () => {
    const item: BillingItem = {
      kind: "transaction",
      description: "Salário",
      amount: 5000.0,
      date: new Date("2025-05-01"),
      transactionType: "INCOME",
    };
    const existing = makeTransactionRecord({ type: "EXPENSE", amount: 5000.0, date: new Date("2025-05-01") });
    const result = await reconcileStatementUseCase(
      makeCreditCardPurchaseRepo(),
      makeTransactionRepo([existing]),
      makeRefundRepo(),
      [item],
      PERSON_ID,
      YEAR,
      MONTH,
    );

    expect(result[0].status).toBe("missing");
  });

  test("10. mixed items (installment + transaction) → all reconciled", async () => {
    const installmentItem: BillingItem = {
      kind: "installment",
      description: "Notebook",
      amount: 100.0,
      date: new Date("2025-05-01"),
      installmentNumber: 1,
      totalInstallments: 12,
    };
    const transactionItem: BillingItem = {
      kind: "transaction",
      description: "Supermercado",
      amount: 50.0,
      date: new Date("2025-05-10"),
      transactionType: "EXPENSE",
    };

    const installment = makeInstallmentRecord({ purchaseDescription: "Notebook", amount: 100.0 });
    const transaction = makeTransactionRecord({ type: "EXPENSE", amount: 50.0, date: new Date("2025-05-10") });

    const result = await reconcileStatementUseCase(
      makeCreditCardPurchaseRepo([installment]),
      makeTransactionRepo([transaction]),
      makeRefundRepo(),
      [installmentItem, transactionItem],
      PERSON_ID,
      YEAR,
      MONTH,
      CARD_ID,
    );

    expect(result).toHaveLength(2);
    expect(result[0].status).toBe("matched");
    expect(result[1].status).toBe("matched");
  });

  test("11. installment filtered by creditCardId (other card not matched)", async () => {
    const item: BillingItem = {
      kind: "installment",
      description: "Notebook",
      amount: 100.0,
      date: new Date("2025-05-01"),
      installmentNumber: 1,
      totalInstallments: 12,
    };
    // Existing installment belongs to a DIFFERENT card
    const existing = makeInstallmentRecord({ purchaseDescription: "Notebook", amount: 100.0, creditCardId: "card-99" });

    const result = await reconcileStatementUseCase(
      makeCreditCardPurchaseRepo([existing]),
      makeTransactionRepo(),
      makeRefundRepo(),
      [item],
      PERSON_ID,
      YEAR,
      MONTH,
      CARD_ID, // looking for card-1, but existing is card-99
    );

    expect(result[0].status).toBe("missing");
  });

  test("12. refund item with matching existing refund → status matched", async () => {
    const item: BillingItem = {
      kind: "refund",
      description: "Estorno loja X",
      amount: 30.0,
      date: new Date("2025-05-10"),
    };
    const existing = makeRefundRecord({ amount: 30.0, refundDate: new Date("2025-05-10") });

    const result = await reconcileStatementUseCase(
      makeCreditCardPurchaseRepo(),
      makeTransactionRepo(),
      makeRefundRepo([existing]),
      [item],
      PERSON_ID,
      YEAR,
      MONTH,
      CARD_ID,
    );

    expect(result).toEqual([{ billingItem: item, status: "matched", matchedRecordId: "refund-1" }]);
  });

  test("13. refund item with no match → status missing", async () => {
    const item: BillingItem = {
      kind: "refund",
      description: "Estorno loja X",
      amount: 30.0,
      date: new Date("2025-05-10"),
    };

    const result = await reconcileStatementUseCase(
      makeCreditCardPurchaseRepo(),
      makeTransactionRepo(),
      makeRefundRepo([]),
      [item],
      PERSON_ID,
      YEAR,
      MONTH,
      CARD_ID,
    );

    expect(result).toEqual([{ billingItem: item, status: "missing" }]);
  });

  test("14. refund filtered by creditCardId (other card not matched)", async () => {
    const item: BillingItem = {
      kind: "refund",
      description: "Estorno loja X",
      amount: 30.0,
      date: new Date("2025-05-10"),
    };
    const existing = makeRefundRecord({ amount: 30.0, refundDate: new Date("2025-05-10"), creditCardId: "card-99" });

    const result = await reconcileStatementUseCase(
      makeCreditCardPurchaseRepo(),
      makeTransactionRepo(),
      makeRefundRepo([existing]),
      [item],
      PERSON_ID,
      YEAR,
      MONTH,
      CARD_ID,
    );

    expect(result[0].status).toBe("missing");
  });
});
