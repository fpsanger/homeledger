"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { MoreHorizontal, ShoppingBag, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { DropdownMenu } from "@/components/ui/dropdown-menu";

type Person = { id: string; name: string };
type Category = { id: string; name: string; parentId: string | null; path: string };
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
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

type Props = {
  people: Person[];
  purchases: Purchase[];
  currentPersonId: string;
  isGlobalLocked?: boolean;
};

type EditState = {
  description: string;
  totalAmount: string;
  purchaseDate: string;
  creditCardId: string;
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function EditForm({
  purchase,
  onSaved,
  onCancel,
}: {
  purchase: Purchase;
  onSaved: () => void;
  onCancel: () => void;
}) {
  function resolveInitialCategory(categoryId: string | null, cats: Category[]) {
    if (!categoryId) return { parentCategoryId: "", subCategoryId: "" };
    const cat = cats.find((c) => c.id === categoryId);
    if (!cat) return { parentCategoryId: categoryId, subCategoryId: "" };
    if (cat.parentId) return { parentCategoryId: cat.parentId, subCategoryId: cat.id };
    return { parentCategoryId: cat.id, subCategoryId: "" };
  }

  const [form, setForm] = useState<EditState>({
    description: purchase.description,
    totalAmount: String(purchase.totalAmount),
    purchaseDate: purchase.purchaseDate.split("T")[0],
    creditCardId: purchase.creditCardId ?? "",
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [parentCategoryId, setParentCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");

  async function loadOptions() {
    if (loaded) return;
    const [catRes, ccRes] = await Promise.all([
      fetch("/api/categories"),
      fetch("/api/credit-cards"),
    ]);
    if (catRes.ok) {
      const d = await catRes.json();
      const cats: Category[] = d.categories ?? [];
      setCategories(cats);
      const resolved = resolveInitialCategory(purchase.categoryId ?? null, cats);
      setParentCategoryId(resolved.parentCategoryId);
      setSubCategoryId(resolved.subCategoryId);
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
    setLoading(true);
    const subCategories = categories.filter((c) => c.parentId === parentCategoryId);
    const selectedParentHasChildren = subCategories.length > 0;
    const resolvedCategoryId = selectedParentHasChildren ? subCategoryId : parentCategoryId;

    const res = await fetch(`/api/credit-card-purchases/${purchase.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: form.description,
        totalAmount: parseFloat(form.totalAmount),
        purchaseDate: form.purchaseDate,
        categoryId: resolvedCategoryId || null,
        creditCardId: form.creditCardId || null,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Falha ao salvar.");
      return;
    }
    toast.success("Parcelamento atualizado.");
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {field("ep-desc", "Descrição",
        <Input id="ep-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Opcional" />
      )}
      {field("ep-amount", "Valor Total",
        <CurrencyInput id="ep-amount" value={form.totalAmount} onChange={(v) => setForm((f) => ({ ...f, totalAmount: v }))} required />
      )}
      {field("", "Data da Compra",
        <DatePicker value={form.purchaseDate} onChange={(v) => setForm((f) => ({ ...f, purchaseDate: v }))} required />
      )}
      {field("ep-card", "Cartão de Crédito",
        <Select id="ep-card" value={form.creditCardId} onChange={(e) => setForm((f) => ({ ...f, creditCardId: e.target.value }))}>
          <option value="">Nenhum</option>
          {creditCards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      )}
      {(() => {
        const rootCategories = categories.filter((c) => c.parentId === null);
        const subCategories = categories.filter((c) => c.parentId === parentCategoryId);
        const selectedParentHasChildren = subCategories.length > 0;
        return (
          <>
            {field("ep-cat", "Categoria",
              <Select id="ep-cat" value={parentCategoryId} onChange={(e) => { setParentCategoryId(e.target.value); setSubCategoryId(""); }}>
                <option value="">Nenhuma</option>
                {rootCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            )}
            {selectedParentHasChildren && field("ep-subcat", "Subcategoria",
              <Select id="ep-subcat" value={subCategoryId} onChange={(e) => setSubCategoryId(e.target.value)} required>
                <option value="">Selecione a subcategoria</option>
                {subCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            )}
          </>
        );
      })()}
      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" disabled={loading}>{loading ? "Salvando…" : "Salvar"}</Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}

function InstallmentStatusBadge({ inst }: { inst: Installment }) {
  if (inst.isCanceled)
    return <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 text-xs">Cancelado</Badge>;
  if (inst.isPaid)
    return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">Pago</Badge>;
  return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">Pendente</Badge>;
}

function ProgressBar({ paid, total }: { paid: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((paid / total) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground shrink-0">{paid}/{total}</span>
    </div>
  );
}

const PAGE_SIZE = 8;

export function InstallmentsList({ people, purchases, currentPersonId, isGlobalLocked = false }: Props) {
  const router = useRouter();
  const [showCanceled, setShowCanceled] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  function handlePersonChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const pid = e.target.value;
    const params = new URLSearchParams();
    if (pid) params.set("personId", pid);
    router.push(`/installments${params.size ? `?${params.toString()}` : ""}`);
  }

  async function markPaid(installmentId: string) {
    setPendingId(installmentId);
    const res = await fetch(`/api/installments/${installmentId}/paid`, { method: "PATCH" });
    setPendingId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Falha ao marcar parcela como paga.");
      return;
    }
    router.refresh();
    toast.success("Parcelamento atualizado.");
  }

  async function deletePurchase(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/credit-card-purchases/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Falha ao excluir.");
      return;
    }
    router.refresh();
    toast.success("Parcelamento atualizado.");
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Edit dialog */}
      <Dialog
        open={!!editingPurchase}
        onClose={() => setEditingPurchase(null)}
        title="Editar compra parcelada"
      >
        {editingPurchase && (
          <EditForm
            purchase={editingPurchase}
            onSaved={() => { setEditingPurchase(null); router.refresh(); }}
            onCancel={() => setEditingPurchase(null)}
          />
        )}
      </Dialog>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="person-filter">Pessoa</Label>
          {isGlobalLocked ? (
            <span className="text-sm text-muted-foreground px-2 py-1 border rounded-md bg-muted/40 w-40 truncate">
              {people.find((p) => p.id === currentPersonId)?.name ?? "Todas as pessoas"}
            </span>
          ) : (
            <Select id="person-filter" value={currentPersonId} onChange={handlePersonChange}>
              <option value="">Todas as pessoas</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          )}
        </div>
        <div className="flex items-center gap-2 mt-5">
          <input
            id="show-canceled"
            type="checkbox"
            checked={showCanceled}
            onChange={(e) => setShowCanceled(e.target.checked)}
          />
          <label htmlFor="show-canceled" className="text-sm">Mostrar cancelados</label>
        </div>
      </div>

      {/* Empty state */}
      {purchases.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground border rounded-lg">
          <ShoppingBag className="w-10 h-10 opacity-25" />
          <p className="text-sm font-medium">Nenhuma compra parcelada encontrada</p>
          <p className="text-xs">Adicione uma compra parcelada para visualizá-la aqui.</p>
        </div>
      )}

      {/* Purchase cards */}
      {purchases.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((purchase) => {
        const activeInstallments = purchase.installments.filter((i) => !i.isCanceled);
        const paidCount = activeInstallments.filter((i) => i.isPaid).length;
        const pendingInstallments = activeInstallments
          .filter((i) => !i.isPaid)
          .sort((a, b) => a.dueYear !== b.dueYear ? a.dueYear - b.dueYear : a.dueMonth - b.dueMonth);
        const amountPaid = activeInstallments.filter((i) => i.isPaid).reduce((s, i) => s + i.amount, 0);
        const amountRemaining = pendingInstallments.reduce((s, i) => s + i.amount, 0);
        const nextInstallment = pendingInstallments[0];
        const visibleInstallments = purchase.installments.filter((i) => showCanceled || !i.isCanceled);
        const isExpanded = expandedId === purchase.id;

        return (
          <Card key={purchase.id} className="overflow-hidden">
            {/* Purchase header */}
            <div className="px-5 py-4 flex flex-col gap-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <p className="font-semibold text-sm truncate">{purchase.description || "Sem descrição"}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(purchase.purchaseDate).toLocaleDateString("pt-BR")} · {purchase.numberOfInstallments}x · {formatCurrency(purchase.totalAmount)}
                  </p>
                </div>
                <DropdownMenu
                  align="right"
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground"
                      aria-label="Ações"
                      disabled={deletingId === purchase.id}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  }
                  items={[
                    {
                      label: "Editar",
                      onClick: () => setEditingPurchase(purchase),
                    },
                    {
                      label: deletingId === purchase.id ? "Excluindo…" : "Excluir",
                      onClick: () => deletePurchase(purchase.id),
                      variant: "destructive",
                    },
                  ]}
                />
              </div>

              {/* Progress bar */}
              <ProgressBar paid={paidCount} total={activeInstallments.length} />

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-semibold text-sm">{formatCurrency(purchase.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pago</p>
                  <p className="font-semibold text-sm text-green-700">{formatCurrency(amountPaid)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Restante</p>
                  <p className="font-semibold text-sm text-amber-700">{formatCurrency(amountRemaining)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Próxima parcela</p>
                  {nextInstallment ? (
                    <p className="font-semibold text-sm">
                      {MONTH_NAMES[nextInstallment.dueMonth - 1]}/{nextInstallment.dueYear} · {formatCurrency(nextInstallment.amount)}
                    </p>
                  ) : (
                    <p className="font-semibold text-sm text-green-700">Quitado</p>
                  )}
                </div>
              </div>

              {/* Expand toggle */}
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : purchase.id)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
              >
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {isExpanded ? "Ocultar parcelas" : `Ver parcelas (${visibleInstallments.length})`}
              </button>
            </div>

            {/* Installments detail (expanded) */}
            {isExpanded && (
              <div className="border-t">
                {visibleInstallments.length === 0 ? (
                  <p className="text-sm text-muted-foreground px-5 py-3">Nenhuma parcela a exibir.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground border-b bg-muted/20">
                        <th className="px-5 py-2 font-medium text-xs">#</th>
                        <th className="px-5 py-2 font-medium text-xs">Vencimento</th>
                        <th className="px-5 py-2 font-medium text-xs">Valor</th>
                        <th className="px-5 py-2 font-medium text-xs">Status</th>
                        <th className="px-5 py-2 font-medium text-xs" />
                      </tr>
                    </thead>
                    <tbody>
                      {visibleInstallments.map((inst) => (
                        <tr key={inst.id} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                          <td className="px-5 py-2.5 text-xs text-muted-foreground">{inst.installmentNumber}</td>
                          <td className="px-5 py-2.5 text-xs">{MONTH_NAMES[inst.dueMonth - 1]}/{inst.dueYear}</td>
                          <td className="px-5 py-2.5 text-xs font-medium">{formatCurrency(inst.amount)}</td>
                          <td className="px-5 py-2.5"><InstallmentStatusBadge inst={inst} /></td>
                          <td className="px-5 py-2.5 text-right">
                            {!inst.isPaid && !inst.isCanceled && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={pendingId === inst.id}
                                onClick={() => markPaid(inst.id)}
                                className="h-7 text-xs"
                              >
                                {pendingId === inst.id ? "Salvando…" : "Marcar pago"}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </Card>
        );
      })}

      {/* Pagination */}
      {purchases.length > PAGE_SIZE && (
        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            {page + 1} / {Math.ceil(purchases.length / PAGE_SIZE)}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={(page + 1) * PAGE_SIZE >= purchases.length}
            onClick={() => setPage((p) => p + 1)}
          >
            Próximo →
          </Button>
        </div>
      )}
    </div>
  );
}
