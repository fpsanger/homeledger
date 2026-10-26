import {
  getInitialFormState,
  isSubmitDisabled,
  resolveEditTarget,
  type SubmitFields,
} from "../../../../src/components/transactions/unifiedTransactionForm/submit";

const fields: SubmitFields = {
  personId: "p1",
  amount: "90,00",
  date: "2026-05-10",
  paymentMethod: "CREDIT_CARD",
  source: "SALARY",
  creditCardId: "card-1",
  categoryId: "",
  description: "Mercado",
  numberOfInstallments: "1",
};

describe("resolveEditTarget (credit purchase)", () => {
  it("sends the chosen fatura so the purchase can move to another bill", () => {
    const target = resolveEditTarget({ purchaseId: "pur-1" }, "credit", {
      ...fields,
      billingMonth: "2026-08",
    });

    expect(target).toMatchObject({
      url: "/api/credit-card-purchases/pur-1",
      method: "PUT",
      body: { billingMonth: "2026-08" },
    });
  });

  it("omits billingMonth when none is set", () => {
    const target = resolveEditTarget({ purchaseId: "pur-1" }, "credit", fields);

    expect(target).not.toHaveProperty("error");
    expect((target as { body: object }).body).not.toHaveProperty("billingMonth");
  });
});

describe("getInitialFormState billingMonth", () => {
  it("starts empty on create and keeps the current fatura on edit", () => {
    expect(getInitialFormState(undefined, "", "2026-05-10").billingMonth).toBe("");
    const initial = { ...fields, type: "credit" as const, billingMonth: "2026-07" };
    expect(getInitialFormState(initial, "", "2026-05-10").billingMonth).toBe("2026-07");
  });
});

describe("isSubmitDisabled", () => {
  it("blocks while a request is in flight", () => {
    expect(isSubmitDisabled(true, false, true)).toBe(true);
  });

  it("allows a submit that is not split", () => {
    expect(isSubmitDisabled(false, false, false)).toBe(false);
  });

  it("blocks a split that does not add up to the total", () => {
    expect(isSubmitDisabled(false, true, false)).toBe(true);
  });

  it("allows a split that reconciles", () => {
    expect(isSubmitDisabled(false, true, true)).toBe(false);
  });
});
