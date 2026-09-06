import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatAmountBR, parseCurrencyBR } from "@/lib/utils";
import {
  type ClosureRecord,
  type CreditCard,
  computeBillingMonths,
  MONTH_NAMES_PT,
  type SplitRow,
} from "./billing";
import { type Person, SplitPeopleFields } from "./fields";

export function TotalOptions({ installmentAmount }: { installmentAmount: string }) {
  const parcela = parseCurrencyBR(installmentAmount);
  if (!parcela || parcela <= 0) {
    return <option value="">Informe o valor da parcela primeiro</option>;
  }
  return Array.from({ length: 12 }, (_, i) => i + 1).map((n) => {
    const total = (parcela * n).toFixed(2).replace(".", ",");
    return (
      <option key={n} value={String(n)}>
        {n}x = R$ {total}
      </option>
    );
  });
}

export function InstallmentCountOptions({ amount }: { amount: string }) {
  const total = parseCurrencyBR(amount);
  if (!total || total <= 0) {
    return <option value="">Informe o valor primeiro</option>;
  }
  return Array.from({ length: 12 }, (_, i) => i + 1).map((n) => {
    const perInstallment = (total / n).toFixed(2).replace(".", ",");
    return (
      <option key={n} value={String(n)}>
        {n}x de R$ {perInstallment}
      </option>
    );
  });
}

export function InstallmentPreview({
  amount,
  date,
  selectedCard,
  numberOfInstallments,
  cardClosures,
}: {
  amount: string;
  date: string;
  selectedCard: CreditCard | undefined;
  numberOfInstallments: string;
  cardClosures: ClosureRecord[];
}) {
  const total = parseCurrencyBR(amount);
  if (!selectedCard || !total || total <= 0 || !date) return null;
  const n = parseInt(numberOfInstallments, 10);
  if (!n || n < 1) return null;

  if (selectedCard.closureType === "VARIABLE") {
    const d = new Date(`${date}T00:00:00Z`);
    const purchaseYear = d.getUTCFullYear();
    const purchaseMonth = d.getUTCMonth() + 1;
    const closure = cardClosures.find((c) => c.year === purchaseYear && c.month === purchaseMonth);
    if (!closure) {
      return (
        <p className="text-xs text-amber-600">
          Fechamento do mês {MONTH_NAMES_PT[purchaseMonth - 1]}/{purchaseYear} não configurado.
          Adicione um fechamento para este cartão antes de registrar a compra.
        </p>
      );
    }
    const variableCard = {
      ...selectedCard,
      fixedClosureDay: closure.closureDay,
      fixedClosurePreviousMonth: closure.previousMonth,
    };
    const months = computeBillingMonths(total, n, date, variableCard);
    return (
      <div className="rounded-md border bg-muted/40 px-3 py-2 flex flex-col gap-1">
        {months.map(({ installmentNumber, dueYear, dueMonth, amount: installAmount }) => (
          <div
            key={installmentNumber}
            className="flex justify-between text-xs text-muted-foreground"
          >
            <span>
              Parcela {installmentNumber}/{n}
            </span>
            <span>
              {MONTH_NAMES_PT[dueMonth - 1]}/{dueYear} — {formatAmountBR(installAmount)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  const months = computeBillingMonths(total, n, date, selectedCard);
  return (
    <div className="rounded-md border bg-muted/40 px-3 py-2 flex flex-col gap-1">
      {months.map(({ installmentNumber, dueYear, dueMonth, amount: installAmount }) => (
        <div key={installmentNumber} className="flex justify-between text-xs text-muted-foreground">
          <span>
            Parcela {installmentNumber}/{n}
          </span>
          <span>
            {MONTH_NAMES_PT[dueMonth - 1]}/{dueYear} — {formatAmountBR(installAmount)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function AmountEntrySection({
  parcelaMode,
  amount,
  date,
  creditCardId,
  creditCards,
  cardClosures,
  numberOfInstallments,
  setNumberOfInstallments,
  installmentAmount,
  onTotalPicked,
}: {
  parcelaMode: boolean;
  amount: string;
  date: string;
  creditCardId: string;
  creditCards: CreditCard[];
  cardClosures: ClosureRecord[];
  numberOfInstallments: string;
  setNumberOfInstallments: (n: string) => void;
  installmentAmount: string;
  onTotalPicked: (n: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {parcelaMode ? (
        <>
          <Label htmlFor="u-total-picker">Selecione o total</Label>
          <Select
            id="u-total-picker"
            value={numberOfInstallments}
            onChange={(e) => onTotalPicked(e.target.value)}
            required
          >
            <option value="">Selecione</option>
            <TotalOptions installmentAmount={installmentAmount} />
          </Select>
        </>
      ) : (
        <>
          <Label htmlFor="u-installments">Parcelas</Label>
          <Select
            id="u-installments"
            value={numberOfInstallments}
            onChange={(e) => setNumberOfInstallments(e.target.value)}
            required
          >
            <InstallmentCountOptions amount={amount} />
          </Select>
        </>
      )}
      <InstallmentPreview
        amount={amount}
        date={date}
        selectedCard={creditCards.find((c) => c.id === creditCardId)}
        numberOfInstallments={numberOfInstallments}
        cardClosures={cardClosures}
      />
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
  setNumberOfInstallments,
  amount,
  date,
  cardClosures,
  splitMode,
  toggleSplitMode,
  splitTotalCents,
  splitRows,
  splitRemainingCents,
  addSplitPerson,
  removeSplitPerson,
  setSplitAmount,
  parcelaMode,
  installmentAmount,
  onTotalPicked,
}: {
  isEditMode: boolean;
  people: Person[];
  creditCardId: string;
  setCreditCardId: (id: string) => void;
  creditCards: CreditCard[];
  numberOfInstallments: string;
  setNumberOfInstallments: (n: string) => void;
  amount: string;
  date: string;
  cardClosures: ClosureRecord[];
  splitMode: boolean;
  toggleSplitMode: () => void;
  splitTotalCents: number;
  splitRows: SplitRow[];
  splitRemainingCents: number;
  addSplitPerson: (id: string) => void;
  removeSplitPerson: (index: number) => void;
  setSplitAmount: (index: number, value: string) => void;
  parcelaMode: boolean;
  installmentAmount: string;
  onTotalPicked: (n: string) => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="u-card">Cartão de Crédito</Label>
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
      {!isEditMode && (
        <AmountEntrySection
          parcelaMode={parcelaMode}
          amount={amount}
          date={date}
          creditCardId={creditCardId}
          creditCards={creditCards}
          cardClosures={cardClosures}
          numberOfInstallments={numberOfInstallments}
          setNumberOfInstallments={setNumberOfInstallments}
          installmentAmount={installmentAmount}
          onTotalPicked={onTotalPicked}
        />
      )}
      {!isEditMode && (
        <div className="flex flex-col gap-2 rounded-md border border-input p-3">
          <div className="flex items-center justify-between">
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
      )}
    </>
  );
}
