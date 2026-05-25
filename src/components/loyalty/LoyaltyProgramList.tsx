"use client";

import Link from "next/link";

type Program = {
  id: string;
  name: string;
  type: string;
  color: string;
};

const TYPE_LABELS: Record<string, string> = {
  AIRLINE: "Aérea",
  HOTEL: "Hotel",
  BANK: "Banco",
  OTHER: "Outro",
};

type Props = {
  programs: Program[];
  onAdd: () => void;
};

export function LoyaltyProgramList({ programs, onAdd }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Programas</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {programs.map((p) => (
          <Link key={p.id} href={`/loyalty/${p.id}`} className="group block">
            <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3 h-full">
              <div className="flex items-center gap-3">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: p.color }}
                />
                <span className="font-semibold text-sm truncate">{p.name}</span>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                  {TYPE_LABELS[p.type] ?? p.type}
                </span>
              </div>
              <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                Ver detalhes →
              </p>
            </div>
          </Link>
        ))}
        <button
          type="button"
          onClick={onAdd}
          className="rounded-xl border-2 border-dashed border-muted-foreground/30 bg-card p-5 min-h-[88px] flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-muted/30 transition-colors text-muted-foreground hover:text-foreground"
        >
          <span className="text-2xl font-light leading-none">+</span>
          <span className="text-xs font-medium">Adicionar Programa</span>
        </button>
      </div>
    </div>
  );
}
