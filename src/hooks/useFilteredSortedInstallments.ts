import { useMemo, useState } from "react";
import type {
  Installment,
  InstallmentFilters,
  SortDir,
  SortKey,
} from "@/components/monthly-view/InstallmentTable.types";
import { toDateMs } from "@/components/monthly-view/InstallmentTable.types";

export function useFilteredSortedInstallments(
  installments: Installment[],
  filters: InstallmentFilters | undefined,
  initialPageSize = 20,
) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function setPageSize(size: number) {
    setPageSizeState(size);
    setPage(0);
  }

  const filtered = useMemo(() => {
    setPage(0);
    if (!filters) return installments;
    const { statusFilter, dateFrom, amountMin } = filters;
    const minAmt = amountMin !== "" ? parseFloat(amountMin) : null;
    const fromMs = dateFrom ? new Date(dateFrom).getTime() : null;
    return installments.filter((i) => {
      if (statusFilter === "paid" && !i.isPaid) return false;
      if (statusFilter === "pending" && i.isPaid) return false;
      const dMs = toDateMs(i.purchaseDate);
      if (fromMs !== null && dMs < fromMs) return false;
      if (minAmt !== null && i.amount < minAmt) return false;
      return true;
    });
  }, [installments, filters]);

  const sortedInstallments = useMemo(() => {
    const arr = [...filtered];
    if (sortKey === "description") {
      arr.sort((a, b) => {
        const d = (a.purchaseDescription ?? "").localeCompare(b.purchaseDescription ?? "");
        return sortDir === "asc" ? d : -d;
      });
    } else if (sortKey === "date") {
      arr.sort((a, b) => {
        const d = toDateMs(a.purchaseDate) - toDateMs(b.purchaseDate);
        return sortDir === "asc" ? d : -d;
      });
    } else if (sortKey === "amount") {
      arr.sort((a, b) => {
        const d = a.amount - b.amount;
        return sortDir === "asc" ? d : -d;
      });
    } else {
      arr.sort((a, b) => toDateMs(b.purchaseDate) - toDateMs(a.purchaseDate));
    }
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sortedInstallments.length / pageSize);
  const paginated = sortedInstallments.slice(page * pageSize, (page + 1) * pageSize);

  return {
    sortKey,
    setSortKey,
    sortDir,
    setSortDir,
    toggleSort,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    sorted: sortedInstallments,
    paginated,
  };
}
