/**
 * Migration script: import lancamentos.json + categorias.json into homeledger.
 *
 * Usage:
 *   DATABASE_URL=<url> npx tsx scripts/seed-from-lancamentos.ts
 *
 * Input files (hardcoded paths, adjust if needed):
 *   ~/Downloads/lancamentos.json
 *   ~/Downloads/categorias.json
 */

import { PrismaClient, PaymentMethod, TransactionType, IncomeSource } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { readFileSync } from "fs";
import { homedir } from "os";
import path from "path";
import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Types from old app
// ---------------------------------------------------------------------------

interface OldLancamento {
  id: string;
  condicao: "À vista" | "Parcelado" | "Recorrente";
  nome: string;
  forma_pagamento: string;
  anotacao: string | null;
  valor: string;
  data_compra: string;
  tipo_transacao: "Despesa" | "Receita";
  qtde_parcela: number | null;
  periodo: string; // YYYY-MM
  parcela_atual: number | null;
  qtde_recorrencia: number | null;
  realizado: boolean | null;
  dividido: boolean;
  antecipado: boolean;
  cartao_id: string | null;
  conta_id: string | null;
  categoria_id: string | null;
  pagador_id: string;
  series_id: string | null;
}

interface OldCategoria {
  id: string;
  nome: string;
  tipo: "despesa" | "receita";
}

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

const PEOPLE: Record<string, string> = {
  "47b2a72d-0173-4bfe-8d23-23bc43938ebf": "Felipe",
  "4c45fc9c-c4c4-44d1-b090-b3e2f6e6a1c8": "Maga",
  "f9dc13cf-1a20-42c1-8254-8c32b3473bec": "Leo",
};

const CREDIT_CARDS: Record<string, { name: string }> = {
  "2e87238a-7e71-4fbe-94f0-dfca8ca55185": { name: "C6 Bank" },
  "b8fc741d-bfa2-4af2-a4ed-7d275cf60b0a": { name: "BTG" },
};

function mapPaymentMethod(forma: string): PaymentMethod {
  switch (forma) {
    case "Cartão de crédito": return PaymentMethod.CREDIT_CARD;
    case "Cartão de débito": return PaymentMethod.DEBIT_CARD;
    case "Pix": return PaymentMethod.PIX;
    case "Boleto": return PaymentMethod.BOLETO;
    case "Transferência bancária": return PaymentMethod.BANK_TRANSFER;
    case "Dinheiro": return PaymentMethod.CASH;
    default: return PaymentMethod.BANK_TRANSFER;
  }
}

function mapIncomeSource(categoryName: string): IncomeSource {
  const lower = categoryName.toLowerCase();
  if (lower.includes("salário") || lower.includes("salario") || lower.includes("13 sal")) return IncomeSource.SALARY;
  if (lower.includes("freelance")) return IncomeSource.FREELANCE;
  if (lower.includes("aluguel")) return IncomeSource.RENTAL;
  if (lower.includes("investimento")) return IncomeSource.INVESTMENT;
  return IncomeSource.OTHER;
}

