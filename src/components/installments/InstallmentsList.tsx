"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type Person = { id: string; name: string };
type Category = { id: string; name: string; path: string };
type CreditCard = { id: string; name: string };

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
  creditCardId: string | null;
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

type EditState = {
  description: string;
  totalAmount: string;
  purchaseDate: string;
  categoryId: string;
  creditCardId: string;
};

function EditForm({
  purchase,
  onSaved,
  onCancel,
}: {
  purchase: Purchase;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<EditState>({
    description: purchase.description,
    totalAmount: String(purchase.totalAmount),
    purchaseDate: purchase.purchaseDate.split("T")[0],
    categoryId: purchase.categoryId ?? "",
    creditCardId: purchase.creditCardId ?? "",
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadOptions() {
    if (loaded) return;
    const [catRes, ccRes] = await Promise.all([
      fetch("/api/categories"),
      fetch("/api/credit-cards"),
    ]);
    if (catRes.ok) {
      const d = await catRes.json();
      setCategories(d.categories ?? []);
    }
    if (ccRes.ok) {
      const d = await ccRes.json();
      setCreditCards(d.cards ?? []);
    }
    setLoaded(true);
  }

  useEffect(() => { loadOptions(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/credit-card-purchases/${purchase.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: form.description,
        totalAmount: parseFloat(form.totalAmount),
        purchaseDate: form.purchaseDate,
        categoryId: form.categoryId || null,
        creditCardId: form.creditCardId || null,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save.");
      return;
    }
    onSaved();
  }

  function field(id: string, label: string, el: React.ReactNode) {
    return (
      <div className="flex flex-col gap-1">
        <Label htmlFor={id}>{label}</Label>
        {el}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 pt-2">
      {field("ep-desc", "Description",
        <Input id="ep-desc" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional" />
      )}
      {field("ep-amount", "Total Amount",
        <Input id="ep-amount" type="number" min="0.01" step="0.01" required value={form.totalAmount} onChange={(e) => setForm(f => ({ ...f, totalAmount: e.target.value }))} />
      )}
      {field("ep-date", "Purchase Date",
        <Input id="ep-date" type="date" required value={form.purchaseDate} onChange={(e) => setForm(f => ({ ...f, purchaseDate: e.target.value }))} />
      )}
      {field("ep-card", "Credit Card",
        <Select id="ep-card" value={form.creditCardId} onChange={(e) => setForm(f => ({ ...f, creditCardId: e.target.value }))}>
          <option value="">None</option>
          {creditCards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      )}
      {field("ep-cat", "Category",
        <Select id="ep-cat" value={form.categoryId} onChange={(e) => setForm(f => ({ ...f, categoryId: e.target.value }))}>
          <option value="">None</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.path}</option>)}
        </Select>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={loading}>{loading ? "Saving…" : "Save"}</Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

export function InstallmentsList({ people, purchases, currentPersonId }: Props) {
  const router = useRouter();
  const [showCanceled, setShowCanceled] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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

  async function deletePurchase(id: string) {
    setError(null);
    setDeletingId(id);
    const res = await fetch(`/api/credit-card-purchases/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to delete.");
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
                  {new Date(purchase.purchaseDate).toLocaleDateString("pt-BR")} ·{" "}
                  {purchase.numberOfInstallments}x ·{" "}
                  R$ {purchase.totalAmount.toFixed(2)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingId(editingId === purchase.id ? null : purchase.id)}
                >
                  {editingId === purchase.id ? "Cancel" : "Edit"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={deletingId === purchase.id}
                  onClick={() => deletePurchase(purchase.id)}
                  className="text-destructive hover:text-destructive"
                >
                  {deletingId === purchase.id ? "…" : "Delete"}
                </Button>
              </div>
            </div>

            {editingId === purchase.id && (
              <EditForm
                purchase={purchase}
                onSaved={() => { setEditingId(null); router.refresh(); }}
                onCancel={() => setEditingId(null)}
              />
            )}

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
