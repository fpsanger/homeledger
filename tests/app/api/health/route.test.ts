import { GET } from "../../../../src/app/api/health/route";

describe("GET /api/health", () => {
  it("reports that the application process is ready", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok" });
  });
});
