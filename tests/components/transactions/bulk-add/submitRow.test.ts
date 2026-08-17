import { submitRow } from "@/components/transactions/bulk-add/submitRow";
import { type BulkRow, createEmptyRow } from "@/components/transactions/bulk-add/types";

const fetchMock = jest.fn();

function row(patch: Partial<BulkRow>): BulkRow {
  return {
    ...createEmptyRow("person-1", "2026-08-17"),
    amount: "1.234,56",
    categoryId: "category-1",
    description: "Mercado",
    ...patch,
  };
}

describe("submitRow", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "record-1", isDuplicate: false }),
    });
    global.fetch = fetchMock;
  });

  it.each([
    [
      "expense",
      row({ type: "expense", paymentMethod: "PIX" }),
      "/api/expenses",
      {
        personId: "person-1",
        amount: 1234.56,
        date: "2026-08-17",
        paymentMethod: "PIX",
        categoryId: "category-1",
        description: "Mercado",
      },
    ],
    [
      "income",
      row({ type: "income", source: "FREELANCE" }),
      "/api/incomes",
      {
        personId: "person-1",
        amount: 1234.56,
        date: "2026-08-17",
        source: "FREELANCE",
        categoryId: "category-1",
        description: "Mercado",
      },
    ],
    [
      "installment",
      row({
        type: "installment",
        creditCardId: "card-1",
        numberOfInstallments: "6",
      }),
      "/api/installments",
      {
        personId: "person-1",
        creditCardId: "card-1",
        totalAmount: 1234.56,
        numberOfInstallments: 6,
        purchaseDate: "2026-08-17",
        categoryId: "category-1",
        description: "Mercado",
      },
    ],
  ])("posts the %s contract", async (_name, input, expectedUrl, expectedBody) => {
    await submitRow(input);

    expect(fetchMock).toHaveBeenCalledWith(expectedUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expectedBody),
    });
  });

  it("surfaces the API error message", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Cartão não encontrado." }),
    });

    await expect(submitRow(row({ type: "expense" }))).rejects.toThrow("Cartão não encontrado.");
  });
});
