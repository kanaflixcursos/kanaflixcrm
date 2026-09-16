"use client";

import { useActionState } from "react";
import { Building2, LoaderCircle } from "lucide-react";
import { createCompany, type CreateCompanyState } from "../actions";

const initialState: CreateCompanyState = {};

export function CompanyForm() {
  const [state, formAction, isPending] = useActionState(createCompany, initialState);
  return (
    <form action={formAction} className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <div className="grid gap-5">
        <label className="block space-y-2">
          <span className="text-sm font-medium">Nome da empresa</span>
          <input name="name" required autoComplete="organization" className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm" placeholder="Ex.: Acme Ltda." />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Site</span>
          <input name="website" type="url" className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm" placeholder="https://empresa.com" />
        </label>
      </div>
      {state.error && <p className="mt-5 rounded-2xl bg-brand-soft px-4 py-3 text-sm">{state.error}</p>}
      <div className="mt-8 flex justify-end border-t border-border pt-6">
        <button type="submit" disabled={isPending} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand px-5 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-hover disabled:opacity-60">
          {isPending ? <LoaderCircle className="animate-spin" size={18} /> : <Building2 size={18} />}
          Criar empresa
        </button>
      </div>
    </form>
  );
}
