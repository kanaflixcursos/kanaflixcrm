import { GitBranch } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageEyebrow } from "@/components/page-eyebrow";
import { getCurrentWorkspace } from "@/lib/current-workspace";
import { PipelineManager } from "./pipeline-manager";

export const dynamic = "force-dynamic";

export default async function PipelineSettingsPage() {
  const { supabase, organization } = await getCurrentWorkspace();
  const { data: pipeline } = await supabase.from("pipelines").select("id, name").order("created_at").limit(1).maybeSingle();
  const { data: stages } = pipeline ? await supabase.from("pipeline_stages").select("id, name, position").eq("pipeline_id", pipeline.id).order("position") : { data: [] };
  const stageIds = (stages ?? []).map((stage) => stage.id);
  const { data: deals } = stageIds.length ? await supabase.from("deals").select("stage_id").in("stage_id", stageIds) : { data: [] };
  const counts = new Map<string, number>(); (deals ?? []).forEach((deal) => { if (deal.stage_id) counts.set(deal.stage_id, (counts.get(deal.stage_id) ?? 0) + 1); });
  return <AppShell organization={organization}><div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14"><header className="border-b border-border pb-8"><div className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand"><GitBranch size={22} /></div><PageEyebrow className="mt-6">Configurações do workspace</PageEyebrow><h1 className="mt-3 text-4xl font-medium tracking-[-0.04em] sm:text-5xl">Pipeline de vendas</h1><p className="mt-3 text-base leading-7 text-muted-foreground sm:text-lg">Defina as etapas que conduzem suas oportunidades.</p></header><div className="mt-10">{pipeline ? <PipelineManager pipeline={{ ...pipeline, stages: (stages ?? []).map((stage) => ({ ...stage, dealsCount: counts.get(stage.id) ?? 0 })) }} /> : <p className="rounded-3xl border border-border bg-surface p-8 text-sm text-muted-foreground">O pipeline está sendo preparado.</p>}</div></div></AppShell>;
}
