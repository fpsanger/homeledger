import {
  describeInstallmentSplit,
  formatBRL,
} from "@/components/credit-cards/bulk-add/installmentNote";

const nbsp = " ";

describe("describeInstallmentSplit", () => {
  it("has nothing to say about a single installment", () => {
    expect(describeInstallmentSplit("100,00", "1")).toBeNull();
  });

  it("has nothing to say without an amount or a valid count", () => {
    expect(describeInstallmentSplit("", "3")).toBeNull();
    expect(describeInstallmentSplit("0", "3")).toBeNull();
    expect(describeInstallmentSplit("100,00", "")).toBeNull();
  });

  it("states an even split once", () => {
    expect(describeInstallmentSplit("120,00", "4")).toBe(`4× R$${nbsp}30,00`);
  });

  it("states the uneven last installment instead of hiding the rounding", () => {
    expect(describeInstallmentSplit("100,00", "3")).toBe(
      `3× R$${nbsp}33,33 · última R$${nbsp}33,34`,
    );
  });
});

describe("formatBRL", () => {
  it("groups thousands in pt-BR", () => {
    expect(formatBRL(123456)).toBe(`R$${nbsp}1.234,56`);
  });
});
