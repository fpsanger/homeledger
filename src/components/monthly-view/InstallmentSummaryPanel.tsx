"use client";

import { CheckCircle2, ChevronDown, Clock, CreditCard, Wallet } from "lucide-react";
import { usePrivacy } from "@/components/layout/PrivacyProvider";
import { maskCurrency } from "@/lib/maskCurrency";
import { SummaryCard } from "./SummaryCard";

export function InstallmentSummaryPanel({
  installments,
  open,
  onToggle,
}: {
  installments: { amount: number; isPaid: boolean }[];
  open: boolean;
  onToggle: () => void;
}) {
  const { hidden } = usePrivacy();
  const fmt = (amount: number) =>
    maskCurrency(amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), hidden);
  const total = installments.reduce((s, i) => s + i.amount, 0);
  const paid = installments.filter((i) => i.isPaid).reduce((s, i) => s + i.amount, 0);
  const remaining = total - paid;
  const pendingCount = installments.filter((i) => !i.isPaid).length;

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "" : "-rotate-90"}`} />
        {open ? "Ocultar resumo" : "Ver resumo"}
      </button>

      {open && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard
            icon={Wallet}
            label="Total"
            value={fmt(total)}
            colorClass="text-foreground"
          />
          <SummaryCard
            icon={CheckCircle2}
            label="Pago"
            value={fmt(paid)}
            colorClass="text-green-600"
          />
          <SummaryCard
            icon={CreditCard}
            label="Restante"
            value={fmt(remaining)}
            colorClass="text-amber-600"
          />
          <SummaryCard
            icon={Clock}
            label="Pendentes"
            value={String(pendingCount)}
            colorClass="text-muted-foreground"
          />
        </div>
      )}
    </>
  );
}
