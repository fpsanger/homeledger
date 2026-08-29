import { expect, test } from "@playwright/test";

function fixtureName(key: "E2E_FIXTURE_CARD_NAME" | "E2E_FIXTURE_PERSON_NAME") {
  const value = process.env[key];
  if (!value) throw new Error(`${key} was not provided by Playwright global setup`);
  return value;
}

test.describe("fatura cartão", () => {
  const fixtureCardName = fixtureName("E2E_FIXTURE_CARD_NAME");
  const fixturePersonName = fixtureName("E2E_FIXTURE_PERSON_NAME");

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
    await expect
      .poll(() => personSelect.locator("option").count(), {
        message: "the E2E person fixture should be available",
      })
      .toBeGreaterThan(1);

    const cardSelect = page.locator("#u-card");
    await expect
      .poll(() => cardSelect.locator("option").count(), {
        message: "the E2E credit-card fixture should be available",
      })
      .toBeGreaterThan(1);

    const fixturePersonValue = await personSelect
      .locator("option", { hasText: fixturePersonName })
      .getAttribute("value");
    await personSelect.selectOption(fixturePersonValue ?? "");

    const fixtureCardValue = await cardSelect
      .locator("option", { hasText: fixtureCardName })
      .getAttribute("value");
    await cardSelect.selectOption(fixtureCardValue ?? "");

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
