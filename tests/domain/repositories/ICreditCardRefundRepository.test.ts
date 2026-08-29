import type {
  CreditCardRefundRecord,
  ICreditCardRefundRepository,
} from "../../../src/domain/repositories/ICreditCardRefundRepository";

class MockCreditCardRefundRepository implements ICreditCardRefundRepository {
  async save(refund: Omit<CreditCardRefundRecord, "createdAt">): Promise<CreditCardRefundRecord> {
    return { ...refund, createdAt: new Date() };
  }
  async findByMonth(_year: number, _month: number): Promise<CreditCardRefundRecord[]> {
    return [];
  }
  async findByPersonAndMonth(
    _personId: string,
    _year: number,
    _month: number,
  ): Promise<CreditCardRefundRecord[]> {
    return [];
  }
  async findById(_id: string): Promise<CreditCardRefundRecord | null> {
    return null;
  }
  async deleteById(_id: string): Promise<void> {}
}

describe("ICreditCardRefundRepository interface", () => {
  it("can be implemented by a mock class", () => {
    expect(new MockCreditCardRefundRepository()).toBeDefined();
  });

  it("findByMonth is part of the contract", async () => {
    const repo = new MockCreditCardRefundRepository();
    await expect(repo.findByMonth(2026, 7)).resolves.toEqual([]);
  });

  it("findByPersonAndMonth is part of the contract", async () => {
    const repo = new MockCreditCardRefundRepository();
    await expect(repo.findByPersonAndMonth("person-1", 2026, 7)).resolves.toEqual([]);
  });

  it("save returns the refund with createdAt set", async () => {
    const repo = new MockCreditCardRefundRepository();
    const refund = await repo.save({
      id: "refund-1",
      creditCardId: "card-1",
      personId: "person-1",
      description: "Estorno",
      amount: 100,
      refundDate: new Date("2026-07-05"),
      dueYear: 2026,
      dueMonth: 7,
      categoryId: null,
      source: "MANUAL",
    });
    expect(refund.createdAt).toBeInstanceOf(Date);
  });
});
