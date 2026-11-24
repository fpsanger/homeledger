import type { NextRequest } from "next/server";

const mockSave = jest.fn();

jest.mock("../../../../../src/app/api/_lib/repositories", () => ({
  createRepositories: () => ({
    loyaltyProgram: { save: mockSave, findAll: jest.fn(), findById: jest.fn(), delete: jest.fn() },
  }),
}));

import { POST } from "../../../../../src/app/api/loyalty/programs/route";

function postRequest(body: unknown): NextRequest {
  return { json: async () => body } as unknown as NextRequest;
}

const valid = { name: "Smiles", type: "AIRLINE", color: "#f60" };

beforeEach(() => {
  jest.clearAllMocks();
  mockSave.mockImplementation(async (p: unknown) => p);
});

describe("POST /api/loyalty/programs", () => {
  it("creates a program with a reference range", async () => {
    const res = await POST(
      postRequest({ ...valid, referenceMinPer1kBrl: 24, referenceMaxPer1kBrl: 26 }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.referenceMinPer1kBrl).toBe(24);
    expect(body.referenceMaxPer1kBrl).toBe(26);
  });

  it("creates a program without a reference range", async () => {
    const res = await POST(postRequest(valid));
    expect(res.status).toBe(201);
    expect((await res.json()).referenceMinPer1kBrl).toBeNull();
  });

  it("rejects a non-numeric reference bound", async () => {
    const res = await POST(postRequest({ ...valid, referenceMinPer1kBrl: "24" }));
    expect(res.status).toBe(400);
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("rejects an inverted range", async () => {
    const res = await POST(
      postRequest({ ...valid, referenceMinPer1kBrl: 30, referenceMaxPer1kBrl: 20 }),
    );
    expect(res.status).toBe(400);
    expect(mockSave).not.toHaveBeenCalled();
  });
});
