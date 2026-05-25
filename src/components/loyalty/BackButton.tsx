"use client";

import { useRouter } from "next/navigation";

export function BackButton({ label }: { label: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
    >
      ← {label}
    </button>
  );
}
