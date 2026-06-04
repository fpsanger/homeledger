import type { CategorySuggestion } from "../../domain/entities/CategorySuggestion";

export type AvailableCategory = {
  categoryId: string;
  label: string;
};

type MerchantRule = {
  keywords: string[];
  categoryHints: string[];
};

const MERCHANT_RULES: MerchantRule[] = [
  {
    keywords: ["uber", "99 ", "99app", "cabify"],
    categoryHints: ["transporte", "mobilidade"],
  },
  {
    keywords: ["estapar", "estacionamento"],
    categoryHints: ["estacionamento", "transporte"],
  },
  {
    keywords: ["spotify", "netflix", "prime video", "hbo", "disney", "apple tv"],
    categoryHints: ["assinatura", "streaming"],
  },
  {
    keywords: ["ifood", "ifd "],
    categoryHints: ["delivery", "alimentacao"],
  },
  {
    keywords: ["restaurante", "bar ", "grill", "lanchonete", "hamburger", "burger"],
    categoryHints: ["restaurante", "alimentacao"],
  },
  {
    keywords: ["pao de acucar", "shopper", "supermercado"],
    categoryHints: ["mercado", "supermercado", "alimentacao"],
  },
  {
    keywords: ["droga raia", "drogasil", "farmacia", "drogaria"],
    categoryHints: ["farmacia", "saude"],
  },
  {
    keywords: ["academia", "smart fit", "bluefit"],
    categoryHints: ["academia", "saude", "esporte"],
  },
  {
    keywords: ["steam", "playstation", "xbox"],
    categoryHints: ["lazer", "entretenimento"],
  },
  {
    keywords: ["openai", "github ", "vercel", "aws "],
    categoryHints: ["software", "trabalho"],
  },
  {
    keywords: ["sabesp", "comgas"],
    categoryHints: ["contas", "agua", "gas", "moradia"],
  },
  {
    keywords: ["vivo ", "claro ", "tim ", "oi "],
    categoryHints: ["telefone", "internet", "contas", "moradia"],
  },
  {
    keywords: ["amazon"],
    categoryHints: ["compras", "shopping"],
  },
  {
    keywords: ["mercado livre", "shopee", "renner"],
    categoryHints: ["compras", "shopping"],
  },
];

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export class MerchantRuleCategorizer {
  categorize(
    description: string,
    categories: AvailableCategory[],
  ): CategorySuggestion {
    const normalizedDesc = normalizeText(description);

    for (const rule of MERCHANT_RULES) {
      const matched = rule.keywords.some((keyword) =>
        normalizeText(normalizedDesc).includes(normalizeText(keyword)),
      );

      if (!matched) continue;

      const category = this.findCategoryByHints(rule.categoryHints, categories);

      if (category) {
        return { categoryId: category.categoryId, confidence: 0.95, source: "rule" };
      }
    }

    return { categoryId: null, confidence: 0, source: "rule" };
  }

  private findCategoryByHints(
    hints: string[],
    categories: AvailableCategory[],
  ): AvailableCategory | undefined {
    for (const hint of hints) {
      const normalizedHint = normalizeText(hint);
      const found = categories.find((cat) =>
        normalizeText(cat.label).includes(normalizedHint),
      );
      if (found) return found;
    }
    return undefined;
  }
}
