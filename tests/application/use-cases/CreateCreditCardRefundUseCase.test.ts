import { createCreditCardRefundUseCase } from "../../../src/application/use-cases/CreateCreditCardRefundUseCase";
import type { ICreditCardRepository } from "../../../src/domain/repositories/ICreditCardRepository";
import type { ICreditCardRefundRepository } from "../../../src/domain/repositories/ICreditCardRefundRepository";
import type { CreditCardRecord, CreditCardClosureRecord } from "../../../src/domain/entities/CreditCard";

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

const BASE_INPUT = {
  id: "refund-1",
  creditCardId: "card-1",
  personId: "person-1",
  description: "Estorno loja X",
  amount: 100,
  categoryId: null,
  source: "MANUAL" as const,
};

function makeCardRepo(
  card: CreditCardRecord | null,
  closuresByBillingMonth: Record<number, CreditCardClosureRecord> = {},
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

function makeRefundRepo(): ICreditCardRefundRepository {
  return {
    save: jest.fn().mockImplementation((refund) => Promise.resolve({ ...refund, createdAt: new Date() })),
    findByMonth: jest.fn(),
    findByPersonAndMonth: jest.fn(),
    findById: jest.fn(),
    deleteById: jest.fn(),
  };
}

describe("createCreditCardRefundUseCase", () => {
  it("resolves the billing month and persists the refund", async () => {
    const cardRepo = makeCardRepo(FIXED_CARD);
    const refundRepo = makeRefundRepo();

    const result = await createCreditCardRefundUseCase(
      { ...BASE_INPUT, refundDate: new Date("2026-05-04T12:00:00Z") },
      refundRepo,
      cardRepo,
    );

    expect(refundRepo.save).toHaveBeenCalledTimes(1);
    expect(result.dueYear).toBe(2026);
    expect(result.dueMonth).toBe(5); // before the 10th closure day -> same month billing
    expect(result.amount).toBe(100);
  });

  it("shifts to the next billing month when the refund date is on/after the closure day", async () => {
    const cardRepo = makeCardRepo(FIXED_CARD);
    const refundRepo = makeRefundRepo();

    const result = await createCreditCardRefundUseCase(
      { ...BASE_INPUT, refundDate: new Date("2026-05-10T12:00:00Z") },
      refundRepo,
      cardRepo,
    );

    expect(result.dueMonth).toBe(6);
  });

  it("throws when the credit card is not found", async () => {
    const cardRepo = makeCardRepo(null);
    const refundRepo = makeRefundRepo();

    await expect(
      createCreditCardRefundUseCase(
        { ...BASE_INPUT, refundDate: new Date("2026-05-04") },
        refundRepo,
        cardRepo,
      ),
    ).rejects.toThrow("Credit card not found");
    expect(refundRepo.save).not.toHaveBeenCalled();
  });

  it("propagates domain validation errors without persisting", async () => {
    const cardRepo = makeCardRepo(FIXED_CARD);
    const refundRepo = makeRefundRepo();

    await expect(
      createCreditCardRefundUseCase(
        { ...BASE_INPUT, amount: 0, refundDate: new Date("2026-05-04") },
        refundRepo,
        cardRepo,
      ),
    ).rejects.toThrow("Amount must be positive");
    expect(refundRepo.save).not.toHaveBeenCalled();
  });
});
