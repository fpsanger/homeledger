"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type DropdownItem = {
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive";
};

type DropdownMenuProps = {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
};

export function DropdownMenu({ trigger, items, align = "right" }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const inTrigger = triggerRef.current?.contains(e.target as Node);
      const inMenu = menuRef.current?.contains(e.target as Node);
      if (!inTrigger && !inMenu) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleTriggerClick() {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 4,
        left: align === "right" ? rect.right + window.scrollX : rect.left + window.scrollX,
      });
    }
    setOpen((v) => !v);
  }

  const menu = open ? (
    <div
      ref={menuRef}
      style={{
        position: "absolute",
        top: coords.top,
        ...(align === "right"
          ? { right: document.documentElement.clientWidth - coords.left }
          : { left: coords.left }),
        zIndex: 9999,
      }}
      className="min-w-[140px] rounded-md border bg-background shadow-md py-1"
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={() => {
            setOpen(false);
            item.onClick();
          }}
          className={cn(
            "w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors",
            item.variant === "destructive" && "text-destructive hover:text-destructive",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <div ref={triggerRef} className="inline-block">
      <div onClick={handleTriggerClick}>{trigger}</div>
      {typeof document !== "undefined" && menu ? createPortal(menu, document.body) : null}
    </div>
  );
}
