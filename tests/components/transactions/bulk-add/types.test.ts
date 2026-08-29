import {
  type BulkRow,
  createEmptyRow,
  validateRow,
} from "@/components/transactions/bulk-add/types";

function validRow(patch: Partial<BulkRow> = {}): BulkRow {
  return {
    ...createEmptyRow("person-1", "2026-08-17"),
    amount: "100,00",
    ...patch,
  };
}

describe("bulk-add row validation", () => {
  it.each([
    ["missing person", { personId: "" }, "Selecione a pessoa."],
    ["missing amount", { amount: "" }, "Informe um valor válido."],
    ["zero amount", { amount: "0" }, "Informe um valor válido."],
    ["missing date", { date: "" }, "Informe a data."],
    [
      "missing installment card",
      { type: "installment" as const, creditCardId: "" },
      "Selecione o cartão.",
    ],
  ])("rejects %s", (_name, patch, expected) => {
    expect(validateRow(validRow(patch))).toBe(expected);
  });

  it("accepts a complete expense", () => {
    expect(validateRow(validRow())).toBeNull();
  });
});
