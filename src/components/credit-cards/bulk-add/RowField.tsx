import { cn } from "@/lib/utils";

/**
 * A field in a bulk-add row. From `xl` the column headers name it; below that rows stack, so the
 * label shows above the control (a filled "Valor total" and "Valor da parcela" look alike).
 */
export function RowField({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <span className="text-xs font-medium text-muted-foreground xl:hidden" aria-hidden="true">
        {label}
      </span>
      {children}
    </div>
  );
}

/** Column titles for the `xl` grid; `template` is the same `xl:grid-cols-[...]` the rows use. */
export function ColumnHeaders({ template, labels }: { template: string; labels: string[] }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "hidden gap-x-2 border-b border-border px-3 py-2 text-xs font-medium text-muted-foreground xl:grid",
        template,
      )}
    >
      {labels.map((label) => (
        <span key={label || "actions"}>{label}</span>
      ))}
    </div>
  );
}
