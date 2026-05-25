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

export function LoyaltyProgramList({ programs }: { programs: Program[] }) {
  if (programs.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-sm">Nenhum programa cadastrado ainda.</p>
        <p className="text-xs mt-1">Clique em &quot;Adicionar Programa&quot; para começar.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {programs.map((p) => (
        <Link key={p.id} href={`/loyalty/${p.id}`} className="group block">
          <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3">
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
    </div>
  );
}
