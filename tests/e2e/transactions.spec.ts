import { expect, test } from "@playwright/test";

test.describe("transactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/transactions");
  });

  test("page loads with header and summary", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Transações", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Adicionar Transação" })).toBeVisible();
    await expect(page.getByText("Resumo do mês")).toBeVisible();
    await expect(page.getByText("Receitas")).toBeVisible();
    await expect(page.getByText("Despesas", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Saldo")).toBeVisible();
  });

  test("add-transaction dialog opens and closes", async ({ page }) => {
    await page.getByRole("button", { name: "Adicionar Transação" }).click();

    const dialog = page.getByRole("heading", { name: "Adicionar Transação" });
    await expect(dialog).toBeVisible();
    await expect(page.getByLabel("Pessoa")).toBeVisible();
    await expect(page.locator('label:text-is("Valor")')).toBeVisible();
    await expect(page.locator('label:text-is("Categoria")')).toBeVisible();
    await expect(page.getByLabel("Descrição")).toBeVisible();
    await expect(page.getByRole("button", { name: "Despesa", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Close", exact: true }).click();
    await expect(dialog).not.toBeVisible();
  });

  test("create and delete an expense transaction", async ({ page }) => {
    await page.getByRole("button", { name: "Adicionar Transação" }).click();

    const personSelect = page.locator("#u-person");
    const optionCount = await personSelect.locator("option").count();
    if (optionCount <= 1) {
      test.skip(true, "No people available in the database to select for the transaction form.");
    }

    const firstPersonValue = await personSelect.locator("option").nth(1).getAttribute("value");
    await personSelect.selectOption(firstPersonValue ?? "");

    await page.locator("#u-amount").fill("123,45");

    const description = `E2E ${Date.now()}`;
    await page.locator("#u-description").fill(description);

    await page.getByRole("button", { name: "Adicionar Despesa" }).click();

    await expect(page.getByText("Transação salva com sucesso.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Adicionar Transação" })).not.toBeVisible();

    const row = page.getByRole("row").filter({ hasText: description });
    await expect(row).toBeVisible();

    await row.getByRole("button", { name: "Ações" }).click();
    // Dropdown menu items are portaled to document.body, so query at page level.
    await page.getByRole("button", { name: "Excluir" }).click();

    await expect(page.getByText("Transação excluída.")).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: description })).not.toBeVisible();
  });
});
