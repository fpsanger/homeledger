import type { NextRequest } from "next/server";

const mockRegister = jest.fn();

jest.mock("../../../../../../src/app/api/_lib/repositories", () => ({
  createRepositories: () => ({
    pendingTransaction: { name: "pending" },
    creditCard: { name: "cards" },
    categoryMemory: { name: "memory" },
  }),
}));
jest.mock("../../../../../../src/application/use-cases/RegisterShortcutTransactionUseCase", () => ({
  registerShortcutTransactionUseCase: (...args: unknown[]) => mockRegister(...args),
}));

import { POST } from "../../../../../../src/app/api/webhooks/shortcuts/transaction/route";

const VALID_BODY = {
  amount: "R$ 12,50",
  merchant: "Padaria São João",
  card: "Nubank",
  date: "2026-11-16T22:30:00-03:00",
};

function request(body: unknown, authorization: string | null = "Bearer s3cret"): NextRequest {
  const headers = new Headers();
  if (authorization !== null) headers.set("authorization", authorization);
  return {
    headers,
    json: async () => {
      if (body === "not-json") throw new SyntaxError("Unexpected token");
      return body;
    },
  } as unknown as NextRequest;
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.WEBHOOK_TOKEN = "s3cret";
  process.env.WEBHOOK_PERSON_ID = "person-1";
  mockRegister.mockResolvedValue({ record: { id: "pending-1" }, created: true });
});

afterAll(() => {
  delete process.env.WEBHOOK_TOKEN;
  delete process.env.WEBHOOK_PERSON_ID;
});

describe("POST /api/webhooks/shortcuts/transaction", () => {
  it("reports 503 while the webhook is not configured", async () => {
    delete process.env.WEBHOOK_TOKEN;

    const res = await POST(request(VALID_BODY));

    expect(res.status).toBe(503);
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("reports 503 when no person is configured", async () => {
    delete process.env.WEBHOOK_PERSON_ID;

    const res = await POST(request(VALID_BODY));

    expect(res.status).toBe(503);
  });

  it.each([
    ["a missing token", null],
    ["a wrong token", "Bearer nope"],
  ])("rejects %s with 401 before reading the body", async (_label, authorization) => {
    const res = await POST(request(VALID_BODY, authorization));

    expect(res.status).toBe(401);
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("rejects a body that is not JSON", async () => {
    const res = await POST(request("not-json"));

    expect(res.status).toBe(400);
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it.each([
    ["no merchant", { ...VALID_BODY, merchant: undefined }],
    ["no amount", { ...VALID_BODY, amount: undefined }],
    ["no date", { ...VALID_BODY, date: undefined }],
    ["a malformed date", { ...VALID_BODY, date: "yesterday" }],
    ["an impossible date", { ...VALID_BODY, date: "2026-13-45" }],
    ["a day that does not exist in the month", { ...VALID_BODY, date: "2026-02-30" }],
    ["a day that does not exist with a time", { ...VALID_BODY, date: "2026-04-31T10:00:00-03:00" }],
    ["an amount that is neither text nor number", { ...VALID_BODY, amount: { v: 1 } }],
  ])("rejects %s with 400", async (_label, body) => {
    const res = await POST(request(body));

    expect(res.status).toBe(400);
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("registers the purchase for the configured person and answers 201", async () => {
    const res = await POST(request(VALID_BODY));

    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toEqual({ id: "pending-1", created: true });
    const [input] = mockRegister.mock.calls[0];
    expect(input).toMatchObject({
      personId: "person-1",
      amount: "R$ 12,50",
      merchant: "Padaria São João",
      cardName: "Nubank",
    });
    expect(input.occurredAt.toISOString()).toBe("2026-11-17T01:30:00.000Z");
    // The local calendar day, not the UTC one: 22:30 in UTC-3 is still the 16th.
    expect(input.occurredOn.toISOString()).toBe("2026-11-16T00:00:00.000Z");
  });

  it("accepts a plain date, a numeric amount and no card", async () => {
    const res = await POST(request({ amount: 12.5, merchant: "Padaria", date: "2026-11-16" }));

    expect(res.status).toBe(201);
    expect(mockRegister.mock.calls[0][0]).toMatchObject({ amount: 12.5, cardName: "" });
  });

  it("answers 200 when the same purchase was already reported", async () => {
    mockRegister.mockResolvedValue({ record: { id: "pending-0" }, created: false });

    const res = await POST(request(VALID_BODY));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ id: "pending-0", created: false });
  });

  it("answers 400 with the reason when the purchase is invalid", async () => {
    mockRegister.mockRejectedValue(new Error("Amount must be a positive number"));

    const res = await POST(request({ ...VALID_BODY, amount: "abc" }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Amount must be a positive number" });
  });
});
