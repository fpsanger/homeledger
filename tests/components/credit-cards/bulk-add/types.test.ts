import {
  countPatch,
  createEmptyRow,
  defaultSectionBillingMonth,
  duplicateRow,
  installmentPatch,
  isBlankPurchaseRow,
  type PurchaseRow,
  resolveRowBillingMonth,
  totalPatch,
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
      installmentAmount: "",
      lastEdited: "total",
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

describe("bulk-add credit card empty row", () => {
  const empty = () => createEmptyRow("2026-08-17");

  it("starts as a single installment", () => {
    expect(empty().numberOfInstallments).toBe("1");
  });

  it("is blank until an amount, description or category is entered", () => {
    expect(isBlankPurchaseRow(empty())).toBe(true);
    expect(isBlankPurchaseRow(validRow())).toBe(false);
    expect(isBlankPurchaseRow({ ...empty(), description: "Mercado" })).toBe(false);
    expect(isBlankPurchaseRow({ ...empty(), categoryId: "c1" })).toBe(false);
  });

  it("does not count a changed date or installment count as input", () => {
    expect(isBlankPurchaseRow({ ...empty(), date: "2026-08-20", numberOfInstallments: "3" })).toBe(
      true,
    );
  });
});

describe("bulk-add credit card linked amounts", () => {
  const row = (patch: Partial<PurchaseRow> = {}) => validRow({ amount: "", ...patch });

  it("a typed total derives the installment amount", () => {
    expect(totalPatch(row({ numberOfInstallments: "3" }), "100,00")).toEqual({
      amount: "100,00",
      installmentAmount: "33,33",
      numberOfInstallments: "3",
      lastEdited: "total",
    });
  });

  it("a typed installment amount derives the total", () => {
    expect(installmentPatch(row({ numberOfInstallments: "4" }), "25,00")).toEqual({
      amount: "100,00",
      installmentAmount: "25,00",
      numberOfInstallments: "4",
      lastEdited: "installment",
    });
  });

  it("changing the count keeps the total when the total was typed last", () => {
    const typed = { ...row({ numberOfInstallments: "2" }), ...totalPatch(row(), "100,00") };
    expect(countPatch(typed, "4")).toEqual({
      amount: "100,00",
      installmentAmount: "25,00",
      numberOfInstallments: "4",
      lastEdited: "total",
    });
  });

  it("changing the count keeps the installment amount when it was typed last", () => {
    const base = row({ numberOfInstallments: "2" });
    const typed = { ...base, ...installmentPatch(base, "30,00") };
    expect(countPatch(typed, "5")).toEqual({
      amount: "150,00",
      installmentAmount: "30,00",
      numberOfInstallments: "5",
      lastEdited: "installment",
    });
  });

  it("clearing the total clears the installment amount", () => {
    expect(totalPatch(row({ numberOfInstallments: "3" }), "")).toMatchObject({
      amount: "",
      installmentAmount: "",
    });
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
