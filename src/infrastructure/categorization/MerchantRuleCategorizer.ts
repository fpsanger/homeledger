import type { AvailableCategory, CategorySuggestion, ICategorizer } from "./types"

type MerchantRule = {
  keywords: string[]
  categoryKeywords: string[]
}

const RULES: MerchantRule[] = [
  { keywords: ["uber", "99", "cabify", "estapar", "zona azul", "parkimeter"], categoryKeywords: ["transporte", "carro", "estacionamento", "mobilidade"] },
  { keywords: ["ifood", "ifd", "restaurante", "bar", "grill", "food", "lanchonete", "pizzaria", "hamburguer", "sushi", "padaria", "pastelaria", "doceria"], categoryKeywords: ["alimentacao", "restaurante", "delivery", "lazer"] },
  { keywords: ["mercado", "pao de acucar", "shopper", "carrefour", "extra", "atacadao", "sam's", "hortifruti", "sacolao"], categoryKeywords: ["mercado", "supermercado", "alimentacao"] },
  { keywords: ["netflix", "spotify", "prime", "steam", "ingresso", "disney", "hbo", "apple tv", "globoplay", "paramount", "deezer"], categoryKeywords: ["assinatura", "streaming", "lazer", "entretenimento"] },
  { keywords: ["sabesp", "copasa", "cedae", "sanepar", "vivo", "claro", "tim", "oi", "net", "sky", "embratel", "algar"], categoryKeywords: ["contas", "agua", "telefone", "internet", "moradia", "habitacao"] },
  { keywords: ["droga raia", "drogasil", "farmacia", "ultrafarma", "pacheco", "drogaria", "pague menos"], categoryKeywords: ["saude", "farmacia"] },
  { keywords: ["academia", "decathlon", "smart fit", "bodytech", "runner", "esporte", "natacao"], categoryKeywords: ["saude", "academia", "esporte"] },
  { keywords: ["amazon", "mercado livre", "shopee", "magalu", "americanas", "casas bahia", "renner", "riachuelo", "zara", "hm", "centauro"], categoryKeywords: ["compras", "shopping", "vestuario", "casa", "lazer"] },
  { keywords: ["openai", "github", "adobe", "microsoft", "hubla", "hotmart", "kiwify"], categoryKeywords: ["educacao", "software", "assinatura", "trabalho"] },
  { keywords: ["livelo", "multiplus", "smiles", "latam pass", "esfera"], categoryKeywords: ["milhas", "viagem", "assinatura"] },
  { keywords: ["azos", "icatu", "porto seguro", "bradesco seguros", "sulamerica", "unimed", "amil", "hapvida"], categoryKeywords: ["seguro", "saude", "servicos"] },
  { keywords: ["posto", "shell", "petrobras", "ipiranga", "ale combustiveis", "br mania"], categoryKeywords: ["transporte", "combustivel", "carro"] },
  { keywords: ["escola", "colegio", "universidade", "coursera", "alura", "udemy", "duolingo"], categoryKeywords: ["educacao", "ensino"] },
]

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
}

function findCategoryByKeywords(
  keywords: string[],
  categories: AvailableCategory[],
): string | null {
  const normalizedKeywords = keywords.map(normalizeText)
  for (const category of categories) {
    const label = normalizeText(category.label)
    if (normalizedKeywords.some((kw) => label.includes(kw))) {
      return category.categoryId
    }
  }
  return null
}

export class MerchantRuleCategorizer implements ICategorizer {
  async categorize(
    description: string,
    categories: AvailableCategory[],
  ): Promise<CategorySuggestion | null> {
    const normalized = normalizeText(description)

    for (const rule of RULES) {
      const matchesMerchant = rule.keywords.some((kw) => normalized.includes(normalizeText(kw)))
      if (!matchesMerchant) continue

      const categoryId = findCategoryByKeywords(rule.categoryKeywords, categories)
      if (categoryId) {
        return { categoryId, confidence: 1.0, source: "rule" }
      }
    }

    return null
  }
}
