import {
  type BulkRow,
  createEmptyRow,
  isBlankRow,
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
  ])("rejects %s", (_name, patch, expected) => {
    expect(validateRow(validRow(patch))).toBe(expected);
  });

  it("accepts a complete expense", () => {
    expect(validateRow(validRow())).toBeNull();
  });

  it("accepts a complete income", () => {
    expect(validateRow(validRow({ type: "income" }))).toBeNull();
  });
});

describe("bulk-add blank row", () => {
  const empty = () => createEmptyRow("person-1", "2026-08-17");

  it("is blank until an amount, description or category is entered", () => {
    expect(isBlankRow(empty())).toBe(true);
    expect(isBlankRow(validRow())).toBe(false);
    expect(isBlankRow({ ...empty(), description: "Mercado" })).toBe(false);
    expect(isBlankRow({ ...empty(), categoryId: "c1" })).toBe(false);
  });

  it("does not count a changed type, payment method or date as input", () => {
    const row = { ...empty(), type: "income" as const, paymentMethod: "PIX", date: "2026-08-20" };
    expect(isBlankRow(row)).toBe(true);
  });
});
