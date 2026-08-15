import { parseBillingText } from "../../../src/infrastructure/parsing/BillingRegexParser";

// Fixtures

const ITAU_TEXT = `
ITAUCARD - FATURA DIGITAL
Vencimento: 10/04/2025

15/03  AMAZON COMPRAS BR         R$ 250,00
22/03  NETFLIX *NETFLIX.COM       R$ 39,90
22/03  SPOTIFY 2/12              R$ 19,90
01/03  PAGAMENTO RECEBIDO        -R$ 500,00

Total da Fatura: R$ 309,80
Limite disponivel: R$ 5.000,00
`;

const BRADESCO_TEXT = `
Bradesco - Extrato de Fatura
Vencimento: 10/04/2025

15/03/2025  AMAZON PAGAMENTOS     250,00
22/03/2025  NETFLIX 2/12          39,90
01/03/2025  PAGTO RECEBIDO       -500,00

Saldo devedor: 289,90
`;

const C6_TEXT = `
C6 Bank - Fatura do Cartao
Vencimento: 10/04/2025

2025-03-15  Amazon Compras        R$ 250,00
2025-03-22  Netflix 2/12          R$ 39,90
2025-03-01  Pagamento             -R$ 500,00

Fatura total: R$ 289,90
`;

const BTG_TEXT = `
BTG Pactual - Fatura
Vencimento: 10/04/2025

15/03/2025  AMAZON COMPRAS BR     BRL 250,00
22/03/2025  NETFLIX 2/12          BRL 39,90
01/03/2025  PAGAMENTO             -BRL 500,00

Total: BRL 289,90
`;

const UNKNOWN_TEXT = `
15/03  AMAZON COMPRAS            R$ 250,00
22/03  NETFLIX 2/12              R$ 39,90
01/03  PAGAMENTO                 -R$ 500,00
`;

