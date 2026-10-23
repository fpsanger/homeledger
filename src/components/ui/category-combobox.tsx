"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useComboboxPopup } from "@/components/ui/use-combobox-popup";
import { getFullPath } from "@/lib/categoryUtils";
import { cn } from "@/lib/utils";

type Category = {
  id: string;
  name: string;
  parentId: string | null;
};

interface CategoryComboboxProps {
  categories: Category[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CategoryCombobox({
  categories,
  value,
  onChange,
  placeholder = "Selecione a categoria",
  disabled = false,
  className,
}: CategoryComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const { searchRef, listReady, initialFocus } = useComboboxPopup(open);

  const rootCategories = categories.filter((c) => c.parentId === null);
  const selected = categories.find((c) => c.id === value);

  const displayLabel = selected ? getFullPath(selected.id, categories) : placeholder;

  function handleSelect(id: string) {
    onChange(id === value ? "" : id);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        disabled={disabled}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          !selected && "text-muted-foreground",
          className,
        )}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent
        className="w-[--anchor-width] p-0 bg-white dark:bg-zinc-950"
        align="start"
        initialFocus={initialFocus}
      >
        <Command>
          <CommandInput ref={searchRef} placeholder="Buscar categoria..." />
          {listReady && (
            <CommandList>
              <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
              <CommandItem value="__none__" onSelect={() => handleSelect("")}>
                <Check className={cn("mr-2 h-4 w-4", value === "" ? "opacity-100" : "opacity-0")} />
                Nenhuma
              </CommandItem>
              {rootCategories.map((parent) => {
                const children = categories.filter((c) => c.parentId === parent.id);
                if (children.length === 0) {
                  return (
                    <CommandItem
                      key={parent.id}
                      value={parent.name}
                      onSelect={() => handleSelect(parent.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === parent.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {parent.name}
                    </CommandItem>
                  );
                }
                return (
                  <CommandGroup key={parent.id} heading={parent.name}>
                    {children.map((child) => (
                      <CommandItem
                        key={child.id}
                        value={`${parent.name} ${child.name}`}
                        onSelect={() => handleSelect(child.id)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === child.id ? "opacity-100" : "opacity-0",
                          )}
                        />
                        {child.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })}
            </CommandList>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
