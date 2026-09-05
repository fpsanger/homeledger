"use client";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useInstallmentFilters } from "@/hooks/useInstallmentFilters";
import { CardInstallmentTableDesktop } from "./BillInstallmentTableDesktop";
import { CardInstallmentTableMobile } from "./BillInstallmentTableMobile";
import type { BillInstallmentItem, RefundItem } from "./BillView.types";

export function CardInstallmentTable({
  installments,
  refunds,
  personMap,
  categoryMap,
  onEdit,
  onDelete,
  deletingId,
  onDeleteRefund,
  deletingRefundId,
}: {
  installments: BillInstallmentItem[];
  refunds: RefundItem[];
  personMap: Map<string, string>;
  categoryMap: Map<string, string>;
  onEdit: (purchaseId: string) => void;
  onDelete: (purchaseId: string) => void;
  deletingId: string | null;
  onDeleteRefund: (refundId: string) => void;
  deletingRefundId: string | null;
}) {
  const {
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
  } = useInstallmentFilters(installments, categoryMap);

  const sharedProps = {
    sorted,
    refunds,
    personMap,
    categoryMap,
    onEdit,
    onDelete,
    deletingId,
    onDeleteRefund,
    deletingRefundId,
  };

  return (
    <>
      {/* Filters */}
      <div className="px-5 py-2 border-b flex gap-2 flex-wrap">
        <Input
          placeholder="Buscar descrição..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-7 w-full sm:w-44 text-xs"
        />
        {usedCategories.length > 1 && (
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-7 w-40 text-xs"
          >
            <option value="">Todas categorias</option>
            {usedCategories.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </Select>
        )}
        <DatePicker
          value={dateFrom}
          onChange={setDateFrom}
          placeholder="Data"
          className="h-7 w-36 text-xs"
        />
        <Input
          type="number"
          placeholder="Valor mín"
          value={amountMin}
          onChange={(e) => setAmountMin(e.target.value)}
          className="h-7 w-28 text-xs"
          min={0}
        />
        {(search || categoryFilter || dateFrom || amountMin) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground"
            onClick={() => {
              setSearch("");
              setCategoryFilter("");
              setDateFrom("");
              setAmountMin("");
            }}
          >
            Limpar ×
          </Button>
        )}
      </div>

      <div className="hidden md:block">
        <CardInstallmentTableDesktop
          {...sharedProps}
          sortKey={sortKey}
          sortDir={sortDir}
          toggleSort={toggleSort}
        />
      </div>
      <div className="md:hidden">
        <CardInstallmentTableMobile
          {...sharedProps}
          sortKey={sortKey}
          setSortKey={setSortKey}
          sortDir={sortDir}
          setSortDir={setSortDir}
        />
      </div>
    </>
  );
}
