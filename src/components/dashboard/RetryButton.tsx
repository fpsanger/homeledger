"use client";

import { RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function RetryButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="link"
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={isPending}
      className="h-auto gap-1.5 p-0 hover:text-primary/80 hover:no-underline"
    >
      <RotateCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
      Tentar novamente
    </Button>
  );
}
