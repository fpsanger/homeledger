"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useComboboxPopup } from "@/components/ui/use-combobox-popup";
import { cn } from "@/lib/utils";

type CreditCard = { id: string; name: string };

type Props = {
  cards: CreditCard[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function CardCombobox({
  cards,
  value,
  onChange,
  placeholder = "Selecione o cartão",
  disabled = false,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const { searchRef, listReady, initialFocus } = useComboboxPopup(open);
  const selected = cards.find((c) => c.id === value);

  function handleSelect(id: string) {
    onChange(id);
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
        )}
      >
        <span className="truncate">{selected ? selected.name : placeholder}</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent
        className="w-[--anchor-width] p-0 bg-white dark:bg-zinc-950"
        align="start"
        initialFocus={initialFocus}
      >
        <Command>
          <CommandInput ref={searchRef} placeholder="Buscar cartão..." />
          {listReady && (
            <CommandList>
              <CommandEmpty>Nenhum cartão encontrado.</CommandEmpty>
              {cards.map((card) => (
                <CommandItem key={card.id} value={card.name} onSelect={() => handleSelect(card.id)}>
                  <Check
                    className={cn("mr-2 h-4 w-4", value === card.id ? "opacity-100" : "opacity-0")}
                  />
                  {card.name}
                </CommandItem>
              ))}
            </CommandList>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
