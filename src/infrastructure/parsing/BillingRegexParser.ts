export type SupportedBank = "itau" | "bradesco" | "c6" | "btg" | "unknown"

export type RawBillingRow = {
  description: string
  amount: number
  date: Date
  rawText: string
  isCredit: boolean
  installmentNumber?: number
  totalInstallments?: number
  bank: SupportedBank
}

export type ParsedStatement = {
  rows: RawBillingRow[]
  bank: SupportedBank
  detectedBillingMonth?: { year: number; month: number }
}

// Lines containing these keywords are skipped as header/footer
const SKIP_KEYWORDS = [
  "total",
  "limite",
  "fatura",
  "vencimento",
  "saldo",
  "extrato",
  "cartao",
  "digital",
]

function shouldSkipLine(line: string): boolean {
  const lower = line.toLowerCase()
  return SKIP_KEYWORDS.some((kw) => lower.includes(kw))
}

function detectBank(text: string): SupportedBank {
  if (/Ita[uú]|ITAUCARD|ITAU/i.test(text)) return "itau"
  if (/Bradesco|BRADESCO|BRADESCARD/i.test(text)) return "bradesco"
  if (/C6\s?Bank|C6BANK/i.test(text)) return "c6"
  if (/BTG\s?Pactual|BTGPACTUAL|BTG/i.test(text)) return "btg"
  return "unknown"
}

function parseAmount(raw: string): { amount: number; isCredit: boolean } {
  const isCredit = raw.trim().startsWith("-")
  const cleaned = raw
    .replace(/^-/, "")
    .replace(/R\$|BRL/gi, "")
    .replace(/\s/g, "")
    .replace(/\./g, "") // thousands separator
    .replace(",", ".")
  return { amount: parseFloat(cleaned), isCredit }
}

function parseInstallments(
  description: string,
): { description: string; installmentNumber?: number; totalInstallments?: number } {
  const match = description.match(/\b(\d+)\/(\d+)\b/)
  if (!match) return { description: description.trim() }
  const installmentNumber = parseInt(match[1], 10)
  const totalInstallments = parseInt(match[2], 10)
  const cleaned = description.replace(match[0], "").replace(/\s+/g, " ").trim()
  return { description: cleaned, installmentNumber, totalInstallments }
}

function parseDateDDMM(day: string, month: string, year?: string): Date {
  const y = year ? parseInt(year, 10) : new Date().getFullYear()
  return new Date(Date.UTC(y, parseInt(month, 10) - 1, parseInt(day, 10)))
}

function parseDateISO(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-")
  return new Date(Date.UTC(parseInt(y), parseInt(m) - 1, parseInt(d)))
}

// DD/MM or DD/MM/YYYY  DESCRIPTION  R$ amount
function parseItauLine(line: string, bank: SupportedBank): RawBillingRow | null {
  const re = /^(\d{2})\/(\d{2})(?:\/(\d{4}))?\s+(.+?)\s+(-?R\$\s*[\d.,]+)\s*$/
  const m = line.match(re)
  if (!m) return null

  const date = parseDateDDMM(m[1], m[2], m[3])
  const rawDesc = m[4]
  const rawAmount = m[5]

  const { amount, isCredit } = parseAmount(rawAmount)
  const { description, installmentNumber, totalInstallments } = parseInstallments(rawDesc)

  return {
    description,
    amount,
    date,
    rawText: line,
    isCredit,
    installmentNumber,
    totalInstallments,
    bank,
  }
}

// DD/MM/YYYY  DESCRIPTION  amount (no R$ prefix, may be negative)
function parseBradescoLine(line: string, bank: SupportedBank): RawBillingRow | null {
  const re = /^(\d{2})\/(\d{2})\/(\d{4})\s+(.+?)\s+(-?[\d.,]+)\s*$/
  const m = line.match(re)
  if (!m) return null

  const date = parseDateDDMM(m[1], m[2], m[3])
  const rawDesc = m[4]
  const rawAmount = m[5]

  const { amount, isCredit } = parseAmount(rawAmount)
  const { description, installmentNumber, totalInstallments } = parseInstallments(rawDesc)

  return {
    description,
    amount,
    date,
    rawText: line,
    isCredit,
    installmentNumber,
    totalInstallments,
    bank,
  }
}

