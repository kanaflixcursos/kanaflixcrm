"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentWorkspace } from "@/lib/current-workspace";
import { parseTags } from "@/lib/lead-status";

const ruleSchema = z.object({
  name: z.string().trim().min(2, "Dê um nome para a regra.").max(100),
  triggerType: z.enum(["form", "utm_source", "utm_campaign"]),
  triggerValue: z.string().trim().min(1, "Informe quando a regra deve rodar.").max(300),
  setStatus: z.enum(["", "new", "reviewing", "qualified", "follow_up", "converted", "discarded"]),
  tags: z.string(),
});

export type AutomationState = { error?: string; success?: string };

export async function createAutomationRule(_state: AutomationState, formData: FormData): Promise<AutomationState> {
  const parsed = ruleSchema.safeParse({
    name: formData.get("name"),
    triggerType: formData.get("triggerType"),
    triggerValue: formData.get("triggerValue"),
    setStatus: formData.get("setStatus"),
    tags: String(formData.get("tags") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const tags = parseTags(parsed.data.tags);
  if (!parsed.data.setStatus && !tags.length) return { error: "Escolha um status ou adicione pelo menos uma tag." };

  const { supabase, organization } = await getCurrentWorkspace();
  if (parsed.data.triggerType === "form") {
    const { data: form } = await supabase.from("lead_forms").select("id").eq("id", parsed.data.triggerValue).maybeSingle();
    if (!form) return { error: "O formulário selecionado não pertence a este workspace." };
  }

  const { error } = await supabase.from("lead_automation_rules").insert({
    organization_id: organization.id,
    name: parsed.data.name,
    trigger_type: parsed.data.triggerType,
    trigger_value: parsed.data.triggerValue,
    set_status: parsed.data.setStatus || null,
    add_tags: tags,
  });
  if (error) return { error: "Não foi possível criar a automação." };
  revalidatePath("/automacoes");
  return { success: "Automação criada." };
}

export async function toggleAutomationRule(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("ruleId"));
  const enabled = z.enum(["true", "false"]).safeParse(formData.get("enabled"));
  if (!id.success || !enabled.success) return;
  const { supabase, organization } = await getCurrentWorkspace();
  await supabase.from("lead_automation_rules").update({ enabled: enabled.data === "true" }).eq("id", id.data).eq("organization_id", organization.id);
  revalidatePath("/automacoes");
}

export async function deleteAutomationRule(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("ruleId"));
  if (!id.success) return;
  const { supabase, organization } = await getCurrentWorkspace();
  await supabase.from("lead_automation_rules").delete().eq("id", id.data).eq("organization_id", organization.id);
  revalidatePath("/automacoes");
}
