import { getCreditCardPurchasesUseCase } from "../../../src/application/use-cases/GetCreditCardPurchasesUseCase";
import type {
  CreditCardPurchaseWithInstallments,
  ICreditCardPurchaseRepository,
} from "../../../src/domain/repositories/ICreditCardPurchaseRepository";

const makeInstallment = (overrides = {}) => ({
  id: "inst-1",
  creditCardPurchaseId: "p-1",
  installmentNumber: 1,
  amount: 100,
  dueYear: 2026,
  dueMonth: 5,
  isPaid: false,
  isCanceled: false,
  ...overrides,
});

const makePurchase = (overrides = {}): CreditCardPurchaseWithInstallments => ({
  id: "p-1",
  personId: "person-1",
  creditCardId: "cc-1",
  description: "TV",
  totalAmount: 1200,
  numberOfInstallments: 12,
  purchaseDate: new Date("2026-01-01"),
  categoryId: null,
  createdAt: new Date("2026-01-01"),
  installments: [makeInstallment()],
  ...overrides,
});

const makeRepo = (
  purchases: CreditCardPurchaseWithInstallments[] = [],
): Pick<ICreditCardPurchaseRepository, "findAllPurchasesWithInstallments"> => ({
  findAllPurchasesWithInstallments: async (personId?: string) => {
    if (personId) return purchases.filter((p) => p.personId === personId);
    return purchases;
  },
});

describe("getCreditCardPurchasesUseCase", () => {
  it("returns all purchases when no personId given", async () => {
    const purchases = [makePurchase({ id: "p-1" }), makePurchase({ id: "p-2", personId: "person-2" })];
    const repo = makeRepo(purchases);
    const result = await getCreditCardPurchasesUseCase(undefined, repo as ICreditCardPurchaseRepository);
    expect(result).toHaveLength(2);
  });

  it("returns only purchases for given personId", async () => {
    const purchases = [
      makePurchase({ id: "p-1", personId: "person-1" }),
      makePurchase({ id: "p-2", personId: "person-2" }),
    ];
    const repo = makeRepo(purchases);
    const result = await getCreditCardPurchasesUseCase("person-1", repo as ICreditCardPurchaseRepository);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("p-1");
  });

  it("returns empty array when no purchases", async () => {
    const repo = makeRepo([]);
    const result = await getCreditCardPurchasesUseCase(undefined, repo as ICreditCardPurchaseRepository);
    expect(result).toEqual([]);
  });
});
