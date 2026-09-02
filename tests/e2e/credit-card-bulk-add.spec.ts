import { expect, test } from "@playwright/test";

function fixtureName(key: "E2E_FIXTURE_CARD_NAME" | "E2E_FIXTURE_PERSON_NAME") {
  const value = process.env[key];
  if (!value) throw new Error(`${key} was not provided by Playwright global setup`);
  return value;
}

test.describe("bulk add credit card purchase", () => {
  const fixtureCardName = fixtureName("E2E_FIXTURE_CARD_NAME");
  const fixturePersonName = fixtureName("E2E_FIXTURE_PERSON_NAME");

  test.beforeEach(async ({ page }) => {
    await page.goto("/credit-cards/bulk-add");
  });

  test("page loads with header and controls", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Adicionar Compra em Lote" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Voltar" })).toHaveAttribute(
      "href",
      "/transactions",
    );
    await expect(page.getByRole("button", { name: "Enviar tudo" })).toBeVisible();
  });

  test("entry point navigates from the transactions bulk-add page", async ({ page }) => {
    await page.goto("/transactions/bulk-add");
    await page.getByRole("link", { name: "Comprar em vários cartões" }).click();
    await expect(page).toHaveURL(/\/credit-cards\/bulk-add$/);
    await expect(page.getByRole("heading", { name: "Adicionar Compra em Lote" })).toBeVisible();
  });

  test("add two purchases to the same card, then clean up", async ({ page }) => {
    async function addCardSection(name: string) {
      await page.getByRole("button", { name: "Selecione o cartão" }).click();
      await page.locator("[cmdk-item]", { hasText: name }).click();
      await page.getByRole("button", { name: "Adicionar cartão" }).click();
    }

    await page.getByRole("button", { name: "Selecione o cartão" }).click();
    await expect
      .poll(() => page.locator("[cmdk-item]", { hasText: fixtureCardName }).count(), {
        message: "the E2E credit-card fixture should be available",
      })
      .toBeGreaterThan(0);
    const cardName = await page.locator("[cmdk-item]", { hasText: fixtureCardName }).textContent();
    await page.keyboard.press("Escape");
    await addCardSection(cardName ?? "");

    const personSelect = page.getByLabel("Pessoa");
    await expect
      .poll(() => personSelect.locator("option").count(), {
        message: "the E2E person fixture should be available",
      })
      .toBeGreaterThan(1);
    const fixturePersonValue = await personSelect
      .locator("option", { hasText: fixturePersonName })
      .getAttribute("value");
    await personSelect.selectOption(fixturePersonValue ?? "");

    const rows = page.getByTestId("purchase-row");
    await expect(rows).toHaveCount(1);

    const descriptionA = `E2E bulk purchase A ${Date.now()}`;
    await rows.nth(0).getByPlaceholder("Valor").fill("111,00");
    await rows.nth(0).getByPlaceholder("Descrição (opcional)").fill(descriptionA);

    // Only one card section exists on the page at this point.
    await page.getByRole("button", { name: "Adicionar compra" }).click();
    await expect(rows).toHaveCount(2);

    const descriptionB = `E2E bulk purchase B ${Date.now()}`;
    await rows.nth(1).getByPlaceholder("Valor").fill("222,00");
    await rows.nth(1).getByPlaceholder("Descrição (opcional)").fill(descriptionB);

    await page.getByRole("button", { name: "Enviar tudo" }).click();

    await expect(page.getByText(/compra\(s\) salva\(s\)\./)).toBeVisible();
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
