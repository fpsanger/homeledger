import { type APIRequestContext, expect, test } from "@playwright/test";

type ProgramRecord = {
  id: string;
  name: string;
  referenceMinPer1kBrl: number | null;
  referenceMaxPer1kBrl: number | null;
};

type ProgramInput = {
  referenceMinPer1kBrl?: number | null;
  referenceMaxPer1kBrl?: number | null;
};

type TransactionInput = {
  type: "PURCHASE" | "REDEEM";
  points: number;
  date: string;
  costBrl?: number;
  valueBrl?: number;
  description?: string;
};

const programIds: string[] = [];
const transactionIds: string[] = [];

async function createProgram(
  request: APIRequestContext,
  input: ProgramInput = {},
): Promise<ProgramRecord> {
  const response = await request.post("/api/loyalty/programs", {
    data: { name: `E2E Sim ${Date.now()}`, type: "AIRLINE", color: "#3b82f6", ...input },
  });
  expect(response.status()).toBe(201);
  const program = (await response.json()) as ProgramRecord;
  programIds.push(program.id);
  return program;
}

async function seedTransaction(
  request: APIRequestContext,
  programId: string,
  input: TransactionInput,
): Promise<void> {
  const response = await request.post("/api/loyalty/transactions", {
    data: { programId, ...input },
  });
  expect(response.status()).toBe(201);
  const created = (await response.json()) as { id: string };
  transactionIds.push(created.id);
}

async function listPrograms(request: APIRequestContext): Promise<ProgramRecord[]> {
  const response = await request.get("/api/loyalty/programs");
  expect(response.ok()).toBe(true);
  return ((await response.json()) as { programs: ProgramRecord[] }).programs;
}

