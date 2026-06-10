"use client";

import { Select } from "@/components/ui/select";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export function PageSizeSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (size: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Select
        value={String(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-8 w-20 text-sm"
      >
        {PAGE_SIZE_OPTIONS.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </Select>
      <span className="text-xs">por página</span>
    </div>
  );
}
