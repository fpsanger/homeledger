"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Package,
  Receipt,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

type Person = { id: string; name: string };
type Category = { id: string; name: string; path: string };

type BillInstallmentItem = {
  id: string;
  creditCardPurchaseId: string;
  installmentNumber: number;
  amount: number;
  dueYear: number;
  dueMonth: number;
  isPaid: boolean;
  isCanceled: boolean;
  purchaseDescription: string;
  personId: string;
  categoryId: string | null;
  numberOfInstallments: number;
  purchaseDate: string;
};

type BillEntry = {
  card: { id: string; name: string };
  dueDayOfMonth: number;
  installments: BillInstallmentItem[];
  total: number;
};

function formatMonth(year: number, month: number) {
  return new Date(year, month - 1).toLocaleString("pt-BR", { month: "long", year: "numeric" });
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

function SummaryCard({
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

type BillViewProps = {
  initialPersonId?: string;
};

export function BillView({ initialPersonId = "" }: BillViewProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [bill, setBill] = useState<BillEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [paying, setPaying] = useState<Set<string>>(new Set());
  const [unpaying, setUnpaying] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([
      fetch("/api/people").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]).then(([pd, cd]) => {
      setPeople(pd.people ?? []);
      setCategories(cd.categories ?? []);
    });
  }, []);

  async function load(y: number, m: number, pid: string) {
    setLoading(true);
    const params = new URLSearchParams({ year: String(y), month: String(m) });
    if (pid) params.set("personId", pid);
    const res = await fetch(`/api/credit-cards/bill?${params}`);
    if (res.ok) {
      const data = await res.json();
      setBill(data.bill);
    }
    setLoading(false);
  }

  useEffect(() => {
    load(year, month, initialPersonId);
  }, [year, month, initialPersonId]);

  function prev() {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else setMonth((m) => m - 1);
  }
  function next() {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else setMonth((m) => m + 1);
  }

  async function payFatura(cardId: string, installments: BillInstallmentItem[]) {
    const ids = installments.filter((i) => !i.isPaid && !i.isCanceled).map((i) => i.id);
    if (ids.length === 0) return;
    setPaying((prev) => new Set(prev).add(cardId));
    setBill((prev) =>
      prev.map((entry) =>
        entry.card.id === cardId
          ? {
              ...entry,
              installments: entry.installments.map((i) =>
                ids.includes(i.id) ? { ...i, isPaid: true } : i,
              ),
            }
          : entry,
      ),
    );
    try {
      const res = await fetch("/api/installments/bulk-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error("Erro ao pagar fatura");
      toast.success("Fatura paga com sucesso.");
    } catch {
      setBill((prev) =>
        prev.map((entry) =>
          entry.card.id === cardId
            ? {
                ...entry,
                installments: entry.installments.map((i) =>
                  ids.includes(i.id) ? { ...i, isPaid: false } : i,
                ),
              }
            : entry,
        ),
      );
      toast.error("Erro ao pagar fatura.");
    } finally {
      setPaying((prev) => {
        const next = new Set(prev);
        next.delete(cardId);
        return next;
      });
    }
  }

  async function unpayFatura(cardId: string, installments: BillInstallmentItem[]) {
    const ids = installments.filter((i) => i.isPaid && !i.isCanceled).map((i) => i.id);
    if (ids.length === 0) return;
    setUnpaying((prev) => new Set(prev).add(cardId));
    setBill((prev) =>
      prev.map((entry) =>
        entry.card.id === cardId
          ? {
              ...entry,
              installments: entry.installments.map((i) =>
                ids.includes(i.id) ? { ...i, isPaid: false } : i,
              ),
            }
          : entry,
      ),
    );
    try {
      const res = await fetch("/api/installments/bulk-unpaid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error("Erro ao estornar fatura");
      toast.success("Fatura estornada com sucesso.");
    } catch {
      setBill((prev) =>
        prev.map((entry) =>
          entry.card.id === cardId
            ? {
                ...entry,
                installments: entry.installments.map((i) =>
                  ids.includes(i.id) ? { ...i, isPaid: true } : i,
                ),
              }
            : entry,
        ),
      );
      toast.error("Erro ao estornar fatura.");
    } finally {
      setUnpaying((prev) => {
        const next = new Set(prev);
        next.delete(cardId);
        return next;
      });
    }
  }

  function toggleCollapse(cardId: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  }

  const personMap = new Map(people.map((p) => [p.id, p.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, c.path]));
  const totalBill = bill.reduce((sum, e) => sum + e.total, 0);
  const totalItems = bill.reduce((sum, e) => sum + e.installments.length, 0);
  const uniquePeople = new Set(bill.flatMap((e) => e.installments.map((i) => i.personId))).size;

  return (
    <div className="flex flex-col gap-6">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="outline" size="sm" onClick={prev}>
          ←
        </Button>
        <span className="font-medium capitalize">{formatMonth(year, month)}</span>
        <Button variant="outline" size="sm" onClick={next}>
          →
        </Button>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Carregando…</p>}

      {!loading && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryCard
              icon={<Receipt className="w-5 h-5" />}
              label="Total da fatura"
              value={formatCurrency(totalBill)}
            />
            <SummaryCard
              icon={<CreditCard className="w-5 h-5" />}
              label="Cartões"
              value={String(bill.length)}
            />
            <SummaryCard
              icon={<Package className="w-5 h-5" />}
              label="Parcelas"
              value={String(totalItems)}
            />
            <SummaryCard
              icon={<Users className="w-5 h-5" />}
              label="Pessoas"
              value={String(uniquePeople)}
            />
          </div>

          {/* Empty state */}
          {bill.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground border rounded-lg">
              <CreditCard className="w-10 h-10 opacity-25" />
              <p className="text-sm font-medium">Nenhuma parcela de cartão neste mês</p>
              <p className="text-xs">Tente navegar para outro mês ou remover o filtro de pessoa.</p>
            </div>
          )}

          {/* Card groups */}
          {bill.map((entry) => {
            const isOpen = !collapsed.has(entry.card.id);
            const activeParcelas = entry.installments.filter((i) => !i.isCanceled);
            const allPaid = activeParcelas.length > 0 && activeParcelas.every((i) => i.isPaid);
            return (
              <Collapsible
                key={entry.card.id}
                open={isOpen}
                onOpenChange={() => toggleCollapse(entry.card.id)}
              >
                <Card className={`overflow-hidden${allPaid ? " ring-1 ring-green-500" : ""}`}>
                  {/* Card header */}
                  <CollapsibleTrigger
                    className={`no-active-scale w-full rounded-none flex items-center justify-between px-5 py-4 border-b transition-colors text-left ${
                      allPaid
                        ? "bg-green-50 hover:bg-green-100 border-green-200 dark:bg-green-950 dark:hover:bg-green-900 dark:border-green-800"
                        : "bg-muted/30 hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{entry.card.name}</p>
                          {allPaid && (
                            <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Paga
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Vence: dia {entry.dueDayOfMonth}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {entry.installments.some((i) => !i.isPaid && !i.isCanceled) && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={paying.has(entry.card.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            payFatura(entry.card.id, entry.installments);
                          }}
                        >
                          {paying.has(entry.card.id) ? "Pagando…" : "Pagar fatura"}
                        </Button>
                      )}
                      {entry.installments.some((i) => i.isPaid && !i.isCanceled) && (
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={unpaying.has(entry.card.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            unpayFatura(entry.card.id, entry.installments);
                          }}
                        >
                          {unpaying.has(entry.card.id) ? "Estornando…" : "Estornar fatura"}
                        </Button>
                      )}
                      <div className="text-right">
                        <p className="font-semibold text-sm">{formatCurrency(entry.total)}</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.installments.length}{" "}
                          {entry.installments.length === 1 ? "item" : "itens"}
                        </p>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    {/* Desktop table */}
                    <div className="hidden sm:block">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-muted-foreground border-b">
                            <th className="px-5 py-2.5 font-medium text-xs">Compra</th>
                            <th className="px-5 py-2.5 font-medium text-xs">Parcela</th>
                            <th className="px-5 py-2.5 font-medium text-xs">Pessoa</th>
                            <th className="px-5 py-2.5 font-medium text-xs">Categoria</th>
                            <th className="px-5 py-2.5 font-medium text-xs text-right">Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entry.installments.map((inst) => (
                            <tr
                              key={inst.id}
                              className={`border-b last:border-0 transition-colors${inst.isPaid ? " bg-green-50 dark:bg-green-900/10 hover:bg-green-100" : " hover:bg-muted/20"}`}
                            >
                              <td className="px-5 py-3">
                                <p className="font-medium text-sm">
                                  {inst.purchaseDescription || "Sem descrição"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(inst.purchaseDate)}
                                </p>
                              </td>
                              <td className="px-5 py-3">
                                <Badge variant="outline" className="font-mono text-xs">
                                  {inst.installmentNumber}/{inst.numberOfInstallments}
                                </Badge>
                              </td>
                              <td className="px-5 py-3 text-sm text-muted-foreground">
                                {personMap.get(inst.personId) ?? "—"}
                              </td>
                              <td className="px-5 py-3 text-sm text-muted-foreground">
                                {inst.categoryId ? (categoryMap.get(inst.categoryId) ?? "—") : "—"}
                              </td>
                              <td className="px-5 py-3 text-right font-medium text-sm">
                                {formatCurrency(inst.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="sm:hidden flex flex-col divide-y">
                      {entry.installments.map((inst) => (
                        <div key={inst.id} className="px-4 py-3 flex flex-col gap-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-sm">
                              {inst.purchaseDescription || "Sem descrição"}
                            </p>
                            <p className="font-semibold text-sm shrink-0">
                              {formatCurrency(inst.amount)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="font-mono text-xs">
                              {inst.installmentNumber}/{inst.numberOfInstallments}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {personMap.get(inst.personId) ?? "—"}
                            </span>
                            {inst.categoryId && (
                              <span className="text-xs text-muted-foreground">
                                {categoryMap.get(inst.categoryId)}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatDate(inst.purchaseDate)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </>
      )}
    </div>
  );
}
