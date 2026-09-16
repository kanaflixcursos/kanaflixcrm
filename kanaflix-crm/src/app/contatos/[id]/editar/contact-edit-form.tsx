"use client";

import { useActionState } from "react";
import { LoaderCircle, Save, Trash2 } from "lucide-react";
import { deleteContact, updateContact, type UpdateContactState } from "../../actions";
import { leadStatuses, type LeadStatus } from "@/lib/lead-status";

const initialState: UpdateContactState = {};

type Contact = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  company_id: string | null;
  source: string | null;
  notes: string | null;
  status: LeadStatus;
  tags: string[];
  discard_reason: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
};

export function ContactEditForm({
  contact,
  companies,
}: Readonly<{
  contact: Contact;
  companies: { id: string; name: string }[];
}>) {
  const [state, formAction, isPending] = useActionState(updateContact, initialState);

  return (
    <div className="space-y-6">
      <form action={formAction} className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <input type="hidden" name="contactId" value={contact.id} />
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block space-y-2 sm:col-span-2">
            <span className="text-sm font-medium">Nome completo</span>
            <input name="fullName" required defaultValue={contact.full_name} autoComplete="name" className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm" />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">E-mail</span>
            <input name="email" type="email" defaultValue={contact.email ?? ""} autoComplete="email" className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm" />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Empresa</span>
            <select name="companyId" defaultValue={contact.company_id ?? ""} className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm">
              <option value="">Sem empresa associada</option>
              {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Telefone</span>
            <input name="phone" type="tel" defaultValue={contact.phone ?? ""} autoComplete="tel" className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm" />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Status</span>
            <select name="status" defaultValue={contact.status} className="h-12 w-full rounded-2xl border border-border bg-surface px-4 pr-11 text-sm">{leadStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select>
          </label>
          <label className="block space-y-2 sm:col-span-2">
            <span className="text-sm font-medium">Origem</span>
            <input name="source" defaultValue={contact.source ?? ""} className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm" placeholder="Ex.: Indicação, Instagram, evento" />
          </label>
          <label className="block space-y-2 sm:col-span-2"><span className="text-sm font-medium">Tags</span><textarea name="tags" rows={3} defaultValue={contact.tags.join("\n")} className="w-full resize-y rounded-2xl border border-border bg-surface px-4 py-3 text-sm" /><span className="block text-xs text-muted-foreground">Use uma linha para cada tag.</span></label>
          <label className="block space-y-2 sm:col-span-2"><span className="text-sm font-medium">Motivo de descarte</span><input name="discardReason" defaultValue={contact.discard_reason ?? ""} className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm" placeholder="Preencha quando o status for Descartado" /></label>
          <div className="sm:col-span-2 mt-2 border-t border-border pt-6"><h2 className="text-base font-medium">Atribuição de marketing</h2></div>
          <label className="block space-y-2"><span className="text-sm font-medium">UTM source</span><input name="utmSource" defaultValue={contact.utm_source ?? ""} className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm" /></label>
          <label className="block space-y-2"><span className="text-sm font-medium">UTM medium</span><input name="utmMedium" defaultValue={contact.utm_medium ?? ""} className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm" /></label>
          <label className="block space-y-2 sm:col-span-2"><span className="text-sm font-medium">Campanha</span><input name="utmCampaign" defaultValue={contact.utm_campaign ?? ""} className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm" /></label>
          <label className="block space-y-2 sm:col-span-2">
            <span className="text-sm font-medium">Observações</span>
            <textarea name="notes" rows={5} defaultValue={contact.notes ?? ""} className="w-full resize-y rounded-2xl border border-border bg-surface px-4 py-3 text-sm" />
          </label>
        </div>
        {state.error && <p className="mt-5 rounded-2xl bg-brand-soft px-4 py-3 text-sm text-foreground">{state.error}</p>}
        <div className="mt-8 flex justify-end border-t border-border pt-6">
          <button type="submit" disabled={isPending} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand px-5 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60">
            {isPending ? <LoaderCircle className="animate-spin" size={18} /> : <Save size={18} />}Salvar alterações
          </button>
        </div>
      </form>

      <form
        action={deleteContact}
        onSubmit={(event) => {
          if (!window.confirm("Excluir este contato? As atividades vinculadas também serão removidas.")) event.preventDefault();
        }}
        className="flex flex-col gap-4 rounded-3xl border border-danger/25 bg-surface p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-8"
      >
        <input type="hidden" name="contactId" value={contact.id} />
        <div>
          <p className="text-sm font-medium">Excluir lead</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">Essa ação remove também as atividades relacionadas. As oportunidades permanecem sem contato associado.</p>
        </div>
        <button type="submit" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl border border-danger/35 px-4 text-sm font-medium text-danger transition-colors hover:bg-danger hover:text-white">
          <Trash2 size={17} />Excluir
        </button>
      </form>
    </div>
  );
}
