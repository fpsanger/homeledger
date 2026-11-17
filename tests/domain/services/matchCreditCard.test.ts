import type { CreditCardRecord } from "../../../src/domain/entities/CreditCard";
import { matchCreditCard } from "../../../src/domain/services/matchCreditCard";

const card = (id: string, name: string): CreditCardRecord => ({
  id,
  name,
  closureType: "FIXED",
  fixedClosureDay: 10,
  fixedClosurePreviousMonth: false,
  dueDayOfMonth: 20,
  closureNextMonth: false,
  createdAt: new Date("2026-01-01"),
});

const nubank = card("c-nu", "Nubank");
const itau = card("c-itau", "Itaú Platinum");

describe("matchCreditCard", () => {
  it("matches the exact name ignoring case and accents", () => {
    expect(matchCreditCard("NUBANK", [nubank, itau])).toBe(nubank);
    expect(matchCreditCard("itau platinum", [nubank, itau])).toBe(itau);
  });

  it("matches when the wallet name carries extra words around the card name", () => {
    expect(matchCreditCard("Nubank Mastercard •• 1234", [nubank, itau])).toBe(nubank);
  });

  it("matches when the registered name is longer than the wallet name", () => {
    expect(matchCreditCard("Itaú", [nubank, itau])).toBe(itau);
  });

  it("does not match on a partial word", () => {
    expect(matchCreditCard("Nubanking", [nubank])).toBeNull();
  });

  it("returns null when nothing matches", () => {
    expect(matchCreditCard("Santander", [nubank, itau])).toBeNull();
  });

  it("prefers an exact name over longer cards that contain it", () => {
    const nubankGold = card("c-nu2", "Nubank Ultravioleta");
    expect(matchCreditCard("Nubank", [nubank, nubankGold])).toBe(nubank);
  });

  it("returns null when more than one card could match", () => {
    const ultravioleta = card("c-nu2", "Nubank Ultravioleta");
    const roxinho = card("c-nu3", "Nubank Roxinho");
    expect(matchCreditCard("Nubank", [ultravioleta, roxinho])).toBeNull();
    expect(
      matchCreditCard("Nubank Mastercard 1234", [nubank, card("c-nu4", "Nubank Mastercard")]),
    ).toBeNull();
  });

  it("returns null for a blank wallet name", () => {
    expect(matchCreditCard("   ", [nubank])).toBeNull();
    expect(matchCreditCard("", [])).toBeNull();
  });
});
