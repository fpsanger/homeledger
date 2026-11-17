"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function BackButton({ label }: { label: string }) {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      type="button"
      onClick={() => router.back()}
      className="h-auto w-fit p-0 text-xs text-muted-foreground hover:bg-transparent hover:text-foreground"
    >
      ← {label}
    </Button>
  );
}
