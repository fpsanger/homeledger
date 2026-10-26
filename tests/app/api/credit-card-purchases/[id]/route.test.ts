import type { NextRequest } from "next/server";

const mockFindPurchaseById = jest.fn();
const mockFindByPurchaseId = jest.fn();
const mockUpdatePurchase = jest.fn();

jest.mock("../../../../../src/app/api/_lib/repositories", () => ({
  createRepositories: () => ({
    creditCardPurchase: {
      findPurchaseById: mockFindPurchaseById,
      findByPurchaseId: mockFindByPurchaseId,
      updatePurchase: mockUpdatePurchase,
    },
  }),
}));

import { GET, PUT } from "../../../../../src/app/api/credit-card-purchases/[id]/route";

const params = { params: { id: "pur-1" } };

const purchase = {
  id: "pur-1",
  totalAmount: 300,
  numberOfInstallments: 3,
  purchaseDate: new Date("2026-05-10"),
};

// Installments 1..3 on the May, June and July faturas.
function installments(overrides: Partial<{ isPaid: boolean }> = {}) {
  return [1, 2, 3].map((n) => ({
    id: `i${n}`,
    installmentNumber: n,
    dueYear: 2026,
    dueMonth: 4 + n,
    personId: "p1",
    isPaid: false,
    ...overrides,
  }));
}

function putRequest(body: Record<string, unknown>): NextRequest {
  const base = { totalAmount: 300, purchaseDate: "2026-05-10", creditCardId: "card-1" };
  return { json: async () => ({ ...base, ...body }) } as unknown as NextRequest;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockFindPurchaseById.mockResolvedValue(purchase);
  mockFindByPurchaseId.mockResolvedValue(installments());
});

describe("GET /api/credit-card-purchases/[id]", () => {
  it("returns the fatura of installment 1, even when read from a later row", async () => {
    mockFindByPurchaseId.mockResolvedValue(installments().slice(2));

    const res = await GET({} as NextRequest, params);

    expect((await res.json()).purchase.billingMonth).toBe("2026-05");
  });
});

describe("PUT /api/credit-card-purchases/[id]", () => {
  it("moves the purchase to the chosen fatura", async () => {
    const res = await PUT(putRequest({ billingMonth: "2026-08" }), params);

    expect(res.status).toBe(204);
    expect(mockUpdatePurchase).toHaveBeenCalledWith(
      "pur-1",
      expect.objectContaining({ firstDue: { year: 2026, month: 8 } }),
    );
  });

  it("does not touch the installments when the fatura is unchanged or omitted", async () => {
    await PUT(putRequest({ billingMonth: "2026-05" }), params);
    await PUT(putRequest({}), params);

    for (const [, data] of mockUpdatePurchase.mock.calls) {
      expect(data).not.toHaveProperty("firstDue");
    }
  });

  it("rejects a malformed fatura", async () => {
    const res = await PUT(putRequest({ billingMonth: "2026-13" }), params);

    expect(res.status).toBe(400);
    expect(mockUpdatePurchase).not.toHaveBeenCalled();
  });

  it("refuses to move a purchase that already has paid installments", async () => {
    mockFindByPurchaseId.mockResolvedValue(installments({ isPaid: true }));

    const res = await PUT(putRequest({ billingMonth: "2026-08" }), params);

    expect(res.status).toBe(409);
    expect(mockUpdatePurchase).not.toHaveBeenCalled();
  });
});
