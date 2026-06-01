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
      {programs.length > 0 && (
        <div className="rounded-xl border overflow-hidden divide-y">
          {programs.map((p) => (
            <Link
              key={p.id}
              href={`/loyalty/${p.id}`}
              className="group flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
              <span className="font-medium text-sm flex-1 truncate">{p.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                {TYPE_LABELS[p.type] ?? p.type}
              </span>
              <svg
                className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={onAdd}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed text-sm text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Adicionar Programa
      </button>
    </div>
  );
}
