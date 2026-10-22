import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import type { RowStatus } from "./types";

type StatusProps = { status: RowStatus; isDuplicate?: boolean };

/** Saved / saving / possible-duplicate marker. Errors are text: see RowError. */
export function RowStatusIcon({ status, isDuplicate }: StatusProps) {
  if (status === "loading") {
    return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" aria-label="Salvando" />;
  }
  if (status !== "success") return null;
  return (
    <span className="flex items-center gap-1">
      <CheckCircle2 className="w-4 h-4 text-emerald-500" aria-label="Salvo" />
      {isDuplicate && (
        <AlertTriangle className="w-4 h-4 text-amber-500" aria-label="Possível duplicata" />
      )}
    </span>
  );
}

export function RowError({
  status,
  error,
  fallback,
}: {
  status: RowStatus;
  error?: string;
  fallback: string;
}) {
  if (status !== "error") return null;
  return (
    <span className="flex items-center gap-1.5 text-xs text-destructive" role="alert">
      <XCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span>{error ?? fallback}</span>
    </span>
  );
}
