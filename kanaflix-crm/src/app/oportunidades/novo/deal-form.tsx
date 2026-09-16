"use client";

import { useActionState } from "react";
import { LoaderCircle, Plus } from "lucide-react";
import { createDeal, type CreateDealState } from "../actions";

const initialState: CreateDealState = {};

export function DealForm({
  contacts,
  stages,
}: Readonly<{
  contacts: { id: string; full_name: string }[];
  stages: { id: string; name: string }[];
}>) {
  const [state, formAction, isPending] = useActionState(createDeal, initialState);

  return (
    <form action={formAction} className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block space-y-2 sm:col-span-2">
          <span className="text-sm font-medium">Oportunidade</span>
          <input name="title" required className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm" placeholder="Ex.: Plano anual da Acme" />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Contato</span>
          <select name="contactId" required defaultValue="" className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm">
            <option value="" disabled>Selecione um contato</option>
            {contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.full_name}</option>)}
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Etapa inicial</span>
          <select name="stageId" required defaultValue={stages[0]?.id ?? ""} className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm">
            {stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Valor estimado</span>
          <input name="amount" type="number" min="0" step="0.01" defaultValue="0" className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm" />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Previsão de fechamento</span>
          <input name="expectedCloseDate" type="date" className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm" />
        </label>
      </div>
      {state.error && <p className="mt-5 rounded-2xl bg-brand-soft px-4 py-3 text-sm">{state.error}</p>}
      <div className="mt-8 flex justify-end border-t border-border pt-6">
        <button type="submit" disabled={isPending} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand px-5 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60">
          {isPending ? <LoaderCircle className="animate-spin" size={18} /> : <Plus size={18} />}
          Criar oportunidade
        </button>
      </div>
    </form>
  );
}
