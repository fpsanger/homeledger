import type { BillingItem } from "../../domain/entities/BillingItem"
import {
  createInstallmentBillingItem,
  createTransactionBillingItem,
} from "../../domain/entities/BillingItem"

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ";" && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

export function parseC6Csv(csvText: string): BillingItem[] {
  const lines = csvText.split("\n").map((l) => l.trim()).filter(Boolean)
  // need at least header + 1 data row
  if (lines.length < 2) return []

  const items: BillingItem[] = []

  for (const line of lines.slice(1)) {
    const cols = parseCsvLine(line)
    if (cols.length < 9) continue

    const dateStr = cols[0]     // DD/MM/YYYY
    const description = cols[4] // Descrição
    const parcelaStr = cols[5]  // "X/Y" or "Única"
    const rawAmount = cols[8]   // Valor (em R$)

    const [day, month, year] = dateStr.split("/")
    if (!day || !month || !year) continue

    const date = new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10)))

    const amount = parseFloat(rawAmount)
    if (!Number.isFinite(amount) || amount === 0) continue

    const absAmount = Math.abs(amount)
    const isCredit = amount < 0

    const installmentMatch = parcelaStr.match(/^(\d+)\/(\d+)$/)

    try {
      if (installmentMatch) {
        items.push(
          createInstallmentBillingItem({
            description,
            amount: absAmount,
            date,
            installmentNumber: parseInt(installmentMatch[1], 10),
            totalInstallments: parseInt(installmentMatch[2], 10),
          }),
        )
      } else {
        items.push(
          createTransactionBillingItem({
            description,
            amount: absAmount,
            date,
            transactionType: isCredit ? "INCOME" : "EXPENSE",
          }),
        )
      }
    } catch {
      // skip invalid rows silently
    }
  }

  return items
}
