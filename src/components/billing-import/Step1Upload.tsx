"use client";

import { Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { ReconciledItem } from "@/domain/entities/ReconciledItem";
import { useCreditCardsAndPeople } from "@/hooks/useCreditCardsAndPeople";
import type { Step1Data } from "./types";

type CreditCard = { id: string; name: string };
type Person = { id: string; name: string };

type Props = {
  onSuccess: (items: ReconciledItem[], data: Step1Data) => void;
};

const BANK_OPTIONS = [
  { value: "unknown", label: "Auto-detectar" },
  { value: "itau", label: "Itaú" },
  { value: "bradesco", label: "Bradesco" },
  { value: "c6", label: "C6 Bank" },
  { value: "btg", label: "BTG" },
];

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;

const BANK_LABELS: Record<string, string> = {
  bradesco: "Bradesco",
  itau: "Itaú",
  c6: "C6 Bank",
  btg: "BTG",
  nubank: "Nubank",
  inter: "Inter",
  santander: "Santander",
  caixa: "Caixa",
  bb: "Banco do Brasil",
};

const BANK_NAME_MATCHERS: [(lower: string) => boolean, string][] = [
  [(lower) => lower.includes("bradesco"), "bradesco"],
  [(lower) => lower.includes("itaú") || lower.includes("itau"), "itau"],
  [(lower) => lower.includes("c6"), "c6"],
  [(lower) => lower.includes("btg"), "btg"],
  [(lower) => lower.includes("nubank") || lower.includes("nu "), "nubank"],
  [(lower) => lower.includes("inter"), "inter"],
  [(lower) => lower.includes("santander"), "santander"],
  [(lower) => lower.includes("caixa"), "caixa"],
  [
    (lower) => lower.includes("banco do brasil") || lower.includes(" bb ") || lower.endsWith(" bb"),
    "bb",
  ],
];

function inferBankFromCardName(name: string): string {
  const lower = name.toLowerCase();
  const match = BANK_NAME_MATCHERS.find(([matches]) => matches(lower));
  return match ? match[1] : "unknown";
}

function validateStep1Fields(
  personId: string,
  statementType: "credit-card" | "debit",
  creditCardId: string,
): string | null {
  if (!personId) return "Selecione uma pessoa.";
  if (statementType === "credit-card" && !creditCardId) return "Selecione um cartão de crédito.";
  return null;
}

function resolveEffectiveBank(selectedCard: CreditCard | undefined, bank: string): string {
  const inferredBank = selectedCard ? inferBankFromCardName(selectedCard.name) : "unknown";
  return bank !== "unknown" ? bank : inferredBank;
}

function resolveDetectedBank(detectedBank: string | undefined, effectiveBank: string): string {
  return detectedBank && detectedBank !== "unknown" ? detectedBank : effectiveBank;
}

function formatBankSuccessMessage(resolvedBank: string): string {
  const bankLabel =
    resolvedBank && resolvedBank !== "unknown"
      ? ` (${BANK_LABELS[resolvedBank] ?? resolvedBank})`
      : "";
  return `Extrato processado com sucesso!${bankLabel}`;
}

function buildParseFormData(
  file: File,
  statementType: "credit-card" | "debit",
  personId: string,
  year: number,
  month: number,
  creditCardId: string,
  effectiveBank: string,
): FormData {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("statementType", statementType);
  formData.append("personId", personId);
  formData.append("year", String(year));
  formData.append("month", String(month));
  if (statementType === "credit-card") formData.append("creditCardId", creditCardId);
  if (effectiveBank && effectiveBank !== "unknown") formData.append("bank", effectiveBank);
  return formData;
}

function FileDropzone({
  file,
  onSelect,
  inputRef,
}: {
  file: File | null;
  onSelect: (file: File | null) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}) {
  return (
    <div>
      <label htmlFor="billing-file-input" className="block text-sm font-medium mb-1">
        Arquivo (PDF ou CSV)
      </label>
      <button
        type="button"
        className="w-full border-2 border-dashed border-muted rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        {file ? (
          <p className="text-sm font-medium">{file.name}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Clique para selecionar ou arraste um PDF ou CSV
          </p>
        )}
        <input
          id="billing-file-input"
          ref={inputRef}
          type="file"
          accept=".pdf,.csv"
          className="hidden"
          onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
        />
      </button>
    </div>
  );
}

function BankMismatchHint({
  bank,
  selectedCard,
}: {
  bank: string;
  selectedCard: CreditCard | undefined;
}) {
  const inferredBank = selectedCard ? inferBankFromCardName(selectedCard.name) : "unknown";
  if (bank === "unknown" || inferredBank === "unknown" || bank === inferredBank) return null;
  return (
    <p className="text-xs text-amber-500 mt-1">
      Cartão sugere {BANK_LABELS[inferredBank] ?? inferredBank} — banco selecionado pode não
      corresponder.
    </p>
  );
}

