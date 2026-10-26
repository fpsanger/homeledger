import type { PrismaClient } from "@prisma/client";
import { PrismaCreditCardPurchaseRepository } from "../../../src/infrastructure/repositories/PrismaCreditCardPurchaseRepository";

function setup(
  rows: { id: string; installmentNumber: number; personId: string; isPaid: boolean }[],
) {
  const installmentUpdate = jest.fn((args) => args);
  const prisma = {
    installment: { findMany: jest.fn().mockResolvedValue(rows), update: installmentUpdate },
    creditCardPurchase: { update: jest.fn((args) => args) },
    $transaction: jest.fn().mockResolvedValue([]),
  };
  const repo = new PrismaCreditCardPurchaseRepository(prisma as unknown as PrismaClient);
  return { repo, installmentUpdate, prisma };
}

const data = {
  description: "Mercado",
  totalAmount: 300,
  purchaseDate: new Date("2026-05-10"),
  categoryId: null,
  creditCardId: "card-1",
};

const row = (n: number, personId = "p1", isPaid = false) => ({
  id: `${personId}-${n}`,
  installmentNumber: n,
  personId,
  isPaid,
});

describe("PrismaCreditCardPurchaseRepository.updatePurchase — fatura", () => {
  it("rebases every installment on the new first fatura, across the year boundary", async () => {
    const { repo, installmentUpdate } = setup([row(1), row(2), row(3)]);

    await repo.updatePurchase("pur-1", { ...data, firstDue: { year: 2026, month: 11 } });

    expect(installmentUpdate.mock.calls.map(([a]) => a.data)).toEqual([
      expect.objectContaining({ dueYear: 2026, dueMonth: 11 }),
      expect.objectContaining({ dueYear: 2026, dueMonth: 12 }),
      expect.objectContaining({ dueYear: 2027, dueMonth: 1 }),
    ]);
  });

  it("moves every person's installments of a split purchase and leaves their amounts alone", async () => {
    const { repo, installmentUpdate } = setup([row(1, "p1"), row(1, "p2")]);

    await repo.updatePurchase("pur-1", { ...data, firstDue: { year: 2026, month: 8 } });

    const updates = installmentUpdate.mock.calls.map(([a]) => a.data);
    expect(updates).toEqual([
      { dueYear: 2026, dueMonth: 8 },
      { dueYear: 2026, dueMonth: 8 },
    ]);
  });

  it("does not move due months when no fatura is given", async () => {
    const { repo, installmentUpdate } = setup([row(1), row(2)]);

    await repo.updatePurchase("pur-1", data);

    for (const [args] of installmentUpdate.mock.calls) {
      expect(args.data).not.toHaveProperty("dueYear");
    }
  });

  it("refuses to move a purchase with a paid installment", async () => {
    const { repo, prisma } = setup([row(1, "p1", true), row(2)]);

    await expect(
      repo.updatePurchase("pur-1", { ...data, firstDue: { year: 2026, month: 8 } }),
    ).rejects.toThrow(/parcelas pagas/);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
