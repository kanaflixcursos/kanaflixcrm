"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackButton({ compact = false }: Readonly<{ compact?: boolean }>) {
  const router = useRouter();
  return <button type="button" onClick={() => router.back()} className={`grid shrink-0 place-items-center text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground ${compact ? "size-8 rounded-xl" : "size-11 rounded-2xl"}`} aria-label="Voltar" title="Voltar"><ArrowLeft size={compact ? 17 : 19} strokeWidth={1.9} /></button>;
}
