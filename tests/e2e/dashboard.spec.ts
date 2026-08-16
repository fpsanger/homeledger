import { expect, test } from "@playwright/test";

test.describe("dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("page loads with header", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("Visão Geral")).toBeVisible();
    await expect(page.getByText("Resumo financeiro geral")).toBeVisible();
  });

  test("annual report card renders (or fails gracefully)", async ({ page }) => {
    const report = page.getByText("Relatório Anual");
    const failure = page.getByText("Falha ao carregar relatório anual.");
    await expect(report.or(failure)).toBeVisible();
  });

  test("monthly summary card renders", async ({ page }) => {
    await expect(page.getByText("Resumo do Mês")).toBeVisible();
    await expect(page.getByText("Saldo do Mês")).toBeVisible();
    await expect(page.getByText("Receita", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Despesas", { exact: true }).first()).toBeVisible();
  });

  test("category breakdown section renders with link to transactions", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Despesas por Categoria" })).toBeVisible();
    const link = page.getByRole("link", { name: /Ver transações/ });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/transactions");
  });
});
