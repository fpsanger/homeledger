"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  installment: {
    id: string;
    amount: number;
    purchaseDescription?: string;
  };
  onSuccess: () => void;
};

export function EditInstallmentForm({ installment, onSuccess }: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState(String(installment.amount));
  const [description, setDescription] = useState(installment.purchaseDescription ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/installments/${installment.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: parseFloat(amount), description }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Falha ao salvar.");
      return;
    }

    router.refresh();
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ei-amount">Valor</Label>
        <Input
          id="ei-amount"
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ei-description">Descrição</Label>
        <Input
          id="ei-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Opcional"
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Salvando…" : "Salvar alterações"}
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
