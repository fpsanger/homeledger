import type { NextRequest } from "next/server";
import { NotFoundError } from "../../../../../../src/domain/errors";

const mockIssue = jest.fn();
const mockRevoke = jest.fn();

jest.mock("../../../../../../src/app/api/_lib/repositories", () => ({
  createRepositories: () => ({ person: { name: "people" }, webhookToken: { name: "tokens" } }),
}));
jest.mock("../../../../../../src/application/use-cases/IssueWebhookTokenUseCase", () => ({
  issueWebhookTokenUseCase: (...args: unknown[]) => mockIssue(...args),
}));
jest.mock("../../../../../../src/application/use-cases/RevokeWebhookTokenUseCase", () => ({
  revokeWebhookTokenUseCase: (...args: unknown[]) => mockRevoke(...args),
}));

import { DELETE, POST } from "../../../../../../src/app/api/people/[id]/webhook-token/route";

const params = { params: { id: "person-1" } };
const request = {} as NextRequest;

beforeEach(() => {
  jest.clearAllMocks();
  mockIssue.mockResolvedValue({ token: "hl_plain" });
  mockRevoke.mockResolvedValue(undefined);
});

describe("POST /api/people/[id]/webhook-token", () => {
  it("issues a token for the person and answers 201 with it", async () => {
    const res = await POST(request, params);

    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toEqual({ token: "hl_plain" });
    const [personId, deps] = mockIssue.mock.calls[0];
    expect(personId).toBe("person-1");
    expect(deps).toMatchObject({ people: { name: "people" }, tokens: { name: "tokens" } });
    expect(deps.mint().token).toMatch(/^hl_[0-9a-f]{64}$/);
  });

  it("answers 404 for an unknown person", async () => {
    mockIssue.mockRejectedValue(new NotFoundError("Person not found"));

    const res = await POST(request, params);

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/people/[id]/webhook-token", () => {
  it("revokes the person's token and answers 204", async () => {
    const res = await DELETE(request, params);

    expect(res.status).toBe(204);
    expect(mockRevoke).toHaveBeenCalledWith("person-1", {
      people: { name: "people" },
      tokens: { name: "tokens" },
    });
  });

  it("answers 404 for an unknown person", async () => {
    mockRevoke.mockRejectedValue(new NotFoundError("Person not found"));

    const res = await DELETE(request, params);

    expect(res.status).toBe(404);
  });
});
