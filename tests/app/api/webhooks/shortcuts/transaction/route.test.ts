import type { NextRequest } from "next/server";

const mockRegister = jest.fn();
const mockFindActiveByHash = jest.fn();

jest.mock("../../../../../../src/app/api/_lib/repositories", () => ({
  createRepositories: () => ({
    pendingTransaction: { name: "pending" },
    creditCard: { name: "cards" },
    categoryMemory: { name: "memory" },
    webhookToken: { findActiveByHash: (...args: unknown[]) => mockFindActiveByHash(...args) },
  }),
}));
jest.mock("../../../../../../src/application/use-cases/RegisterShortcutTransactionUseCase", () => ({
  registerShortcutTransactionUseCase: (...args: unknown[]) => mockRegister(...args),
}));

import { hashWebhookToken } from "../../../../../../src/app/api/_lib/webhookAuth";
import { POST } from "../../../../../../src/app/api/webhooks/shortcuts/transaction/route";

// Active tokens by the hash the route looks up; "revoked" is simply absent.
const ACTIVE_TOKENS: Record<string, string> = {
  [hashWebhookToken("ana-token")]: "person-1",
  [hashWebhookToken("bia-token")]: "person-2",
};

const VALID_BODY = {
  amount: "R$ 12,50",
  merchant: "Padaria São João",
  card: "Nubank",
  date: "2026-11-16T22:30:00-03:00",
};

function request(body: unknown, authorization: string | null = "Bearer ana-token"): NextRequest {
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
  mockFindActiveByHash.mockImplementation(async (hash: string) =>
    ACTIVE_TOKENS[hash] ? { personId: ACTIVE_TOKENS[hash] } : null,
  );
  mockRegister.mockResolvedValue({ record: { id: "pending-1" }, created: true });
});

describe("POST /api/webhooks/shortcuts/transaction", () => {
  it.each([
    ["a missing token", null],
    ["a malformed header", "ana-token"],
    ["an unknown or revoked token", "Bearer nope"],
  ])("rejects %s with 401 before reading the body", async (_label, authorization) => {
    const res = await POST(request(VALID_BODY, authorization));

    expect(res.status).toBe(401);
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("looks the token up by its hash, never by the plain value", async () => {
    await POST(request(VALID_BODY));

    expect(mockFindActiveByHash).toHaveBeenCalledWith(hashWebhookToken("ana-token"));
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

  it("registers the purchase for the person who owns the token", async () => {
    await POST(request(VALID_BODY, "Bearer bia-token"));

    expect(mockRegister.mock.calls[0][0]).toMatchObject({ personId: "person-2" });
  });

  it("registers the purchase and answers 201", async () => {
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

describe("POST /api/webhooks/shortcuts/transaction logging", () => {
  let info: jest.SpyInstance;
  let warn: jest.SpyInstance;
  let error: jest.SpyInstance;

  const logged = () =>
    JSON.stringify([...info.mock.calls, ...warn.mock.calls, ...error.mock.calls]);

  beforeEach(() => {
    info = jest.spyOn(console, "info").mockImplementation(() => {});
    warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    error = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it("logs that a request arrived", async () => {
    await POST(request(VALID_BODY));

    expect(info).toHaveBeenCalledWith("[webhook/shortcuts] received", {
      userAgent: null,
      hasAuthorization: true,
    });
  });

  it("names the missing variable when not configured", async () => {
    delete process.env.WEBHOOK_PERSON_ID;

    await POST(request(VALID_BODY));

    expect(warn).toHaveBeenCalledWith("[webhook/shortcuts] not configured", {
      missing: ["WEBHOOK_PERSON_ID"],
    });
  });

  it.each([
    ["no authorization header", null],
    ["not a bearer header", "Basic abc"],
    ["token mismatch", "Bearer nope-nope"],
  ])("logs why a request is unauthorized: %s", async (reason, authorization) => {
    await POST(request(VALID_BODY, authorization));

    expect(warn).toHaveBeenCalledWith("[webhook/shortcuts] unauthorized", { reason });
    expect(logged()).not.toContain("s3cret");
    expect(logged()).not.toContain("nope-nope");
  });

  it("logs which fields of the body are invalid without echoing their values", async () => {
    await POST(request({ ...VALID_BODY, merchant: undefined }));

    const [message, details] = warn.mock.calls[0];
    expect(message).toBe("[webhook/shortcuts] invalid body");
    expect(details.issues).toEqual([{ path: "merchant", message: expect.any(String) }]);
  });

  it("logs the stored purchase id and how long it took", async () => {
    await POST(request(VALID_BODY));

    expect(info).toHaveBeenCalledWith("[webhook/shortcuts] stored", {
      id: "pending-1",
      ms: expect.any(Number),
    });
  });

  it("logs a repeated purchase as a duplicate", async () => {
    mockRegister.mockResolvedValue({ record: { id: "pending-0" }, created: false });

    await POST(request(VALID_BODY));

    expect(info).toHaveBeenCalledWith("[webhook/shortcuts] duplicate", {
      id: "pending-0",
      ms: expect.any(Number),
    });
  });

  it("logs a failure with its duration", async () => {
    mockRegister.mockRejectedValue(new Error("db down"));

    await POST(request(VALID_BODY));

    expect(error).toHaveBeenCalledWith("[webhook/shortcuts] error", {
      message: "db down",
      ms: expect.any(Number),
    });
  });

  it("never writes the purchase details or the token to the log", async () => {
    await POST(request(VALID_BODY));
    await POST(request({ ...VALID_BODY, amount: "abc" }));

    for (const secret of ["s3cret", "Padaria", "12,50", "Nubank"]) {
      expect(logged()).not.toContain(secret);
    }
  });
});
