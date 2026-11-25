"use client";

import { useState } from "react";

const TYPES = [
  { value: "AIRLINE", label: "Aérea" },
  { value: "HOTEL", label: "Hotel" },
  { value: "BANK", label: "Banco" },
  { value: "OTHER", label: "Outro" },
];

const PRESET_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

const INPUT_CLASS =
  "rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export type EditableProgram = {
  id: string;
  name: string;
  type: string;
  color: string;
  referenceMinPer1kBrl: number | null;
  referenceMaxPer1kBrl: number | null;
};

type Props = {
  /** When set the form edits this program (PUT); otherwise it creates one (POST). */
  program?: EditableProgram;
  onSuccess: () => void;
};

function toInputValue(value: number | null | undefined): string {
  return value == null ? "" : String(value);
}

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function ColorField({ color, onChange }: { color: string; onChange: (color: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium" htmlFor="prog-color">
        Cor
      </label>
      <div className="flex items-center gap-2 flex-wrap">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            aria-label={`Selecionar cor ${c}`}
            className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
            style={{ backgroundColor: c, borderColor: color === c ? "black" : "transparent" }}
          />
        ))}
        <input
          id="prog-color"
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded-full border cursor-pointer"
          title="Cor personalizada"
        />
      </div>
    </div>
  );
}

type ReferenceFieldsProps = {
  min: string;
  max: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
};

function ReferenceFields({ min, max, onMinChange, onMaxChange }: ReferenceFieldsProps) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-sm font-medium">Referência do milheiro (R$)</legend>
      <p className="text-xs text-muted-foreground">
        Opcional. Usada pelo simulador de compra. Preencha só um valor para uma referência fixa.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          aria-label="Referência mínima por milheiro"
          placeholder="Mínimo"
          value={min}
          onChange={(e) => onMinChange(e.target.value)}
          className={INPUT_CLASS}
        />
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          aria-label="Referência máxima por milheiro"
          placeholder="Máximo"
          value={max}
          onChange={(e) => onMaxChange(e.target.value)}
          className={INPUT_CLASS}
        />
      </div>
    </fieldset>
  );
}

export function LoyaltyProgramForm({ program, onSuccess }: Props) {
  const [name, setName] = useState(program?.name ?? "");
  const [type, setType] = useState(program?.type ?? "AIRLINE");
  const [color, setColor] = useState(program?.color ?? PRESET_COLORS[0]);
  const [refMin, setRefMin] = useState(toInputValue(program?.referenceMinPer1kBrl));
  const [refMax, setRefMax] = useState(toInputValue(program?.referenceMaxPer1kBrl));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(program);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const referenceMinPer1kBrl = parseOptionalNumber(refMin);
    const referenceMaxPer1kBrl = parseOptionalNumber(refMax);
    if (Number.isNaN(referenceMinPer1kBrl) || Number.isNaN(referenceMaxPer1kBrl)) {
      setError("Referência inválida.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        isEdit ? `/api/loyalty/programs/${program?.id}` : "/api/loyalty/programs",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            type,
            color,
            referenceMinPer1kBrl,
            referenceMaxPer1kBrl,
          }),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? `Erro ao ${isEdit ? "salvar" : "criar"} programa.`);
        return;
      }
      onSuccess();
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="prog-name">
          Nome
        </label>
        <input
          id="prog-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Smiles, Livelo..."
          required
          className={INPUT_CLASS}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="prog-type">
          Tipo
        </label>
        <select
          id="prog-type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className={INPUT_CLASS}
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <ColorField color={color} onChange={setColor} />
      <ReferenceFields min={refMin} max={refMax} onMinChange={setRefMin} onMaxChange={setRefMax} />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {loading ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}
