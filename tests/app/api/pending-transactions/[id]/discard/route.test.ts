import type { NextRequest } from "next/server";
import {
  NotFoundError,
  PendingTransactionResolvedError,
} from "../../../../../../src/domain/errors";

const mockDiscard = jest.fn();

jest.mock("../../../../../../src/app/api/_lib/repositories", () => ({
  createRepositories: () => ({ pendingTransaction: { name: "pending" } }),
}));
jest.mock("../../../../../../src/application/use-cases/ConfirmPendingTransactionUseCase", () => ({
  discardPendingTransactionUseCase: (...args: unknown[]) => mockDiscard(...args),
}));

import { POST } from "../../../../../../src/app/api/pending-transactions/[id]/discard/route";

const params = { params: { id: "pending-1" } };
const request = {} as NextRequest;

beforeEach(() => {
  jest.clearAllMocks();
  mockDiscard.mockResolvedValue(undefined);
});

describe("POST /api/pending-transactions/[id]/discard", () => {
  it("discards the pending purchase and answers 204", async () => {
    const res = await POST(request, params);

    expect(res.status).toBe(204);
    expect(mockDiscard).toHaveBeenCalledWith("pending-1", { name: "pending" });
  });

  it("answers 404 for an unknown pending purchase", async () => {
    mockDiscard.mockRejectedValue(new NotFoundError("Pending transaction not found"));

    const res = await POST(request, params);

    expect(res.status).toBe(404);
  });

  it("answers 409 when the purchase was already resolved", async () => {
    mockDiscard.mockRejectedValue(new PendingTransactionResolvedError());

    const res = await POST(request, params);

    expect(res.status).toBe(409);
  });
});
