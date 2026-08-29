"use client";

import { CheckCircle2, ChevronDown, ChevronRight, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CollapsibleTrigger } from "@/components/ui/collapsible";
import { useMaskedCurrency } from "./BillSummaryCard";
import { formatItemsSummary } from "./BillView.helpers";
import type { BillEntry, BillInstallmentItem } from "./BillView.types";

export function CardHeaderRow({
  entry,
  isOpen,
  allPaid,
  paying,
  unpaying,
  onPayFatura,
  onUnpayFatura,
}: {
  entry: BillEntry;
  isOpen: boolean;
  allPaid: boolean;
  paying: Set<string>;
  unpaying: Set<string>;
  onPayFatura: (cardId: string, installments: BillInstallmentItem[]) => void;
  onUnpayFatura: (cardId: string, installments: BillInstallmentItem[]) => void;
}) {
  const formatCurrencyMasked = useMaskedCurrency();
  return (
    <CollapsibleTrigger
      className={`no-active-scale w-full rounded-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-5 py-4 border-b transition-colors text-left ${
        allPaid
          ? "bg-green-50 hover:bg-green-100 border-green-200 dark:bg-green-950 dark:hover:bg-green-900 dark:border-green-800"
          : "bg-muted/30 hover:bg-muted/50"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
        <CreditCard className="w-4 h-4 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm truncate">{entry.card.name}</p>
            {allPaid && (
              <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full shrink-0">
                <CheckCircle2 className="w-3 h-3" /> Paga
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Vence: dia {entry.dueDayOfMonth}</p>
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-3 pl-7 sm:pl-0">
        {entry.installments.some((i) => !i.isPaid) && (
          <Button
            variant="outline"
            size="sm"
            disabled={paying.has(entry.card.id)}
            onClick={(e) => {
              e.stopPropagation();
              onPayFatura(entry.card.id, entry.installments);
            }}
          >
            {paying.has(entry.card.id) ? "Pagando…" : "Pagar fatura"}
          </Button>
        )}
        {entry.installments.some((i) => i.isPaid) && (
          <Button
            variant="destructive"
            size="sm"
            disabled={unpaying.has(entry.card.id)}
            onClick={(e) => {
              e.stopPropagation();
              onUnpayFatura(entry.card.id, entry.installments);
            }}
          >
            {unpaying.has(entry.card.id) ? "Estornando…" : "Estornar fatura"}
          </Button>
        )}
        <div className="text-right shrink-0">
          <p className="font-semibold text-sm">{formatCurrencyMasked(entry.total)}</p>
          <p className="text-xs text-muted-foreground whitespace-nowrap">
            {formatItemsSummary(entry)}
          </p>
        </div>
      </div>
    </CollapsibleTrigger>
  );
}
