"use client";

import { CreditCard, Package, Plus, Receipt, Users } from "lucide-react";
import { CreditCardRefundForm } from "@/components/credit-cards/CreditCardRefundForm";
import { UnifiedTransactionForm } from "@/components/transactions/UnifiedTransactionForm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useBillData } from "@/hooks/useBillData";
import { formatAmountBR } from "@/lib/utils";
import { CardHeaderRow as BillCardHeaderRow } from "./BillCardHeaderRow";
import { CardInstallmentTable } from "./BillInstallmentTable";
import { SummaryCard, useMaskedCurrency } from "./BillSummaryCard";
import { formatMonth, isCardFullyPaid } from "./BillView.helpers";

export type { BillInstallmentItem, BillSortDir, BillSortKey } from "./BillView.types";

const SUMMARY_SKELETONS = ["a", "b", "c", "d"];
const ROW_SKELETONS = ["a", "b", "c", "d", "e"];

type BillViewProps = {
  initialPersonId?: string;
};

export function BillView({ initialPersonId = "" }: BillViewProps) {
  const formatCurrencyMasked = useMaskedCurrency();
  const today = new Date().toISOString().split("T")[0];
  const {
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
  } = useBillData(initialPersonId);

  return (
    <div className="flex flex-col gap-6">
      {/* Add dialog */}
      <Dialog open={showAdd} onClose={() => setShowAdd(false)} title="Nova transação">
        <UnifiedTransactionForm
          people={people}
          categories={categories}
          creditCards={creditCards}
          allowedTypes={["credit"]}
          initialValues={{
            type: "credit",
            personId: initialPersonId,
            amount: "",
            date: today,
            paymentMethod: "CREDIT_CARD",
            source: "SALARY",
            creditCardId: "",
            categoryId: "",
            description: "",
          }}
          onSuccess={() => {
            setShowAdd(false);
            load(year, month, initialPersonId);
          }}
        />
      </Dialog>

      {/* Add refund dialog */}
      <Dialog open={showAddRefund} onClose={() => setShowAddRefund(false)} title="Novo estorno">
        <CreditCardRefundForm
          people={people}
          categories={categories}
          creditCards={creditCards}
          defaultPersonId={initialPersonId}
          onSuccess={() => {
            setShowAddRefund(false);
            load(year, month, initialPersonId);
          }}
        />
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={!!editingPurchase}
        onClose={() => setEditingPurchaseId(null)}
        title="Editar compra"
      >
        {editingPurchase && (
          <UnifiedTransactionForm
            people={people}
            categories={categories}
            creditCards={creditCards}
            editMode={{ purchaseId: editingPurchase.id }}
            initialValues={{
              type: "credit",
              personId: editingPurchase.personId,
              amount: formatAmountBR(editingPurchase.totalAmount),
              date: editingPurchase.purchaseDate.toString().split("T")[0],
              paymentMethod: "CREDIT_CARD",
              source: "SALARY",
              creditCardId: editingPurchase.creditCardId ?? "",
              categoryId: editingPurchase.categoryId ?? "",
              description: editingPurchase.description,
            }}
            onSuccess={() => {
              setEditingPurchaseId(null);
              load(year, month, initialPersonId);
            }}
          />
        )}
      </Dialog>

      {/* Filters + Nova compra */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={prev}>
            ←
          </Button>
          <span className="font-medium capitalize">{formatMonth(year, month)}</span>
          <Button variant="outline" size="sm" onClick={next}>
            →
          </Button>
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => setShowAddRefund(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Estorno
          </Button>
          <Button size="sm" className="flex-1 sm:flex-none" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Nova compra
          </Button>
        </div>
      </div>

      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SUMMARY_SKELETONS.map((s) => (
              <Skeleton key={s} className="h-20 w-full" />
            ))}
          </div>
          <div className="space-y-2">
            {ROW_SKELETONS.map((s) => (
              <Skeleton key={s} className="h-12 w-full" />
            ))}
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryCard
              icon={<Receipt className="w-5 h-5" />}
              label="Total da fatura"
              value={formatCurrencyMasked(totalBill)}
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
            const allPaid = isCardFullyPaid(entry.installments);
            return (
              <Collapsible
                key={entry.card.id}
                open={isOpen}
                onOpenChange={() => toggleCollapse(entry.card.id)}
              >
                <Card className={`overflow-hidden${allPaid ? " ring-1 ring-green-500" : ""}`}>
                  {/* Card header */}
                  <BillCardHeaderRow
                    entry={entry}
                    isOpen={isOpen}
                    allPaid={allPaid}
                    paying={paying}
                    unpaying={unpaying}
                    onPayFatura={payFatura}
                    onUnpayFatura={unpayFatura}
                  />

                  <CollapsibleContent>
                    <CardInstallmentTable
                      installments={entry.installments}
                      refunds={entry.refunds}
                      personMap={personMap}
                      categoryMap={categoryMap}
                      onEdit={setEditingPurchaseId}
                      onDelete={deletePurchase}
                      deletingId={deletingId}
                      onDeleteRefund={deleteRefund}
                      deletingRefundId={deletingRefundId}
                    />
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
