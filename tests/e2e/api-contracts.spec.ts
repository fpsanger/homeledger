import { expect, test } from "@playwright/test";

test.describe("API input contracts", () => {
  test("global fixtures provide a person and a credit card", async ({ request }) => {
    const [peopleResponse, cardsResponse] = await Promise.all([
      request.get("/api/people"),
      request.get("/api/credit-cards"),
    ]);

    expect(peopleResponse.ok()).toBe(true);
    expect(cardsResponse.ok()).toBe(true);

    const { people } = (await peopleResponse.json()) as { people: unknown[] };
    const { cards } = (await cardsResponse.json()) as { cards: unknown[] };
    expect(people.length).toBeGreaterThan(0);
    expect(cards.length).toBeGreaterThan(0);
  });

  test("people rejects a blank name", async ({ request }) => {
    const response = await request.post("/api/people", { data: { name: "   " } });

    expect(response.status()).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "name is required" });
  });

  test("credit cards requires closure type", async ({ request }) => {
    const response = await request.post("/api/credit-cards", {
      data: { name: "Contract test card", dueDayOfMonth: 20 },
    });

    expect(response.status()).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "closureType is required" });
  });

  test("credit cards requires a due day", async ({ request }) => {
    const response = await request.post("/api/credit-cards", {
      data: { name: "Contract test card", closureType: "FIXED", fixedClosureDay: 10 },
    });

    expect(response.status()).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "dueDayOfMonth is required" });
  });

  test("variable-closure cards bill purchases on the month the user picks", async ({ request }) => {
    const { people } = (await (await request.get("/api/people")).json()) as {
      people: { id: string }[];
    };
    const cardResponse = await request.post("/api/credit-cards", {
      data: {
        name: `Variable contract card ${Date.now()}`,
        closureType: "VARIABLE",
        dueDayOfMonth: 5,
      },
    });
    expect(cardResponse.status()).toBe(201);
    const card = (await cardResponse.json()) as { id: string };
    const description = `Variable bill contract ${Date.now()}`;
    const purchase = {
      personId: people[0].id,
      creditCardId: card.id,
      totalAmount: 200,
      numberOfInstallments: 2,
      purchaseDate: "2030-10-20",
      description,
    };
    let purchaseId: string | undefined;

    try {
      const missingBill = await request.post("/api/installments", { data: purchase });
      expect(missingBill.status()).toBe(400);
      await expect(missingBill.json()).resolves.toEqual({
        error: "Billing month is required for variable-closure cards",
      });

      const created = await request.post("/api/installments", {
        data: { ...purchase, billingMonth: "2030-12" },
      });
      expect(created.status()).toBe(201);
      purchaseId = ((await created.json()) as { id: string }).id;

      const billFor = async (year: number, month: number) =>
        JSON.stringify(
          await (await request.get(`/api/credit-cards/bill?year=${year}&month=${month}`)).json(),
        );
      expect(await billFor(2030, 10)).not.toContain(description);
      expect(await billFor(2030, 12)).toContain(description);
      expect(await billFor(2031, 1)).toContain(description);
    } finally {
      if (purchaseId) await request.delete(`/api/credit-card-purchases/${purchaseId}`);
      await request.delete(`/api/credit-cards/${card.id}`);
    }
  });
});
