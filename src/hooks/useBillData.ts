import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type {
  BillEntry,
  BillInstallmentItem,
  Category,
  CreditCardFull,
  Person,
  PurchaseRecord,
} from "@/components/credit-cards/BillView.types";
import { getFullPath } from "@/lib/categoryUtils";

function useBillCatalog() {
  const [people, setPeople] = useState<Person[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCardFull[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/people").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/credit-cards").then((r) => r.json()),
    ]).then(([pd, cd, cc]) => {
      setPeople(pd.people ?? []);
      setCategories(cd.categories ?? []);
      setCreditCards(cc.cards ?? []);
    });
  }, []);

  return { people, categories, creditCards };
}

function useBillPeriod() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

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

  return { year, month, prev, next };
}

function useBillList(year: number, month: number, personId: string) {
  const [bill, setBill] = useState<BillEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (y: number, m: number, pid: string) => {
    setLoading(true);
    const params = new URLSearchParams({ year: String(y), month: String(m) });
    if (pid) params.set("personId", pid);
    const res = await fetch(`/api/credit-cards/bill?${params}`);
    if (res.ok) {
      const data = await res.json();
      setBill(data.bill);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load(year, month, personId);
  }, [year, month, personId, load]);

  return { bill, setBill, loading, load };
}

function useEditingPurchase() {
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);
  const [editingPurchase, setEditingPurchase] = useState<PurchaseRecord | null>(null);

  useEffect(() => {
    if (!editingPurchaseId) {
      setEditingPurchase(null);
      return;
    }
    fetch(`/api/credit-card-purchases/${editingPurchaseId}`)
      .then((r) => r.json())
      .then((d) => setEditingPurchase(d.purchase ?? null));
  }, [editingPurchaseId]);

  return { editingPurchaseId, setEditingPurchaseId, editingPurchase };
}

function usePurchaseMutations(
  load: (y: number, m: number, pid: string) => Promise<void>,
  year: number,
  month: number,
  personId: string,
) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingRefundId, setDeletingRefundId] = useState<string | null>(null);

  async function deletePurchase(purchaseId: string) {
    setDeletingId(purchaseId);
    const res = await fetch(`/api/credit-card-purchases/${purchaseId}`, { method: "DELETE" });
    setDeletingId(null);
    if (!res.ok) {
      toast.error("Falha ao excluir.");
      return;
    }
    toast.success("Compra excluída.");
    load(year, month, personId);
  }

  async function deleteRefund(refundId: string) {
    setDeletingRefundId(refundId);
    const res = await fetch(`/api/credit-card-refunds/${refundId}`, { method: "DELETE" });
    setDeletingRefundId(null);
    if (!res.ok) {
      toast.error("Falha ao excluir estorno.");
      return;
    }
    toast.success("Estorno excluído.");
    load(year, month, personId);
  }

  return { deletingId, deletingRefundId, deletePurchase, deleteRefund };
}

function usePayFatura(setBill: React.Dispatch<React.SetStateAction<BillEntry[]>>) {
  const [paying, setPaying] = useState<Set<string>>(new Set());

  async function payFatura(cardId: string, installments: BillInstallmentItem[]) {
    const ids = installments.filter((i) => !i.isPaid).map((i) => i.id);
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

  return { paying, payFatura };
}

function useUnpayFatura(setBill: React.Dispatch<React.SetStateAction<BillEntry[]>>) {
  const [unpaying, setUnpaying] = useState<Set<string>>(new Set());

  async function unpayFatura(cardId: string, installments: BillInstallmentItem[]) {
    const ids = installments.filter((i) => i.isPaid).map((i) => i.id);
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

  return { unpaying, unpayFatura };
}

function useCollapse() {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  function toggleCollapse(cardId: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  }

  return { collapsed, toggleCollapse };
}

export function useBillData(initialPersonId: string) {
  const { people, categories, creditCards } = useBillCatalog();
  const { year, month, prev, next } = useBillPeriod();
  const { bill, setBill, loading, load } = useBillList(year, month, initialPersonId);
  const { setEditingPurchaseId, editingPurchase } = useEditingPurchase();
  const { deletingId, deletingRefundId, deletePurchase, deleteRefund } = usePurchaseMutations(
    load,
    year,
    month,
    initialPersonId,
  );
  const { paying, payFatura } = usePayFatura(setBill);
  const { unpaying, unpayFatura } = useUnpayFatura(setBill);
  const { collapsed, toggleCollapse } = useCollapse();
  const [showAdd, setShowAdd] = useState(false);
  const [showAddRefund, setShowAddRefund] = useState(false);

  const personMap = new Map(people.map((p) => [p.id, p.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, getFullPath(c.id, categories)]));
  const totalBill = bill.reduce((sum, e) => sum + e.total, 0);
  const totalItems = bill.reduce((sum, e) => sum + e.installments.length, 0);
  const uniquePeople = new Set(bill.flatMap((e) => e.installments.map((i) => i.personId))).size;

  return {
    year,
    month,
    bill,
    loading,
    people,
    categories,
    creditCards,
    collapsed,
    paying,
    unpaying,
    showAdd,
    setShowAdd,
    setEditingPurchaseId,
    editingPurchase,
    deletingId,
    showAddRefund,
    setShowAddRefund,
    deletingRefundId,
    load,
    prev,
    next,
    deletePurchase,
    deleteRefund,
    payFatura,
    unpayFatura,
    toggleCollapse,
    personMap,
    categoryMap,
    totalBill,
    totalItems,
    uniquePeople,
  };
}
