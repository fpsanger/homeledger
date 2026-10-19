import { createCreditCardRefundUseCase } from "../../../src/application/use-cases/CreateCreditCardRefundUseCase";
import type { CreditCardRecord } from "../../../src/domain/entities/CreditCard";
import type { ICreditCardRefundRepository } from "../../../src/domain/repositories/ICreditCardRefundRepository";
import type { ICreditCardRepository } from "../../../src/domain/repositories/ICreditCardRepository";

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

const BASE_INPUT = {
  id: "refund-1",
  creditCardId: "card-1",
  personId: "person-1",
  description: "Estorno loja X",
  amount: 100,
  categoryId: null,
  source: "MANUAL" as const,
};

function makeCardRepo(card: CreditCardRecord | null): ICreditCardRepository {
  return {
    findById: jest.fn().mockResolvedValue(card),
    save: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn(),
    delete: jest.fn(),
    hasPurchases: jest.fn(),
  };
}

function makeRefundRepo(): ICreditCardRefundRepository {
  return {
    save: jest
      .fn()
      .mockImplementation((refund) => Promise.resolve({ ...refund, createdAt: new Date() })),
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

  it("uses the explicit billing month for a VARIABLE card", async () => {
    const variableCard: CreditCardRecord = {
      ...FIXED_CARD,
      closureType: "VARIABLE",
      fixedClosureDay: null,
    };
    const result = await createCreditCardRefundUseCase(
      {
        ...BASE_INPUT,
        refundDate: new Date("2026-05-04T12:00:00Z"),
        billingMonth: { year: 2026, month: 7 },
      },
      makeRefundRepo(),
      makeCardRepo(variableCard),
    );

    expect(result).toMatchObject({ dueYear: 2026, dueMonth: 7 });
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
