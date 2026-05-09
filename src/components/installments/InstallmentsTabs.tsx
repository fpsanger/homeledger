"use client";

import { useState } from "react";

type Tab = "purchases" | "bill";

interface Props {
  defaultTab: Tab;
  purchasesView: React.ReactNode;
  billView: React.ReactNode;
}

export function InstallmentsTabs({ defaultTab, purchasesView, billView }: Props) {
  const [active, setActive] = useState<Tab>(defaultTab);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActive("purchases")}
          className={`px-4 py-2 text-sm font-medium transition-colors -mb-px border-b-2 ${
            active === "purchases"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Todas as Compras
        </button>
        <button
          type="button"
          onClick={() => setActive("bill")}
          className={`px-4 py-2 text-sm font-medium transition-colors -mb-px border-b-2 ${
            active === "bill"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Fatura
        </button>
      </div>
      <div className={active === "purchases" ? "" : "hidden"}>{purchasesView}</div>
      <div className={active === "bill" ? "" : "hidden"}>{billView}</div>
    </div>
  );
}
