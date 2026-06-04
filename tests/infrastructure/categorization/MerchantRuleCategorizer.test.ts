import { MerchantRuleCategorizer } from "../../../src/infrastructure/categorization/MerchantRuleCategorizer";

type AvailableCategory = { categoryId: string; label: string };

const categories: AvailableCategory[] = [
  { categoryId: "cat-transport", label: "Transporte" },
  { categoryId: "cat-streaming", label: "Assinaturas/Streaming" },
  { categoryId: "cat-food", label: "Alimentacao/Restaurante" },
  { categoryId: "cat-market", label: "Alimentacao/Mercado" },
  { categoryId: "cat-pharmacy", label: "Saude/Farmacia" },
  { categoryId: "cat-gym", label: "Saude/Academia" },
  { categoryId: "cat-utilities", label: "Moradia/Contas" },
  { categoryId: "cat-phone", label: "Moradia/Telefone" },
  { categoryId: "cat-shopping", label: "Compras/Shopping" },
  { categoryId: "cat-leisure", label: "Lazer/Entretenimento" },
  { categoryId: "cat-software", label: "Trabalho/Software" },
  { categoryId: "cat-delivery", label: "Alimentacao/Delivery" },
];

const categorizer = new MerchantRuleCategorizer();

describe("MerchantRuleCategorizer", () => {
  describe("transport merchants", () => {
    it("categorizes Uber as transport", () => {
      const result = categorizer.categorize("UBER* TRIP", categories);
      expect(result.categoryId).toBe("cat-transport");
      expect(result.source).toBe("rule");
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it("categorizes Estapar as transport", () => {
      const result = categorizer.categorize("ESTAPAR SAO PAULO", categories);
      expect(result.categoryId).toBe("cat-transport");
      expect(result.source).toBe("rule");
    });
  });

  describe("streaming/subscription merchants", () => {
    it("categorizes Netflix as streaming", () => {
      const result = categorizer.categorize("NETFLIX.COM", categories);
      expect(result.categoryId).toBe("cat-streaming");
      expect(result.source).toBe("rule");
    });

    it("categorizes Spotify as streaming", () => {
      const result = categorizer.categorize("SPOTIFY PREMIUM", categories);
      expect(result.categoryId).toBe("cat-streaming");
      expect(result.source).toBe("rule");
    });
  });

  describe("food/delivery merchants", () => {
    it("categorizes iFood as delivery", () => {
      const result = categorizer.categorize("IFOOD*RESTAURANTE XYZ", categories);
      expect(["cat-food", "cat-delivery"]).toContain(result.categoryId);
      expect(result.source).toBe("rule");
    });
  });

  describe("supermarket merchants", () => {
    it("categorizes Pao de Acucar as market", () => {
      const result = categorizer.categorize("CBD PAO DE ACUCAR SP", categories);
      expect(result.categoryId).toBe("cat-market");
      expect(result.source).toBe("rule");
    });
  });

  describe("pharmacy merchants", () => {
    it("categorizes Droga Raia as pharmacy", () => {
      const result = categorizer.categorize("DROGA RAIA 1234", categories);
      expect(result.categoryId).toBe("cat-pharmacy");
      expect(result.source).toBe("rule");
    });

    it("categorizes Drogasil as pharmacy", () => {
      const result = categorizer.categorize("DROGASIL LTDA", categories);
      expect(result.categoryId).toBe("cat-pharmacy");
      expect(result.source).toBe("rule");
    });
  });

  describe("utilities", () => {
    it("categorizes Sabesp as utilities", () => {
      const result = categorizer.categorize("SABESP", categories);
      expect(result.categoryId).toBe("cat-utilities");
      expect(result.source).toBe("rule");
    });

    it("categorizes Vivo as phone", () => {
      const result = categorizer.categorize("VIVO FATURA", categories);
      expect(result.categoryId).toBe("cat-phone");
      expect(result.source).toBe("rule");
    });
  });

  describe("unknown merchants", () => {
    it("returns null categoryId for unknown merchant", () => {
      const result = categorizer.categorize(
        "PADARIA DO JOAO LTDA ME",
        categories,
      );
      expect(result.categoryId).toBeNull();
      expect(result.source).toBe("rule");
    });
  });

  describe("normalization", () => {
    it("is case-insensitive", () => {
      const result = categorizer.categorize("uber* trip", categories);
      expect(result.categoryId).toBe("cat-transport");
    });

    it("strips accents", () => {
      const result = categorizer.categorize("DROGASÍL", categories);
      expect(result.categoryId).toBe("cat-pharmacy");
    });
  });
});
