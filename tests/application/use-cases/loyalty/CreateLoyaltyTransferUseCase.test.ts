import { createLoyaltyTransferUseCase } from "../../../../src/application/use-cases/loyalty/CreateLoyaltyTransferUseCase";
import type { ILoyaltyTransferRepository, LoyaltyTransferRecord } from "../../../../src/domain/repositories/ILoyaltyTransferRepository";
import type { ILoyaltyTransactionRepository, LoyaltyTransactionRecord } from "../../../../src/domain/repositories/ILoyaltyTransactionRepository";

function makeTransferRecord(overrides: Partial<LoyaltyTransferRecord> = {}): LoyaltyTransferRecord {
  return {
    id: "transfer-id",
    fromProgramId: "livelo",
    toProgramId: "latam",
    pointsSent: 80000,
    pointsReceived: 96000,
    costBrl: null,
    transferDate: new Date("2026-07-01"),
    personId: null,
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeTx(overrides: Partial<LoyaltyTransactionRecord> & Pick<LoyaltyTransactionRecord, "type" | "points">): LoyaltyTransactionRecord {
  return {
    id: "tx-" + Math.random(),
    programId: "livelo",
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

function makeTransferRepo(): ILoyaltyTransferRepository {
  const saved = makeTransferRecord();
  return {
    save: jest.fn().mockResolvedValue(saved),
    findById: jest.fn(),
    findAll: jest.fn(),
    delete: jest.fn(),
  };
}

function makeTransactionRepo(fromProgramTxs: LoyaltyTransactionRecord[] = []): ILoyaltyTransactionRepository {
  return {
    save: jest.fn().mockImplementation(async (tx) => tx),
    findById: jest.fn(),
    findByProgramId: jest.fn().mockResolvedValue(fromProgramTxs),
    findByProgramIdAndPersonId: jest.fn().mockResolvedValue([]),
    findByTransferId: jest.fn().mockResolvedValue([]),
    delete: jest.fn(),
  };
}

const BASE_INPUT = {
  transferId: "transfer-id",
  outTxId: "out-tx-id",
  inTxId: "in-tx-id",
  fromProgramId: "livelo",
  toProgramId: "latam",
  pointsSent: 80000,
  pointsReceived: 96000,
  costBrl: null,
  transferDate: new Date("2026-07-01"),
  personId: null,
  description: null,
};

describe("createLoyaltyTransferUseCase", () => {
  it("saves transfer record and both transactions", async () => {
    const transferRepo = makeTransferRepo();
    const transactionRepo = makeTransactionRepo([
      makeTx({ type: "PURCHASE", points: 80000, costBrl: 3592, date: new Date("2026-01-01") }),
      makeTx({ id: "out-tx-id", type: "TRANSFER_OUT", points: 80000, transferId: "transfer-id", date: new Date("2026-07-01") }),
    ]);

    await createLoyaltyTransferUseCase(BASE_INPUT, transferRepo, transactionRepo);

    expect(transferRepo.save).toHaveBeenCalledTimes(1);
    expect(transactionRepo.save).toHaveBeenCalledTimes(2);
  });

  it("TRANSFER_OUT uses fromProgramId and pointsSent", async () => {
    const transferRepo = makeTransferRepo();
    const transactionRepo = makeTransactionRepo([
      makeTx({ type: "PURCHASE", points: 80000, costBrl: 3592 }),
      makeTx({ id: "out-tx-id", type: "TRANSFER_OUT", points: 80000, transferId: "transfer-id" }),
    ]);

    await createLoyaltyTransferUseCase(BASE_INPUT, transferRepo, transactionRepo);

    const [firstSave] = (transactionRepo.save as jest.Mock).mock.calls;
    const outTx = firstSave[0] as LoyaltyTransactionRecord;
    expect(outTx.type).toBe("TRANSFER_OUT");
    expect(outTx.programId).toBe("livelo");
    expect(outTx.points).toBe(80000);
  });

  it("TRANSFER_IN inherits FIFO cost from source program", async () => {
    // LIVELO: 80,000 purchased points at R$44.90/1000 = R$3,592 total cost
    const transferRepo = makeTransferRepo();
    const transactionRepo = makeTransactionRepo([
      makeTx({ type: "PURCHASE", points: 80000, costBrl: 3592, date: new Date("2026-01-01") }),
      makeTx({ id: "out-tx-id", type: "TRANSFER_OUT", points: 80000, transferId: "transfer-id", date: new Date("2026-07-01") }),
    ]);

    await createLoyaltyTransferUseCase(BASE_INPUT, transferRepo, transactionRepo);

    const [, secondSave] = (transactionRepo.save as jest.Mock).mock.calls;
    const inTx = secondSave[0] as LoyaltyTransactionRecord;
    expect(inTx.type).toBe("TRANSFER_IN");
    expect(inTx.programId).toBe("latam");
    expect(inTx.points).toBe(96000);
    // costBrl should be the FIFO cost of the 80,000 LIVELO points sent
    expect(inTx.costBrl).toBeCloseTo(3592);
  });

  it("TRANSFER_IN gets costBrl = 0 when source has only free (EARN) points", async () => {
    const transferRepo = makeTransferRepo();
    const transactionRepo = makeTransactionRepo([
      makeTx({ type: "EARN", points: 80000, date: new Date("2026-01-01") }),
      makeTx({ id: "out-tx-id", type: "TRANSFER_OUT", points: 80000, transferId: "transfer-id", date: new Date("2026-07-01") }),
    ]);

    await createLoyaltyTransferUseCase(BASE_INPUT, transferRepo, transactionRepo);

    const [, secondSave] = (transactionRepo.save as jest.Mock).mock.calls;
    const inTx = secondSave[0] as LoyaltyTransactionRecord;
    expect(inTx.type).toBe("TRANSFER_IN");
    expect(inTx.costBrl).toBe(0);
  });

  it("TRANSFER_IN cost reflects partial purchased lots (mixed EARN + PURCHASE)", async () => {
    // 40,000 EARN (free) + 40,000 PURCHASE at R$44.90/1000 = R$1,796
    // Transfer all 80,000: FIFO consumes free EARN first, then 40,000 PURCHASE = R$1,796
    const transferRepo = makeTransferRepo();
    const transactionRepo = makeTransactionRepo([
      makeTx({ type: "EARN", points: 40000, date: new Date("2026-01-01") }),
      makeTx({ type: "PURCHASE", points: 40000, costBrl: 1796, date: new Date("2026-02-01") }),
      makeTx({ id: "out-tx-id", type: "TRANSFER_OUT", points: 80000, transferId: "transfer-id", date: new Date("2026-07-01") }),
    ]);

    await createLoyaltyTransferUseCase(BASE_INPUT, transferRepo, transactionRepo);

    const [, secondSave] = (transactionRepo.save as jest.Mock).mock.calls;
    const inTx = secondSave[0] as LoyaltyTransactionRecord;
    expect(inTx.costBrl).toBeCloseTo(1796);
  });
});