function StatementTypeFieldset({
  statementType,
  onChange,
}: {
  statementType: "credit-card" | "debit";
  onChange: (type: "credit-card" | "debit") => void;
}) {
  return (
    <fieldset>
      <legend className="block text-sm font-medium mb-2">Tipo de Extrato</legend>
      <div className="flex gap-4">
        {(["credit-card", "debit"] as const).map((type) => (
          <label key={type} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="statementType"
              value={type}
              checked={statementType === type}
              onChange={() => onChange(type)}
              className="accent-primary"
            />
            <span className="text-sm">
              {type === "credit-card" ? "Cartão de Crédito" : "Débito"}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function CreditCardSelect({
  creditCardId,
  creditCards,
  onChange,
}: {
  creditCardId: string;
  creditCards: CreditCard[];
  onChange: (id: string) => void;
}) {
  return (
    <div>
      <label htmlFor="billing-credit-card" className="block text-sm font-medium mb-1">
        Cartão de Crédito
      </label>
      <select
        id="billing-credit-card"
        value={creditCardId}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
      >
        <option value="">Selecione um cartão</option>
        {creditCards.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      {creditCards.length === 0 && (
        <p className="text-xs text-amber-600 mt-1">Não foi possível carregar cartões.</p>
      )}
    </div>
  );
}

function PersonSelect({
  personId,
  people,
  onChange,
}: {
  personId: string;
  people: Person[];
  onChange: (id: string) => void;
}) {
  return (
    <div>
      <label htmlFor="billing-person" className="block text-sm font-medium mb-1">
        Pessoa
      </label>
      <select
        id="billing-person"
        value={personId}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
      >
        <option value="">Selecione uma pessoa</option>
        {people.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      {people.length === 0 && (
        <p className="text-xs text-amber-600 mt-1">Não foi possível carregar pessoas.</p>
      )}
    </div>
  );
}

const MONTH_ABBREVIATIONS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

function MonthYearFields({
  month,
  year,
  onMonthChange,
  onYearChange,
}: {
  month: number;
  year: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-1">
        <label htmlFor="billing-month" className="block text-sm font-medium mb-1">
          Mês
        </label>
        <select
          id="billing-month"
          value={month}
          onChange={(e) => onMonthChange(Number(e.target.value))}
          className="w-full border rounded-md px-3 py-2 text-sm bg-background"
        >
          {MONTH_ABBREVIATIONS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1">
        <label htmlFor="billing-year" className="block text-sm font-medium mb-1">
          Ano
        </label>
        <input
          id="billing-year"
          type="number"
          value={year}
          onChange={(e) => onYearChange(Number(e.target.value))}
          min={2000}
          max={2100}
          className="w-full border rounded-md px-3 py-2 text-sm bg-background"
        />
      </div>
    </div>
  );
}

function BankSelectField({
  bank,
  creditCardId,
  creditCards,
  onChange,
}: {
  bank: string;
  creditCardId: string;
  creditCards: CreditCard[];
  onChange: (bank: string) => void;
}) {
  return (
    <div>
      <label htmlFor="billing-bank" className="block text-sm font-medium mb-1">
        Banco (opcional)
      </label>
      <select
        id="billing-bank"
        value={bank}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
      >
        {BANK_OPTIONS.map((b) => (
          <option key={b.value} value={b.value}>
            {b.label}
          </option>
        ))}
      </select>
      <BankMismatchHint bank={bank} selectedCard={creditCards.find((c) => c.id === creditCardId)} />
    </div>
  );
}

export function Step1Upload({ onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [statementType, setStatementType] = useState<"credit-card" | "debit">("credit-card");
  const [creditCardId, setCreditCardId] = useState("");
  const [personId, setPersonId] = useState("");
  const [year, setYear] = useState(CURRENT_YEAR);
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [bank, setBank] = useState("unknown");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { creditCards, people } = useCreditCardsAndPeople();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Selecione um arquivo PDF.");
      return;
    }
    const fieldsError = validateStep1Fields(personId, statementType, creditCardId);
    if (fieldsError) {
      setError(fieldsError);
      return;
    }

    const selectedCard = creditCards.find((c) => c.id === creditCardId);
    const effectiveBank = resolveEffectiveBank(selectedCard, bank);

    setLoading(true);
    setError(null);

    const formData = buildParseFormData(
      file,
      statementType,
      personId,
      year,
      month,
      creditCardId,
      effectiveBank,
    );

    try {
      const res = await fetch("/api/billing/parse", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao processar extrato.");
        return;
      }
      const resolvedBank = resolveDetectedBank(data.detectedBank, effectiveBank);
      toast.success(formatBankSuccessMessage(resolvedBank));
      onSuccess(data.items ?? data, {
        statementType,
        creditCardId: creditCardId || undefined,
        personId,
        year,
        month,
        detectedBank: resolvedBank !== "unknown" ? resolvedBank : undefined,
      });
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-card rounded-lg border p-6">
      <h2 className="text-lg font-semibold mb-6">Etapa 1 — Upload do Extrato</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* File upload */}
        <FileDropzone file={file} onSelect={setFile} inputRef={fileInputRef} />

        {/* Statement type */}
        <StatementTypeFieldset statementType={statementType} onChange={setStatementType} />

        {/* Credit card selector */}
        {statementType === "credit-card" && (
          <CreditCardSelect
            creditCardId={creditCardId}
            creditCards={creditCards}
            onChange={setCreditCardId}
          />
        )}

        {/* Person */}
        <PersonSelect personId={personId} people={people} onChange={setPersonId} />

        {/* Month / Year */}
        <MonthYearFields
          month={month}
          year={year}
          onMonthChange={setMonth}
          onYearChange={setYear}
        />

        {/* Bank hint */}
        <BankSelectField
          bank={bank}
          creditCardId={creditCardId}
          creditCards={creditCards}
          onChange={setBank}
        />

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Processando..." : "Processar Extrato"}
        </button>
      </form>
    </div>
  );
}
