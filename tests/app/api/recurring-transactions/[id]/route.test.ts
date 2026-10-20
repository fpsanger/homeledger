import type { NextRequest } from "next/server";
import type { RecurringTransactionRecord } from "../../../../../src/domain/repositories/IRecurringTransactionRepository";

// Jest hoists the mock factory, so these must be named `mock*` to be usable inside it.
const mockFindById = jest.fn();
const mockUpdate = jest.fn();
const mockSaveSplit = jest.fn();
const mockDelete = jest.fn();

jest.mock("../../../../../src/app/api/_lib/repositories", () => ({
  createRepositories: () => ({
    recurring: {
      findById: mockFindById,
      update: mockUpdate,
      saveSplit: mockSaveSplit,
      delete: mockDelete,
    },
  }),
}));

import { DELETE, GET, PATCH } from "../../../../../src/app/api/recurring-transactions/[id]/route";

// A 12-month series: January through December 2026 (endDate is exclusive).
const rule: RecurringTransactionRecord = {
  id: "rule-1",
  personId: "person-1",
  type: "EXPENSE",
  amount: 1200,
  description: "Aluguel",
  paymentMethod: "PIX",
  categoryId: null,
  frequency: "MONTHLY",
  startDate: new Date(Date.UTC(2026, 0, 1)),
  endDate: new Date(Date.UTC(2027, 0, 1)),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const params = { params: { id: "rule-1" } };

function patchRequest(body: unknown): NextRequest {
  return { json: async () => body } as unknown as NextRequest;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockFindById.mockResolvedValue(rule);
  mockSaveSplit.mockImplementation(
    async (
      _closed: unknown,
      next: Omit<RecurringTransactionRecord, "createdAt" | "updatedAt">,
    ) => ({
      ...next,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  );
  mockUpdate.mockImplementation(
    async (_id: string, changes: Partial<RecurringTransactionRecord>) => ({
      ...rule,
      ...changes,
    }),
  );
});

describe("GET /api/recurring-transactions/[id]", () => {
  it("returns the rule", async () => {
    const res = await GET({} as NextRequest, params);

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ id: "rule-1", amount: 1200 });
  });

  it("404s when the rule does not exist", async () => {
    mockFindById.mockResolvedValue(null);

    const res = await GET({} as NextRequest, params);

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Recurring transaction not found" });
  });
});

describe("PATCH /api/recurring-transactions/[id]", () => {
  it("requires effectiveFrom", async () => {
    const res = await PATCH(patchRequest({ amount: 1450 }), params);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "effectiveFrom is required" });
    expect(mockSaveSplit).not.toHaveBeenCalled();
  });

  it("rejects a malformed effectiveFrom", async () => {
    const res = await PATCH(patchRequest({ effectiveFrom: "04/2026", amount: 1450 }), params);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "effectiveFrom must be in YYYY-MM format" });
  });

  it("rejects a non-numeric amount", async () => {
    const res = await PATCH(patchRequest({ effectiveFrom: "2026-04", amount: "1450" }), params);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "amount must be a number" });
  });

  it("rejects a non-positive amount", async () => {
    const res = await PATCH(patchRequest({ effectiveFrom: "2026-04", amount: 0 }), params);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Amount must be positive" });
  });

  it("rejects an effective month outside the series", async () => {
    const res = await PATCH(patchRequest({ effectiveFrom: "2027-01", amount: 1450 }), params);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "Effective month is outside the recurring transaction period",
    });
  });

  it("404s when the rule does not exist", async () => {
    mockFindById.mockResolvedValue(null);

    const res = await PATCH(patchRequest({ effectiveFrom: "2026-04", amount: 1450 }), params);

    expect(res.status).toBe(404);
  });

  it("splits the series at the requested month", async () => {
    const res = await PATCH(
      patchRequest({
        effectiveFrom: "2026-04",
        amount: 1450,
        description: "Aluguel",
        categoryId: null,
        paymentMethod: "PIX",
      }),
      params,
    );

    expect(res.status).toBe(200);
    expect(mockSaveSplit).toHaveBeenCalledWith(
      { id: "rule-1", endDate: new Date(Date.UTC(2026, 3, 1)) },
      expect.objectContaining({
        amount: 1450,
        startDate: new Date(Date.UTC(2026, 3, 1)),
        endDate: new Date(Date.UTC(2027, 0, 1)),
      }),
    );
  });

  it("updates in place when the month is the first of the series", async () => {
    const res = await PATCH(patchRequest({ effectiveFrom: "2026-01", amount: 1450 }), params);

    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith("rule-1", { amount: 1450 });
    expect(mockSaveSplit).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/recurring-transactions/[id]", () => {
  it("deletes the rule", async () => {
    const res = await DELETE({} as NextRequest, params);

    expect(res.status).toBe(204);
    expect(mockDelete).toHaveBeenCalledWith("rule-1");
  });
});
