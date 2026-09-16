"use client";

import { useActionState } from "react";
import { LoaderCircle, Plus } from "lucide-react";
import { createContact, type CreateContactState } from "../actions";
import { leadStatuses } from "@/lib/lead-status";

const initialState: CreateContactState = {};

export function ContactForm({ companies = [] }: Readonly<{ companies?: { id: string; name: string }[] }>) {
  const [state, formAction, isPending] = useActionState(createContact, initialState);

  return (
    <form action={formAction} className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block space-y-2 sm:col-span-2">
          <span className="text-sm font-medium">Nome completo</span>
          <input name="fullName" required autoComplete="name" className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm" placeholder="Ex.: Ana Martins" />
        </label>
        <label className="block space-y-2"><span className="text-sm font-medium">E-mail</span><input name="email" type="email" autoComplete="email" className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm" placeholder="ana@empresa.com" /></label>
        <label className="block space-y-2"><span className="text-sm font-medium">Telefone</span><input name="phone" type="tel" autoComplete="tel" className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm" placeholder="(00) 00000-0000" /></label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Status</span>
          <select name="status" defaultValue="new" className="h-12 w-full rounded-2xl border border-border bg-surface px-4 pr-11 text-sm">{leadStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select>
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Empresa</span>
          <select name="companyId" defaultValue="" className="h-12 w-full rounded-2xl border border-border bg-surface px-4 pr-11 text-sm"><option value="">Sem empresa associada</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select>
        </label>
        <label className="block space-y-2 sm:col-span-2"><span className="text-sm font-medium">Origem</span><input name="source" className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm" placeholder="Ex.: Instagram, indicação ou evento" /></label>
        <label className="block space-y-2 sm:col-span-2"><span className="text-sm font-medium">Tags</span><textarea name="tags" rows={3} className="w-full resize-y rounded-2xl border border-border bg-surface px-4 py-3 text-sm" placeholder={'Uma tag por linha\nEx.: ebook\nagência'} /><span className="block text-xs text-muted-foreground">Use uma linha para cada tag.</span></label>

        <div className="sm:col-span-2 mt-2 border-t border-border pt-6">
          <h2 className="text-base font-medium">Atribuição de marketing</h2>
          <p className="mt-1 text-sm text-muted-foreground">Opcional no cadastro manual; formulários registram esses dados automaticamente.</p>
        </div>
        <label className="block space-y-2"><span className="text-sm font-medium">UTM source</span><input name="utmSource" className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm" placeholder="meta, google, newsletter" /></label>
        <label className="block space-y-2"><span className="text-sm font-medium">UTM medium</span><input name="utmMedium" className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm" placeholder="paid_social, cpc, email" /></label>
        <label className="block space-y-2 sm:col-span-2"><span className="text-sm font-medium">Campanha</span><input name="utmCampaign" className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm" placeholder="Nome ou identificador da campanha" /></label>
        <input type="hidden" name="discardReason" value="" />
        <label className="block space-y-2 sm:col-span-2"><span className="text-sm font-medium">Observações</span><textarea name="notes" rows={4} className="w-full resize-y rounded-2xl border border-border bg-surface px-4 py-3 text-sm" placeholder="Contexto útil sobre este lead." /></label>
      </div>

      {state.error && <p className="mt-5 rounded-2xl bg-brand-soft px-4 py-3 text-sm">{state.error}</p>}
      <div className="mt-8 flex justify-end border-t border-border pt-6">
        <button type="submit" disabled={isPending} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand px-5 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60">
          {isPending ? <LoaderCircle className="animate-spin" size={18} /> : <Plus size={18} />}
          Criar lead
        </button>
      </div>
    </form>
  );
}
