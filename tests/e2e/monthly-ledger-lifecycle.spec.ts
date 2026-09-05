import { expect, test } from "@playwright/test";

/**
 * Determinism strategy: this test owns a person + FIXED-closure credit card created just for
 * itself (not the global E2E fixture), so its totals can never be polluted by other data in the
 * shared dev database. A 3-installment purchase with an evenly divisible amount (300 -> 3x100)
 * sidesteps the cents-rounding-remainder edge case, which is already covered at the unit level in
 * tests/domain/services/InstallmentPurchase.test.ts — this test's job is lifecycle wiring
 * (API -> persistence -> use case -> displayed total), not that boundary.
 *
 * Rather than re-deriving the closure-day billing-month arithmetic by hand, the test searches
 * forward across months (same technique as installments.spec.ts) using the monthly-view API
 * itself, scoped by personId with filterBy=transactionMonth -- the same filter the dashboard UI
 * uses -- so the API-layer and UI-layer assertions are guaranteed to agree on which month each
 * installment lands in.
 */

type CreatedRecord = { id: string };
type InstallmentRecord = {
  amount: number;
  transactionYear: number;
  transactionMonth: number;
  creditCardPurchaseId: string;
};

test("monthly ledger lifecycle: create installment purchase, persist, and display monthly total", async ({
  page,
  request,
  context,
}) => {
  const suffix = `${Date.now()}-${test.info().workerIndex}`;
  const personName = `Lifecycle E2E Person ${suffix}`;
  const cardName = `Lifecycle E2E Card ${suffix}`;

  const personResponse = await request.post("/api/people", { data: { name: personName } });
  expect(personResponse.ok()).toBe(true);
  const person = (await personResponse.json()) as CreatedRecord;

  const cardResponse = await request.post("/api/credit-cards", {
    data: { name: cardName, closureType: "FIXED", fixedClosureDay: 10, dueDayOfMonth: 20 },
  });
  expect(cardResponse.ok()).toBe(true);
  const card = (await cardResponse.json()) as CreatedRecord;

  let purchaseId: string | undefined;

  try {
    const purchaseDate = new Date();
    purchaseDate.setUTCDate(5);

    const purchaseResponse = await request.post("/api/installments", {
      data: {
        personId: person.id,
        creditCardId: card.id,
        totalAmount: 300,
        numberOfInstallments: 3,
        purchaseDate: purchaseDate.toISOString(),
        description: `Lifecycle purchase ${suffix}`,
      },
    });
    expect(purchaseResponse.ok()).toBe(true);
    const purchase = (await purchaseResponse.json()) as CreatedRecord;
    purchaseId = purchase.id;

    // Search forward for the months each installment transacts in -- collect all 3 before
    // asserting so the test doesn't depend on exactly which month the first one lands in.
    const found: InstallmentRecord[] = [];
    let year = purchaseDate.getUTCFullYear();
    let month = purchaseDate.getUTCMonth() + 1;
    let firstMatchYear = year;
    let firstMatchMonth = month;

    for (let i = 0; i < 6 && found.length < 3; i++) {
      const viewResponse = await request.get(
        `/api/monthly-view?year=${year}&month=${month}&personId=${person.id}&filterBy=transactionMonth`,
      );
      expect(viewResponse.ok()).toBe(true);
      const { installments } = (await viewResponse.json()) as { installments: InstallmentRecord[] };
      if (installments.length > 0 && found.length === 0) {
        firstMatchYear = year;
        firstMatchMonth = month;
      }
      found.push(...installments);

      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }

    // API + persistence + use case: all 3 installments exist with the expected even split.
    expect(found).toHaveLength(3);
    for (const installment of found) {
      expect(installment.amount).toBe(100);
    }
    expect(found.reduce((sum, i) => sum + i.amount, 0)).toBe(300);

    // Displayed total: the dashboard filters by the same person (via cookie) and the same
    // transactionMonth semantics, so the first landing month shows exactly this one installment.
    await context.addCookies([
      {
        name: "global-person-id",
        value: person.id,
        url: "http://127.0.0.1:3000",
      },
    ]);
    await page.goto(`/dashboard?monthYear=${firstMatchYear}&monthMonth=${firstMatchMonth}`);
    await expect(page.locator('[data-stat="monthly-expenses"]')).toHaveText(/100,00/);
  } finally {
    if (purchaseId) await request.delete(`/api/credit-card-purchases/${purchaseId}`);
    await request.delete(`/api/credit-cards/${card.id}`);
    await request.delete(`/api/people/${person.id}`);
  }
});
