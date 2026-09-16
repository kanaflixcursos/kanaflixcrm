"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const dealSchema = z.object({
  title: z.string().trim().min(2, "Informe o nome da oportunidade."),
  contactId: z.string().uuid("Selecione um contato."),
  stageId: z.string().uuid("Selecione uma etapa."),
  amount: z.coerce.number().min(0, "Informe um valor válido."),
  expectedCloseDate: z.string().trim(),
});

export type CreateDealState = { error?: string };
export type UpdateDealState = { error?: string };

export async function createDeal(
  _previousState: CreateDealState,
  formData: FormData,
): Promise<CreateDealState> {
  const parsed = dealSchema.safeParse({
    title: formData.get("title"),
    contactId: formData.get("contactId"),
    stageId: formData.get("stageId"),
    amount: formData.get("amount"),
    expectedCloseDate: formData.get("expectedCloseDate"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return { error: "Sua sessão expirou. Entre novamente para continuar." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("current_organization_id")
    .eq("id", userId)
    .maybeSingle();
  if (!profile?.current_organization_id) return { error: "Não foi possível identificar seu espaço de trabalho." };

  const { data: contact } = await supabase
    .from("contacts")
    .select("company_id")
    .eq("id", parsed.data.contactId)
    .eq("organization_id", profile.current_organization_id)
    .maybeSingle();
  if (!contact) return { error: "O contato selecionado não pertence a este espaço de trabalho." };

  const { error } = await supabase.from("deals").insert({
    organization_id: profile.current_organization_id,
    owner_id: userId,
    contact_id: parsed.data.contactId,
    company_id: contact.company_id,
    stage_id: parsed.data.stageId,
    title: parsed.data.title,
    amount: parsed.data.amount,
    expected_close_date: parsed.data.expectedCloseDate || null,
  });

  if (error) return { error: "Não foi possível criar a oportunidade. Tente novamente." };
  revalidatePath("/");
  revalidatePath("/oportunidades");
  redirect("/oportunidades");
}

export async function updateDealStage(formData: FormData) {
  const parsed = z.object({ dealId: z.string().uuid(), stageId: z.string().uuid() }).safeParse({
    dealId: formData.get("dealId"),
    stageId: formData.get("stageId"),
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("deals")
    .update({ stage_id: parsed.data.stageId })
    .eq("id", parsed.data.dealId)
    .eq("outcome", "open");

  if (!error) {
    revalidatePath("/");
    revalidatePath("/oportunidades");
  }
}

export async function updateDeal(
  _previousState: UpdateDealState,
  formData: FormData,
): Promise<UpdateDealState> {
  const dealId = z.string().uuid().safeParse(formData.get("dealId"));
  const parsed = dealSchema.safeParse({
    title: formData.get("title"),
    contactId: formData.get("contactId"),
    stageId: formData.get("stageId"),
    amount: formData.get("amount"),
    expectedCloseDate: formData.get("expectedCloseDate"),
  });
  if (!dealId.success || !parsed.success) return { error: parsed.success ? "Oportunidade inválida." : parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return { error: "Sua sessão expirou. Entre novamente para continuar." };
  const { data: profile } = await supabase.from("profiles").select("current_organization_id").eq("id", userId).maybeSingle();
  if (!profile?.current_organization_id) return { error: "Não foi possível identificar seu espaço de trabalho." };

  const { data: contact } = await supabase
    .from("contacts")
    .select("company_id")
    .eq("id", parsed.data.contactId)
    .eq("organization_id", profile.current_organization_id)
    .maybeSingle();
  if (!contact) return { error: "O contato selecionado não pertence a este espaço de trabalho." };

  const { error } = await supabase
    .from("deals")
    .update({
      title: parsed.data.title,
      contact_id: parsed.data.contactId,
      company_id: contact.company_id,
      stage_id: parsed.data.stageId,
      amount: parsed.data.amount,
      expected_close_date: parsed.data.expectedCloseDate || null,
    })
    .eq("id", dealId.data)
    .eq("organization_id", profile.current_organization_id);
  if (error) return { error: "Não foi possível atualizar a oportunidade. Tente novamente." };

  revalidatePath("/");
  revalidatePath("/oportunidades");
  revalidatePath(`/oportunidades/${dealId.data}`);
  redirect(`/oportunidades/${dealId.data}`);
}

export async function deleteDeal(formData: FormData) {
  const dealId = z.string().uuid().safeParse(formData.get("dealId"));
  if (!dealId.success) return;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return;
  const { data: profile } = await supabase.from("profiles").select("current_organization_id").eq("id", userId).maybeSingle();
  if (!profile?.current_organization_id) return;
  const { error } = await supabase
    .from("deals")
    .delete()
    .eq("id", dealId.data)
    .eq("organization_id", profile.current_organization_id);
  if (error) return;
  revalidatePath("/");
  revalidatePath("/oportunidades");
  revalidatePath("/atividades");
  redirect("/oportunidades");
}

export async function updateDealOutcome(formData: FormData) {
  const parsed = z.object({
    dealId: z.string().uuid(),
    outcome: z.enum(["open", "won", "lost"]),
  }).safeParse({ dealId: formData.get("dealId"), outcome: formData.get("outcome") });
  if (!parsed.success) return { error: "Não foi possível atualizar a oportunidade." };

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return { error: "Sua sessão expirou. Entre novamente." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("current_organization_id")
    .eq("id", userId)
    .maybeSingle();
  if (!profile?.current_organization_id) return { error: "Não foi possível identificar seu espaço de trabalho." };

  const { error } = await supabase
    .from("deals")
    .update({
      outcome: parsed.data.outcome,
      closed_at: parsed.data.outcome === "open" ? null : new Date().toISOString(),
    })
    .eq("id", parsed.data.dealId)
    .eq("organization_id", profile.current_organization_id);
  if (error) return { error: "Não foi possível atualizar a oportunidade. Tente novamente." };

  revalidatePath("/");
  revalidatePath("/oportunidades");
  revalidatePath(`/oportunidades/${parsed.data.dealId}`);
  return { success: true };
}
