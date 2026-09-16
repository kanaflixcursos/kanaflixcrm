"use client";

import { useActionState } from "react";
import { LoaderCircle, Plus } from "lucide-react";
import { createActivity, type CreateActivityState } from "./actions";

const initialState: CreateActivityState = {};

export function ActivityForm({
  contacts,
  deals,
  defaultRelatedTo = "",
}: Readonly<{
  contacts: { id: string; full_name: string }[];
  deals: { id: string; title: string }[];
  defaultRelatedTo?: string;
}>) {
  const [state, formAction, isPending] = useActionState(createActivity, initialState);
  return (
    <form id="planejar" action={formAction} className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
      <p className="text-sm font-medium">Planejar próxima atividade</p>
      <div className="mt-5 grid gap-4">
        <select name="relatedTo" required defaultValue={defaultRelatedTo} className="h-11 w-full rounded-2xl border border-border bg-surface px-3.5 text-sm">
          <option value="" disabled>Vincular a um contato ou oportunidade</option>
          {contacts.length > 0 && <optgroup label="Contatos">{contacts.map((contact) => <option key={contact.id} value={`contact:${contact.id}`}>{contact.full_name}</option>)}</optgroup>}
          {deals.length > 0 && <optgroup label="Oportunidades">{deals.map((deal) => <option key={deal.id} value={`deal:${deal.id}`}>{deal.title}</option>)}</optgroup>}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <select name="type" defaultValue="task" className="h-11 rounded-2xl border border-border bg-surface px-3.5 text-sm">
            <option value="task">Tarefa</option><option value="call">Ligação</option><option value="email">E-mail</option><option value="meeting">Reunião</option><option value="note">Nota</option>
          </select>
          <input name="dueAt" type="datetime-local" className="h-11 rounded-2xl border border-border bg-surface px-3.5 text-sm" />
        </div>
        <textarea name="description" required rows={3} placeholder="O que precisa acontecer?" className="w-full resize-none rounded-2xl border border-border bg-surface px-3.5 py-3 text-sm" />
      </div>
      {state.error && <p className="mt-4 text-sm text-brand">{state.error}</p>}
      {state.success && <p className="mt-4 text-sm text-success">Atividade adicionada à agenda.</p>}
      <button type="submit" disabled={isPending} className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-sm font-medium text-brand-foreground disabled:opacity-60">
        {isPending ? <LoaderCircle className="animate-spin" size={17} /> : <Plus size={17} />} Adicionar atividade
      </button>
    </form>
  );
}
