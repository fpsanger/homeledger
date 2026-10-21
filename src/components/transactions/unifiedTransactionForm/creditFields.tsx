import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { MonthPicker } from "@/components/ui/month-picker";
import { Select } from "@/components/ui/select";
import { parseCurrencyBR } from "@/lib/utils";
import {
  type CreditCard,
  computeBillingMonths,
  MONTH_NAMES_PT,
  type SplitRow,
  splitInstallmentCents,
  toCents,
} from "./billing";
import { type Person, SplitPeopleFields } from "./fields";

export function InstallmentCountOptions() {
  return Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
    <option key={n} value={String(n)}>
      {n}x
    </option>
  ));
}

function monthLabel(year: number, month: number): string {
  return `${MONTH_NAMES_PT[month - 1].toLowerCase()}/${year}`;
}

/** Grouped pt-BR currency, so the schedule reads the same as the bill table behind the dialog. */
function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function InstallmentSchedule({
  amount,
  billingMonth,
  numberOfInstallments,
}: {
  amount: string;
  billingMonth: string;
  numberOfInstallments: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const total = parseCurrencyBR(amount);
  const n = parseInt(numberOfInstallments, 10);
  if (!billingMonth || !total || total <= 0 || !n || n < 1) return null;

  const months = computeBillingMonths(total, n, billingMonth);
  const first = months[0];
  const last = months[months.length - 1];
  const { baseCents, lastCents } = splitInstallmentCents(toCents(amount), n);
  const range =
    n === 1
      ? monthLabel(first.dueYear, first.dueMonth)
      : `${monthLabel(first.dueYear, first.dueMonth)} a ${monthLabel(last.dueYear, last.dueMonth)}`;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2 text-xs text-muted-foreground">
        <span id="u-schedule-summary">
          {range}
          {lastCents !== baseCents && ` · última parcela ${formatBRL(last.amount)}`}
        </span>
        {n > 1 && (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            className="shrink-0 underline underline-offset-2 hover:text-foreground transition-colors"
          >
            {expanded ? "ocultar parcelas" : "ver parcelas"}
          </button>
        )}
      </div>
      {expanded && (
        <div className="flex flex-col gap-1">
          {months.map(({ installmentNumber, dueYear, dueMonth, amount: installAmount }) => (
            <div
              key={installmentNumber}
              className="flex justify-between text-xs text-muted-foreground"
            >
              <span>
                Parcela {installmentNumber}/{n}
              </span>
              <span>
                {monthLabel(dueYear, dueMonth)} — {formatBRL(installAmount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function BillingMonthField({
  billingMonth,
  setBillingMonth,
}: {
  billingMonth: string;
  setBillingMonth: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="u-billing-month">Fatura (mês)</Label>
      <MonthPicker id="u-billing-month" value={billingMonth} onChange={setBillingMonth} />
    </div>
  );
}

export function InstallmentAmountFields({
  amount,
  installmentAmount,
  numberOfInstallments,
  billingMonth,
  onTotalChange,
  onInstallmentChange,
  onCountChange,
}: {
  amount: string;
  installmentAmount: string;
  numberOfInstallments: string;
  billingMonth: string;
  onTotalChange: (value: string) => void;
  onInstallmentChange: (value: string) => void;
  onCountChange: (value: string) => void;
}) {
  const isInstallmentPlan = parseInt(numberOfInstallments, 10) > 1;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="u-installments">Parcelas</Label>
        <Select
          id="u-installments"
          value={numberOfInstallments}
          onChange={(e) => onCountChange(e.target.value)}
          aria-describedby="u-schedule-summary"
          required
        >
          <InstallmentCountOptions />
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="u-amount">{isInstallmentPlan ? "Valor total" : "Valor"}</Label>
        <CurrencyInput id="u-amount" value={amount} onChange={onTotalChange} required />
      </div>

      {isInstallmentPlan && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="u-installment-amount">Valor da parcela</Label>
          <CurrencyInput
            id="u-installment-amount"
            value={installmentAmount}
            onChange={onInstallmentChange}
          />
        </div>
      )}

      <InstallmentSchedule
        amount={amount}
        billingMonth={billingMonth}
        numberOfInstallments={numberOfInstallments}
      />
    </div>
  );
}

export function SplitSection({
  people,
  splitMode,
  toggleSplitMode,
  splitTotalCents,
  splitRows,
  splitRemainingCents,
  addSplitPerson,
  removeSplitPerson,
  setSplitAmount,
}: {
  people: Person[];
  splitMode: boolean;
  toggleSplitMode: () => void;
  splitTotalCents: number;
  splitRows: SplitRow[];
  splitRemainingCents: number;
  addSplitPerson: (id: string) => void;
  removeSplitPerson: (index: number) => void;
  setSplitAmount: (index: number, value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <Label>Dividir com outras pessoas</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={splitTotalCents <= 0}
          onClick={toggleSplitMode}
        >
          {splitMode ? "Cancelar divisão" : "Dividir"}
        </Button>
      </div>
      {splitMode && (
        <SplitPeopleFields
          people={people}
          splitRows={splitRows}
          remainingCents={splitRemainingCents}
          onAddPerson={addSplitPerson}
          onRemovePerson={removeSplitPerson}
          onAmountChange={setSplitAmount}
        />
      )}
    </div>
  );
}

export function CreditCardField({
  creditCardId,
  setCreditCardId,
  creditCards,
}: {
  creditCardId: string;
  setCreditCardId: (id: string) => void;
  creditCards: CreditCard[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="u-card">Cartão de crédito</Label>
      <Select
        id="u-card"
        value={creditCardId}
        onChange={(e) => setCreditCardId(e.target.value)}
        required
      >
        <option value="">Selecione o cartão</option>
        {creditCards.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>
    </div>
  );
}

export function CreditTypeFields({
  isEditMode,
  people,
  creditCardId,
  setCreditCardId,
  creditCards,
  numberOfInstallments,
  onCountChange,
  amount,
  installmentAmount,
  onTotalChange,
  onInstallmentChange,
  billingMonth,
  setBillingMonth,
  splitMode,
  toggleSplitMode,
  splitTotalCents,
  splitRows,
  splitRemainingCents,
  addSplitPerson,
  removeSplitPerson,
  setSplitAmount,
}: {
  isEditMode: boolean;
  people: Person[];
  creditCardId: string;
  setCreditCardId: (id: string) => void;
  creditCards: CreditCard[];
  numberOfInstallments: string;
  onCountChange: (value: string) => void;
  amount: string;
  installmentAmount: string;
  onTotalChange: (value: string) => void;
  onInstallmentChange: (value: string) => void;
  billingMonth: string;
  setBillingMonth: (value: string) => void;
  splitMode: boolean;
  toggleSplitMode: () => void;
  splitTotalCents: number;
  splitRows: SplitRow[];
  splitRemainingCents: number;
  addSplitPerson: (id: string) => void;
  removeSplitPerson: (index: number) => void;
  setSplitAmount: (index: number, value: string) => void;
}) {
  return (
    <>
      <CreditCardField
        creditCardId={creditCardId}
        setCreditCardId={setCreditCardId}
        creditCards={creditCards}
      />
      {!isEditMode && (
        <>
          <BillingMonthField billingMonth={billingMonth} setBillingMonth={setBillingMonth} />
          <InstallmentAmountFields
            amount={amount}
            installmentAmount={installmentAmount}
            numberOfInstallments={numberOfInstallments}
            billingMonth={billingMonth}
            onTotalChange={onTotalChange}
            onInstallmentChange={onInstallmentChange}
            onCountChange={onCountChange}
          />
          <SplitSection
            people={people}
            splitMode={splitMode}
            toggleSplitMode={toggleSplitMode}
            splitTotalCents={splitTotalCents}
            splitRows={splitRows}
            splitRemainingCents={splitRemainingCents}
            addSplitPerson={addSplitPerson}
            removeSplitPerson={removeSplitPerson}
            setSplitAmount={setSplitAmount}
          />
        </>
      )}
    </>
  );
}
