import { submitPurchase } from "@/components/credit-cards/bulk-add/submitPurchase";
import { createEmptyRow as createPurchaseRow } from "@/components/credit-cards/bulk-add/types";
import type { CardSectionState } from "@/components/credit-cards/bulk-add/useCardSections";
import {
  cardJobs,
  normalJobs,
  type RowPatch,
  runJobs,
  type SubmitJob,
} from "@/components/transactions/bulk-add/submitAll";
import { createEmptyRow } from "@/components/transactions/bulk-add/types";

jest.mock("@/components/credit-cards/bulk-add/submitPurchase", () => ({
  submitPurchase: jest.fn(),
}));
jest.mock("@/components/transactions/bulk-add/submitRow", () => ({ submitRow: jest.fn() }));

const mockedSubmitPurchase = jest.mocked(submitPurchase);

function normalRow(patch = {}) {
  return { ...createEmptyRow("person-1", "2026-08-17"), amount: "10,00", ...patch };
}

function purchaseRow(patch = {}) {
  return { ...createPurchaseRow("2026-08-17"), amount: "90,00", ...patch };
}

function section(rows = [purchaseRow()], patch = {}): CardSectionState {
  return { cardId: "card-1", personId: "person-1", billingMonth: "", rows, ...patch };
}

beforeEach(() => {
  mockedSubmitPurchase.mockReset();
});

describe("normalJobs", () => {
  it("skips untouched and already saved rows", () => {
    const rows = [
      createEmptyRow("person-1", "2026-08-17"),
      normalRow({ status: "success" }),
      normalRow(),
    ];

    expect(normalJobs(rows, jest.fn())).toHaveLength(1);
  });

  it("flags a row without a person and routes updates to its client id", () => {
    const update = jest.fn();
    const row = normalRow({ personId: "" });
    const [job] = normalJobs([row], update);

    expect(job.validationError).toBe("Selecione a pessoa.");
    job.update({ status: "error" });
    expect(update).toHaveBeenCalledWith(row.clientId, { status: "error" });
  });
});

describe("cardJobs", () => {
  it("skips blank purchase rows", () => {
    const blank = section([createPurchaseRow("2026-08-17")]);

    expect(cardJobs([blank], {}, jest.fn())).toHaveLength(0);
  });

  it("requires a person for each card block", () => {
    const [job] = cardJobs([section(undefined, { personId: "" })], {}, jest.fn());

    expect(job.validationError).toBe("Selecione a pessoa.");
  });

  it("requires a bill for a VARIABLE card and not for a FIXED one", () => {
    const variable = cardJobs([section()], { "card-1": "VARIABLE" }, jest.fn());
    const fixed = cardJobs([section()], { "card-1": "FIXED" }, jest.fn());

    expect(variable[0].validationError).toBe("Informe a fatura (mês).");
    expect(fixed[0].validationError).toBeNull();
  });

  it("sends the block's person and bill, and a row's own bill when overridden", async () => {
    mockedSubmitPurchase.mockResolvedValue({ isDuplicate: false });
    const own = purchaseRow({ amount: "10,00", billingMonth: "2026-12" });
    const plain = purchaseRow({ amount: "20,00" });
    const jobs = cardJobs(
      [section([plain, own], { personId: "person-2", billingMonth: "2026-11" })],
      { "card-1": "VARIABLE" },
      jest.fn(),
    );

    await jobs[0].send();
    await jobs[1].send();

    expect(mockedSubmitPurchase.mock.calls.map((c) => [c[0], c[2], c[3]])).toEqual([
      ["person-2", "card-1", "2026-11"],
      ["person-2", "card-1", "2026-12"],
    ]);
  });
});

describe("runJobs", () => {
  function job(send: SubmitJob["send"], validationError: string | null = null) {
    const patches: RowPatch[] = [];
    return { validationError, send, update: (p: RowPatch) => patches.push(p), patches };
  }

  it("marks outcomes, continues after a failure and reports progress", async () => {
    const ok = job(async () => ({ isDuplicate: true }));
    const bad = job(async () => {
      throw new Error("Fechamento não configurado.");
    });
    const invalid = job(async () => ({ isDuplicate: false }), "Informe a data.");
    const progress = jest.fn();

    const outcome = await runJobs([bad, invalid, ok], progress);

    expect(outcome).toEqual({ succeeded: 1, failed: 2 });
    expect(bad.patches).toEqual([
      { status: "loading" },
      { status: "error", error: "Fechamento não configurado." },
    ]);
    expect(invalid.patches).toEqual([{ status: "error", error: "Informe a data." }]);
    expect(ok.patches).toEqual([{ status: "loading" }, { status: "success", isDuplicate: true }]);
    expect(progress.mock.calls.map((c) => c[0])).toEqual([
      { current: 1, total: 3 },
      { current: 2, total: 3 },
      { current: 3, total: 3 },
    ]);
  });

  it("falls back to a generic message for a non-Error rejection", async () => {
    const odd = job(() => Promise.reject("boom"));

    await runJobs([odd], jest.fn());

    expect(odd.patches[1]).toEqual({ status: "error", error: "Erro desconhecido" });
  });
});
