"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";
import type { ReconciledItem } from "@/domain/entities/ReconciledItem";
import type { Step1Data } from "./BillingImportWizard";

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
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/credit-cards")
      .then((r) => r.json())
      .then((d) => setCreditCards(d.cards ?? []))
      .catch(() => setCreditCards([]));
    fetch("/api/people")
      .then((r) => r.json())
      .then((d) => setPeople(d.people ?? []))
      .catch(() => setPeople([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError("Selecione um arquivo PDF."); return; }
    if (!personId) { setError("Selecione uma pessoa."); return; }
    if (statementType === "credit-card" && !creditCardId) { setError("Selecione um cartão de crédito."); return; }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("statementType", statementType);
    formData.append("personId", personId);
    formData.append("year", String(year));
    formData.append("month", String(month));
    if (statementType === "credit-card") formData.append("creditCardId", creditCardId);
    if (bank && bank !== "unknown") formData.append("bank", bank);

    try {
      const res = await fetch("/api/billing/parse", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao processar extrato.");
        return;
      }
      toast.success("Extrato processado com sucesso!");
      onSuccess(data, { statementType, creditCardId: creditCardId || undefined, personId, year, month });
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
        <div>
          <label className="block text-sm font-medium mb-1">Arquivo (PDF ou CSV)</label>
          <div
            className="border-2 border-dashed border-muted rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            {file ? (
              <p className="text-sm font-medium">{file.name}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Clique para selecionar ou arraste um PDF ou CSV</p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.csv"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        {/* Statement type */}
        <div>
          <label className="block text-sm font-medium mb-2">Tipo de Extrato</label>
          <div className="flex gap-4">
            {(["credit-card", "debit"] as const).map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="statementType"
                  value={type}
                  checked={statementType === type}
                  onChange={() => setStatementType(type)}
                  className="accent-primary"
                />
                <span className="text-sm">{type === "credit-card" ? "Cartão de Crédito" : "Débito"}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Credit card selector */}
        {statementType === "credit-card" && (
          <div>
            <label className="block text-sm font-medium mb-1">Cartão de Crédito</label>
            <select
              value={creditCardId}
              onChange={(e) => setCreditCardId(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
            >
              <option value="">Selecione um cartão</option>
              {creditCards.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {creditCards.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">Não foi possível carregar cartões.</p>
            )}
          </div>
        )}

        {/* Person */}
        <div>
          <label className="block text-sm font-medium mb-1">Pessoa</label>
          <select
            value={personId}
            onChange={(e) => setPersonId(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
          >
            <option value="">Selecione uma pessoa</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {people.length === 0 && (
            <p className="text-xs text-amber-600 mt-1">Não foi possível carregar pessoas.</p>
          )}
        </div>

        {/* Month / Year */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Mês</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
            >
              {["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"].map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Ano</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              min={2000}
              max={2100}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
            />
          </div>
        </div>

        {/* Bank hint */}
        <div>
          <label className="block text-sm font-medium mb-1">Banco (opcional)</label>
          <select
            value={bank}
            onChange={(e) => setBank(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
          >
            {BANK_OPTIONS.map((b) => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
        </div>

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
