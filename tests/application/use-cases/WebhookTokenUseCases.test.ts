import { issueWebhookTokenUseCase } from "../../../src/application/use-cases/IssueWebhookTokenUseCase";
import { revokeWebhookTokenUseCase } from "../../../src/application/use-cases/RevokeWebhookTokenUseCase";
import type { IPersonRepository } from "../../../src/domain/repositories/IPersonRepository";
import type { IWebhookTokenRepository } from "../../../src/domain/repositories/IWebhookTokenRepository";

function makePeople(exists: boolean): IPersonRepository {
  return {
    findAll: jest.fn(),
    findById: jest
      .fn()
      .mockResolvedValue(exists ? { id: "person-1", name: "Ana", createdAt: new Date() } : null),
    save: jest.fn(),
    delete: jest.fn(),
  };
}

function makeTokens(): IWebhookTokenRepository {
  return {
    issue: jest.fn().mockResolvedValue(undefined),
    findActiveByHash: jest.fn(),
    revokeForPerson: jest.fn().mockResolvedValue(undefined),
  };
}

const mint = () => ({ id: "token-1", token: "hl_plain", tokenHash: "hash-of-plain" });

describe("issueWebhookTokenUseCase", () => {
  it("stores only the hash and returns the plain token once", async () => {
    const tokens = makeTokens();

    const result = await issueWebhookTokenUseCase("person-1", {
      people: makePeople(true),
      tokens,
      mint,
    });

    expect(result).toEqual({ token: "hl_plain" });
    expect(tokens.issue).toHaveBeenCalledWith({
      id: "token-1",
      personId: "person-1",
      tokenHash: "hash-of-plain",
    });
    expect(JSON.stringify((tokens.issue as jest.Mock).mock.calls)).not.toContain("hl_plain");
  });

  it("throws NotFoundError and stores nothing for an unknown person", async () => {
    const tokens = makeTokens();

    await expect(
      issueWebhookTokenUseCase("ghost", { people: makePeople(false), tokens, mint }),
    ).rejects.toThrow("Person not found");
    expect(tokens.issue).not.toHaveBeenCalled();
  });
});

describe("revokeWebhookTokenUseCase", () => {
  it("revokes the person's token", async () => {
    const tokens = makeTokens();

    await revokeWebhookTokenUseCase("person-1", { people: makePeople(true), tokens });

    expect(tokens.revokeForPerson).toHaveBeenCalledWith("person-1");
  });

  it("throws NotFoundError for an unknown person", async () => {
    const tokens = makeTokens();

    await expect(
      revokeWebhookTokenUseCase("ghost", { people: makePeople(false), tokens }),
    ).rejects.toThrow("Person not found");
    expect(tokens.revokeForPerson).not.toHaveBeenCalled();
  });
});