test.describe("milhas: simulador de compra e faixa de referência", () => {
  // The dev server can throw a transient SSR error on the first hit of a route it
  // hasn't compiled yet (same flakiness handled in loyalty.spec.ts).
  test.describe.configure({ retries: 1 });

  test.afterEach(async ({ request }) => {
    // A program with transactions cannot be deleted: remove the seeded transactions first.
    for (const id of transactionIds.splice(0)) {
      await request.delete(`/api/loyalty/transactions/${id}`);
    }
    for (const id of programIds.splice(0)) {
      await request.delete(`/api/loyalty/programs/${id}`);
    }
  });

  test("editing the reference range from the UI persists it", async ({ page, request }) => {
    const program = await createProgram(request);

    await page.goto(`/loyalty/${program.id}`);
    await expect(page.getByText("Referência do milheiro não definida")).toBeVisible();

    await page.getByRole("button", { name: "Editar programa" }).click();
    await page.getByLabel("Referência mínima por milheiro").fill("24");
    await page.getByLabel("Referência máxima por milheiro").fill("26");
    await page.getByRole("button", { name: "Salvar" }).click();

    await expect(page.getByText("Programa atualizado.")).toBeVisible();
    const reference = page.getByText(/^Referência do milheiro:/);
    await expect(reference).toHaveText("Referência do milheiro: R$ 24,00 – R$ 26,00");

    // Survives a full reload, so it really reached the database.
    await page.reload();
    await expect(reference).toHaveText("Referência do milheiro: R$ 24,00 – R$ 26,00");
  });

  test("clearing one bound keeps the other as a fixed reference", async ({ page, request }) => {
    const program = await createProgram(request, {
      referenceMinPer1kBrl: 24,
      referenceMaxPer1kBrl: 26,
    });

    await page.goto(`/loyalty/${program.id}`);
    await page.getByRole("button", { name: "Editar programa" }).click();
    await expect(page.getByLabel("Referência mínima por milheiro")).toHaveValue("24");
    await page.getByLabel("Referência máxima por milheiro").fill("");
    await page.getByRole("button", { name: "Salvar" }).click();

    await expect(page.getByText(/^Referência do milheiro:/)).toHaveText(
      "Referência do milheiro: R$ 24,00",
    );

    const stored = (await listPrograms(request)).find((p) => p.id === program.id);
    expect(stored?.referenceMinPer1kBrl).toBe(24);
    expect(stored?.referenceMaxPer1kBrl).toBeNull();
  });

  test("simulator uses the real FIFO lots and redemption average", async ({ page, request }) => {
    const program = await createProgram(request, {
      referenceMinPer1kBrl: 24,
      referenceMaxPer1kBrl: 26,
    });
    // Lot of 10k pts for R$ 150 (R$ 15/1k); redeeming 5k consumes R$ 75 of it, leaving
    // 5k pts costing R$ 75 (R$ 15/1k). The redemption returned R$ 150 -> R$ 30/1k.
    await seedTransaction(request, program.id, {
      type: "PURCHASE",
      points: 10000,
      costBrl: 150,
      date: "2026-01-05",
    });
    await seedTransaction(request, program.id, {
      type: "REDEEM",
      points: 5000,
      valueBrl: 150,
      date: "2026-02-01",
    });

    await page.goto(`/loyalty/${program.id}`);
    await page.getByRole("button", { name: "Simular compra" }).click();
    await page.getByLabel(/Pontos/).fill("10000");

    const verdict = page.getByTestId("simulator-verdict");
    const paid = page.getByLabel(/Valor pago/);

    // R$ 25/1k: inside the 24-26 range and below the R$ 30 redemption average.
    await paid.fill("250");
    await expect(page.getByTestId("simulator-effective-cost")).toHaveText("R$ 25,00");
    await expect(verdict).toHaveAttribute("data-verdict", "OK");
    await expect(verdict).toContainText("Vale a pena");
    // (75 + 250) / (5000 + 10000) * 1000
    await expect(page.getByTestId("simulator-average")).toHaveText("R$ 15,00 → R$ 21,67");
    await expect(page.getByTestId("simulator-redeem-average")).toHaveText("R$ 30,00");
    // Same toFixed(1) formatting as the ROI column (formatRoi), so a dot, not a comma.
    await expect(page.getByText("ROI projetado 20.0%")).toBeVisible();

    // R$ 20/1k: below the range.
    await paid.fill("200");
    await expect(page.getByTestId("simulator-effective-cost")).toHaveText("R$ 20,00");
    await expect(verdict).toHaveAttribute("data-verdict", "GREAT");
    await expect(page.getByTestId("simulator-reference").locator("..")).toContainText(
      "abaixo do mínimo",
    );

    // R$ 30/1k: above the range.
    await paid.fill("300");
    await expect(page.getByTestId("simulator-effective-cost")).toHaveText("R$ 30,00");
    await expect(verdict).toHaveAttribute("data-verdict", "NOT_WORTH");
    await expect(verdict).toContainText("Não vale a pena");
    await expect(page.getByTestId("simulator-reference").locator("..")).toContainText(
      "acima do máximo",
    );
  });

  test("simulator shows no verdict until both fields are valid", async ({ page, request }) => {
    const program = await createProgram(request);

    await page.goto(`/loyalty/${program.id}`);
    await page.getByRole("button", { name: "Simular compra" }).click();

    const verdict = page.getByTestId("simulator-verdict");
    await expect(page.getByText(/Informe os pontos e o valor pago/)).toBeVisible();
    await expect(verdict).toHaveCount(0);

    await page.getByLabel(/Pontos/).fill("10000");
    await page.getByLabel(/Valor pago/).fill("0");
    await expect(verdict).toHaveCount(0);

    // Without a reference range or redemptions there is nothing to compare against.
    await page.getByLabel(/Valor pago/).fill("200");
    await expect(verdict).toHaveAttribute("data-verdict", "NO_REFERENCE");
  });

  test("a lot consumed by two partial redemptions keeps the same cost per 1k", async ({
    page,
    request,
  }) => {
    const program = await createProgram(request);
    await seedTransaction(request, program.id, {
      type: "PURCHASE",
      points: 10000,
      costBrl: 100,
      date: "2026-01-05",
      description: "E2E lote",
    });
    await seedTransaction(request, program.id, {
      type: "REDEEM",
      points: 5000,
      valueBrl: 300,
      date: "2026-02-01",
      description: "E2E resgate um",
    });
    await seedTransaction(request, program.id, {
      type: "REDEEM",
      points: 5000,
      valueBrl: 400,
      date: "2026-03-01",
      description: "E2E resgate dois",
    });

    await page.goto(`/loyalty/${program.id}`);

    // Both redemptions consume half of the R$ 100 lot: R$ 10,00 per 1k each. Before the
    // fix the second one was priced at R$ 20,00 per 1k.
    for (const description of ["E2E resgate um", "E2E resgate dois"]) {
      const row = page.getByRole("row").filter({ hasText: description });
      await expect(row).toContainText("R$ 10,00");
      await expect(row).not.toContainText("R$ 20,00");
    }
  });
});

test.describe("milhas: contrato da API da faixa de referência", () => {
  test("rejects an inverted range on create", async ({ request }) => {
    const response = await request.post("/api/loyalty/programs", {
      data: {
        name: `E2E Sim invalid ${Date.now()}`,
        type: "AIRLINE",
        color: "#3b82f6",
        referenceMinPer1kBrl: 30,
        referenceMaxPer1kBrl: 20,
      },
    });
    expect(response.status()).toBe(400);
  });

  test("rejects a non-numeric bound on create", async ({ request }) => {
    const response = await request.post("/api/loyalty/programs", {
      data: {
        name: `E2E Sim invalid ${Date.now()}`,
        type: "AIRLINE",
        color: "#3b82f6",
        referenceMinPer1kBrl: "24",
      },
    });
    expect(response.status()).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "referenceMinPer1kBrl must be a number or null",
    });
  });

  test("rejects an update whose merged range is inverted", async ({ request }) => {
    const program = await createProgram(request, {
      referenceMinPer1kBrl: 24,
      referenceMaxPer1kBrl: 26,
    });

    const response = await request.put(`/api/loyalty/programs/${program.id}`, {
      data: { referenceMinPer1kBrl: 40 },
    });
    expect(response.status()).toBe(400);

    const stored = (await listPrograms(request)).find((p) => p.id === program.id);
    expect(stored?.referenceMinPer1kBrl).toBe(24);

    await request.delete(`/api/loyalty/programs/${program.id}`);
    programIds.splice(programIds.indexOf(program.id), 1);
  });
});
