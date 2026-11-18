"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

type Props = {
  personName: string;
  /** The plain token, shown only here and only once; null keeps the dialog closed. */
  token: string | null;
  onClose: () => void;
};

export function WebhookTokenDialog({ personName, token, onClose }: Props) {
  async function copy() {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      toast.success("Token copiado.");
    } catch {
      toast.error("Não foi possível copiar. Selecione o token e copie manualmente.");
    }
  }

  return (
    <Dialog open={token !== null} onClose={onClose} title="Token do Atalho">
      <div className="flex flex-col gap-4">
        <p className="text-sm">
          Token de <strong>{personName}</strong>. Cole no cabeçalho{" "}
          <code className="text-xs">Authorization: Bearer &lt;token&gt;</code> do Atalho.
        </p>
        <code className="block break-all rounded-md border bg-muted px-3 py-2 text-xs">
          {token}
        </code>
        <p className="text-sm text-muted-foreground">
          Este token não será mostrado novamente. Gerar outro invalida este.
        </p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={copy} aria-label="Copiar token">
            <Copy className="w-4 h-4 mr-2" aria-hidden="true" />
            Copiar
          </Button>
          <Button type="button" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
