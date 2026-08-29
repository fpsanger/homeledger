import { useMemo, useState } from "react";
import type {
  BillInstallmentItem,
  BillSortDir,
  BillSortKey,
} from "@/components/credit-cards/BillView.types";

export function useInstallmentFilters(
  installments: BillInstallmentItem[],
  categoryMap: Map<string, string>,
) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [sortKey, setSortKey] = useState<BillSortKey | null>(null);
  const [sortDir, setSortDir] = useState<BillSortDir>("asc");

  function toggleSort(key: BillSortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const usedCategories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const i of installments) {
      if (i.categoryId) seen.set(i.categoryId, categoryMap.get(i.categoryId) ?? i.categoryId);
    }
    return Array.from(seen.entries());
  }, [installments, categoryMap]);

  const filtered = useMemo(() => {
    const fromMs = dateFrom ? new Date(dateFrom).getTime() : null;
    const minAmt = amountMin !== "" ? parseFloat(amountMin) : null;
    return installments.filter((i) => {
      if (search && !i.purchaseDescription.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (categoryFilter && i.categoryId !== categoryFilter) return false;
      if (fromMs !== null && new Date(i.purchaseDate).getTime() < fromMs) return false;
      if (minAmt !== null && i.amount < minAmt) return false;
      return true;
    });
  }, [installments, search, categoryFilter, dateFrom, amountMin]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sortKey === "description")
      arr.sort((a, b) => {
        const d = a.purchaseDescription.localeCompare(b.purchaseDescription);
        return sortDir === "asc" ? d : -d;
      });
    else if (sortKey === "amount")
      arr.sort((a, b) => {
        const d = a.amount - b.amount;
        return sortDir === "asc" ? d : -d;
      });
    else if (sortKey === "date")
      arr.sort((a, b) => {
        const d = new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime();
        return sortDir === "asc" ? d : -d;
      });
    return arr;
  }, [filtered, sortKey, sortDir]);

  return {
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
    dateFrom,
    setDateFrom,
    amountMin,
    setAmountMin,
    sortKey,
    setSortKey,
    sortDir,
    setSortDir,
    toggleSort,
    usedCategories,
    sorted,
  };
}
