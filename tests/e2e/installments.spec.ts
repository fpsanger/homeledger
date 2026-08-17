import { expect, test } from "@playwright/test";

test.describe("fatura cartão", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/installments");
  });

  test("page loads with header and summary", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Fatura cartão", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "←" })).toBeVisible();
    await expect(page.getByRole("button", { name: "→" })).toBeVisible();
    await expect(page.getByText("Total da fatura")).toBeVisible();
    await expect(page.getByText("Cartões", { exact: true })).toBeVisible();
    await expect(page.getByText("Parcelas")).toBeVisible();
    await expect(page.getByRole("main").getByText("Pessoas")).toBeVisible();
    await expect(page.getByRole("button", { name: "Nova compra" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Estorno" })).toBeVisible();
  });

  test("nova compra dialog opens and closes", async ({ page }) => {
    await page.getByRole("button", { name: "Nova compra" }).click();

    const dialog = page.getByRole("heading", { name: "Nova transação" });
    await expect(dialog).toBeVisible();
    await expect(page.getByLabel("Pessoa")).toBeVisible();
    await expect(page.locator('label:text-is("Valor Total")')).toBeVisible();
    await expect(page.locator('label:text-is("Cartão de Crédito")')).toBeVisible();
    await expect(page.locator('label:text-is("Parcelas")')).toBeVisible();
    await expect(page.locator('label:text-is("Categoria")')).toBeVisible();
    await expect(page.getByLabel("Descrição")).toBeVisible();

    await page.getByRole("button", { name: "Close", exact: true }).click();
    await expect(dialog).not.toBeVisible();
  });

  test("create and delete a credit card purchase", async ({ page }) => {
    await page.getByRole("button", { name: "Nova compra" }).click();

    const personSelect = page.locator("#u-person");
    const personOptionCount = await personSelect.locator("option").count();
    if (personOptionCount <= 1) {
      test.skip(true, "No people available in the database to select for the purchase form.");
    }

    const cardSelect = page.locator("#u-card");
    const cardOptionCount = await cardSelect.locator("option").count();
    if (cardOptionCount <= 1) {
      test.skip(true, "No credit cards available in the database to select for the purchase form.");
    }

    const firstPersonValue = await personSelect.locator("option").nth(1).getAttribute("value");
    await personSelect.selectOption(firstPersonValue ?? "");

    const firstCardValue = await cardSelect.locator("option").nth(1).getAttribute("value");
    await cardSelect.selectOption(firstCardValue ?? "");

    await page.locator("#u-amount").fill("123,45");

    const description = `E2E ${Date.now()}`;
    await page.locator("#u-description").fill(description);

    await page.getByRole("button", { name: "Adicionar Compra com Cartão" }).click();

    await expect(page.getByText("Transação salva com sucesso.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Nova transação" })).not.toBeVisible();

    // Depending on the selected card's closure day, the purchase's first installment
    // may bill in a later month than the purchase date, so search forward if needed.
    const row = page.getByRole("row").filter({ hasText: description });
    for (let i = 0; i < 4 && (await row.count()) === 0; i++) {
      await page.getByRole("button", { name: "→" }).click();
      await page.waitForLoadState("networkidle");
    }
    await expect(row).toBeVisible();

    await row.getByRole("button", { name: "Ações" }).click();
    // Dropdown menu items are portaled to document.body, so query at page level.
    await page.getByRole("button", { name: "Excluir compra" }).click();

    await expect(page.getByText("Compra excluída.")).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: description })).not.toBeVisible();
  });
});