// YYYY-MM-DD  DESCRIPTION  R$ amount
function parseC6Line(line: string, bank: SupportedBank): RawBillingRow | null {
  const re = /^(\d{4}-\d{2}-\d{2})\s+(.+?)\s+(-?R\$\s*[\d.,]+)\s*$/
  const m = line.match(re)
  if (!m) return null

  const date = parseDateISO(m[1])
  const rawDesc = m[2]
  const rawAmount = m[3]

  const { amount, isCredit } = parseAmount(rawAmount)
  const { description, installmentNumber, totalInstallments } = parseInstallments(rawDesc)

  return {
    description,
    amount,
    date,
    rawText: line,
    isCredit,
    installmentNumber,
    totalInstallments,
    bank,
  }
}

// DD/MM/YYYY  DESCRIPTION  BRL amount
function parseBtgLine(line: string, bank: SupportedBank): RawBillingRow | null {
  const re = /^(\d{2})\/(\d{2})\/(\d{4})\s+(.+?)\s+(-?BRL\s*[\d.,]+)\s*$/
  const m = line.match(re)
  if (!m) return null

  const date = parseDateDDMM(m[1], m[2], m[3])
  const rawDesc = m[4]
  const rawAmount = m[5]

  const { amount, isCredit } = parseAmount(rawAmount)
  const { description, installmentNumber, totalInstallments } = parseInstallments(rawDesc)

  return {
    description,
    amount,
    date,
    rawText: line,
    isCredit,
    installmentNumber,
    totalInstallments,
    bank,
  }
}

// Generic fallback: DD/MM or DD/MM/YYYY  DESCRIPTION  R$/BRL/- amount
function parseUnknownLine(line: string, bank: SupportedBank): RawBillingRow | null {
  // Try with R$ prefix
  const re = /^(\d{2})\/(\d{2})(?:\/(\d{4}))?\s+(.+?)\s+(-?(?:R\$|BRL)?\s*[\d.,]+)\s*$/
  const m = line.match(re)
  if (!m) return null

  const date = parseDateDDMM(m[1], m[2], m[3])
  const rawDesc = m[4]
  const rawAmount = m[5]

  const { amount, isCredit } = parseAmount(rawAmount)
  const { description, installmentNumber, totalInstallments } = parseInstallments(rawDesc)

  return {
    description,
    amount,
    date,
    rawText: line,
    isCredit,
    installmentNumber,
    totalInstallments,
    bank,
  }
}

type LineParser = (line: string, bank: SupportedBank) => RawBillingRow | null

const BANK_PARSERS: Record<SupportedBank, LineParser> = {
  itau: parseItauLine,
  bradesco: parseBradescoLine,
  c6: parseC6Line,
  btg: parseBtgLine,
  unknown: parseUnknownLine,
}

export function parseBillingText(
  pdfText: string,
  hintBank?: SupportedBank,
): ParsedStatement {
  if (!pdfText || !pdfText.trim()) {
    return { rows: [], bank: hintBank ?? "unknown" }
  }

  const bank: SupportedBank =
    hintBank && hintBank !== "unknown" ? hintBank : detectBank(pdfText)

  const lineParser = BANK_PARSERS[bank]
  const rows: RawBillingRow[] = []

  for (const rawLine of pdfText.split("\n")) {
    const line = rawLine.trim()
    if (!line) continue
    if (shouldSkipLine(line)) continue

    const row = lineParser(line, bank)
    if (row) rows.push(row)
  }

  return { rows, bank }
}
