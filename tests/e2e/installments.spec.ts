import { expect, test } from "@playwright/test";

function fixtureName(
  key: "E2E_FIXTURE_CARD_NAME" | "E2E_FIXTURE_PERSON_NAME" | "E2E_FIXTURE_PERSON2_NAME",
) {
  const value = process.env[key];
  if (!value) throw new Error(`${key} was not provided by Playwright global setup`);
  return value;
}

test.describe("fatura cartão", () => {
  const fixtureCardName = fixtureName("E2E_FIXTURE_CARD_NAME");
  const fixturePersonName = fixtureName("E2E_FIXTURE_PERSON_NAME");
  const fixturePerson2Name = fixtureName("E2E_FIXTURE_PERSON2_NAME");

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
    // The dialog closing doesn't guarantee the list's background refetch has landed yet;
    // wait for it before checking row counts, otherwise the search below can start from a
    // stale (pre-refresh) 0-count and permanently skip past the correct month.
    await page.waitForLoadState("networkidle");

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

  test("split a credit card purchase between two people", async ({ page }) => {
    await page.getByRole("button", { name: "Nova compra" }).click();

    const cardSelect = page.locator("#u-card");
    await expect
      .poll(() => cardSelect.locator("option").count(), {
        message: "the E2E credit-card fixture should be available",
      })
      .toBeGreaterThan(1);
    const fixtureCardValue = await cardSelect
      .locator("option", { hasText: fixtureCardName })
      .getAttribute("value");
    await cardSelect.selectOption(fixtureCardValue ?? "");

    await page.locator("#u-amount").fill("300,00");

    const splitButton = page.getByRole("button", { name: "Dividir" });
    await expect(splitButton).toBeEnabled();
    await splitButton.click();

    // The single-person "Pessoa" field is replaced by the split UI.
    await expect(page.getByLabel("Pessoa", { exact: true })).not.toBeVisible();

    const addPersonSelect = page.getByLabel("Adicionar pessoa");
    await addPersonSelect.selectOption({ label: fixturePersonName });
    await addPersonSelect.selectOption({ label: fixturePerson2Name });

    // Both rows should auto-split the total equally (R$ 150,00 each).
    await expect(page.getByLabel(`Valor de ${fixturePersonName}`)).toHaveValue("R$ 150,00");
    await expect(page.getByLabel(`Valor de ${fixturePerson2Name}`)).toHaveValue("R$ 150,00");
    await expect(page.getByText("Valores conferem com o total.")).toBeVisible();

    // Editing one person's share rebalances the other automatically.
    await page.getByLabel(`Valor de ${fixturePersonName}`).fill("200,00");
    await expect(page.getByLabel(`Valor de ${fixturePerson2Name}`)).toHaveValue("R$ 100,00");
    await expect(page.getByText("Valores conferem com o total.")).toBeVisible();

    const description = `E2E split ${Date.now()}`;
    await page.locator("#u-description").fill(description);

    const submitButton = page.getByRole("button", { name: "Adicionar Compra com Cartão" });
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    await expect(page.getByText("Transação salva com sucesso.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Nova transação" })).not.toBeVisible();
    // Wait for the list's background refetch before checking row counts (see comment in the
    // "create and delete" test above for why this matters).
    await page.waitForLoadState("networkidle");

    // A split purchase creates one row per person, each with their own share of the total.
    // Depending on the card's closure day, the first installment may bill in a later month
    // than the purchase date, so search forward if needed.
    let rows = page.getByRole("row").filter({ hasText: description });
    for (let i = 0; i < 4 && (await rows.count()) < 2; i++) {
      await page.getByRole("button", { name: "→" }).click();
      await page.waitForLoadState("networkidle");
      rows = page.getByRole("row").filter({ hasText: description });
    }
    await expect(rows).toHaveCount(2);
    await expect(rows.filter({ hasText: "200,00" })).toBeVisible();
    await expect(rows.filter({ hasText: "100,00" })).toBeVisible();

    // A split purchase is a single CreditCardPurchase with one Installment row per person, so
    // deleting it removes both people's rows in one action.
    await rows.first().getByRole("button", { name: "Ações" }).click();
    await page.getByRole("button", { name: "Excluir compra" }).click();
    await expect(page.getByText("Compra excluída.")).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: description })).toHaveCount(0);
  });

  test("create a purchase by entering the installment amount first", async ({ page }) => {
    await page.getByRole("button", { name: "Nova compra" }).click();

    const personSelect = page.locator("#u-person");
    await expect
      .poll(() => personSelect.locator("option").count(), {
        message: "the E2E person fixture should be available",
      })
      .toBeGreaterThan(1);
    const fixturePersonValue = await personSelect
      .locator("option", { hasText: fixturePersonName })
      .getAttribute("value");
    await personSelect.selectOption(fixturePersonValue ?? "");

    const cardSelect = page.locator("#u-card");
    await expect
      .poll(() => cardSelect.locator("option").count(), {
        message: "the E2E credit-card fixture should be available",
      })
      .toBeGreaterThan(1);
    const fixtureCardValue = await cardSelect
      .locator("option", { hasText: fixtureCardName })
      .getAttribute("value");
    await cardSelect.selectOption(fixtureCardValue ?? "");

    await page.getByRole("button", { name: "Informar valor da parcela" }).click();

    // The generic "Valor Total" field and the count-first "Parcelas" select are replaced.
    await expect(page.locator("#u-amount")).not.toBeVisible();

    await page.locator("#u-installment-amount").fill("50,00");
    await page.locator("#u-total-picker").selectOption({ label: "3x = R$ 150,00" });

    const description = `E2E parcela-first ${Date.now()}`;
    await page.locator("#u-description").fill(description);

    await page.getByRole("button", { name: "Adicionar Compra com Cartão" }).click();

    await expect(page.getByText("Transação salva com sucesso.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Nova transação" })).not.toBeVisible();
    await page.waitForLoadState("networkidle");

    // Total (R$ 150,00) split across 3 installments of R$ 50,00 each; search forward if the
    // first installment bills in a later month than the purchase date.
    let row = page.getByRole("row").filter({ hasText: description });
    for (let i = 0; i < 4 && (await row.count()) === 0; i++) {
      await page.getByRole("button", { name: "→" }).click();
      await page.waitForLoadState("networkidle");
      row = page.getByRole("row").filter({ hasText: description });
    }
    await expect(row).toBeVisible();
    await expect(row).toContainText("50,00");
    await expect(row).toContainText("1/3");

    await row.getByRole("button", { name: "Ações" }).click();
    await page.getByRole("button", { name: "Excluir compra" }).click();
    await expect(page.getByText("Compra excluída.")).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: description })).toHaveCount(0);
  });

  test("split defaults to the active global person filter", async ({ page }) => {
    const globalPersonSelect = page.locator("header").getByRole("combobox").first();
    await expect
      .poll(() => globalPersonSelect.locator("option", { hasText: fixturePersonName }).count())
      .toBeGreaterThan(0);
    await globalPersonSelect.selectOption({ label: fixturePersonName });
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: "Nova compra" }).click();

    const cardSelect = page.locator("#u-card");
    await expect
      .poll(() => cardSelect.locator("option").count(), {
        message: "the E2E credit-card fixture should be available",
      })
      .toBeGreaterThan(1);
    const fixtureCardValue = await cardSelect
      .locator("option", { hasText: fixtureCardName })
      .getAttribute("value");
    await cardSelect.selectOption(fixtureCardValue ?? "");

    // Pessoa is prefilled from the global filter before split is even toggled on.
    await expect(page.locator("#u-person option:checked")).toHaveText(fixturePersonName);

    await page.locator("#u-amount").fill("300,00");
    await page.getByRole("button", { name: "Dividir" }).click();

    // The filtered person is already seeded as the first split row with the full amount.
    await expect(page.getByLabel(`Valor de ${fixturePersonName}`)).toHaveValue("R$ 300,00");
    await expect(page.getByText("Valores conferem com o total.")).not.toBeVisible();

    const addPersonSelect = page.getByLabel("Adicionar pessoa");
    await addPersonSelect.selectOption({ label: fixturePerson2Name });
    await expect(page.getByLabel(`Valor de ${fixturePersonName}`)).toHaveValue("R$ 150,00");
    await expect(page.getByLabel(`Valor de ${fixturePerson2Name}`)).toHaveValue("R$ 150,00");
    await expect(page.getByText("Valores conferem com o total.")).toBeVisible();

    const description = `E2E split default ${Date.now()}`;
    await page.locator("#u-description").fill(description);
    await page.getByRole("button", { name: "Adicionar Compra com Cartão" }).click();

    await expect(page.getByText("Transação salva com sucesso.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Nova transação" })).not.toBeVisible();
    await page.waitForLoadState("networkidle");

    // The global filter is still scoped to fixturePersonName, so only their own row is visible
    // here — the other person's row exists (proven by the two-row assertion in the split test
    // above) but is correctly hidden from this filtered view.
    let row = page.getByRole("row").filter({ hasText: description });
    for (let i = 0; i < 4 && (await row.count()) === 0; i++) {
      await page.getByRole("button", { name: "→" }).click();
      await page.waitForLoadState("networkidle");
      row = page.getByRole("row").filter({ hasText: description });
    }
    await expect(row).toHaveCount(1);

    // Reset the global filter so it doesn't leak into other tests.
    await globalPersonSelect.selectOption({ label: "Todas as pessoas" });
    await page.waitForLoadState("networkidle");

    // Clean up via the API rather than the UI: the filtered list view was still settling from
    // the just-reset global filter, which made the "Ações" menu an unreliable click target here.
    const purchasesResponse = await page.request.get("/api/credit-card-purchases");
    const { purchases } = (await purchasesResponse.json()) as {
      purchases: { id: string; description: string }[];
    };
    const purchase = purchases.find((p) => p.description === description);
    expect(
      purchase,
      "the split purchase created above should be findable via the API",
    ).toBeTruthy();
    const deleteResponse = await page.request.delete(`/api/credit-card-purchases/${purchase?.id}`);
    expect(deleteResponse.ok()).toBeTruthy();
  });
});
