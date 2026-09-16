"use client";

import { useState, useTransition } from "react";
import { Check, CircleDot, LoaderCircle, X } from "lucide-react";
import { updateDealOutcome } from "./actions";

const outcomeLabel = { won: "Ganha", lost: "Perdida" } as const;

export function DealOutcomeActions({ dealId, outcome }: Readonly<{ dealId: string; outcome: "open" | "won" | "lost" }>) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const updateOutcome = (nextOutcome: "open" | "won" | "lost") => {
    setError(undefined);
    const formData = new FormData();
    formData.set("dealId", dealId);
    formData.set("outcome", nextOutcome);
    startTransition(async () => {
      const result = await updateDealOutcome(formData);
      if (result?.error) setError(result.error);
    });
  };

  if (outcome !== "open") {
    const isWon = outcome === "won";
    return <div className="flex flex-wrap items-center gap-3"><span className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-medium ${isWon ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>{isWon ? <Check size={16} /> : <X size={16} />}{outcomeLabel[outcome]}</span><button type="button" disabled={isPending} onClick={() => updateOutcome("open")} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-medium transition-colors hover:bg-surface-muted disabled:opacity-60"><CircleDot size={16} />Reabrir</button>{isPending && <LoaderCircle className="animate-spin text-muted-foreground" size={16} />}{error && <p className="basis-full text-xs text-danger">{error}</p>}</div>;
  }

  return <div className="flex flex-wrap items-center gap-2"><button type="button" disabled={isPending} onClick={() => updateOutcome("won")} className="inline-flex h-10 items-center gap-2 rounded-2xl bg-success px-4 text-sm font-medium text-white transition-colors hover:bg-success/85 disabled:opacity-60"><Check size={17} />Marcar como ganha</button><button type="button" disabled={isPending} onClick={() => updateOutcome("lost")} className="inline-flex h-10 items-center gap-2 rounded-2xl border border-danger/35 px-4 text-sm font-medium text-danger transition-colors hover:bg-danger hover:text-white disabled:opacity-60"><X size={17} />Marcar como perdida</button>{isPending && <LoaderCircle className="animate-spin text-muted-foreground" size={16} />}{error && <p className="basis-full text-xs text-danger">{error}</p>}</div>;
}
