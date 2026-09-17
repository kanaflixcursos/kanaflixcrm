"use client";

import { useActionState } from "react";
import { FileUp, LoaderCircle } from "lucide-react";
import { importContacts, type ImportLeadState } from "../actions";

const initialState: ImportLeadState = {};

export function ImportContactsForm() {
  const [state, formAction, pending] = useActionState(importContacts, initialState);
  return <form action={formAction} encType="multipart/form-data" className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
    <div className="rounded-2xl border border-dashed border-border bg-surface-muted p-6"><label className="block"><span className="text-sm font-medium">Arquivo CSV</span><input name="file" type="file" required accept=".csv,text/csv" className="mt-3 block w-full text-sm file:mr-4 file:rounded-xl file:border-0 file:bg-brand file:px-4 file:py-2.5 file:font-medium file:text-brand-foreground hover:file:bg-brand-hover" /><span className="mt-3 block text-xs leading-5 text-muted-foreground">Até 5 MB e 10.000 linhas. O cabeçalho deve conter `nome` ou `name`; e-mail e telefone são opcionais, mas pelo menos um dos dois é necessário.</span></label></div>
    <div className="mt-6 rounded-2xl bg-surface-muted p-4 text-sm leading-6 text-muted-foreground"><p className="font-medium text-foreground">Colunas reconhecidas</p><p className="mt-1">nome, email, telefone, origem, status, tags, observações, utm_source, utm_medium e utm_campaign.</p><p className="mt-2">Linhas duplicadas no workspace serão ignoradas e aparecerão no relatório.</p></div>
    {state.error && <p className="mt-5 rounded-2xl bg-brand-soft px-4 py-3 text-sm" role="alert">{state.error}</p>}
    {state.success && <div className="mt-5 rounded-2xl bg-brand-soft px-4 py-3 text-sm" role="status"><p>{state.success}</p>{state.details?.length ? <ul className="mt-3 list-disc space-y-1 pl-5 text-muted-foreground">{state.details.map((detail) => <li key={detail}>{detail}</li>)}</ul> : null}</div>}
    <div className="mt-8 flex justify-end border-t border-border pt-6"><button disabled={pending} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-brand px-5 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60">{pending ? <LoaderCircle className="animate-spin" size={18} /> : <FileUp size={18} />}{pending ? "Importando..." : "Importar contatos"}</button></div>
  </form>;
}
