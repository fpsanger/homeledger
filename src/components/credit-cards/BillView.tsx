"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Installment = { id: string; installmentNumber: number; amount: number; isPaid: boolean };
type BillEntry = {
  card: { id: string; name: string };
  dueDayOfMonth: number;
  installments: Installment[];
  total: number;
};

function formatMonth(year: number, month: number) {
  return new Date(year, month - 1).toLocaleString("default", { month: "long", year: "numeric" });
}

export function BillView() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [bill, setBill] = useState<BillEntry[]>([]);
  const [loading, setLoading] = useState(false);

  async function load(y: number, m: number) {
    setLoading(true);
    const res = await fetch(`/api/credit-cards/bill?year=${y}&month=${m}`);
    if (res.ok) {
      const data = await res.json();
      setBill(data.bill);
    }
    setLoading(false);
  }

  useEffect(() => { load(year, month); }, [year, month]);

  function prev() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function next() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={prev}>←</Button>
        <span className="font-medium">{formatMonth(year, month)}</span>
        <Button variant="outline" size="sm" onClick={next}>→</Button>
      </div>
      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!loading && bill.length === 0 && (
        <p className="text-sm text-muted-foreground">No credit card installments for this month.</p>
      )}
      {bill.map((entry) => (
        <Card key={entry.card.id} className="p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{entry.card.name}</p>
              <p className="text-sm text-muted-foreground">Due: day {entry.dueDayOfMonth}</p>
            </div>
            <p className="font-semibold">R$ {entry.total.toFixed(2)}</p>
          </div>
          <ul className="text-sm flex flex-col gap-1">
            {entry.installments.map((inst) => (
              <li key={inst.id} className="flex justify-between">
                <span>Installment {inst.installmentNumber}{inst.isPaid ? " ✓" : ""}</span>
                <span>R$ {inst.amount.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
