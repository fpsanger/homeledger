import type { NextRequest } from "next/server";
import type { LoyaltyProgramRecord } from "../../../../../../src/domain/repositories/ILoyaltyProgramRepository";

const mockFindById = jest.fn();
const mockSave = jest.fn();

jest.mock("../../../../../../src/app/api/_lib/repositories", () => ({
  createRepositories: () => ({
    loyaltyProgram: { findById: mockFindById, save: mockSave },
  }),
}));

import { PUT } from "../../../../../../src/app/api/loyalty/programs/[id]/route";

const existing: LoyaltyProgramRecord = {
  id: "latam",
  name: "LATAM Pass",
  type: "AIRLINE",
  color: "#E31837",
  referenceMinPer1kBrl: 24,
  referenceMaxPer1kBrl: 26,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

const ctx = { params: Promise.resolve({ id: "latam" }) };

function putRequest(body: unknown): NextRequest {
  return { json: async () => body } as unknown as NextRequest;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockFindById.mockResolvedValue(existing);
  mockSave.mockImplementation(async (p: unknown) => p);
});

describe("PUT /api/loyalty/programs/[id]", () => {
  it("updates the reference range", async () => {
    const res = await PUT(putRequest({ referenceMinPer1kBrl: 20, referenceMaxPer1kBrl: 22 }), ctx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.referenceMinPer1kBrl).toBe(20);
    expect(body.referenceMaxPer1kBrl).toBe(22);
  });

  it("clears a bound with null and keeps omitted fields", async () => {
    const res = await PUT(putRequest({ referenceMaxPer1kBrl: null }), ctx);
    const body = await res.json();
    expect(body.referenceMinPer1kBrl).toBe(24);
    expect(body.referenceMaxPer1kBrl).toBeNull();
    expect(body.name).toBe("LATAM Pass");
  });

  it("rejects a non-numeric bound", async () => {
    const res = await PUT(putRequest({ referenceMinPer1kBrl: "abc" }), ctx);
    expect(res.status).toBe(400);
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("rejects a merged range that is inverted", async () => {
    const res = await PUT(putRequest({ referenceMinPer1kBrl: 40 }), ctx);
    expect(res.status).toBe(400);
    expect(mockSave).not.toHaveBeenCalled();
  });
});
