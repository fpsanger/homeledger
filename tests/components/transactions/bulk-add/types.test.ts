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

  it("requires a bill for an installment on a VARIABLE card", () => {
    const row = validRow({ type: "installment", creditCardId: "card-1" });
    expect(validateRow(row, "VARIABLE")).toBe("Informe a fatura (mês).");
    expect(validateRow({ ...row, billingMonth: "2026-09" }, "VARIABLE")).toBeNull();
    expect(validateRow(row, "FIXED")).toBeNull();
  });

  it("rejects a malformed installment bill", () => {
    const row = validRow({ type: "installment", creditCardId: "card-1", billingMonth: "2026-13" });
    expect(validateRow(row, "FIXED")).toBe("Fatura inválida.");
  });

  it("accepts a complete expense", () => {
    expect(validateRow(validRow())).toBeNull();
  });
});
