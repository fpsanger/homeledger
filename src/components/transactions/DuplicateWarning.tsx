"use client";

import type { CreditCardPurchaseRecord } from "@/domain/repositories/ICreditCardPurchaseRepository";
import type { TransactionRecord } from "@/domain/repositories/ITransactionRepository";
import type { LoyaltyDuplicateCandidate } from "@/domain/services/isDuplicateLoyaltyTransaction";
import { formatDatePtBR } from "@/lib/format-date";
import { formatAmountBR } from "@/lib/utils";

type Match = TransactionRecord | CreditCardPurchaseRecord | LoyaltyDuplicateCandidate;

export function DuplicateWarning({ match, note }: { match: Match | null; note?: string }) {
  if (!match) return null;

  const isLoyalty = "points" in match;
  const value = isLoyalty
    ? `${match.points.toLocaleString("pt-BR")} pts`
    : formatAmountBR("totalAmount" in match ? match.totalAmount : match.amount);
  const date = isLoyalty ? match.date : "purchaseDate" in match ? match.purchaseDate : match.date;

  return (
    <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
      <p className="font-medium text-amber-500">Possível duplicata encontrada</p>
      <p className="mt-1 text-amber-400">
        {match.description || "Sem descrição"}
        {" · "}
        {value}
        {" · "}
        {formatDatePtBR(String(date).slice(0, 10))}
      </p>
      {note && <p className="mt-1 text-xs text-amber-400/70">{note}</p>}
      <p className="mt-1 text-xs text-amber-400/70">Você pode continuar mesmo assim.</p>
    </div>
  );
}
