"use client";

import { useActionState, useState } from "react";
import { LoaderCircle, Plus } from "lucide-react";
import { leadStatuses } from "@/lib/lead-status";
import { createAutomationRule, type AutomationState } from "./actions";

const initialState: AutomationState = {};

export function AutomationForm({ forms }: Readonly<{ forms: { id: string; name: string }[] }>) {
  const [state, formAction, isPending] = useActionState(createAutomationRule, initialState);
  const [triggerType, setTriggerType] = useState<"form" | "utm_source" | "utm_campaign">("form");
  return (
    <form action={formAction} className="w-full rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <div><h2 className="text-lg font-medium">Nova automação</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Uma condição simples, aplicada assim que o lead é capturado.</p></div>
      <div className="mt-6 grid gap-5">
        <label className="block space-y-2"><span className="text-sm font-medium">Nome da regra</span><input name="name" required className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm" placeholder="Ex.: Leads do ebook" /></label>
        <label className="block space-y-2"><span className="text-sm font-medium">Quando</span><select name="triggerType" value={triggerType} onChange={(event) => setTriggerType(event.target.value as typeof triggerType)} className="h-12 w-full rounded-2xl border border-border bg-surface px-4 pr-11 text-sm"><option value="form">Formulário for</option><option value="utm_source">UTM source for</option><option value="utm_campaign">UTM campaign for</option></select></label>
        <label className="block space-y-2"><span className="text-sm font-medium">Valor</span>{triggerType === "form" ? <select name="triggerValue" required defaultValue="" className="h-12 w-full rounded-2xl border border-border bg-surface px-4 pr-11 text-sm"><option value="" disabled>Selecione o formulário</option>{forms.map((form) => <option key={form.id} value={form.id}>{form.name}</option>)}</select> : <input name="triggerValue" required className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm" placeholder={triggerType === "utm_source" ? "Ex.: meta" : "Ex.: lancamento-agosto"} />}</label>
        <label className="block space-y-2"><span className="text-sm font-medium">Definir status</span><select name="setStatus" defaultValue="" className="h-12 w-full rounded-2xl border border-border bg-surface px-4 pr-11 text-sm"><option value="">Manter status atual</option>{leadStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
        <label className="block space-y-2"><span className="text-sm font-medium">Adicionar tags</span><textarea name="tags" rows={3} className="w-full resize-y rounded-2xl border border-border bg-surface px-4 py-3 text-sm" placeholder={'Uma tag por linha\nEx.: ebook'} /></label>
      </div>
      {state.error && <p className="mt-5 rounded-2xl bg-brand-soft px-4 py-3 text-sm">{state.error}</p>}
      {state.success && <p className="mt-5 text-sm text-success">{state.success}</p>}
      <button disabled={isPending} className="mt-6 inline-flex h-12 items-center gap-2 rounded-2xl bg-brand px-5 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-hover disabled:opacity-60">{isPending ? <LoaderCircle className="animate-spin" size={18} /> : <Plus size={18} />}Criar automação</button>
    </form>
  );
}
