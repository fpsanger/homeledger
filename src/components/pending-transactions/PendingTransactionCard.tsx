"use client";

import { useState } from "react";
import { toast } from "sonner";
import { formatCurrency } from "@/components/credit-cards/BillView.helpers";
import { usePrivacy } from "@/components/layout/PrivacyProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryCombobox } from "@/components/ui/category-combobox";
import { Label } from "@/components/ui/label";
import { MonthPicker } from "@/components/ui/month-picker";
import { Select } from "@/components/ui/select";
import { notifyPendingChanged } from "@/hooks/usePendingCount";
import { formatDatePtBR } from "@/lib/format-date";
import { maskCurrency } from "@/lib/maskCurrency";
import {
  buildConfirmBody,
  canConfirm,
  cardChoice,
  initialPaymentChoice,
  NON_CREDIT_OPTIONS,
  type PendingItem,
  type ReviewCard,
  requiresBillingMonth,
} from "./pendingTransactionForm";

type Category = { id: string; name: string; parentId: string | null };

type Props = {
  item: PendingItem;
  cards: ReviewCard[];
  categories: Category[];
  onResolved: (id: string) => void;
};

async function post(url: string, body?: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

export function PendingTransactionCard({ item, cards, categories, onResolved }: Props) {
  const { hidden } = usePrivacy();
  const [choice, setChoice] = useState(() => initialPaymentChoice(item));
  const [categoryId, setCategoryId] = useState(item.suggestedCategoryId ?? "");
  const [billingMonth, setBillingMonth] = useState("");
  const [busy, setBusy] = useState(false);

  const needsMonth = requiresBillingMonth(choice, cards);
  const paymentId = `payment-${item.id}`;

  function finish(message: string) {
    toast.success(message);
    notifyPendingChanged();
    onResolved(item.id);
  }

  async function confirm() {
    setBusy(true);
    try {
      const body = buildConfirmBody({ choice, categoryId, billingMonth, cards });
      const result = await post(`/api/pending-transactions/${item.id}/confirm`, body);
      if (!result.ok) {
        toast.error(result.data.error ?? "Não foi possível registrar a compra");
        if (result.status === 409) onResolved(item.id);
        return;
      }
      if (result.data.isDuplicate) {
        toast.warning("Parece repetir uma compra já registrada. Confira o lançamento.");
      }
      finish(`${item.merchant} registrada`);
    } catch {
      toast.error("Sem conexão com o servidor");
    } finally {
      setBusy(false);
    }
  }

  async function discard() {
    setBusy(true);
    try {
      const result = await post(`/api/pending-transactions/${item.id}/discard`);
      if (!result.ok && result.status !== 409) {
        toast.error(result.data.error ?? "Não foi possível descartar a compra");
        return;
      }
      finish(`${item.merchant} descartada`);
    } catch {
      toast.error("Sem conexão com o servidor");
    } finally {
      setBusy(false);
    }
  }

  const cardNotMatched = item.cardName !== "" && item.creditCardId === null;
  const categoryFromHistory =
    item.suggestedCategoryId !== null && categoryId === item.suggestedCategoryId;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate font-medium">{item.merchant}</p>
            <p className="text-sm text-muted-foreground">
              {formatDatePtBR(item.occurredOn)} · {item.cardName || "Cartão não informado"}
            </p>
          </div>
          <p className="shrink-0 text-lg font-semibold tabular-nums">
            {maskCurrency(formatCurrency(item.amount), hidden)}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={paymentId}>Pago com</Label>
            <Select id={paymentId} value={choice} onChange={(e) => setChoice(e.target.value)}>
              <optgroup label="Sem cartão de crédito">
                {NON_CREDIT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
              {cards.length > 0 && (
                <optgroup label="Cartão de crédito">
                  {cards.map((card) => (
                    <option key={card.id} value={cardChoice(card.id)}>
                      {card.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </Select>
            {cardNotMatched && (
              <p className="text-xs text-muted-foreground">
                Cartão na Carteira: {item.cardName}. Escolha como foi pago.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Categoria</Label>
            <CategoryCombobox categories={categories} value={categoryId} onChange={setCategoryId} />
            {categoryFromHistory && (
              <p className="text-xs text-muted-foreground">Sugerida pelo histórico</p>
            )}
          </div>

          {needsMonth && (
            <div className="flex flex-col gap-1.5">
              <Label>Fatura</Label>
              <MonthPicker
                value={billingMonth}
                onChange={setBillingMonth}
                placeholder="Mês da fatura"
                ariaLabel="Mês da fatura"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" disabled={busy} onClick={discard}>
            Descartar
          </Button>
          <Button
            type="button"
            disabled={busy || !canConfirm(choice, billingMonth, cards)}
            onClick={confirm}
          >
            Confirmar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
