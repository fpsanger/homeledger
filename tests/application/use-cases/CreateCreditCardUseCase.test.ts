import { createCreditCardUseCase } from "../../../src/application/use-cases/CreateCreditCardUseCase";
import type { CreditCardRecord } from "../../../src/domain/entities/CreditCard";
import type { ICreditCardRepository } from "../../../src/domain/repositories/ICreditCardRepository";

function makeRepo(overrides: Partial<ICreditCardRepository> = {}): ICreditCardRepository {
  return {
    save: jest.fn().mockResolvedValue({
      id: "card-1",
      name: "Nubank",
      closureType: "FIXED",
      fixedClosureDay: 25,
      dueDayOfMonth: 10,
      alwaysNextMonth: false,
      closureNextMonth: false,
      createdAt: new Date(),
    } as CreditCardRecord),
    update: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    delete: jest.fn(),
    hasPurchases: jest.fn(),
    setClosure: jest.fn(),
    findClosure: jest.fn(),
    findClosuresByCard: jest.fn(),
    deleteClosure: jest.fn(),
    ...overrides,
  };
}

describe("createCreditCardUseCase", () => {
  it("saves and returns the card", async () => {
    const repo = makeRepo();
    const result = await createCreditCardUseCase(
      {
        name: "Nubank",
        closureType: "FIXED",
        fixedClosureDay: 25,
        fixedClosurePreviousMonth: false,
        dueDayOfMonth: 10,
        alwaysNextMonth: false,
        closureNextMonth: false,
      },
      repo,
    );
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(result.name).toBe("Nubank");
  });

  it("throws when domain validation fails", async () => {
    const repo = makeRepo();
    await expect(
      createCreditCardUseCase(
        {
          name: "",
          closureType: "FIXED",
          fixedClosureDay: 25,
          fixedClosurePreviousMonth: false,
          dueDayOfMonth: 10,
          alwaysNextMonth: false,
          closureNextMonth: false,
        },
        repo,
      ),
    ).rejects.toThrow("Name is required");
    expect(repo.save).not.toHaveBeenCalled();
  });
});
