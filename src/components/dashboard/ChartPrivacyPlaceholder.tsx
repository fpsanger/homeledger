import { EyeOff } from "lucide-react";

export function ChartPrivacyPlaceholder({ height }: { height: number | string }) {
  return (
    <div
      className="flex flex-col items-center justify-center text-muted-foreground gap-2"
      style={{ height }}
    >
      <EyeOff className="w-6 h-6" />
      <span className="text-sm">Valores ocultos</span>
    </div>
  );
}
