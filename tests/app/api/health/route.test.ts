// Jest hoists the mock factory, so this must be named `mock*` to be usable inside it.
const mockQueryRaw = jest.fn();

jest.mock("../../../../src/infrastructure/database/client", () => ({
  prisma: { $queryRaw: mockQueryRaw },
}));

import { GET } from "../../../../src/app/api/health/route";

beforeEach(() => {
  jest.clearAllMocks();
  mockQueryRaw.mockResolvedValue([{ "1": 1 }]);
});

describe("GET /api/health", () => {
  it("reports ok once the database answers", async () => {
    const res = await GET();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
    expect(mockQueryRaw).toHaveBeenCalledTimes(1);
  });

  it("reports 503 with the reason when the database is unreachable", async () => {
    mockQueryRaw.mockRejectedValue(new Error("connection refused"));

    const res = await GET();

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ status: "error", error: "connection refused" });
  });

  it("reports 503 when the failure is not an Error", async () => {
    mockQueryRaw.mockRejectedValue("socket hang up");

    const res = await GET();

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ status: "error", error: "Database check failed" });
  });
});
