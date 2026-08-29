import {
  createEmptyRow,
  type PurchaseRow,
  validatePersonId,
  validateRow,
} from "@/components/credit-cards/bulk-add/types";

function validRow(patch: Partial<PurchaseRow> = {}): PurchaseRow {
  return {
    ...createEmptyRow("2026-08-17"),
    amount: "100,00",
    ...patch,
  };
}

describe("bulk-add credit card purchase row validation", () => {
  it.each([
    ["missing amount", { amount: "" }, "Informe um valor válido."],
    ["zero amount", { amount: "0" }, "Informe um valor válido."],
    ["missing date", { date: "" }, "Informe a data."],
    ["missing installments", { numberOfInstallments: "" }, "Informe o número de parcelas."],
    ["installments below 2", { numberOfInstallments: "1" }, "Informe o número de parcelas."],
  ])("rejects %s", (_name, patch, expected) => {
    expect(validateRow(validRow(patch))).toBe(expected);
  });

  it("accepts a complete row", () => {
    expect(validateRow(validRow())).toBeNull();
  });
});

describe("bulk-add credit card person validation", () => {
  it("rejects a missing person", () => {
    expect(validatePersonId("")).toBe("Selecione a pessoa.");
  });

  it("accepts a selected person", () => {
    expect(validatePersonId("person-1")).toBeNull();
  });
});
