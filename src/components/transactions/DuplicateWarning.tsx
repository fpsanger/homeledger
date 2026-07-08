"use client";

import type { TransactionRecord } from "@/domain/repositories/ITransactionRepository";
import type { CreditCardPurchaseRecord } from "@/domain/repositories/ICreditCardPurchaseRepository";
import { formatAmountBR } from "@/lib/utils";
import { formatDatePtBR } from "@/lib/format-date";

type Match = TransactionRecord | CreditCardPurchaseRecord;

export function DuplicateWarning({ match, note }: { match: Match | null; note?: string }) {
  if (!match) return null;

  const amount = "totalAmount" in match ? match.totalAmount : match.amount;
  const date = "purchaseDate" in match ? match.purchaseDate : match.date;

  return (
    <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
      <p className="font-medium text-amber-500">Possível duplicata encontrada</p>
      <p className="mt-1 text-amber-400">
        {match.description || "Sem descrição"}
        {" · "}
        {formatAmountBR(amount)}
        {" · "}
        {formatDatePtBR(String(date).slice(0, 10))}
      </p>
      {note && <p className="mt-1 text-xs text-amber-400/70">{note}</p>}
      <p className="mt-1 text-xs text-amber-400/70">Você pode continuar mesmo assim.</p>
    </div>
  );
}
