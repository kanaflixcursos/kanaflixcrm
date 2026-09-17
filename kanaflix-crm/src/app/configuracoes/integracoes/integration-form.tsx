"use client";

import { useActionState } from "react";
import { LoaderCircle, Save } from "lucide-react";
import { saveTrackingIntegration, type IntegrationState } from "./actions";

const initialState: IntegrationState = {};

export function IntegrationForm({ provider, title, description, externalId, status, placeholder }: Readonly<{ provider: "meta_pixel" | "google_tag_manager"; title: string; description: string; externalId?: string; status: string; placeholder: string }>) {
  const [state, formAction, isPending] = useActionState(saveTrackingIntegration, initialState);
  return (
    <form action={formAction} className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <input type="hidden" name="provider" value={provider} />
      <div><h2 className="text-lg font-medium">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></div>
      <label className="mt-6 block space-y-2"><span className="text-sm font-medium">Identificador</span><input name="externalId" required defaultValue={externalId ?? ""} placeholder={placeholder} className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm" /></label>
      <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-surface-muted px-4 py-3 text-sm"><span className="text-muted-foreground">Status</span><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status === "configured" ? "bg-brand-soft text-brand" : status === "active" ? "bg-success/10 text-success" : "bg-surface text-muted-foreground"}`}>{status === "configured" ? "Configurada · validação pendente" : status === "active" ? "Ativa" : status === "paused" ? "Pausada" : "Não configurada"}</span></div>
      <label className="mt-3 flex items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm"><input name="enabled" type="checkbox" defaultChecked={status === "configured" || status === "active"} className="size-4 accent-[var(--brand)]" /><span>Habilitar após a validação técnica</span></label>
      {state.error && <p className="mt-5 rounded-2xl bg-brand-soft px-4 py-3 text-sm">{state.error}</p>}
      {state.success && <p className="mt-5 text-sm text-success">{state.success}</p>}
      <button disabled={isPending} className="mt-6 inline-flex h-11 items-center gap-2 rounded-2xl bg-brand px-4 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-hover disabled:opacity-60">{isPending ? <LoaderCircle className="animate-spin" size={17} /> : <Save size={17} />}Salvar</button>
    </form>
  );
}
