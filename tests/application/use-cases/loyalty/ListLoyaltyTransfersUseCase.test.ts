import { listLoyaltyTransfersUseCase } from "../../../../src/application/use-cases/loyalty/ListLoyaltyTransfersUseCase";
import type { ILoyaltyTransferRepository, LoyaltyTransferRecord } from "../../../../src/domain/repositories/ILoyaltyTransferRepository";

const makeRepo = (transfers: LoyaltyTransferRecord[]): ILoyaltyTransferRepository => ({
  save: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn().mockResolvedValue(transfers),
  delete: jest.fn(),
});

const makeTransfer = (overrides = {}): LoyaltyTransferRecord => ({
  id: "t1",
  fromProgramId: "p1",
  toProgramId: "p2",
  pointsSent: 10000,
  pointsReceived: 20000,
  costBrl: null,
  transferDate: new Date("2026-05-25"),
  personId: null,
  description: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe("listLoyaltyTransfersUseCase", () => {
  it("returns all transfers from repo", async () => {
    const transfers = [makeTransfer(), makeTransfer({ id: "t2" })];
    const repo = makeRepo(transfers);
    const result = await listLoyaltyTransfersUseCase(repo);
    expect(result).toEqual(transfers);
    expect(repo.findAll).toHaveBeenCalledTimes(1);
  });

  it("returns empty array when no transfers", async () => {
    const repo = makeRepo([]);
    const result = await listLoyaltyTransfersUseCase(repo);
    expect(result).toEqual([]);
  });
});
