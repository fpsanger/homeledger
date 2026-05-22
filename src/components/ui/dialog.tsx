"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export function Dialog({ open, onClose, title, children, className }: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className={cn(
          "relative z-10 bg-card border rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto",
          className,
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-base font-semibold">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
