import { submitPurchase } from "@/components/credit-cards/bulk-add/submitPurchase";
import { createEmptyRow, type PurchaseRow } from "@/components/credit-cards/bulk-add/types";

const fetchMock = jest.fn();

function row(patch: Partial<PurchaseRow> = {}): PurchaseRow {
  return {
    ...createEmptyRow("2026-08-17"),
    amount: "1.234,56",
    categoryId: "category-1",
    description: "Compra",
    numberOfInstallments: "6",
    ...patch,
  };
}

describe("submitPurchase", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "record-1", isDuplicate: false }),
    });
    global.fetch = fetchMock;
  });

  it("posts the installment contract for the given person, row and card", async () => {
    await submitPurchase("person-1", row(), "card-1");

    expect(fetchMock).toHaveBeenCalledWith("/api/installments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personId: "person-1",
        creditCardId: "card-1",
        totalAmount: 1234.56,
        numberOfInstallments: 6,
        purchaseDate: "2026-08-17",
        categoryId: "category-1",
        description: "Compra",
      }),
    });
  });

  it("sends the billing month when one is given", async () => {
    await submitPurchase("person-1", row(), "card-1", "2026-09");

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.billingMonth).toBe("2026-09");
  });

  it("returns isDuplicate from the response", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "record-1", isDuplicate: true }),
    });

    await expect(submitPurchase("person-1", row(), "card-1")).resolves.toEqual({
      isDuplicate: true,
    });
  });

  it("surfaces the API error message", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Fechamento não configurado." }),
    });

    await expect(submitPurchase("person-1", row(), "card-1")).rejects.toThrow(
      "Fechamento não configurado.",
    );
  });
});
