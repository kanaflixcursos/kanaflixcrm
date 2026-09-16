"use client";

import { useActionState } from "react";
import { LoaderCircle, Save, Trash2 } from "lucide-react";
import { deleteCompany, updateCompany, type UpdateCompanyState } from "../../actions";

const initialState: UpdateCompanyState = {};

export function CompanyEditForm({ company }: Readonly<{ company: { id: string; name: string; website: string | null } }>) {
  const [state, formAction, isPending] = useActionState(updateCompany, initialState);
  return (
    <div className="space-y-6">
      <form action={formAction} className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <input type="hidden" name="companyId" value={company.id} />
        <div className="grid gap-5">
          <label className="block space-y-2"><span className="text-sm font-medium">Nome da empresa</span><input name="name" required defaultValue={company.name} autoComplete="organization" className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm" /></label>
          <label className="block space-y-2"><span className="text-sm font-medium">Site</span><input name="website" type="url" defaultValue={company.website ?? ""} className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm" placeholder="https://empresa.com" /></label>
        </div>
        {state.error && <p className="mt-5 rounded-2xl bg-brand-soft px-4 py-3 text-sm">{state.error}</p>}
        <div className="mt-8 flex justify-end border-t border-border pt-6"><button type="submit" disabled={isPending} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand px-5 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-hover disabled:opacity-60">{isPending ? <LoaderCircle className="animate-spin" size={18} /> : <Save size={18} />}Salvar alterações</button></div>
      </form>
      <form action={deleteCompany} onSubmit={(event) => { if (!window.confirm("Excluir esta empresa? Os contatos e oportunidades permanecerão, sem vínculo com ela.")) event.preventDefault(); }} className="flex flex-col gap-4 rounded-3xl border border-danger/25 bg-surface p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <input type="hidden" name="companyId" value={company.id} />
        <div><p className="text-sm font-medium">Excluir empresa</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Os contatos e oportunidades continuam existentes, apenas deixam de estar associados a esta empresa.</p></div>
        <button type="submit" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl border border-danger/35 px-4 text-sm font-medium text-danger transition-colors hover:bg-danger hover:text-white"><Trash2 size={17} />Excluir</button>
      </form>
    </div>
  );
}
