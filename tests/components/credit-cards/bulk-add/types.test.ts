import {
  createEmptyRow,
  defaultSectionBillingMonth,
  duplicateRow,
  type PurchaseRow,
  resolveRowBillingMonth,
  validateBillingMonth,
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
    ["zero installments", { numberOfInstallments: "0" }, "Informe o número de parcelas."],
  ])("rejects %s", (_name, patch, expected) => {
    expect(validateRow(validRow(patch))).toBe(expected);
  });

  it("accepts a complete row", () => {
    expect(validateRow(validRow())).toBeNull();
  });

  it("accepts a single installment", () => {
    expect(validateRow(validRow({ numberOfInstallments: "1" }))).toBeNull();
  });
});

describe("bulk-add credit card duplicateRow", () => {
  const source = validRow({
    categoryId: "category-1",
    description: "Mercado",
    numberOfInstallments: "6",
    status: "success",
    isDuplicate: true,
  });

  it("keeps the row's own billing month override", () => {
    const copy = duplicateRow({ ...source, billingMonth: "2026-10" }, "2026-09-01");
    expect(copy.billingMonth).toBe("2026-10");
  });

  it("copies only the category, installments and description", () => {
    const copy = duplicateRow(source, "2026-09-01");

    expect(copy).toEqual({
      rowId: expect.any(String),
      amount: "",
      date: "2026-09-01",
      categoryId: "category-1",
      description: "Mercado",
      numberOfInstallments: "6",
      status: "pending",
    });
  });

  it("gives the copy its own row id", () => {
    expect(duplicateRow(source, "2026-09-01").rowId).not.toBe(source.rowId);
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

describe("bulk-add credit card billing month", () => {
  it("a row without its own billing month inherits the section's", () => {
    expect(resolveRowBillingMonth(validRow(), "2026-09")).toBe("2026-09");
    expect(resolveRowBillingMonth(validRow({ billingMonth: "" }), "2026-09")).toBe("2026-09");
  });

  it("a row's own billing month overrides the section's", () => {
    expect(resolveRowBillingMonth(validRow({ billingMonth: "2026-10" }), "2026-09")).toBe(
      "2026-10",
    );
  });

  it("VARIABLE sections default to the current month, FIXED to automatic", () => {
    expect(defaultSectionBillingMonth("VARIABLE", "2026-08-17")).toBe("2026-08");
    expect(defaultSectionBillingMonth("FIXED", "2026-08-17")).toBe("");
  });

  it("requires a billing month for VARIABLE cards only", () => {
    expect(validateBillingMonth("", "VARIABLE")).toBe("Informe a fatura (mês).");
    expect(validateBillingMonth("", "FIXED")).toBeNull();
    expect(validateBillingMonth("2026-09", "VARIABLE")).toBeNull();
  });

  it("rejects a malformed billing month", () => {
    expect(validateBillingMonth("2026-13", "FIXED")).toBe("Fatura inválida.");
  });
});
