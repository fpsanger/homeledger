import { resolveClosureForDate } from "../../../src/application/services/resolveCardClosure";
import type {
  CreditCardClosureRecord,
  CreditCardRecord,
} from "../../../src/domain/entities/CreditCard";
import type { ICreditCardRepository } from "../../../src/domain/repositories/ICreditCardRepository";

const FIXED_CARD: CreditCardRecord = {
  id: "card-1",
  name: "Nubank",
  closureType: "FIXED",
  fixedClosureDay: 10,
  dueDayOfMonth: 17,
  alwaysNextMonth: false,
  closureNextMonth: false,
  fixedClosurePreviousMonth: false,
  createdAt: new Date(),
};

const VARIABLE_CARD: CreditCardRecord = {
  id: "card-1",
  name: "C6 Bank",
  closureType: "VARIABLE",
  fixedClosureDay: null,
  dueDayOfMonth: 10,
  alwaysNextMonth: false,
  closureNextMonth: false,
  fixedClosurePreviousMonth: false,
  createdAt: new Date(),
};

function makeCardRepo(
  closuresByBillingMonth: Record<number, CreditCardClosureRecord>,
): ICreditCardRepository {
  return {
    findById: jest.fn(),
    findClosure: jest
      .fn()
      .mockImplementation((_cardId: string, _year: number, month: number) =>
        Promise.resolve(closuresByBillingMonth[month] ?? null),
      ),
    save: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn(),
    delete: jest.fn(),
    hasPurchases: jest.fn(),
    setClosure: jest.fn(),
    findClosuresByCard: jest.fn(),
    deleteClosure: jest.fn(),
  };
}

describe("resolveClosureForDate", () => {
  it("resolves a FIXED card's closure directly from the card", async () => {
    const result = await resolveClosureForDate(
      FIXED_CARD,
      new Date("2026-05-04"),
      makeCardRepo({}),
    );
    expect(result).toEqual({
      closureDay: 10,
      closureInPreviousMonth: false,
      effectiveClosureNextMonth: false,
    });
  });

  it("throws when a FIXED card is missing fixedClosureDay", async () => {
    await expect(
      resolveClosureForDate(
        { ...FIXED_CARD, fixedClosureDay: null },
        new Date("2026-05-04"),
        makeCardRepo({}),
      ),
    ).rejects.toThrow("FIXED card is missing fixedClosureDay");
  });

  it("resolves a VARIABLE card's closure from the current month's record", async () => {
    const closures = {
      5: {
        id: "c5",
        creditCardId: "card-1",
        year: 2026,
        month: 5,
        closureDay: 28,
        previousMonth: false,
      },
    };
    const result = await resolveClosureForDate(
      VARIABLE_CARD,
      new Date("2026-05-04"),
      makeCardRepo(closures),
    );
    expect(result).toEqual({
      closureDay: 28,
      closureInPreviousMonth: false,
      effectiveClosureNextMonth: false,
    });
  });

  it("resolves a VARIABLE card's closure from the next billing month's previousMonth record", async () => {
    const closures = {
      6: {
        id: "c6",
        creditCardId: "card-1",
        year: 2026,
        month: 6,
        closureDay: 28,
        previousMonth: true,
      },
    };
    const result = await resolveClosureForDate(
      VARIABLE_CARD,
      new Date("2026-05-04"),
      makeCardRepo(closures),
    );
    expect(result).toEqual({
      closureDay: 28,
      closureInPreviousMonth: true,
      effectiveClosureNextMonth: false,
    });
  });

  it("throws when a VARIABLE card has no closure set for the month", async () => {
    await expect(
      resolveClosureForDate(VARIABLE_CARD, new Date("2026-05-04"), makeCardRepo({})),
    ).rejects.toThrow(/No closure date set for C6 Bank in 2026-05/);
  });
});
