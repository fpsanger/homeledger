import { expect, test } from "@playwright/test";

function fixtureName(key: "E2E_FIXTURE_CARD_NAME" | "E2E_FIXTURE_PERSON_NAME") {
  const value = process.env[key];
  if (!value) throw new Error(`${key} was not provided by Playwright global setup`);
  return value;
}

test.describe("bulk add credit card purchases", () => {
  const fixtureCardName = fixtureName("E2E_FIXTURE_CARD_NAME");
  const fixturePersonName = fixtureName("E2E_FIXTURE_PERSON_NAME");

  test.beforeEach(async ({ page }) => {
    await page.goto("/transactions/bulk-add");
  });

  test("the old credit-card bulk page redirects to the unified page", async ({ page }) => {
    await page.goto("/credit-cards/bulk-add");

    await expect(page).toHaveURL(/\/transactions\/bulk-add$/);
    await expect(page.getByRole("heading", { name: "Compras no cartão" })).toBeVisible();
  });

  test("add a single and a 3x purchase to the same card, then clean up", async ({ page }) => {
    await page.getByRole("button", { name: "Selecione o cartão" }).click();
    await expect
      .poll(() => page.locator("[cmdk-item]", { hasText: fixtureCardName }).count(), {
        message: "the E2E credit-card fixture should be available",
      })
      .toBeGreaterThan(0);
    const cardName =
      (await page.locator("[cmdk-item]", { hasText: fixtureCardName }).textContent()) ?? "";
    await page.locator("[cmdk-item]", { hasText: fixtureCardName }).click();
    await page.getByRole("button", { name: "Adicionar cartão" }).click();

    const section = page.getByRole("region", { name: `Compras no ${cardName}` });
    const personSelect = section.getByLabel("Pessoa");
    await expect
      .poll(() => personSelect.locator("option").count(), {
        message: "the E2E person fixture should be available",
      })
      .toBeGreaterThan(1);
    const fixturePersonValue = await personSelect
      .locator("option", { hasText: fixturePersonName })
      .getAttribute("value");
    await personSelect.selectOption(fixturePersonValue ?? "");

    const rows = section.getByTestId("purchase-row");
    await expect(rows).toHaveCount(1);

    const descriptionA = `E2E bulk purchase A ${Date.now()}`;
    await rows.nth(0).getByPlaceholder("Valor").fill("111,00");
    await rows.nth(0).getByPlaceholder("Descrição (opcional)").fill(descriptionA);

    await section.getByRole("button", { name: "Adicionar compra" }).click();
    await expect(rows).toHaveCount(2);

    const descriptionB = `E2E bulk purchase B ${Date.now()}`;
    await rows.nth(1).getByLabel("Número de parcelas").selectOption("3");
    await rows.nth(1).getByLabel("Valor total").fill("300,00");
    await expect(rows.nth(1).getByLabel("Valor da parcela")).toHaveValue("R$ 100,00");
    await rows.nth(1).getByPlaceholder("Descrição (opcional)").fill(descriptionB);

    // The untouched starter row of the normal section is skipped, not reported as an error.
    await page.getByRole("button", { name: "Enviar tudo" }).click();

    await expect(page.getByText(/lançamento\(s\) salvo\(s\)\./)).toBeVisible();
    await expect(page).toHaveURL(/\/transactions$/);

    const purchasesResponse = await page.request.get("/api/credit-card-purchases");
    expect(purchasesResponse.ok()).toBe(true);
    const { purchases } = (await purchasesResponse.json()) as {
      purchases: Array<{ id: string; description: string }>;
    };
    const createdPurchases = purchases.filter((purchase) =>
      [descriptionA, descriptionB].includes(purchase.description),
    );
    expect(createdPurchases).toHaveLength(2);

    for (const purchase of createdPurchases) {
      const cleanupResponse = await page.request.delete(
        `/api/credit-card-purchases/${purchase.id}`,
      );
      expect(cleanupResponse.ok()).toBe(true);
    }
  });
});
