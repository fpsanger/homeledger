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
  ])("posts the %s contract", async (_name, input, expectedUrl, expectedBody) => {
    await submitRow(input);

    expect(fetchMock).toHaveBeenCalledWith(expectedUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expectedBody),
    });
  });

  it("reports a duplicate warning from the API", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ isDuplicate: true }) });

    await expect(submitRow(row({ type: "expense" }))).resolves.toEqual({ isDuplicate: true });
  });

  it("surfaces the API error message", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Pessoa não encontrada." }),
    });

    await expect(submitRow(row({ type: "expense" }))).rejects.toThrow("Pessoa não encontrada.");
  });
});