describe("parseBillingText", () => {
  // --- Bank detection ---
  describe("bank auto-detection", () => {
    it("detects Itaú from text", () => {
      const result = parseBillingText(ITAU_TEXT);
      expect(result.bank).toBe("itau");
    });

    it("detects Bradesco from text", () => {
      const result = parseBillingText(BRADESCO_TEXT);
      expect(result.bank).toBe("bradesco");
    });

    it("detects C6 from text", () => {
      const result = parseBillingText(C6_TEXT);
      expect(result.bank).toBe("c6");
    });

    it("detects BTG from text", () => {
      const result = parseBillingText(BTG_TEXT);
      expect(result.bank).toBe("btg");
    });

    it("falls back to unknown when no bank marker found", () => {
      const result = parseBillingText(UNKNOWN_TEXT);
      expect(result.bank).toBe("unknown");
    });

    it("uses hintBank when provided", () => {
      const result = parseBillingText(UNKNOWN_TEXT, "itau");
      expect(result.bank).toBe("itau");
    });
  });

  // --- Itaú parsing ---
  describe("Itaú parser", () => {
    it("parses an expense row (isCredit=false)", () => {
      const result = parseBillingText(ITAU_TEXT);
      const amazon = result.rows.find((r) => r.description.includes("AMAZON"));
      expect(amazon).toBeDefined();
      expect(amazon!.amount).toBe(250);
      expect(amazon!.isCredit).toBe(false);
      expect(amazon!.bank).toBe("itau");
    });

    it("parses a credit row (negative amount → isCredit=true)", () => {
      const result = parseBillingText(ITAU_TEXT);
      const payment = result.rows.find((r) => r.description.includes("PAGAMENTO"));
      expect(payment).toBeDefined();
      expect(payment!.amount).toBe(500);
      expect(payment!.isCredit).toBe(true);
    });

    it("parses installment row extracting number and total", () => {
      const result = parseBillingText(ITAU_TEXT);
      const spotify = result.rows.find((r) => r.description.includes("SPOTIFY"));
      expect(spotify).toBeDefined();
      expect(spotify!.installmentNumber).toBe(2);
      expect(spotify!.totalInstallments).toBe(12);
      expect(spotify!.description).not.toMatch(/\b2\/12\b/);
    });

    it("parses date correctly", () => {
      const result = parseBillingText(ITAU_TEXT);
      const amazon = result.rows.find((r) => r.description.includes("AMAZON"));
      expect(amazon!.date.getUTCDate()).toBe(15);
      expect(amazon!.date.getUTCMonth()).toBe(2); // March = 2 (0-indexed)
    });

    it("skips header/footer lines (Total, Limite, Vencimento)", () => {
      const result = parseBillingText(ITAU_TEXT);
      const bad = result.rows.find(
        (r) =>
          r.description.includes("Total") ||
          r.description.includes("Limite") ||
          r.description.includes("Vencimento"),
      );
      expect(bad).toBeUndefined();
    });
  });

  // --- Bradesco parsing ---
  describe("Bradesco parser", () => {
    it("parses an expense row correctly", () => {
      const result = parseBillingText(BRADESCO_TEXT);
      const amazon = result.rows.find((r) => r.description.includes("AMAZON"));
      expect(amazon).toBeDefined();
      expect(amazon!.amount).toBe(250);
      expect(amazon!.isCredit).toBe(false);
      expect(amazon!.bank).toBe("bradesco");
    });

    it("parses a credit row correctly", () => {
      const result = parseBillingText(BRADESCO_TEXT);
      const payment = result.rows.find((r) => r.description.includes("PAGTO"));
      expect(payment).toBeDefined();
      expect(payment!.amount).toBe(500);
      expect(payment!.isCredit).toBe(true);
    });

    it("parses installment from Bradesco", () => {
      const result = parseBillingText(BRADESCO_TEXT);
      const netflix = result.rows.find((r) => r.description.includes("NETFLIX"));
      expect(netflix).toBeDefined();
      expect(netflix!.installmentNumber).toBe(2);
      expect(netflix!.totalInstallments).toBe(12);
    });
  });

  // --- C6 parsing ---
  describe("C6 parser", () => {
    it("parses an expense row correctly", () => {
      const result = parseBillingText(C6_TEXT);
      const amazon = result.rows.find((r) => r.description.includes("Amazon"));
      expect(amazon).toBeDefined();
      expect(amazon!.amount).toBe(250);
      expect(amazon!.isCredit).toBe(false);
      expect(amazon!.bank).toBe("c6");
    });

    it("parses a credit row correctly", () => {
      const result = parseBillingText(C6_TEXT);
      const payment = result.rows.find((r) => r.description.includes("Pagamento"));
      expect(payment).toBeDefined();
      expect(payment!.amount).toBe(500);
      expect(payment!.isCredit).toBe(true);
    });
  });

  // --- BTG parsing ---
  describe("BTG parser", () => {
    it("parses an expense row correctly", () => {
      const result = parseBillingText(BTG_TEXT);
      const amazon = result.rows.find((r) => r.description.includes("AMAZON"));
      expect(amazon).toBeDefined();
      expect(amazon!.amount).toBe(250);
      expect(amazon!.isCredit).toBe(false);
      expect(amazon!.bank).toBe("btg");
    });

    it("parses a credit row correctly", () => {
      const result = parseBillingText(BTG_TEXT);
      const payment = result.rows.find((r) => r.description.includes("PAGAMENTO"));
      expect(payment).toBeDefined();
      expect(payment!.amount).toBe(500);
      expect(payment!.isCredit).toBe(true);
    });
  });

  // --- Edge cases ---
  describe("edge cases", () => {
    it("returns empty rows for empty string", () => {
      const result = parseBillingText("");
      expect(result.rows).toHaveLength(0);
    });

    it("returns empty rows for whitespace-only text", () => {
      const result = parseBillingText("   \n\n   \t  \n");
      expect(result.rows).toHaveLength(0);
    });

    it("unknown bank uses fallback parser and extracts rows", () => {
      const result = parseBillingText(UNKNOWN_TEXT);
      expect(result.bank).toBe("unknown");
      expect(result.rows.length).toBeGreaterThan(0);
    });
  });
});
