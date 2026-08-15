"use client";

import { Plus, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { InstallmentTable } from "@/components/monthly-view/InstallmentTable";
import { MonthNav } from "@/components/monthly-view/MonthNav";
import { SummaryCard } from "@/components/monthly-view/SummaryCard";
import { TransactionTable } from "@/components/monthly-view/TransactionTable";
import { Button } from "@/components/ui/button";
import { CategoryCombobox } from "@/components/ui/category-combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog } from "@/components/ui/dialog";
import { FilterGroup } from "@/components/ui/filter-group";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { InvestmentForm } from "./InvestmentForm";
import { RecurringTransactionForm } from "./RecurringTransactionForm";
import {
  EditInstallmentDialog,
  EditPurchaseDialog,
  EditTransactionDialog,
} from "./TransactionEditDialogs";
import type { Category, CreditCard, Installment, Person, Transaction } from "./types";
import { UnifiedTransactionForm } from "./UnifiedTransactionForm";

type Props = {
  year: number;
  month: number;
  people: Person[];
  currentPersonId?: string;
  categories: Category[];
  creditCards: CreditCard[];
  transactions: Transaction[];
  installments: Installment[];
};

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Dinheiro",
  DEBIT_CARD: "Débito",
  CREDIT_CARD: "Crédito",
  PIX: "PIX",
  BANK_TRANSFER: "Transferência",
  BOLETO: "Boleto",
  ACCOUNT_DEBIT: "Déb. Conta",
};

function computeHasActiveFilters(filters: {
  search: string;
  categoryFilter: string;
  paymentFilter: string;
  statusFilter: string;
  dateFrom: string;
  amountMin: string;
}): boolean {
  return (
    filters.search !== "" ||
    filters.categoryFilter !== "" ||
    filters.paymentFilter !== "" ||
    filters.statusFilter !== "" ||
    filters.dateFrom !== "" ||
    filters.amountMin !== ""
  );
}

