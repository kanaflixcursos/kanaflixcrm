"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const activitySchema = z.object({
  relatedTo: z.string().regex(/^(contact|deal):[0-9a-f-]{36}$/i, "Selecione um contato ou oportunidade."),
  type: z.enum(["call", "email", "meeting", "note", "task"]),
  description: z.string().trim().min(2, "Descreva a atividade."),
  dueAt: z.string().trim(),
});

export type CreateActivityState = { error?: string; success?: boolean };

export async function createActivity(
  _previousState: CreateActivityState,
  formData: FormData,
): Promise<CreateActivityState> {
  const parsed = activitySchema.safeParse({
    relatedTo: formData.get("relatedTo"),
    type: formData.get("type"),
    description: formData.get("description"),
    dueAt: formData.get("dueAt"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return { error: "Sua sessão expirou. Entre novamente para continuar." };
  const { data: profile } = await supabase.from("profiles").select("current_organization_id").eq("id", userId).maybeSingle();
  if (!profile?.current_organization_id) return { error: "Não foi possível identificar seu espaço de trabalho." };

  const [relationType, relationId] = parsed.data.relatedTo.split(":") as ["contact" | "deal", string];
  const relationTable = relationType === "contact" ? "contacts" : "deals";
  const { data: relatedRecord } = await supabase
    .from(relationTable)
    .select("id")
    .eq("id", relationId)
    .eq("organization_id", profile.current_organization_id)
    .maybeSingle();
  if (!relatedRecord) return { error: "O registro selecionado não pertence a este espaço de trabalho." };

  const { error } = await supabase.from("activities").insert({
    organization_id: profile.current_organization_id,
    owner_id: userId,
    contact_id: relationType === "contact" ? relationId : null,
    deal_id: relationType === "deal" ? relationId : null,
    activity_type: parsed.data.type,
    description: parsed.data.description,
    due_at: parsed.data.dueAt ? new Date(parsed.data.dueAt).toISOString() : null,
  });
  if (error) return { error: "Não foi possível criar a atividade. Tente novamente." };
  revalidatePath("/");
  revalidatePath("/hoje");
  revalidatePath("/atividades");
  revalidatePath(relationType === "contact" ? `/contatos/${relationId}` : `/oportunidades/${relationId}`);
  return { success: true };
}

export async function completeActivity(formData: FormData) {
  const activityId = z.string().uuid().safeParse(formData.get("activityId"));
  if (!activityId.success) return;
  const supabase = await createClient();
  await supabase.from("activities").update({ completed_at: new Date().toISOString() }).eq("id", activityId.data);
  revalidatePath("/");
  revalidatePath("/hoje");
  revalidatePath("/atividades");
}
