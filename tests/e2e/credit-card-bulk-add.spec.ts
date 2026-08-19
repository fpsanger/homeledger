import { expect, test } from "@playwright/test";

test.describe("bulk add credit card purchase", () => {
  test.describe.configure({ retries: 1 });

  test.beforeEach(async ({ page }) => {
    await page.goto("/credit-cards/bulk-add");
  });

  test("page loads with header and controls", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Adicionar Compra em Lote" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Voltar" })).toBeVisible();
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

    const personSelect = page.getByLabel("Pessoa");
    const personOptionCount = await personSelect.locator("option").count();
    if (personOptionCount <= 1) {
      test.skip(true, "No people available in the database to select for the bulk-add form.");
    }

    await page.getByRole("button", { name: "Selecione o cartão" }).click();
    const cardOptionCount = await page.locator("[cmdk-item]").count();
    await page.keyboard.press("Escape");
    if (cardOptionCount < 1) {
      test.skip(true, "No credit cards available for the bulk-add form.");
    }

    const firstPersonValue = await personSelect.locator("option").nth(1).getAttribute("value");
    await personSelect.selectOption(firstPersonValue ?? "");

    await page.getByRole("button", { name: "Selecione o cartão" }).click();
    const cardName = await page.locator("[cmdk-item]").nth(0).textContent();
    await page.keyboard.press("Escape");
    await addCardSection(cardName ?? "");

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

    // Clean up both created purchases via the fatura page; the card's closure day
    // may push the first installment into a later month than today.
    await page.goto("/installments");
    for (const description of [descriptionA, descriptionB]) {
      const row = page.getByRole("row").filter({ hasText: description });
      for (let i = 0; i < 4 && (await row.count()) === 0; i++) {
        await page.getByRole("button", { name: "→" }).click();
        await page.waitForLoadState("networkidle");
      }
      await expect(row).toBeVisible();
      await row.getByRole("button", { name: "Ações" }).click();
      await page.getByRole("button", { name: "Excluir compra" }).click();
      await expect(page.getByText("Compra excluída.")).toBeVisible();
      await expect(page.getByRole("row").filter({ hasText: description })).not.toBeVisible();
    }
  });
});
