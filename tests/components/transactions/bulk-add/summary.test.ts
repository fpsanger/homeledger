import { createEmptyRow as createPurchaseRow } from "@/components/credit-cards/bulk-add/types";
import { summarizeCards, summarizeNormal } from "@/components/transactions/bulk-add/summary";
import { createEmptyRow } from "@/components/transactions/bulk-add/types";

describe("summarizeNormal", () => {
  it("counts only rows still to send and splits expenses from incomes", () => {
    const rows = [
      createEmptyRow("p", "2026-08-17"),
      { ...createEmptyRow("p", "2026-08-17"), amount: "10,50" },
      { ...createEmptyRow("p", "2026-08-17"), amount: "1.000,00", type: "income" as const },
      { ...createEmptyRow("p", "2026-08-17"), amount: "99,00", status: "success" as const },
    ];

    expect(summarizeNormal(rows)).toEqual({ count: 2, expenseCents: 1050, incomeCents: 100000 });
  });
});

describe("summarizeCards", () => {
  it("sums purchase totals across blocks, ignoring blank and saved rows", () => {
    const row = (patch = {}) => ({ ...createPurchaseRow("2026-08-17"), ...patch });
    const sections = [
      {
        cardId: "a",
        personId: "p",
        billingMonth: "",
        rows: [
          row(),
          row({ amount: "100,00" }),
          row({ amount: "5,00", status: "success" as const }),
        ],
      },
      { cardId: "b", personId: "p", billingMonth: "", rows: [row({ amount: "20,25" })] },
    ];

    expect(summarizeCards(sections)).toEqual({ count: 2, expenseCents: 12025, incomeCents: 0 });
  });
});
