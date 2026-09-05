"use client";

import type React from "react";
import { usePrivacy } from "@/components/layout/PrivacyProvider";
import { Card } from "@/components/ui/card";
import { maskCurrency } from "@/lib/maskCurrency";
import { formatCurrency } from "./BillView.helpers";

export function useMaskedCurrency() {
  const { hidden } = usePrivacy();
  return (value: number) => maskCurrency(formatCurrency(value), hidden);
}

export function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground leading-none mb-1">{label}</p>
        <p className="text-lg font-semibold leading-none">{value}</p>
      </div>
    </Card>
  );
}
