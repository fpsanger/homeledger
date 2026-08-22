"use client";

import { usePrivacy } from "@/components/layout/PrivacyProvider";
import { maskCurrency } from "@/lib/maskCurrency";

type TransactionAmountProps = {
  type: string;
  amount: number;
};

export function TransactionAmount({ type, amount }: TransactionAmountProps) {
  const { hidden } = usePrivacy();
  const fmtCurrency = (value: number) =>
    maskCurrency(value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), hidden);

  switch (type) {
    case "INVESTMENT":
      return (
        <span className="inline-flex items-center gap-1.5 text-violet-600">
          {fmtCurrency(amount)}
        </span>
      );

    case "EXPENSE":
      return (
        <span className="inline-flex items-center gap-1.5 text-red-600">{fmtCurrency(amount)}</span>
      );

    case "INCOME":
      return (
        <span className="inline-flex items-center gap-1.5 text-green-600">
          {fmtCurrency(amount)}
        </span>
      );

    default:
      return <span>{fmtCurrency(amount)}</span>;
  }
}
