"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type Person = { id: string; name: string };

type Installment = {
  id: string;
  installmentNumber: number;
  amount: number;
  dueYear: number;
  dueMonth: number;
  isPaid: boolean;
  isCanceled: boolean;
};

type Purchase = {
  id: string;
  personId: string;
  description: string;
  totalAmount: number;
  numberOfInstallments: number;
  purchaseDate: string;
  categoryId: string | null;
  installments: Installment[];
};

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

type Props = {
  people: Person[];
  purchases: Purchase[];
  currentPersonId: string;
};

export function InstallmentsList({ people, purchases, currentPersonId }: Props) {
  const router = useRouter();
  const [showCanceled, setShowCanceled] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handlePersonChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const personId = e.target.value;
    const params = new URLSearchParams();
    if (personId) params.set("personId", personId);
    router.push(`/installments${params.size ? `?${params.toString()}` : ""}`);
  }

  async function markPaid(installmentId: string) {
    setError(null);
    setPendingId(installmentId);
    const res = await fetch(`/api/installments/${installmentId}/paid`, { method: "PATCH" });
    setPendingId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to mark installment as paid.");
      return;
    }
    router.refresh();
  }

  function statusBadge(inst: Installment) {
    if (inst.isCanceled) return <span className="text-xs text-muted-foreground">Canceled</span>;
    if (inst.isPaid) return <span className="text-xs text-green-600 font-medium">Paid</span>;
    return <span className="text-xs text-yellow-600 font-medium">Pending</span>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="person-filter">Person</Label>
          <Select
            id="person-filter"
            value={currentPersonId}
            onChange={handlePersonChange}
          >
            <option value="">All people</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-2 mt-5">
          <input
            id="show-canceled"
            type="checkbox"
            checked={showCanceled}
            onChange={(e) => setShowCanceled(e.target.checked)}
          />
          <label htmlFor="show-canceled" className="text-sm">Show canceled</label>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {purchases.length === 0 && (
        <p className="text-sm text-muted-foreground">No purchases found.</p>
      )}

      {purchases.map((purchase) => {
        const visibleInstallments = purchase.installments.filter(
          (i) => showCanceled || !i.isCanceled,
        );
        return (
          <div key={purchase.id} className="border rounded-lg p-4 flex flex-col gap-3">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-medium">{purchase.description || "No description"}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(purchase.purchaseDate).toLocaleDateString()} ·{" "}
                  {purchase.numberOfInstallments}x ·{" "}
                  R$ {purchase.totalAmount.toFixed(2)}
                </p>
              </div>
            </div>

            {visibleInstallments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No installments to show.</p>
            ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b">
                  <th className="pb-1 font-normal">#</th>
                  <th className="pb-1 font-normal">Due</th>
                  <th className="pb-1 font-normal">Amount</th>
                  <th className="pb-1 font-normal">Status</th>
                  <th className="pb-1 font-normal"></th>
                </tr>
              </thead>
              <tbody>
                {visibleInstallments.map((inst) => (
                  <tr key={inst.id} className="border-b last:border-0">
                    <td className="py-1.5">{inst.installmentNumber}</td>
                    <td className="py-1.5">{MONTH_NAMES[inst.dueMonth - 1]}/{inst.dueYear}</td>
                    <td className="py-1.5">R$ {inst.amount.toFixed(2)}</td>
                    <td className="py-1.5">{statusBadge(inst)}</td>
                    <td className="py-1.5 text-right">
                      {!inst.isPaid && !inst.isCanceled && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pendingId === inst.id}
                          onClick={() => markPaid(inst.id)}
                        >
                          {pendingId === inst.id ? "Saving…" : "Mark Paid"}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
        );
      })}
    </div>
  );
}
