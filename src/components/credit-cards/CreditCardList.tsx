"use client";

import {
  Calendar,
  CreditCard as CreditCardIcon,
  Lock,
  MoreHorizontal,
  Plus,
  Shuffle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/ui/page-header";
import { CreditCardForm } from "./CreditCardForm";

type CreditCard = {
  id: string;
  name: string;
  closureType: "FIXED" | "VARIABLE";
  fixedClosureDay: number | null;
  fixedClosurePreviousMonth: boolean;
  dueDayOfMonth: number;
  closureNextMonth: boolean;
};

type Props = { initialCards: CreditCard[] };

export function CreditCardList({ initialCards }: Props) {
  const router = useRouter();
  const [cards, setCards] = useState(initialCards);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);

  async function refresh() {
    const res = await fetch("/api/credit-cards");
    if (res.ok) {
      const data = await res.json();
      setCards(data.cards);
    }
    router.refresh();
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/credit-cards/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Falha ao excluir.");
      return;
    }
    toast.success("Cartão excluído.");
    refresh();
  }

  const fixedCount = cards.filter((c) => c.closureType === "FIXED").length;
  const variableCount = cards.filter((c) => c.closureType === "VARIABLE").length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Crédito"
        title="Cartões de Crédito"
        description="Gerencie cartões, vencimentos e regras de fechamento."
      >
        <Button onClick={() => setFormOpen(true)} className="shrink-0 gap-2">
          <Plus className="w-4 h-4" />
          Novo Cartão
        </Button>
      </PageHeader>

      {/* Summary strip */}
      {cards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SummaryCard
            label="Total de Cartões"
            value={cards.length}
            icon={<CreditCardIcon className="w-4 h-4" />}
          />
          <SummaryCard
            label="Fechamento Fixo"
            value={fixedCount}
            icon={<Lock className="w-4 h-4" />}
          />
          <SummaryCard
            label="Fechamento Variável"
            value={variableCount}
            icon={<Shuffle className="w-4 h-4" />}
          />
        </div>
      )}

      {/* Empty state */}
      {cards.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground border rounded-xl border-dashed">
          <CreditCardIcon className="w-10 h-10 opacity-20" />
          <div className="text-center">
            <p className="text-sm font-medium">Nenhum cartão cadastrado</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Clique em "Novo Cartão" para começar.
            </p>
          </div>
        </div>
      )}

      {/* Card list */}
      <div className="flex flex-col gap-3">
        {cards.map((card) => (
          <CreditCardRow
            key={card.id}
            card={card}
            onEdit={() => setEditingCard(card)}
            onDelete={() => handleDelete(card.id)}
          />
        ))}
      </div>

      {/* Create dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} title="Novo Cartão de Crédito">
        <CreditCardForm
          onSaved={() => {
            setFormOpen(false);
            refresh();
          }}
          onCancel={() => setFormOpen(false)}
        />
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={!!editingCard}
        onClose={() => setEditingCard(null)}
        title="Editar Cartão de Crédito"
      >
        {editingCard && (
          <CreditCardForm
            card={editingCard}
            onSaved={() => {
              setEditingCard(null);
              refresh();
            }}
            onCancel={() => setEditingCard(null)}
          />
        )}
      </Dialog>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card className="px-4 py-3 flex items-center gap-3">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="text-xl font-semibold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </Card>
  );
}

function CreditCardRow({
  card,
  onEdit,
  onDelete,
}: {
  card: CreditCard;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isFixed = card.closureType === "FIXED";

  const menuItems = [
    { label: "Editar", onClick: onEdit },
    { label: "Excluir", onClick: onDelete, variant: "destructive" as const },
  ];

  return (
    <Card className="px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        {/* Left: info */}
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{card.name}</span>
            <Badge variant={isFixed ? "secondary" : "outline"} className="shrink-0">
              {isFixed ? "Fixo" : "Variável"}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {isFixed && card.fixedClosureDay != null && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Fecha no dia {card.fixedClosureDay}
              </span>
            )}
            <span className="flex items-center gap-1">
              <CreditCardIcon className="w-3.5 h-3.5" />
              Vence no dia {card.dueDayOfMonth}
            </span>
            {!isFixed && (
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                Fatura escolhida em cada compra
              </span>
            )}
            {card.closureNextMonth && (
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                Fechamento no mês seguinte
              </span>
            )}
          </div>
        </div>

        {/* Right: actions */}
        <DropdownMenu
          trigger={
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          }
          items={menuItems}
          align="right"
        />
      </div>
    </Card>
  );
}
