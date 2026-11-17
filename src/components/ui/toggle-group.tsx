"use client";

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";
import * as React from "react";

import { cn } from "@/lib/utils";

type Variant = "muted" | "primary";

const VariantContext = React.createContext<Variant>("muted");

const PRESSED: Record<Variant, string> = {
  muted: "data-pressed:bg-muted data-pressed:text-foreground",
  primary: "data-pressed:bg-primary data-pressed:text-primary-foreground",
};

type ToggleGroupProps = Omit<
  ToggleGroupPrimitive.Props,
  "value" | "defaultValue" | "onValueChange" | "multiple"
> & {
  value: string;
  onValueChange: (value: string) => void;
  variant?: Variant;
};

/** A single-choice segmented control: one item is always selected. */
function ToggleGroup({
  value,
  onValueChange,
  variant = "muted",
  className,
  ...props
}: ToggleGroupProps) {
  return (
    <VariantContext.Provider value={variant}>
      <ToggleGroupPrimitive
        data-slot="toggle-group"
        value={[value]}
        // Pressing the selected item again would empty the group; a segmented control cannot be empty.
        onValueChange={(next) => {
          if (next[0] !== undefined) onValueChange(next[0]);
        }}
        className={cn("flex overflow-hidden rounded-md border", className)}
        {...props}
      />
    </VariantContext.Provider>
  );
}

function ToggleGroupItem({ className, ...props }: TogglePrimitive.Props<string>) {
  const variant = React.useContext(VariantContext);
  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      className={cn(
        "flex items-center justify-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 not-first:border-l",
        PRESSED[variant],
        className,
      )}
      {...props}
    />
  );
}

export { ToggleGroup, ToggleGroupItem };
