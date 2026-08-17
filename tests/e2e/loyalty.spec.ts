import { expect, test } from "@playwright/test";

test.describe("milhas", () => {
  // The dev server can throw a transient SSR error on the first parallel hit of a
  // route it hasn't compiled yet (Next.js fast-refresh flakiness, unrelated to this
  // test); retry once locally instead of failing the whole suite run over it.
  test.describe.configure({ retries: 1 });

  test.beforeEach(async ({ page }) => {
    await page.goto("/loyalty");
  });

  test("page loads with header", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Programas de Milhas", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Transferir entre parceiros" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Adicionar Programa" })).toBeVisible();
  });

  test("novo programa dialog opens and closes", async ({ page }) => {
    await page.getByRole("button", { name: "Adicionar Programa" }).click();

    const dialog = page.getByRole("heading", { name: "Novo Programa de Milhas" });
    await expect(dialog).toBeVisible();
    await expect(page.getByLabel("Nome")).toBeVisible();
    await expect(page.getByLabel("Tipo")).toBeVisible();
    await expect(page.getByLabel("Cor", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Close", exact: true }).click();
    await expect(dialog).not.toBeVisible();
  });

  test("create a program, add a transaction, delete both", async ({ page }) => {
    let programId: string | undefined;

    try {
      const programName = `E2E Miles ${Date.now()}`;

      await page.getByRole("button", { name: "Adicionar Programa" }).click();
      await page.locator("#prog-name").fill(programName);
      await page.getByRole("button", { name: "Salvar" }).click();

      // No toast on program creation success - wait for it to appear in the list instead.
      const programLink = page.getByRole("link", { name: new RegExp(programName) });
      await expect(programLink).toBeVisible();

      await programLink.click();
      await page.waitForURL(/\/loyalty\/[^/]+$/);
      programId = new URL(page.url()).pathname.split("/").pop();

      await expect(page.getByRole("heading", { name: programName, exact: true })).toBeVisible();

      await page.getByRole("button", { name: "+ Adicionar" }).click();
      const txDialog = page.getByRole("heading", { name: "Nova Transação" });
      await expect(txDialog).toBeVisible();

      const description = `E2E tx ${Date.now()}`;
      await page.locator("#new-tx-points").fill("1000");
      await page.locator("#new-tx-description").fill(description);
      await page.getByRole("button", { name: "Salvar" }).click();

      await expect(txDialog).not.toBeVisible();

      const row = page.getByRole("row").filter({ hasText: description });
      await expect(row).toBeVisible();

      await row.getByRole("button", { name: "Ações" }).click();
      // Dropdown menu items are portaled to document.body, so query at page level.
      await page.getByRole("button", { name: "Excluir" }).click();

      await expect(page.getByText("Transação excluída.")).toBeVisible();
      await expect(row).not.toBeVisible();
    } finally {
      // No UI exists to delete a program, so clean up directly via the API.
      if (programId) {
        await page.request.delete(`/api/loyalty/programs/${programId}`);
      }
    }
  });
});