export function TransactionPageClient({
  year,
  month,
  people,
  currentPersonId = "",
  categories,
  creditCards,
  transactions,
  installments,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [recurringDialogOpen, setRecurringDialogOpen] = useState(false);
  const [investmentDialogOpen, setInvestmentDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingInstallment, setEditingInstallment] = useState<Installment | null>(null);
  const [editingPurchase, setEditingPurchase] = useState<Installment | null>(null);

  // Shared filters (affect both tables)
  const [dateFrom, setDateFrom] = useState("");
  const [amountMin, setAmountMin] = useState("");

  // Transaction-only filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");

  // Installment-only filters
  const [statusFilter, setStatusFilter] = useState("");

  const hasActiveFilters = computeHasActiveFilters({
    search,
    categoryFilter,
    paymentFilter,
    statusFilter,
    dateFrom,
    amountMin,
  });

  function clearAllFilters() {
    setSearch("");
    setCategoryFilter("");
    setPaymentFilter("");
    setStatusFilter("");
    setDateFrom("");
    setAmountMin("");
  }

  const paymentMethods = useMemo(() => {
    const seen = new Set<string>();
    for (const t of transactions) if (t.paymentMethod) seen.add(t.paymentMethod);
    return Array.from(seen);
  }, [transactions]);

  const usedParentCategories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const t of transactions) {
      if (!t.categoryId) continue;
      const cat = categories.find((c) => c.id === t.categoryId);
      if (!cat) continue;
      const parentId = cat.parentId ?? cat.id;
      if (!seen.has(parentId)) {
        const parent = categories.find((c) => c.id === parentId);
        seen.set(parentId, parent?.name ?? cat.name);
      }
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name, parentId: null }));
  }, [transactions, categories]);

  const transactionFilters = { search, categoryFilter, paymentFilter, dateFrom, amountMin };
  const installmentFilters = { statusFilter, dateFrom, amountMin };

  const hasInstallments = installments.length > 0;

  const combinedIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((s, t) => s + t.amount, 0);
  const combinedExpenses =
    transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0) +
    installments.reduce((s, i) => s + i.amount, 0);
  const combinedBalance = combinedIncome - combinedExpenses;

  function fmtCurrency(amount: number) {
    return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <MonthNav year={year} month={month} basePath="/transactions" />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setRecurringDialogOpen(true)}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Recorrente
          </Button>
          <Button
            variant="outline"
            onClick={() => setInvestmentDialogOpen(true)}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Investimento
          </Button>
          <Button onClick={() => setDialogOpen(true)} className="gap-1.5">
            <Plus className="w-4 h-4" />
            Adicionar Transação
          </Button>
        </div>
      </div>

      <Dialog
        open={recurringDialogOpen}
        onClose={() => setRecurringDialogOpen(false)}
        title="Adicionar Transação Recorrente"
      >
        <RecurringTransactionForm
          people={people}
          categories={categories}
          defaultPersonId={currentPersonId}
          onSuccess={() => setRecurringDialogOpen(false)}
        />
      </Dialog>

      <Dialog
        open={investmentDialogOpen}
        onClose={() => setInvestmentDialogOpen(false)}
        title="Adicionar Investimento"
      >
        <InvestmentForm
          people={people}
          categories={categories}
          defaultPersonId={currentPersonId}
          onSuccess={() => setInvestmentDialogOpen(false)}
        />
      </Dialog>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Adicionar Transação">
        <UnifiedTransactionForm
          people={people}
          categories={categories}
          creditCards={creditCards}
          defaultPersonId={currentPersonId}
          onSuccess={() => setDialogOpen(false)}
        />
      </Dialog>

      <EditTransactionDialog
        transaction={editingTransaction}
        people={people}
        categories={categories}
        creditCards={creditCards}
        onClose={() => setEditingTransaction(null)}
      />

      <EditInstallmentDialog
        installment={editingInstallment}
        people={people}
        creditCards={creditCards}
        onClose={() => setEditingInstallment(null)}
      />

      <EditPurchaseDialog
        purchase={editingPurchase}
        people={people}
        categories={categories}
        creditCards={creditCards}
        onClose={() => setEditingPurchase(null)}
      />

      {/* Unified filters */}
      <FilterGroup hasActiveFilters={hasActiveFilters} onClear={clearAllFilters}>
        <FilterGroup.Section label="Transações">
          <Input
            placeholder="Buscar descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-48 text-sm"
          />
          {usedParentCategories.length > 0 && (
            <CategoryCombobox
              categories={usedParentCategories}
              value={categoryFilter}
              onChange={setCategoryFilter}
              placeholder="Todas categorias"
              className="h-8 w-44 text-sm"
            />
          )}
          {paymentMethods.length > 0 && (
            <Select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="h-8 w-40 text-sm"
            >
              <option value="">Todos métodos</option>
              {paymentMethods.map((pm) => (
                <option key={pm} value={pm}>
                  {PAYMENT_LABELS[pm] ?? pm}
                </option>
              ))}
            </Select>
          )}
        </FilterGroup.Section>

        {hasInstallments && (
          <FilterGroup.Section label="Parcelas">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 w-40 text-sm"
            >
              <option value="">Todos status</option>
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
            </Select>
          </FilterGroup.Section>
        )}

        <FilterGroup.Section label="Ambos">
          <DatePicker
            value={dateFrom}
            onChange={setDateFrom}
            placeholder="Data"
            className="h-8 w-36 text-sm"
          />
          <Input
            type="number"
            placeholder="Valor mín"
            value={amountMin}
            onChange={(e) => setAmountMin(e.target.value)}
            className="h-8 w-28 text-sm"
            min={0}
          />
        </FilterGroup.Section>
      </FilterGroup>

      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Resumo do mês
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <SummaryCard
            icon={TrendingUp}
            label="Receitas"
            value={combinedIncome > 0 ? `+${fmtCurrency(combinedIncome)}` : fmtCurrency(0)}
            colorClass="text-green-600"
          />
          <SummaryCard
            icon={TrendingDown}
            label="Despesas"
            value={`-${fmtCurrency(combinedExpenses)}`}
            colorClass="text-red-600"
          />
          <SummaryCard
            icon={Wallet}
            label="Saldo"
            value={`${combinedBalance >= 0 ? "+" : "-"}${fmtCurrency(Math.abs(combinedBalance))}`}
            colorClass={combinedBalance >= 0 ? "text-green-700" : "text-red-700"}
          />
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Transações
            {transactions.length > 0 && (
              <span className="ml-2 text-xs font-medium bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">
                {transactions.length}
              </span>
            )}
          </h2>
          <TransactionTable
            transactions={transactions}
            people={people}
            categories={categories}
            filters={transactionFilters}
            onEdit={(t) => setEditingTransaction(t)}
          />
        </div>

        {hasInstallments && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Parcelas
              <span className="ml-2 text-xs font-medium bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">
                {installments.length}
              </span>
            </h2>
            <InstallmentTable
              installments={[...installments].sort((a, b) => {
                const da = new Date(a.purchaseDate ?? 0).getTime();
                const db = new Date(b.purchaseDate ?? 0).getTime();
                return db - da;
              })}
              people={people}
              creditCards={creditCards}
              filters={installmentFilters}
              onEditInstallment={(inst) => setEditingInstallment(inst)}
              onEditPurchase={(inst) => setEditingPurchase(inst)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
