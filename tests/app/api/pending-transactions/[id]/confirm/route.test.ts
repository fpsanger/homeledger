import type { NextRequest } from "next/server";
import {
  NotFoundError,
  PendingTransactionResolvedError,
} from "../../../../../../src/domain/errors";

const mockConfirm = jest.fn();

jest.mock("../../../../../../src/app/api/_lib/repositories", () => ({
  createRepositories: () => ({
    pendingTransaction: { name: "pending" },
    transaction: { name: "transactions" },
    category: { name: "categories" },
    creditCardPurchase: { name: "purchases" },
    creditCard: { name: "cards" },
    categoryMemory: { name: "memory" },
  }),
}));
jest.mock("../../../../../../src/application/use-cases/ConfirmPendingTransactionUseCase", () => ({
  confirmPendingTransactionUseCase: (...args: unknown[]) => mockConfirm(...args),
}));

import { POST } from "../../../../../../src/app/api/pending-transactions/[id]/confirm/route";

const params = { params: { id: "pending-1" } };

function request(body: unknown): NextRequest {
  return { json: async () => body } as unknown as NextRequest;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockConfirm.mockResolvedValue({ kind: "expense", recordId: "record-1", isDuplicate: false });
});

describe("POST /api/pending-transactions/[id]/confirm", () => {
  it("confirms an expense and answers 201", async () => {
    const res = await POST(
      request({ categoryId: "cat-1", creditCardId: null, paymentMethod: "PIX" }),
      params,
    );

    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toEqual({
      kind: "expense",
      recordId: "record-1",
      isDuplicate: false,
    });
    const [input, deps] = mockConfirm.mock.calls[0];
    expect(input).toMatchObject({
      id: "pending-1",
      categoryId: "cat-1",
      creditCardId: null,
      paymentMethod: "PIX",
    });
    expect(input.recordId).toEqual(expect.any(String));
    expect(Object.keys(deps).sort()).toEqual([
      "categories",
      "categoryMemory",
      "creditCards",
      "pending",
      "purchases",
      "transactions",
    ]);
  });

  it("passes the billing month of a credit card purchase", async () => {
    await POST(
      request({ categoryId: null, creditCardId: "card-1", billingMonth: "2026-12" }),
      params,
    );

    expect(mockConfirm.mock.calls[0][0]).toMatchObject({
      categoryId: null,
      creditCardId: "card-1",
      billingMonth: { year: 2026, month: 12 },
    });
  });

  it.each([
    ["a missing category field", { creditCardId: null }],
    ["a missing card field", { categoryId: "cat-1" }],
    [
      "an unknown payment method",
      { categoryId: null, creditCardId: null, paymentMethod: "BARTER" },
    ],
    ["an empty category id", { categoryId: "", creditCardId: null }],
    ["a malformed billing month", { categoryId: null, creditCardId: "c", billingMonth: "12/2026" }],
    [
      "a billing month out of range",
      { categoryId: null, creditCardId: "c", billingMonth: "2026-13" },
    ],
  ])("rejects %s with 400", async (_label, body) => {
    const res = await POST(request(body), params);

    expect(res.status).toBe(400);
    expect(mockConfirm).not.toHaveBeenCalled();
  });

  it("answers 404 for an unknown pending purchase", async () => {
    mockConfirm.mockRejectedValue(new NotFoundError("Pending transaction not found"));

    const res = await POST(request({ categoryId: null, creditCardId: null }), params);

    expect(res.status).toBe(404);
  });

  it("answers 409 when the purchase was already resolved", async () => {
    mockConfirm.mockRejectedValue(new PendingTransactionResolvedError());

    const res = await POST(request({ categoryId: null, creditCardId: null }), params);

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toEqual({
      error: "Pending transaction was already resolved",
    });
  });

  it("answers 400 with the reason when the entry is invalid", async () => {
    mockConfirm.mockRejectedValue(
      new Error("Billing month is required for variable-closure cards"),
    );

    const res = await POST(request({ categoryId: null, creditCardId: "card-1" }), params);

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "Billing month is required for variable-closure cards",
    });
  });
});
