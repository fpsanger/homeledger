import { getLoyaltyProgramReportUseCase } from "../../../../src/application/use-cases/loyalty/GetLoyaltyProgramReportUseCase";
import type { ILoyaltyProgramRepository } from "../../../../src/domain/repositories/ILoyaltyProgramRepository";
import type {
  ILoyaltyTransactionRepository,
  LoyaltyTransactionRecord,
} from "../../../../src/domain/repositories/ILoyaltyTransactionRepository";
import type {
  ILoyaltyTransferRepository,
  LoyaltyTransferRecord,
} from "../../../../src/domain/repositories/ILoyaltyTransferRepository";

function makeTx(
  overrides: Partial<LoyaltyTransactionRecord> & Pick<LoyaltyTransactionRecord, "type" | "points">,
): LoyaltyTransactionRecord {
  return {
    id: `tx-${overrides.type}-${overrides.points}`,
    programId: "latam",
    personId: null,
    transferId: null,
    description: null,
    expiresAt: null,
    costBrl: null,
    valueBrl: null,
    date: new Date("2026-01-01"),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeTransfer(overrides: Partial<LoyaltyTransferRecord> = {}): LoyaltyTransferRecord {
  return {
    id: "transfer-1",
    fromProgramId: "livelo",
    toProgramId: "latam",
    pointsSent: 30000,
    pointsReceived: 38100,
    costBrl: null,
    transferDate: new Date("2026-02-01"),
    personId: null,
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function setup(transactions: LoyaltyTransactionRecord[], transfers: LoyaltyTransferRecord[]) {
  const programRepo = {
    findById: jest.fn().mockResolvedValue({ id: "latam" }),
  } as unknown as ILoyaltyProgramRepository;
  const transactionRepo = {
    findByProgramId: jest.fn().mockResolvedValue(transactions),
    findByProgramIdAndPersonId: jest.fn().mockResolvedValue(transactions),
  } as unknown as ILoyaltyTransactionRepository;
  const transferRepo = {
    findAll: jest.fn().mockResolvedValue(transfers),
  } as unknown as ILoyaltyTransferRepository;
  return { programRepo, transactionRepo, transferRepo };
}

describe("getLoyaltyProgramReportUseCase", () => {
  it("attaches pointsSent/pointsReceived to transactions that belong to a transfer", async () => {
    const { programRepo, transactionRepo, transferRepo } = setup(
      [
        makeTx({ type: "PURCHASE", points: 1000, costBrl: 25 }),
        makeTx({ type: "TRANSFER_IN", points: 38100, transferId: "transfer-1", costBrl: 857 }),
      ],
      [makeTransfer(), makeTransfer({ id: "other", pointsSent: 1, pointsReceived: 2 })],
    );

    const report = await getLoyaltyProgramReportUseCase(
      "latam",
      programRepo,
      transactionRepo,
      transferRepo,
    );

    const transferIn = report.transactions.find((t) => t.type === "TRANSFER_IN");
    expect(transferIn?.transfer).toEqual({ pointsSent: 30000, pointsReceived: 38100 });
    const purchase = report.transactions.find((t) => t.type === "PURCHASE");
    expect(purchase?.transfer).toBeUndefined();
  });

  it("leaves transfer undefined when the transfer record is missing", async () => {
    const { programRepo, transactionRepo, transferRepo } = setup(
      [makeTx({ type: "TRANSFER_IN", points: 100, transferId: "gone", costBrl: 1 })],
      [],
    );

    const report = await getLoyaltyProgramReportUseCase(
      "latam",
      programRepo,
      transactionRepo,
      transferRepo,
    );

    expect(report.transactions[0].transfer).toBeUndefined();
  });

  it("does not query transfers when no transaction belongs to one", async () => {
    const { programRepo, transactionRepo, transferRepo } = setup(
      [makeTx({ type: "PURCHASE", points: 1000, costBrl: 25 })],
      [],
    );

    await getLoyaltyProgramReportUseCase("latam", programRepo, transactionRepo, transferRepo);

    expect(transferRepo.findAll).not.toHaveBeenCalled();
  });

  it("filters by person when personId is given", async () => {
    const { programRepo, transactionRepo, transferRepo } = setup([], []);

    await getLoyaltyProgramReportUseCase(
      "latam",
      programRepo,
      transactionRepo,
      transferRepo,
      "person-1",
    );

    expect(transactionRepo.findByProgramIdAndPersonId).toHaveBeenCalledWith("latam", "person-1");
  });
});
