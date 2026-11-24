import { createLoyaltyProgramUseCase } from "../../../../src/application/use-cases/loyalty/CreateLoyaltyProgramUseCase";
import { updateLoyaltyProgramUseCase } from "../../../../src/application/use-cases/loyalty/UpdateLoyaltyProgramUseCase";
import { NotFoundError } from "../../../../src/domain/errors";
import type {
  ILoyaltyProgramRepository,
  LoyaltyProgramRecord,
} from "../../../../src/domain/repositories/ILoyaltyProgramRepository";

function makeProgram(overrides: Partial<LoyaltyProgramRecord> = {}): LoyaltyProgramRecord {
  return {
    id: "latam",
    name: "LATAM Pass",
    type: "AIRLINE",
    color: "#E31837",
    referenceMinPer1kBrl: 24,
    referenceMaxPer1kBrl: 26,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

function makeRepo(existing: LoyaltyProgramRecord | null = null) {
  return {
    save: jest.fn(async (p: LoyaltyProgramRecord) => p),
    findById: jest.fn().mockResolvedValue(existing),
    findAll: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<ILoyaltyProgramRepository>;
}

describe("createLoyaltyProgramUseCase", () => {
  it("persists the reference range", async () => {
    const repo = makeRepo();
    const result = await createLoyaltyProgramUseCase(
      {
        id: "smiles",
        name: "Smiles",
        type: "AIRLINE",
        color: "#f60",
        referenceMinPer1kBrl: 16,
      },
      repo,
    );
    expect(result.referenceMinPer1kBrl).toBe(16);
    expect(result.referenceMaxPer1kBrl).toBeNull();
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ referenceMinPer1kBrl: 16 }));
  });

  it("rejects an inverted range", async () => {
    const repo = makeRepo();
    await expect(
      createLoyaltyProgramUseCase(
        {
          id: "x",
          name: "X",
          type: "OTHER",
          color: "#000",
          referenceMinPer1kBrl: 30,
          referenceMaxPer1kBrl: 20,
        },
        repo,
      ),
    ).rejects.toThrow("must not exceed");
    expect(repo.save).not.toHaveBeenCalled();
  });
});

describe("updateLoyaltyProgramUseCase", () => {
  it("keeps the reference range when the fields are omitted", async () => {
    const repo = makeRepo(makeProgram());
    const result = await updateLoyaltyProgramUseCase({ id: "latam", name: "LATAM" }, repo);
    expect(result.referenceMinPer1kBrl).toBe(24);
    expect(result.referenceMaxPer1kBrl).toBe(26);
  });

  it("updates the range", async () => {
    const repo = makeRepo(makeProgram());
    const result = await updateLoyaltyProgramUseCase(
      { id: "latam", referenceMinPer1kBrl: 20, referenceMaxPer1kBrl: 22 },
      repo,
    );
    expect(result.referenceMinPer1kBrl).toBe(20);
    expect(result.referenceMaxPer1kBrl).toBe(22);
  });

  it("clears a bound when null is sent", async () => {
    const repo = makeRepo(makeProgram());
    const result = await updateLoyaltyProgramUseCase(
      { id: "latam", referenceMaxPer1kBrl: null },
      repo,
    );
    expect(result.referenceMinPer1kBrl).toBe(24);
    expect(result.referenceMaxPer1kBrl).toBeNull();
  });

  it("validates the merged range, not just the sent fields", async () => {
    const repo = makeRepo(makeProgram());
    await expect(
      updateLoyaltyProgramUseCase({ id: "latam", referenceMinPer1kBrl: 30 }, repo),
    ).rejects.toThrow("must not exceed");
    expect(repo.save).not.toHaveBeenCalled();
  });

  it("throws NotFoundError for an unknown program", async () => {
    await expect(updateLoyaltyProgramUseCase({ id: "nope" }, makeRepo(null))).rejects.toThrow(
      NotFoundError,
    );
  });
});
