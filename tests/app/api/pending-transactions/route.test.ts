const mockFindPending = jest.fn();

jest.mock("../../../../src/app/api/_lib/repositories", () => ({
  createRepositories: () => ({ pendingTransaction: { findPending: mockFindPending } }),
}));

import { GET } from "../../../../src/app/api/pending-transactions/route";

describe("GET /api/pending-transactions", () => {
  it("lists the purchases waiting for review", async () => {
    const pending = [{ id: "pending-1", merchant: "Padaria", amount: 12.5 }];
    mockFindPending.mockResolvedValue(pending);

    const res = await GET();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ pending });
  });

  it("answers 400 with the reason when the lookup fails", async () => {
    mockFindPending.mockRejectedValue(new Error("db down"));

    const res = await GET();

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "db down" });
  });
});
