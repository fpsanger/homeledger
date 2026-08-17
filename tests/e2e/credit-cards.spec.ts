import { expect, test } from "@playwright/test";

test.describe("cartões de crédito", () => {
  // The dev server can throw a transient SSR error on the first parallel hit of a
  // route it hasn't compiled yet (Next.js fast-refresh flakiness, unrelated to this
  // test); retry once locally instead of failing the whole suite run over it.
  test.describe.configure({ retries: 1 });

  test.beforeEach(async ({ page }) => {
    await page.goto("/credit-cards");
  });

  test("page loads with header", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Cartões de Crédito", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Novo Cartão" })).toBeVisible();
  });

  test("novo cartão dialog opens and closes", async ({ page }) => {
    await page.getByRole("button", { name: "Novo Cartão" }).click();

    const dialog = page.getByRole("heading", { name: "Novo Cartão de Crédito" });
    await expect(dialog).toBeVisible();
    await expect(page.getByLabel("Nome do Cartão")).toBeVisible();
    await expect(page.getByLabel("Tipo de Fechamento")).toBeVisible();
    await expect(page.getByLabel("Dia de Fechamento", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Dia de Vencimento")).toBeVisible();

    await page.getByRole("button", { name: "Close", exact: true }).click();
    await expect(dialog).not.toBeVisible();
  });

  test("create and delete a credit card", async ({ page }) => {
    await page.getByRole("button", { name: "Novo Cartão" }).click();

    const name = `E2E Card ${Date.now()}`;
    await page.locator("#cc-name").fill(name);
    await page.locator("#cc-closure-day").fill("10");
    await page.locator("#cc-due-day").fill("20");

    await page.getByRole("button", { name: "Adicionar Cartão" }).click();

    await expect(page.getByText("Cartão criado com sucesso.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Novo Cartão de Crédito" })).not.toBeVisible();

    const cardRow = page.locator(".rounded-xl").filter({ hasText: name });
    await expect(cardRow).toBeVisible();
    await expect(cardRow.getByText("Fecha no dia 10")).toBeVisible();
    await expect(cardRow.getByText("Vence no dia 20")).toBeVisible();

    await cardRow.getByRole("button").click();
    // Dropdown menu items are portaled to document.body, so query at page level.
    await page.getByRole("button", { name: "Excluir" }).click();

    await expect(page.getByText("Cartão excluído.")).toBeVisible();
    await expect(cardRow).not.toBeVisible();
  });
});
