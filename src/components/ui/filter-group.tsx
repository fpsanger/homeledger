"use client";

import { Button } from "@/components/ui/button";

function FilterGroupRoot({
  children,
  hasActiveFilters,
  onClear,
}: {
  children: React.ReactNode;
  hasActiveFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="rounded-lg border bg-card p-3 flex flex-col gap-3">
      {children}
      {hasActiveFilters && (
        <div className="flex justify-end pt-1 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground"
            onClick={onClear}
          >
            Limpar filtros ×
          </Button>
        </div>
      )}
    </div>
  );
}

function FilterGroupSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export const FilterGroup = Object.assign(FilterGroupRoot, {
  Section: FilterGroupSection,
});
