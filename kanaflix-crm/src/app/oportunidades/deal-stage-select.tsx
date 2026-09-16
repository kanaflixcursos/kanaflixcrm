"use client";

import { useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { updateDealStage } from "./actions";

export function DealStageSelect({
  dealId,
  stageId,
  stages,
}: Readonly<{
  dealId: string;
  stageId: string | null;
  stages: { id: string; name: string }[];
}>) {
  const [isPending, startTransition] = useTransition();
  return (
    <form action={updateDealStage} className="mt-4 flex items-center gap-2">
      <input type="hidden" name="dealId" value={dealId} />
      <select
        name="stageId"
        value={stageId ?? ""}
        disabled={isPending}
        aria-label="Mover oportunidade de etapa"
        onChange={(event) => {
          const form = event.currentTarget.form;
          if (form) startTransition(() => form.requestSubmit());
        }}
        className="h-8 min-w-0 flex-1 rounded-xl border border-border bg-surface-muted px-2 text-xs text-muted-foreground disabled:opacity-60"
      >
        {stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}
      </select>
      {isPending && <LoaderCircle className="animate-spin text-muted-foreground" size={14} />}
    </form>
  );
}
