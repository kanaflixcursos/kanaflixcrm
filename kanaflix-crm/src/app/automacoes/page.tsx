import { Pause, Play, Trash2, Zap } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageEyebrow } from "@/components/page-eyebrow";
import { getCurrentWorkspace } from "@/lib/current-workspace";
import { leadStatusLabels, type LeadStatus } from "@/lib/lead-status";
import { AutomationForm } from "./automation-form";
import { deleteAutomationRule, toggleAutomationRule } from "./actions";

export const dynamic = "force-dynamic";

const triggerLabels = { form: "Formulário", utm_source: "UTM source", utm_campaign: "UTM campaign" } as const;

export default async function AutomationsPage() {
  const { supabase, organization } = await getCurrentWorkspace();
  const [{ data: rules }, { data: forms }] = await Promise.all([
    supabase.from("lead_automation_rules").select("id, name, trigger_type, trigger_value, set_status, add_tags, enabled, created_at").order("created_at", { ascending: false }),
    supabase.from("lead_forms").select("id, name").neq("status", "archived").order("name"),
  ]);
  const formNames = new Map((forms ?? []).map((form) => [form.id, form.name]));

  return (
    <AppShell organization={organization}>
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
        <header className="border-b border-border pb-8"><div className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand"><Zap size={22} /></div><PageEyebrow className="mt-6">Operação automática</PageEyebrow><h1 className="mt-3 text-4xl font-medium tracking-[-0.04em] sm:text-5xl">Automações</h1><p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">Organize leads no momento da captura com regras pequenas e previsíveis.</p></header>
        <div className="mt-10 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.75fr)]">
          <section className="self-start rounded-3xl border border-border bg-surface shadow-sm"><div className="border-b border-border p-6"><h2 className="text-lg font-medium">Regras deste workspace</h2><p className="mt-1 text-sm text-muted-foreground">{rules?.length ?? 0} automação(ões)</p></div>{rules?.length ? <div className="divide-y divide-border">{rules.map((rule) => <article key={rule.id} className="p-6"><div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-medium">{rule.name}</h3><span className={`rounded-full px-2.5 py-1 text-xs ${rule.enabled ? "bg-success/10 text-success" : "bg-surface-muted text-muted-foreground"}`}>{rule.enabled ? "Ativa" : "Pausada"}</span></div><p className="mt-2 text-sm text-muted-foreground">{triggerLabels[rule.trigger_type as keyof typeof triggerLabels]} = <span className="font-medium text-foreground">{rule.trigger_type === "form" ? formNames.get(rule.trigger_value) ?? "Formulário removido" : rule.trigger_value}</span></p><p className="mt-2 text-xs text-muted-foreground">{rule.set_status ? `Status: ${leadStatusLabels[rule.set_status as LeadStatus]}` : "Mantém o status"}{rule.add_tags?.length ? ` · Tags: ${rule.add_tags.join(", ")}` : ""}</p></div><div className="flex shrink-0 gap-1"><form action={toggleAutomationRule}><input type="hidden" name="ruleId" value={rule.id} /><input type="hidden" name="enabled" value={String(!rule.enabled)} /><button aria-label={rule.enabled ? "Pausar automação" : "Ativar automação"} className="grid size-10 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground">{rule.enabled ? <Pause size={17} /> : <Play size={17} />}</button></form><form action={deleteAutomationRule}><input type="hidden" name="ruleId" value={rule.id} /><button aria-label="Excluir automação" className="grid size-10 place-items-center rounded-xl text-danger transition-colors hover:bg-surface-muted"><Trash2 size={17} /></button></form></div></div></article>)}</div> : <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center"><Zap className="text-muted-foreground" size={24} /><h2 className="mt-4 text-base font-medium">Nenhuma automação ainda</h2><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Crie uma regra para classificar os próximos leads automaticamente.</p></div>}</section>
          <AutomationForm forms={forms ?? []} />
        </div>
      </div>
    </AppShell>
  );
}
