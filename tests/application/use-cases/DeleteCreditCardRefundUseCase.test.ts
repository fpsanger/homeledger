import { deleteCreditCardRefundUseCase } from "../../../src/application/use-cases/DeleteCreditCardRefundUseCase";
import type { ICreditCardRefundRepository } from "../../../src/domain/repositories/ICreditCardRefundRepository";
import type { CreditCardRefundRecord } from "../../../src/domain/entities/CreditCardRefund";

const EXISTING: CreditCardRefundRecord = {
  id: "refund-1",
  creditCardId: "card-1",
  personId: "person-1",
  description: "Estorno",
  amount: 100,
  refundDate: new Date("2026-05-04"),
  dueYear: 2026,
  dueMonth: 5,
  categoryId: null,
  source: "MANUAL",
  createdAt: new Date(),
};

function makeRepo(existing: CreditCardRefundRecord | null): ICreditCardRefundRepository {
  return {
    save: jest.fn(),
    findByMonth: jest.fn(),
    findByPersonAndMonth: jest.fn(),
    findById: jest.fn().mockResolvedValue(existing),
    deleteById: jest.fn(),
  };
}

describe("deleteCreditCardRefundUseCase", () => {
  it("deletes an existing refund", async () => {
    const repo = makeRepo(EXISTING);
    await deleteCreditCardRefundUseCase("refund-1", repo);
    expect(repo.deleteById).toHaveBeenCalledWith("refund-1");
  });

  it("throws when the refund does not exist", async () => {
    const repo = makeRepo(null);
    await expect(deleteCreditCardRefundUseCase("refund-1", repo)).rejects.toThrow(
      "Refund not found",
    );
    expect(repo.deleteById).not.toHaveBeenCalled();
  });
});
