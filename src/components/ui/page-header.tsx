import { cn } from "@/lib/utils";

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
};

export function PageHeader({ eyebrow, title, description, className, children }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8",
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        {eyebrow && (
          <p className="text-xs font-semibold tracking-widest uppercase text-primary/70">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-semibold leading-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        <div className="mt-2 h-px w-12 bg-primary rounded-full" />
      </div>
      {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
    </div>
  );
}
