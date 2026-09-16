import Link from "next/link";
import { Plus, Target } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageEyebrow } from "@/components/page-eyebrow";
import { getCurrentWorkspace } from "@/lib/current-workspace";
import { DealStageSelect } from "./deal-stage-select";
import { DealOutcomeActions } from "./deal-outcome-actions";

export const dynamic = "force-dynamic";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default async function OpportunitiesPage() {
  const { supabase, organization } = await getCurrentWorkspace();
  const [{ data: pipelines }, { data: deals }, { data: contacts }] = await Promise.all([
    supabase.from("pipelines").select("id, name").order("created_at"),
    supabase.from("deals").select("id, title, amount, stage_id, contact_id, expected_close_date, outcome").order("created_at", { ascending: false }),
    supabase.from("contacts").select("id, full_name"),
  ]);
  const pipeline = pipelines?.[0];
  const { data: stages } = pipeline
    ? await supabase.from("pipeline_stages").select("id, name, position").eq("pipeline_id", pipeline.id).order("position")
    : { data: [] };
  const contactsById = new Map((contacts ?? []).map((contact) => [contact.id, contact.full_name]));

  return (
    <AppShell organization={organization}>
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
        <header className="flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <PageEyebrow>{pipeline?.name ?? "Pipeline"}</PageEyebrow>
            <h1 className="mt-3 text-4xl font-medium tracking-[-0.04em] sm:text-5xl">Oportunidades</h1>
            <p className="mt-3 text-base text-muted-foreground sm:text-lg">Visualize as negociações em cada etapa da venda.</p>
          </div>
          <Link href="/oportunidades/novo" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand px-5 text-sm font-medium text-brand-foreground shadow-sm transition-colors hover:bg-brand-hover">
            <Plus size={18} aria-hidden="true" />
            Nova oportunidade
          </Link>
        </header>

        <section className="mt-10 grid gap-4 xl:grid-cols-4" aria-label="Pipeline de oportunidades">
          {(stages ?? []).map((stage) => {
            const stageDeals = (deals ?? []).filter((deal) => deal.stage_id === stage.id);
            const total = stageDeals.reduce((sum, deal) => sum + Number(deal.amount), 0);
            return (
              <article key={stage.id} className="min-h-80 rounded-3xl border border-border bg-surface-muted/55 p-4">
                <div className="flex items-start justify-between gap-3 px-1 pt-1">
                  <div>
                    <h2 className="text-sm font-medium">{stage.name}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">{stageDeals.length} oportunidade(s) · {currency.format(total)}</p>
                  </div>
                  <span className="grid size-8 place-items-center rounded-xl bg-surface text-xs font-medium text-muted-foreground">{stageDeals.length}</span>
                </div>
                <div className="mt-4 space-y-3">
                  {stageDeals.map((deal) => (
                    <div key={deal.id} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
                      <Link href={`/oportunidades/${deal.id}`} className="text-sm font-medium transition-colors hover:text-brand">{deal.title}</Link>
                      <p className="mt-2 text-sm text-muted-foreground">{deal.contact_id ? contactsById.get(deal.contact_id) ?? "Contato" : "Sem contato"}</p>
                      <div className="mt-4 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{currency.format(Number(deal.amount))}</span>
                        {deal.expected_close_date && <span>{new Intl.DateTimeFormat("pt-BR").format(new Date(`${deal.expected_close_date}T12:00:00`))}</span>}
                      </div>
                      {deal.outcome === "open" ? <DealStageSelect dealId={deal.id} stageId={deal.stage_id} stages={stages ?? []} /> : <div className="mt-4"><DealOutcomeActions dealId={deal.id} outcome={deal.outcome as "won" | "lost"} /></div>}
                    </div>
                  ))}
                  {stageDeals.length === 0 && <p className="rounded-2xl border border-dashed border-border px-4 py-5 text-center text-xs leading-5 text-muted-foreground">Arraste ou crie uma oportunidade para começar.</p>}
                </div>
              </article>
            );
          })}
        </section>

        {!stages?.length && (
          <div className="mt-10 flex flex-col items-center rounded-3xl border border-dashed border-border bg-surface p-10 text-center">
            <div className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand"><Target size={22} /></div>
            <h2 className="mt-5 text-lg font-medium">Seu pipeline está sendo preparado</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Atualize a página em instantes para ver as etapas padrão do seu espaço de trabalho.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
