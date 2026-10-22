import { expect, test } from "@playwright/test";

test.describe("bulk add", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/transactions/bulk-add");
  });

  test("page loads with header, one row and controls", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Adicionar em Lote" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Voltar" })).toBeVisible();
    await expect(page.getByTestId("bulk-add-row")).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Adicionar linha" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Enviar tudo" })).toBeVisible();
  });

  test("shows the normal entries and the card purchases as two sections", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Despesas e receitas" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Compras no cartão" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Adicionar cartão" })).toBeVisible();
    await expect(page.getByLabel("Tipo").locator("option")).toHaveText(["Despesa", "Receita"]);
  });

  test("entry point navigates from the transactions page", async ({ page }) => {
    await page.goto("/transactions");
    await page.getByRole("button", { name: "Adicionar em Lote" }).click();
    await expect(page).toHaveURL(/\/transactions\/bulk-add$/);
    await expect(page.getByRole("heading", { name: "Adicionar em Lote" })).toBeVisible();
  });

  test("add row and remove row", async ({ page }) => {
    await page.getByRole("button", { name: "Adicionar linha" }).click();
    await expect(page.getByTestId("bulk-add-row")).toHaveCount(2);

    await page.getByTestId("bulk-add-row").nth(1).getByLabel("Remover linha").click();
    await expect(page.getByTestId("bulk-add-row")).toHaveCount(1);
  });

  test("create an expense and an income row, then clean up", async ({ page }) => {
    const rows = page.getByTestId("bulk-add-row");
    const firstRow = rows.nth(0);

    const personSelect = firstRow.getByLabel("Pessoa");
    const optionCount = await personSelect.locator("option").count();
    if (optionCount <= 1) {
      test.skip(true, "No people available in the database to select for the bulk-add rows.");
    }
    const firstPersonValue = await personSelect.locator("option").nth(1).getAttribute("value");

    const expenseDescription = `E2E bulk expense ${Date.now()}`;
    await personSelect.selectOption(firstPersonValue ?? "");
    await firstRow.getByPlaceholder("Valor").fill("111,00");
    await firstRow.getByPlaceholder("Descrição (opcional)").fill(expenseDescription);

    await page.getByRole("button", { name: "Adicionar linha" }).click();
    await expect(rows).toHaveCount(2);
    const secondRow = rows.nth(1);

    const incomeDescription = `E2E bulk income ${Date.now()}`;
    await secondRow.getByLabel("Tipo").selectOption("income");
    await secondRow.getByLabel("Pessoa").selectOption(firstPersonValue ?? "");
    await secondRow.getByPlaceholder("Valor").fill("222,00");
    await secondRow.getByPlaceholder("Descrição (opcional)").fill(incomeDescription);

    await page.getByRole("button", { name: "Enviar tudo" }).click();

    await expect(page.getByText(/lançamento\(s\) salvo\(s\)\./)).toBeVisible();
    await expect(page).toHaveURL(/\/transactions$/);

    for (const description of [expenseDescription, incomeDescription]) {
      const row = page.getByRole("row").filter({ hasText: description });
      await expect(row).toBeVisible();
      await row.getByRole("button", { name: "Ações" }).click();
      // Dropdown menu items are portaled to document.body, so query at page level.
      await page.getByRole("button", { name: "Excluir" }).click();
      await expect(page.getByRole("row").filter({ hasText: description })).not.toBeVisible();
    }
  });
});
