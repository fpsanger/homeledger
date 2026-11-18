import type { PrismaClient } from "@prisma/client";
import { PrismaWebhookTokenRepository } from "../../../src/infrastructure/repositories/PrismaWebhookTokenRepository";

function setup(table: Record<string, jest.Mock>, executeRaw = jest.fn().mockResolvedValue(1)) {
  const transaction = jest.fn(async (run: (tx: unknown) => Promise<unknown>) =>
    run({ webhookToken: table, $executeRaw: executeRaw }),
  );
  const prisma = { webhookToken: table, $transaction: transaction } as unknown as PrismaClient;
  return { repository: new PrismaWebhookTokenRepository(prisma), transaction };
}

describe("PrismaWebhookTokenRepository", () => {
  describe("issue", () => {
    it("revokes the person's active tokens and creates the new one in one transaction", async () => {
      const updateMany = jest.fn().mockResolvedValue({ count: 1 });
      const create = jest.fn().mockResolvedValue({});
      const { repository, transaction } = setup({ updateMany, create });

      await repository.issue({ id: "token-1", personId: "person-1", tokenHash: "hash-1" });

      expect(transaction).toHaveBeenCalledTimes(1);
      expect(updateMany).toHaveBeenCalledWith({
        where: { personId: "person-1", revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
      expect(create).toHaveBeenCalledWith({
        data: { id: "token-1", personId: "person-1", tokenHash: "hash-1" },
      });
      expect(updateMany.mock.invocationCallOrder[0]).toBeLessThan(
        create.mock.invocationCallOrder[0],
      );
    });
  });

  describe("issue concurrency", () => {
    it("takes a per-person advisory lock inside the transaction before revoking and creating", async () => {
      const updateMany = jest.fn().mockResolvedValue({ count: 0 });
      const create = jest.fn().mockResolvedValue({});
      const executeRaw = jest.fn().mockResolvedValue(1);
      const { repository } = setup({ updateMany, create }, executeRaw);

      await repository.issue({ id: "token-1", personId: "person-1", tokenHash: "hash-1" });

      const [strings, ...values] = executeRaw.mock.calls[0] as [TemplateStringsArray, ...unknown[]];
      expect(strings.join("?")).toContain("pg_advisory_xact_lock");
      expect(values).toEqual(["person-1"]);
      expect(executeRaw.mock.invocationCallOrder[0]).toBeLessThan(
        updateMany.mock.invocationCallOrder[0],
      );
    });

    it("does not revoke or create anything when the lock cannot be taken", async () => {
      const updateMany = jest.fn();
      const create = jest.fn();
      const executeRaw = jest.fn().mockRejectedValue(new Error("lock failed"));
      const { repository } = setup({ updateMany, create }, executeRaw);

      await expect(
        repository.issue({ id: "token-1", personId: "person-1", tokenHash: "hash-1" }),
      ).rejects.toThrow("lock failed");
      expect(updateMany).not.toHaveBeenCalled();
      expect(create).not.toHaveBeenCalled();
    });
  });

  describe("findActiveByHash", () => {
    it("looks the hash up among tokens that are not revoked", async () => {
      const findFirst = jest.fn().mockResolvedValue({ personId: "person-1" });
      const { repository } = setup({ findFirst });

      await expect(repository.findActiveByHash("hash-1")).resolves.toEqual({
        personId: "person-1",
      });
      expect(findFirst).toHaveBeenCalledWith({
        where: { tokenHash: "hash-1", revokedAt: null },
        select: { personId: true },
      });
    });

    it("returns null for an unknown or revoked token", async () => {
      const { repository } = setup({ findFirst: jest.fn().mockResolvedValue(null) });

      await expect(repository.findActiveByHash("nope")).resolves.toBeNull();
    });
  });

  describe("revokeForPerson", () => {
    it("revokes only the active tokens of that person", async () => {
      const updateMany = jest.fn().mockResolvedValue({ count: 1 });
      const { repository } = setup({ updateMany });

      await repository.revokeForPerson("person-1");

      expect(updateMany).toHaveBeenCalledWith({
        where: { personId: "person-1", revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });
});
