import { CategorizationPipeline } from "../../../src/infrastructure/categorization/CategorizationPipeline";
import type { CategorySuggestion } from "../../../src/domain/entities/CategorySuggestion";

type AvailableCategory = { categoryId: string; label: string };

const categories: AvailableCategory[] = [
  { categoryId: "cat-transport", label: "Transporte" },
  { categoryId: "cat-food", label: "Alimentacao/Restaurante" },
];

function makeRuleCategorizer(result: CategorySuggestion) {
  return { categorize: jest.fn().mockReturnValue(result) };
}

function makeHistoryCategorizer(result: CategorySuggestion) {
  return { categorize: jest.fn().mockResolvedValue(result) };
}

function makeOllamaCategorizer(result: CategorySuggestion) {
  return { categorize: jest.fn().mockResolvedValue(result) };
}

const noMatch: CategorySuggestion = {
  categoryId: null,
  confidence: 0,
  source: "rule",
};

describe("CategorizationPipeline", () => {
  it("returns rule result and skips history and ollama when rule matches", async () => {
    const ruleMatch: CategorySuggestion = {
      categoryId: "cat-transport",
      confidence: 0.95,
      source: "rule",
    };
    const rule = makeRuleCategorizer(ruleMatch);
    const history = makeHistoryCategorizer(noMatch);
    const ollama = makeOllamaCategorizer(noMatch);

    const pipeline = new CategorizationPipeline(rule, history, ollama);
    const result = await pipeline.categorize("UBER* TRIP", categories);

    expect(result.categoryId).toBe("cat-transport");
    expect(result.source).toBe("rule");
    expect(history.categorize).not.toHaveBeenCalled();
    expect(ollama.categorize).not.toHaveBeenCalled();
  });

  it("falls through to history when rule misses", async () => {
    const historyMatch: CategorySuggestion = {
      categoryId: "cat-food",
      confidence: 0.9,
      source: "history",
    };
    const rule = makeRuleCategorizer(noMatch);
    const history = makeHistoryCategorizer(historyMatch);
    const ollama = makeOllamaCategorizer(noMatch);

    const pipeline = new CategorizationPipeline(rule, history, ollama);
    const result = await pipeline.categorize("PADARIA DO JOAO", categories);

    expect(result.categoryId).toBe("cat-food");
    expect(result.source).toBe("history");
    expect(ollama.categorize).not.toHaveBeenCalled();
  });

  it("falls through to ollama when both rule and history miss", async () => {
    const ollamaMatch: CategorySuggestion = {
      categoryId: "cat-food",
      confidence: 0.7,
      source: "ai",
    };
    const rule = makeRuleCategorizer(noMatch);
    const history = makeHistoryCategorizer({ ...noMatch, source: "history" });
    const ollama = makeOllamaCategorizer(ollamaMatch);

    const pipeline = new CategorizationPipeline(rule, history, ollama);
    const result = await pipeline.categorize("LOJA DESCONHECIDA", categories);

    expect(result.categoryId).toBe("cat-food");
    expect(result.source).toBe("ai");
    expect(ollama.categorize).toHaveBeenCalled();
  });

  it("returns null when all layers miss", async () => {
    const rule = makeRuleCategorizer(noMatch);
    const history = makeHistoryCategorizer({ ...noMatch, source: "history" });
    const ollama = makeOllamaCategorizer({ categoryId: null, confidence: 0, source: "ai" });

    const pipeline = new CategorizationPipeline(rule, history, ollama);
    const result = await pipeline.categorize("???", categories);

    expect(result.categoryId).toBeNull();
  });
});