// Parse "YYYY-MM-DD" or "YYYY-MM" → Date (midnight UTC)
function parseDate(s: string): Date {
  if (s.length === 7) return new Date(`${s}-01T00:00:00.000Z`);
  return new Date(`${s}T00:00:00.000Z`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const downloadsDir = path.join(homedir(), "Downloads");
  const lancamentos: OldLancamento[] = JSON.parse(
    readFileSync(path.join(downloadsDir, "lancamentos.json"), "utf-8")
  );
  const categorias: OldCategoria[] = JSON.parse(
    readFileSync(path.join(downloadsDir, "categorias.json"), "utf-8")
  );

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  console.log(`Loaded ${lancamentos.length} lancamentos, ${categorias.length} categorias`);

  // -------------------------------------------------------------------------
  // 1. Categories — deduplicate by name, create new records, build id map
  // -------------------------------------------------------------------------

  const uniqueByName = new Map<string, OldCategoria>();
  for (const cat of categorias) {
    if (!uniqueByName.has(cat.nome)) uniqueByName.set(cat.nome, cat);
  }

  // old categoria_id → new Category.id
  const categoryIdMap = new Map<string, string>();

  // Build name → new id (for dedup across workspaces)
  const nameToNewId = new Map<string, string>();
  for (const cat of uniqueByName.values()) {
    nameToNewId.set(cat.nome, randomUUID());
  }

  // Map every old id to its new id (using the deduped name)
  for (const cat of categorias) {
    const newId = nameToNewId.get(cat.nome)!;
    categoryIdMap.set(cat.id, newId);
  }

  console.log(`Creating ${uniqueByName.size} unique categories...`);
  for (const [name, cat] of uniqueByName) {
    await prisma.category.create({
      data: {
        id: nameToNewId.get(name)!,
        name: cat.nome,
      },
    });
  }

  // -------------------------------------------------------------------------
  // 2. People
  // -------------------------------------------------------------------------

  // old pagador_id → new Person.id
  const personIdMap = new Map<string, string>();
  console.log("Creating 3 people...");
  for (const [oldId, name] of Object.entries(PEOPLE)) {
    const newId = randomUUID();
    personIdMap.set(oldId, newId);
    await prisma.person.create({ data: { id: newId, name } });
  }

  // -------------------------------------------------------------------------
  // 3. Credit cards
  // -------------------------------------------------------------------------

  // old cartao_id → new CreditCard.id
  const creditCardIdMap = new Map<string, string>();
  console.log("Creating 2 credit cards...");
  for (const [oldId, card] of Object.entries(CREDIT_CARDS)) {
    const newId = randomUUID();
    creditCardIdMap.set(oldId, newId);
    await prisma.creditCard.create({
      data: {
        id: newId,
        name: card.name,
        closureType: "VARIABLE",
        fixedClosureDay: null,
        dueDayOfMonth: 10, // default — adjust after import
        alwaysNextMonth: false,
      },
    });
  }

  // -------------------------------------------------------------------------
  // 4. Parcelado — group by series_id → CreditCardPurchase + Installments
  // -------------------------------------------------------------------------

  const parcelados = lancamentos.filter((r) => r.condicao === "Parcelado");
  const seriesMap = new Map<string, OldLancamento[]>();
  for (const r of parcelados) {
    if (!r.series_id) continue;
    const group = seriesMap.get(r.series_id) ?? [];
    group.push(r);
    seriesMap.set(r.series_id, group);
  }

  console.log(`Creating ${seriesMap.size} credit card purchases (parcelado)...`);
  for (const [, rows] of seriesMap) {
    const sorted = rows.sort((a, b) => (a.parcela_atual ?? 0) - (b.parcela_atual ?? 0));
    const first = sorted[0];
    const perInstallment = parseFloat(first.valor);
    const total = perInstallment * (first.qtde_parcela ?? sorted.length);

    const purchaseId = randomUUID();
    await prisma.creditCardPurchase.create({
      data: {
        id: purchaseId,
        personId: personIdMap.get(first.pagador_id)!,
        creditCardId: first.cartao_id ? creditCardIdMap.get(first.cartao_id) ?? null : null,
        description: first.nome,
        totalAmount: total,
        numberOfInstallments: first.qtde_parcela ?? sorted.length,
        purchaseDate: parseDate(first.data_compra),
        categoryId: first.categoria_id ? categoryIdMap.get(first.categoria_id) ?? null : null,
      },
    });

    for (const row of sorted) {
      const [year, month] = row.periodo.split("-").map(Number);
      await prisma.installment.create({
        data: {
          id: randomUUID(),
          creditCardPurchaseId: purchaseId,
          installmentNumber: row.parcela_atual ?? 1,
          amount: parseFloat(row.valor),
          dueYear: year,
          dueMonth: month,
          isPaid: row.realizado ?? false,
        },
      });
    }
  }

  // -------------------------------------------------------------------------
  // 5. À vista — with cartao_id → 1-installment CreditCardPurchase (Option B)
  //              without cartao_id → Transaction
  // -------------------------------------------------------------------------

  const avista = lancamentos.filter((r) => r.condicao === "À vista");
  const avistaWithCard = avista.filter((r) => r.cartao_id);
  const avistaNoCard = avista.filter((r) => !r.cartao_id);

  console.log(`Creating ${avistaWithCard.length} single-installment CC purchases (à vista + cartão)...`);
  for (const r of avistaWithCard) {
    const [year, month] = r.periodo.split("-").map(Number);
    const purchaseId = randomUUID();
    await prisma.creditCardPurchase.create({
      data: {
        id: purchaseId,
        personId: personIdMap.get(r.pagador_id)!,
        creditCardId: creditCardIdMap.get(r.cartao_id!) ?? null,
        description: r.nome,
        totalAmount: parseFloat(r.valor),
        numberOfInstallments: 1,
        purchaseDate: parseDate(r.data_compra),
        categoryId: r.categoria_id ? categoryIdMap.get(r.categoria_id) ?? null : null,
      },
    });
    await prisma.installment.create({
      data: {
        id: randomUUID(),
        creditCardPurchaseId: purchaseId,
        installmentNumber: 1,
        amount: parseFloat(r.valor),
        dueYear: year,
        dueMonth: month,
        isPaid: r.realizado ?? false,
      },
    });
  }

  console.log(`Creating ${avistaNoCard.length} transactions (à vista sem cartão)...`);
  for (const r of avistaNoCard) {
    const type: TransactionType = r.tipo_transacao === "Receita" ? "INCOME" : "EXPENSE";
    const categoryNewId = r.categoria_id ? categoryIdMap.get(r.categoria_id) ?? null : null;
    const categoryName = categoryNewId
      ? [...uniqueByName.values()].find((c) => nameToNewId.get(c.nome) === categoryNewId)?.nome ?? ""
      : "";

    await prisma.transaction.create({
      data: {
        id: randomUUID(),
        personId: personIdMap.get(r.pagador_id)!,
        type,
        amount: parseFloat(r.valor),
        date: parseDate(r.data_compra),
        description: r.nome,
        paymentMethod: mapPaymentMethod(r.forma_pagamento),
        source: type === "INCOME" ? mapIncomeSource(categoryName) : null,
        categoryId: categoryNewId,
      },
    });
  }

  // -------------------------------------------------------------------------
  // 6. Recorrente — each row as a Transaction (history preserved)
  // -------------------------------------------------------------------------

  const recorrentes = lancamentos.filter((r) => r.condicao === "Recorrente");
  console.log(`Creating ${recorrentes.length} transactions (recorrente rows)...`);
  for (const r of recorrentes) {
    const type: TransactionType = r.tipo_transacao === "Receita" ? "INCOME" : "EXPENSE";
    const categoryNewId = r.categoria_id ? categoryIdMap.get(r.categoria_id) ?? null : null;
    const categoryName = categoryNewId
      ? [...uniqueByName.values()].find((c) => nameToNewId.get(c.nome) === categoryNewId)?.nome ?? ""
      : "";

    await prisma.transaction.create({
      data: {
        id: randomUUID(),
        personId: personIdMap.get(r.pagador_id)!,
        type,
        amount: parseFloat(r.valor),
        date: parseDate(r.data_compra),
        description: r.nome,
        paymentMethod: mapPaymentMethod(r.forma_pagamento),
        source: type === "INCOME" ? mapIncomeSource(categoryName) : null,
        categoryId: categoryNewId,
      },
    });
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------

  const [cats, people, cards, purchases, installments, transactions] = await Promise.all([
    prisma.category.count(),
    prisma.person.count(),
    prisma.creditCard.count(),
    prisma.creditCardPurchase.count(),
    prisma.installment.count(),
    prisma.transaction.count(),
  ]);

  console.log("\n=== Migration complete ===");
  console.log(`  Categories:          ${cats}`);
  console.log(`  People:              ${people}`);
  console.log(`  Credit cards:        ${cards}`);
  console.log(`  CC purchases:        ${purchases}`);
  console.log(`  Installments:        ${installments}`);
  console.log(`  Transactions:        ${transactions}`);

  console.log("\nNOTE: Credit card dueDayOfMonth defaults to 10. Update via app after import.");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
