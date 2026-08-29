import { deleteLoyaltyTransferUseCase } from "../../../../src/application/use-cases/loyalty/DeleteLoyaltyTransferUseCase";
import { NotFoundError } from "../../../../src/domain/errors";
import type {
  ILoyaltyTransactionRepository,
  LoyaltyTransactionRecord,
} from "../../../../src/domain/repositories/ILoyaltyTransactionRepository";
import type {
  ILoyaltyTransferRepository,
  LoyaltyTransferRecord,
} from "../../../../src/domain/repositories/ILoyaltyTransferRepository";

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

function makeTx(
  overrides: Partial<LoyaltyTransactionRecord> &
    Pick<LoyaltyTransactionRecord, "type" | "id" | "programId">,
): LoyaltyTransactionRecord {
  return {
    personId: null,
    transferId: "transfer-id",
    points: 80000,
    description: null,
    expiresAt: null,
    costBrl: null,
    valueBrl: null,
    date: new Date("2026-07-01"),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeTransferRepo(existing: LoyaltyTransferRecord | null): ILoyaltyTransferRepository {
  return {
    save: jest.fn(),
    findById: jest.fn().mockResolvedValue(existing),
    findAll: jest.fn(),
    delete: jest.fn(),
  };
}

function makeTransactionRepo(
  transferTxs: LoyaltyTransactionRecord[],
): ILoyaltyTransactionRepository {
  return {
    save: jest.fn(),
    findById: jest.fn(),
    findByProgramId: jest.fn(),
    findByProgramIdAndPersonId: jest.fn(),
    findByTransferId: jest.fn().mockResolvedValue(transferTxs),
    delete: jest.fn(),
  };
}

describe("deleteLoyaltyTransferUseCase", () => {
  it("deletes both TRANSFER_OUT and TRANSFER_IN transactions, then the transfer", async () => {
    const transferRepo = makeTransferRepo(makeTransferRecord());
    const transactionRepo = makeTransactionRepo([
      makeTx({ id: "out-tx-id", type: "TRANSFER_OUT", programId: "livelo" }),
      makeTx({ id: "in-tx-id", type: "TRANSFER_IN", programId: "latam" }),
    ]);

    await deleteLoyaltyTransferUseCase("transfer-id", transferRepo, transactionRepo);

    expect(transactionRepo.delete).toHaveBeenCalledWith("out-tx-id");
    expect(transactionRepo.delete).toHaveBeenCalledWith("in-tx-id");
    expect(transactionRepo.delete).toHaveBeenCalledTimes(2);
    expect(transferRepo.delete).toHaveBeenCalledWith("transfer-id");
  });

  it("throws NotFoundError when transfer does not exist", async () => {
    const transferRepo = makeTransferRepo(null);
    const transactionRepo = makeTransactionRepo([]);

    await expect(
      deleteLoyaltyTransferUseCase("missing-id", transferRepo, transactionRepo),
    ).rejects.toThrow(NotFoundError);
    expect(transactionRepo.delete).not.toHaveBeenCalled();
    expect(transferRepo.delete).not.toHaveBeenCalled();
  });
});
