"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { leadStatuses, parseTags } from "@/lib/lead-status";

const leadStatusValues = leadStatuses.map((status) => status.value) as ["new", ...("reviewing" | "qualified" | "follow_up" | "converted" | "discarded")[]];

const contactSchema = z.object({
  fullName: z.string().trim().min(2, "Informe o nome do contato."),
  email: z.string().trim().email("Informe um e-mail válido.").or(z.literal("")),
  phone: z.string().trim(),
  companyId: z.string().uuid().or(z.literal("")),
  source: z.string().trim(),
  notes: z.string().trim(),
  status: z.enum(leadStatusValues),
  tags: z.string(),
  discardReason: z.string().trim(),
  utmSource: z.string().trim(),
  utmMedium: z.string().trim(),
  utmCampaign: z.string().trim(),
});

function readLead(formData: FormData) {
  return {
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    companyId: formData.get("companyId"),
    source: formData.get("source"),
    notes: formData.get("notes"),
    status: formData.get("status") ?? "new",
    tags: String(formData.get("tags") ?? ""),
    discardReason: formData.get("discardReason"),
    utmSource: formData.get("utmSource"),
    utmMedium: formData.get("utmMedium"),
    utmCampaign: formData.get("utmCampaign"),
  };
}

export type CreateContactState = { error?: string };
export type UpdateContactState = { error?: string };
export type BulkLeadState = { error?: string; success?: string };

export async function quickUpdateLeadStatus(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("contactId"));
  const status = z.enum(leadStatusValues).safeParse(formData.get("status"));
  if (!id.success || !status.success) return;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return;
  const { data: profile } = await supabase.from("profiles").select("current_organization_id").eq("id", userId).maybeSingle();
  if (!profile?.current_organization_id) return;
  await supabase.from("contacts").update({ status: status.data }).eq("id", id.data).eq("organization_id", profile.current_organization_id);
  revalidatePath("/");
  revalidatePath("/hoje");
  revalidatePath("/contatos");
  revalidatePath(`/contatos/${id.data}`);
  revalidatePath("/relatorios");
}

export async function bulkUpdateLeadStatus(_previousState: BulkLeadState, formData: FormData): Promise<BulkLeadState> {
  const ids = z.array(z.string().uuid()).min(1).max(100).safeParse(formData.getAll("leadIds"));
  const status = z.enum(leadStatusValues).safeParse(formData.get("bulkStatus"));
  if (!ids.success || !status.success) return { error: "Selecione pelo menos um lead e um status." };

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return { error: "Sua sessão expirou." };
  const { data: profile } = await supabase.from("profiles").select("current_organization_id").eq("id", userId).maybeSingle();
  if (!profile?.current_organization_id) return { error: "Não foi possível identificar o workspace." };

  const { error } = await supabase.from("contacts").update({ status: status.data }).in("id", ids.data).eq("organization_id", profile.current_organization_id);
  if (error) return { error: "Não foi possível atualizar os leads selecionados." };
  revalidatePath("/");
  revalidatePath("/hoje");
  revalidatePath("/contatos");
  revalidatePath("/relatorios");
  return { success: `${ids.data.length} lead(s) atualizado(s).` };
}

export async function createContact(
  _previousState: CreateContactState,
  formData: FormData,
): Promise<CreateContactState> {
  const parsed = contactSchema.safeParse(readLead(formData));

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

  if (!profile?.current_organization_id) {
    return { error: "Não foi possível identificar seu espaço de trabalho." };
  }

  const { data: lead, error } = await supabase.from("contacts").insert({
    owner_id: userId,
    organization_id: profile.current_organization_id,
    full_name: parsed.data.fullName,
    company_id: parsed.data.companyId || null,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    source: parsed.data.source || null,
    notes: parsed.data.notes || null,
    status: parsed.data.status,
    tags: parseTags(parsed.data.tags),
    discard_reason: parsed.data.status === "discarded" ? parsed.data.discardReason || null : null,
    utm_source: parsed.data.utmSource || null,
    utm_medium: parsed.data.utmMedium || null,
    utm_campaign: parsed.data.utmCampaign || null,
  }).select("id").single();

  if (error) return { error: "Não foi possível criar o contato. Tente novamente." };

  await supabase.from("lead_events").insert({
    organization_id: profile.current_organization_id,
    contact_id: lead.id,
    event_name: "lead.created",
    source: "crm",
    properties: { method: "manual" },
  });

  revalidatePath("/");
  revalidatePath("/hoje");
  revalidatePath("/contatos");
  revalidatePath("/relatorios");
  redirect("/contatos");
}

export async function updateContact(
  _previousState: UpdateContactState,
  formData: FormData,
): Promise<UpdateContactState> {
  const contactId = z.string().uuid().safeParse(formData.get("contactId"));
  const parsed = contactSchema.safeParse(readLead(formData));

  if (!contactId.success || !parsed.success) {
    return { error: parsed.success ? "Contato inválido." : parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return { error: "Sua sessão expirou. Entre novamente para continuar." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("current_organization_id")
    .eq("id", userId)
    .maybeSingle();
  if (!profile?.current_organization_id) {
    return { error: "Não foi possível identificar seu espaço de trabalho." };
  }

  const { error } = await supabase
    .from("contacts")
    .update({
      full_name: parsed.data.fullName,
      company_id: parsed.data.companyId || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      source: parsed.data.source || null,
      notes: parsed.data.notes || null,
      status: parsed.data.status,
      tags: parseTags(parsed.data.tags),
      discard_reason: parsed.data.status === "discarded" ? parsed.data.discardReason || null : null,
      utm_source: parsed.data.utmSource || null,
      utm_medium: parsed.data.utmMedium || null,
      utm_campaign: parsed.data.utmCampaign || null,
    })
    .eq("id", contactId.data)
    .eq("organization_id", profile.current_organization_id);

  if (error) return { error: "Não foi possível atualizar o contato. Tente novamente." };

  revalidatePath("/");
  revalidatePath("/hoje");
  revalidatePath("/contatos");
  revalidatePath("/relatorios");
  revalidatePath(`/contatos/${contactId.data}`);
  redirect(`/contatos/${contactId.data}`);
}

export async function deleteContact(formData: FormData) {
  const contactId = z.string().uuid().safeParse(formData.get("contactId"));
  if (!contactId.success) return;

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("current_organization_id")
    .eq("id", userId)
    .maybeSingle();
  if (!profile?.current_organization_id) return;

  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", contactId.data)
    .eq("organization_id", profile.current_organization_id);
  if (error) return;

  revalidatePath("/");
  revalidatePath("/contatos");
  revalidatePath("/atividades");
  revalidatePath("/oportunidades");
  redirect("/contatos");
}
