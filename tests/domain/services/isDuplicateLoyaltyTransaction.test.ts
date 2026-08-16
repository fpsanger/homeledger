import type { LoyaltyTransactionRecord } from "../../../src/domain/entities/LoyaltyTransaction";
import { findDuplicateLoyaltyTransaction } from "../../../src/domain/services/isDuplicateLoyaltyTransaction";

function makeTx(overrides: Partial<LoyaltyTransactionRecord> = {}): LoyaltyTransactionRecord {
  return {
    id: "1",
    programId: "livelo",
    personId: "person-1",
    transferId: null,
    type: "EARN",
    points: 100,
    date: new Date("2026-05-07"),
    description: "",
    expiresAt: null,
    costBrl: null,
    valueBrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("findDuplicateLoyaltyTransaction", () => {
  it("returns matching record when same type, points, person, and date exist", () => {
    const existing = [
      makeTx({ type: "EARN", points: 100, personId: "person-1", date: new Date("2026-05-07") }),
    ];
    expect(
      findDuplicateLoyaltyTransaction(existing, "EARN", 100, "person-1", "2026-05-07"),
    ).not.toBeNull();
  });

  it("returns null when points differ", () => {
    const existing = [makeTx({ type: "EARN", points: 100, date: new Date("2026-05-07") })];
    expect(
      findDuplicateLoyaltyTransaction(existing, "EARN", 200, "person-1", "2026-05-07"),
    ).toBeNull();
  });

  it("returns null when type differs", () => {
    const existing = [makeTx({ type: "EARN", points: 100, date: new Date("2026-05-07") })];
    expect(
      findDuplicateLoyaltyTransaction(existing, "BONUS", 100, "person-1", "2026-05-07"),
    ).toBeNull();
  });

  it("returns null when person differs", () => {
    const existing = [
      makeTx({ type: "EARN", points: 100, personId: "person-1", date: new Date("2026-05-07") }),
    ];
    expect(
      findDuplicateLoyaltyTransaction(existing, "EARN", 100, "person-2", "2026-05-07"),
    ).toBeNull();
  });

  it("returns null when date is more than 30 days away", () => {
    const existing = [makeTx({ type: "EARN", points: 100, date: new Date("2026-05-07") })];
    expect(
      findDuplicateLoyaltyTransaction(existing, "EARN", 100, "person-1", "2026-06-08"),
    ).toBeNull();
  });

  it("returns matching record when dates are within 30 days", () => {
    const existing = [makeTx({ type: "EARN", points: 100, date: new Date("2026-05-07") })];
    expect(
      findDuplicateLoyaltyTransaction(existing, "EARN", 100, "person-1", "2026-05-20"),
    ).not.toBeNull();
  });

  it("returns null when list is empty", () => {
    expect(findDuplicateLoyaltyTransaction([], "EARN", 100, "person-1", "2026-05-07")).toBeNull();
  });

  it("returns null when points or date not yet provided", () => {
    const existing = [makeTx()];
    expect(
      findDuplicateLoyaltyTransaction(existing, "EARN", null, "person-1", "2026-05-07"),
    ).toBeNull();
    expect(findDuplicateLoyaltyTransaction(existing, "EARN", 100, "person-1", null)).toBeNull();
  });

  it("matches when personId is null on both sides", () => {
    const existing = [
      makeTx({ type: "EARN", points: 100, personId: null, date: new Date("2026-05-07") }),
    ];
    expect(
      findDuplicateLoyaltyTransaction(existing, "EARN", 100, null, "2026-05-07"),
    ).not.toBeNull();
  });
});
