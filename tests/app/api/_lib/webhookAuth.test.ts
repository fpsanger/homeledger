import {
  generateWebhookToken,
  hashWebhookToken,
  resolveWebhookPerson,
} from "../../../../src/app/api/_lib/webhookAuth";
import type { IWebhookTokenRepository } from "../../../../src/domain/repositories/IWebhookTokenRepository";

function makeTokens(active: Record<string, string>): IWebhookTokenRepository {
  return {
    issue: jest.fn(),
    revokeForPerson: jest.fn(),
    findActiveByHash: jest.fn(async (hash: string) =>
      active[hash] ? { personId: active[hash] } : null,
    ),
  };
}

describe("generateWebhookToken", () => {
  it("returns an hl_ token, its id and the hash that gets stored", () => {
    const { id, token, tokenHash } = generateWebhookToken();

    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(token).toMatch(/^hl_[0-9a-f]{64}$/);
    expect(tokenHash).toBe(hashWebhookToken(token));
    expect(tokenHash).not.toContain(token);
  });

  it("never repeats", () => {
    expect(generateWebhookToken().token).not.toBe(generateWebhookToken().token);
  });
});

describe("hashWebhookToken", () => {
  it("is a stable SHA-256 hex digest", () => {
    expect(hashWebhookToken("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
});

describe("resolveWebhookPerson", () => {
  const tokens = () => makeTokens({ [hashWebhookToken("ana-token")]: "person-1" });

  it("returns the person who owns the Bearer token", async () => {
    await expect(resolveWebhookPerson("Bearer ana-token", tokens())).resolves.toBe("person-1");
  });

  it("accepts a lowercase scheme", async () => {
    await expect(resolveWebhookPerson("bearer ana-token", tokens())).resolves.toBe("person-1");
  });

  it.each([
    ["a missing header", null],
    ["an empty header", ""],
    ["a different token", "Bearer other-token"],
    ["a token with the same prefix", "Bearer ana-token-and-more"],
    ["no scheme", "ana-token"],
    ["another scheme", "Basic ana-token"],
    ["an empty bearer", "Bearer "],
  ])("rejects %s", async (_label, header) => {
    await expect(resolveWebhookPerson(header, tokens())).resolves.toBeNull();
  });

  it("does not query the database when there is no bearer credential", async () => {
    const repo = tokens();

    await resolveWebhookPerson("Basic abc", repo);

    expect(repo.findActiveByHash).not.toHaveBeenCalled();
  });
});
