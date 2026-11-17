import type { PrismaClient } from "@prisma/client";
import type { PendingTransactionRecord } from "../../../src/domain/entities/PendingTransaction";
import { PrismaPendingTransactionRepository } from "../../../src/infrastructure/repositories/PrismaPendingTransactionRepository";

const RECORD: PendingTransactionRecord = {
  id: "pending-1",
  personId: "person-1",
  amount: 12.5,
  occurredAt: new Date("2026-11-17T01:30:00Z"),
  occurredOn: new Date("2026-11-16"),
  merchant: "Padaria",
  cardName: "Nubank",
  creditCardId: "card-1",
  suggestedCategoryId: null,
  status: "PENDING",
  createdAt: new Date("2026-11-17T01:31:00Z"),
  resolvedAt: null,
};

const row = (overrides = {}) => ({
  ...RECORD,
  amount: { toNumber: () => 12.5 },
  ...overrides,
});

function setup(table: Record<string, jest.Mock>) {
  const prisma = { pendingTransaction: table } as unknown as PrismaClient;
  return new PrismaPendingTransactionRepository(prisma);
}

const uniqueViolation = Object.assign(new Error("Unique constraint failed"), { code: "P2002" });

describe("PrismaPendingTransactionRepository", () => {
  describe("saveIfNew", () => {
    it("creates the row and reports it as new", async () => {
      const create = jest.fn().mockResolvedValue(row());

      const result = await setup({ create }).saveIfNew(RECORD);

      expect(result.created).toBe(true);
      expect(result.record).toMatchObject({ id: "pending-1", amount: 12.5, status: "PENDING" });
      expect(create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: "pending-1",
          personId: "person-1",
          amount: 12.5,
          occurredAt: RECORD.occurredAt,
          merchant: "Padaria",
          cardName: "Nubank",
        }),
      });
    });

    it("returns the existing row when the same purchase was already reported", async () => {
      const create = jest.fn().mockRejectedValue(uniqueViolation);
      const findFirst = jest.fn().mockResolvedValue(row({ id: "pending-0" }));

      const result = await setup({ create, findFirst }).saveIfNew(RECORD);

      expect(result.created).toBe(false);
      expect(result.record.id).toBe("pending-0");
      expect(findFirst).toHaveBeenCalledWith({
        where: {
          personId: "person-1",
          amount: 12.5,
          occurredAt: RECORD.occurredAt,
          merchant: "Padaria",
          cardName: "Nubank",
        },
      });
    });

    it("rethrows errors that are not a unique violation", async () => {
      const create = jest.fn().mockRejectedValue(new Error("connection lost"));

      await expect(setup({ create }).saveIfNew(RECORD)).rejects.toThrow("connection lost");
    });

    it("rethrows the violation when the conflicting row cannot be found", async () => {
      const create = jest.fn().mockRejectedValue(uniqueViolation);
      const findFirst = jest.fn().mockResolvedValue(null);

      await expect(setup({ create, findFirst }).saveIfNew(RECORD)).rejects.toBe(uniqueViolation);
    });
  });

  it("finds only PENDING rows, newest purchase first", async () => {
    const findMany = jest.fn().mockResolvedValue([row()]);

    const result = await setup({ findMany }).findPending();

    expect(result).toHaveLength(1);
    expect(findMany).toHaveBeenCalledWith({
      where: { status: "PENDING" },
      orderBy: { occurredAt: "desc" },
    });
  });

  it("returns null for an unknown id", async () => {
    const findUnique = jest.fn().mockResolvedValue(null);

    await expect(setup({ findUnique }).findById("nope")).resolves.toBeNull();
  });

  describe("resolve", () => {
    it("only moves rows that are still PENDING and reports whether it did", async () => {
      const updateMany = jest.fn().mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({
        count: 0,
      });
      const repo = setup({ updateMany });
      const at = new Date("2026-11-17T10:00:00Z");

      await expect(repo.resolve("pending-1", "CONFIRMED", at)).resolves.toBe(true);
      await expect(repo.resolve("pending-1", "CONFIRMED", at)).resolves.toBe(false);
      expect(updateMany).toHaveBeenCalledWith({
        where: { id: "pending-1", status: "PENDING" },
        data: { status: "CONFIRMED", resolvedAt: at },
      });
    });
  });

  it("reopens a row by clearing its status and resolution time", async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });

    await setup({ updateMany }).reopen("pending-1");

    expect(updateMany).toHaveBeenCalledWith({
      where: { id: "pending-1" },
      data: { status: "PENDING", resolvedAt: null },
    });
  });
});
