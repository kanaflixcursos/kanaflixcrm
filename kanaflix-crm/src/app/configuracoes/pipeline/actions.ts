"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

type PipelineActionState = { error?: string; success?: string };
const nameSchema = z.string().trim().min(2, "Informe pelo menos 2 caracteres.").max(80, "Use no máximo 80 caracteres.");

async function getActionWorkspace() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return { error: "Sua sessão expirou. Entre novamente." } as const;
  const { data: profile } = await supabase.from("profiles").select("current_organization_id").eq("id", userId).maybeSingle();
  if (!profile?.current_organization_id) return { error: "Não foi possível identificar seu espaço de trabalho." } as const;
  return { supabase, organizationId: profile.current_organization_id } as const;
}

function refreshPipeline() {
  revalidatePath("/");
  revalidatePath("/oportunidades");
  revalidatePath("/oportunidades/novo");
  revalidatePath("/configuracoes/pipeline");
}

export async function renamePipeline(_previous: PipelineActionState, formData: FormData): Promise<PipelineActionState> {
  const pipelineId = z.string().uuid().safeParse(formData.get("pipelineId"));
  const name = nameSchema.safeParse(formData.get("name"));
  if (!pipelineId.success || !name.success) return { error: name.success ? "Pipeline inválido." : name.error.issues[0]?.message };
  const workspace = await getActionWorkspace();
  if ("error" in workspace) return workspace;
  const { error } = await workspace.supabase.from("pipelines").update({ name: name.data }).eq("id", pipelineId.data).eq("organization_id", workspace.organizationId);
  if (error) return { error: "Não foi possível salvar o pipeline." };
  refreshPipeline();
  return { success: "Nome do pipeline atualizado." };
}

export async function createPipelineStage(_previous: PipelineActionState, formData: FormData): Promise<PipelineActionState> {
  const pipelineId = z.string().uuid().safeParse(formData.get("pipelineId"));
  const name = nameSchema.safeParse(formData.get("name"));
  if (!pipelineId.success || !name.success) return { error: name.success ? "Pipeline inválido." : name.error.issues[0]?.message };
  const workspace = await getActionWorkspace();
  if ("error" in workspace) return workspace;
  const { data: pipeline } = await workspace.supabase.from("pipelines").select("id").eq("id", pipelineId.data).eq("organization_id", workspace.organizationId).maybeSingle();
  if (!pipeline) return { error: "Este pipeline não pertence ao workspace atual." };
  const { data: lastStage } = await workspace.supabase.from("pipeline_stages").select("position").eq("pipeline_id", pipelineId.data).order("position", { ascending: false }).limit(1).maybeSingle();
  const { error } = await workspace.supabase.from("pipeline_stages").insert({ pipeline_id: pipelineId.data, name: name.data, position: (lastStage?.position ?? -1) + 1 });
  if (error) return { error: "Não foi possível criar a etapa." };
  refreshPipeline();
  return { success: "Etapa criada." };
}

export async function renamePipelineStage(_previous: PipelineActionState, formData: FormData): Promise<PipelineActionState> {
  const stageId = z.string().uuid().safeParse(formData.get("stageId"));
  const name = nameSchema.safeParse(formData.get("name"));
  if (!stageId.success || !name.success) return { error: name.success ? "Etapa inválida." : name.error.issues[0]?.message };
  const workspace = await getActionWorkspace();
  if ("error" in workspace) return workspace;
  const { error } = await workspace.supabase.from("pipeline_stages").update({ name: name.data }).eq("id", stageId.data);
  if (error) return { error: "Não foi possível renomear a etapa." };
  refreshPipeline();
  return { success: "Etapa atualizada." };
}

export async function deletePipelineStage(formData: FormData): Promise<PipelineActionState> {
  const stageId = z.string().uuid().safeParse(formData.get("stageId"));
  const pipelineId = z.string().uuid().safeParse(formData.get("pipelineId"));
  if (!stageId.success || !pipelineId.success) return { error: "Etapa inválida." };
  const workspace = await getActionWorkspace();
  if ("error" in workspace) return workspace;
  const { data: pipeline } = await workspace.supabase.from("pipelines").select("id").eq("id", pipelineId.data).eq("organization_id", workspace.organizationId).maybeSingle();
  if (!pipeline) return { error: "Este pipeline não pertence ao workspace atual." };
  const [{ count: stagesCount }, { count: dealsCount }] = await Promise.all([
    workspace.supabase.from("pipeline_stages").select("id", { count: "exact", head: true }).eq("pipeline_id", pipelineId.data),
    workspace.supabase.from("deals").select("id", { count: "exact", head: true }).eq("stage_id", stageId.data),
  ]);
  if ((stagesCount ?? 0) <= 1) return { error: "O pipeline precisa ter ao menos uma etapa." };
  if (dealsCount) return { error: "Mova as oportunidades desta etapa antes de removê-la." };
  const { error } = await workspace.supabase.from("pipeline_stages").delete().eq("id", stageId.data).eq("pipeline_id", pipelineId.data);
  if (error) return { error: "Não foi possível remover a etapa." };
  const { data: stages } = await workspace.supabase.from("pipeline_stages").select("id").eq("pipeline_id", pipelineId.data).order("position");
  await workspace.supabase.rpc("reorder_pipeline_stages", { target_pipeline_id: pipelineId.data, ordered_stage_ids: (stages ?? []).map((stage) => stage.id) });
  refreshPipeline();
  return { success: "Etapa removida." };
}

export async function reorderPipelineStages(pipelineId: string, orderedStageIds: string[]): Promise<PipelineActionState> {
  if (!z.string().uuid().safeParse(pipelineId).success || !z.array(z.string().uuid()).min(1).safeParse(orderedStageIds).success) return { error: "Ordem inválida." };
  const workspace = await getActionWorkspace();
  if ("error" in workspace) return workspace;
  const { error } = await workspace.supabase.rpc("reorder_pipeline_stages", { target_pipeline_id: pipelineId, ordered_stage_ids: orderedStageIds });
  if (error) return { error: "Não foi possível reordenar as etapas." };
  refreshPipeline();
  return { success: "Ordem atualizada." };
}
