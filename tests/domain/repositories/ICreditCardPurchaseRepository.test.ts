import type { ICreditCardPurchaseRepository, CreditCardPurchaseRecord, InstallmentRecord } from "../../../src/domain/repositories/ICreditCardPurchaseRepository";

class MockCreditCardPurchaseRepository implements ICreditCardPurchaseRepository {
  async save(
    purchase: Omit<CreditCardPurchaseRecord, "createdAt">,
    _installments: Omit<InstallmentRecord, "id">[]
  ): Promise<CreditCardPurchaseRecord> {
    return { ...purchase, createdAt: new Date() };
  }
  async findInstallmentsByMonth(_personId: string, _year: number, _month: number): Promise<InstallmentRecord[]> { return []; }
  async markInstallmentPaid(_installmentId: string): Promise<void> {}
}

describe("ICreditCardPurchaseRepository interface", () => {
  it("can be implemented by a mock class", () => {
    expect(new MockCreditCardPurchaseRepository()).toBeDefined();
  });
});
