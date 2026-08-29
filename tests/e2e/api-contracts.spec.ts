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
});
