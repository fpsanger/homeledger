import type {
  CreditCardPurchaseRecord,
  CreditCardPurchaseWithInstallments,
  ICreditCardPurchaseRepository,
  InstallmentRecord,
} from "../../../src/domain/repositories/ICreditCardPurchaseRepository";

class MockCreditCardPurchaseRepository implements ICreditCardPurchaseRepository {
  async save(
    purchase: Omit<CreditCardPurchaseRecord, "createdAt">,
    _installments: Omit<InstallmentRecord, "id">[],
  ): Promise<CreditCardPurchaseRecord> {
    return { ...purchase, createdAt: new Date() };
  }
  async findAllInstallmentsByMonth(_year: number, _month: number): Promise<InstallmentRecord[]> {
    return [];
  }
  async findInstallmentsByMonth(
    _personId: string,
    _year: number,
    _month: number,
  ): Promise<InstallmentRecord[]> {
    return [];
  }
  async findAllInstallmentsByYear(_year: number): Promise<InstallmentRecord[]> {
    return [];
  }
  async findInstallmentsByYear(_personId: string, _year: number): Promise<InstallmentRecord[]> {
    return [];
  }
  async updatePurchase(_id: string, _data: Pick<CreditCardPurchaseRecord, "description" | "totalAmount" | "purchaseDate" | "categoryId" | "creditCardId">): Promise<void> {}
  async deletePurchase(_id: string): Promise<void> {}
  async markInstallmentPaid(_installmentId: string): Promise<void> {}
  async deleteInstallment(_installmentId: string): Promise<void> {}
  async findByPurchaseId(_purchaseId: string): Promise<InstallmentRecord[]> {
    return [];
  }
  async updateInstallments(_installments: InstallmentRecord[]): Promise<void> {}
  async findAllPurchasesWithInstallments(
    _personId?: string,
  ): Promise<CreditCardPurchaseWithInstallments[]> {
    return [];
  }
}

describe("ICreditCardPurchaseRepository interface", () => {
  it("can be implemented by a mock class", () => {
    expect(new MockCreditCardPurchaseRepository()).toBeDefined();
  });

  it("findByPurchaseId is part of the contract", async () => {
    const repo = new MockCreditCardPurchaseRepository();
    await expect(repo.findByPurchaseId("purchase-1")).resolves.toEqual([]);
  });

  it("updateInstallments is part of the contract", async () => {
    const repo = new MockCreditCardPurchaseRepository();
    await expect(repo.updateInstallments([])).resolves.toBeUndefined();
  });
});
