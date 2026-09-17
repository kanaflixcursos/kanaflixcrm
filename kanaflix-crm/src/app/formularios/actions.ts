"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { parseLeadFormFields } from "@/lib/lead-forms";
import { createClient } from "@/lib/supabase/server";
import { parseTags } from "@/lib/lead-status";

export type LeadFormActionState = { error?: string; success?: string };

const formSchema = z.object({
  name: z.string().trim().min(2, "Dê um nome ao formulário.").max(80),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífens no endereço.").min(3).max(64),
  title: z.string().trim().min(2, "Informe o título exibido no formulário.").max(120),
  description: z.string().trim().max(500),
  successMessage: z.string().trim().min(3, "Informe a mensagem de confirmação.").max(300),
  redirectUrl: z.string().trim().max(2048).refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, "Informe uma URL completa começando com http:// ou https://."),
  status: z.enum(["draft", "published"]),
  campaignName: z.string().trim().max(300),
  defaultTags: z.string(),
  allowedOrigins: z.string().trim().max(5000),
});

function parseAllowedOrigins(value: string): { data: string[] } | { error: string } {
  const origins = [...new Set(value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean))];
  if (origins.length > 20) return { error: "Informe no máximo 20 origens autorizadas." } as const;
  const normalized: string[] = [];
  for (const value of origins) {
    try {
      const url = new URL(value);
      if (!["http:", "https:"].includes(url.protocol) || url.origin !== value.replace(/\/$/, "") || url.pathname !== "/" || url.search || url.hash) throw new Error();
      normalized.push(url.origin);
    } catch {
      return { error: `Origem inválida: ${value}. Use somente https://dominio.com.` } as const;
    }
  }
  return { data: normalized } as const;
}

async function getActionWorkspace() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return { error: "Sua sessão expirou. Entre novamente." } as const;

  const { data: profile } = await supabase
    .from("profiles")
    .select("current_organization_id")
    .eq("id", userId)
    .maybeSingle();
  if (!profile?.current_organization_id) return { error: "Não foi possível identificar seu workspace." } as const;

  return { supabase, userId, organizationId: profile.current_organization_id } as const;
}

function readFormData(formData: FormData) {
  const parsed = formSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    title: formData.get("title"),
    description: formData.get("description"),
    successMessage: formData.get("successMessage"),
    redirectUrl: formData.get("redirectUrl"),
    status: formData.get("status"),
    campaignName: formData.get("campaignName"),
    defaultTags: String(formData.get("defaultTags") ?? ""),
    allowedOrigins: String(formData.get("allowedOrigins") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message } as const;

  const fields = parseLeadFormFields(String(formData.get("fields") ?? ""));
  if (!fields.success) return { error: fields.error } as const;
  const origins = parseAllowedOrigins(parsed.data.allowedOrigins);
  if (!("data" in origins)) return { error: origins.error } as const;
  return { data: { ...parsed.data, fields: fields.data, allowedOrigins: origins.data } } as const;
}

function refreshForms() {
  revalidatePath("/");
  revalidatePath("/contatos");
  revalidatePath("/formularios");
}

export async function createLeadForm(
  _previous: LeadFormActionState,
  formData: FormData,
): Promise<LeadFormActionState> {
  const input = readFormData(formData);
  if ("error" in input) return input;
  const workspace = await getActionWorkspace();
  if ("error" in workspace) return workspace;

  const { data, error } = await workspace.supabase
    .from("lead_forms")
    .insert({
      organization_id: workspace.organizationId,
      created_by: workspace.userId,
      name: input.data.name,
      slug: input.data.slug,
      title: input.data.title,
      description: input.data.description || null,
      success_message: input.data.successMessage,
      redirect_url: input.data.redirectUrl || null,
      status: input.data.status,
      fields: input.data.fields,
      campaign_name: input.data.campaignName || null,
      default_tags: parseTags(input.data.defaultTags),
      allowed_origins: input.data.allowedOrigins,
    })
    .select("id")
    .single();

  if (error?.code === "23505") return { error: "Esse endereço já está em uso. Escolha outro." };
  if (error || !data) return { error: "Não foi possível criar o formulário. Tente novamente." };

  refreshForms();
  redirect(`/formularios/${data.id}`);
}

export async function updateLeadForm(
  _previous: LeadFormActionState,
  formData: FormData,
): Promise<LeadFormActionState> {
  const formId = z.string().uuid().safeParse(formData.get("formId"));
  const input = readFormData(formData);
  if (!formId.success || "error" in input) return { error: "error" in input ? input.error : "Formulário inválido." };
  const workspace = await getActionWorkspace();
  if ("error" in workspace) return workspace;

  const { error } = await workspace.supabase
    .from("lead_forms")
    .update({
      name: input.data.name,
      slug: input.data.slug,
      title: input.data.title,
      description: input.data.description || null,
      success_message: input.data.successMessage,
      redirect_url: input.data.redirectUrl || null,
      status: input.data.status,
      fields: input.data.fields,
      campaign_name: input.data.campaignName || null,
      default_tags: parseTags(input.data.defaultTags),
      allowed_origins: input.data.allowedOrigins,
    })
    .eq("id", formId.data)
    .eq("organization_id", workspace.organizationId);

  if (error?.code === "23505") return { error: "Esse endereço já está em uso. Escolha outro." };
  if (error) return { error: "Não foi possível salvar as alterações." };

  refreshForms();
  revalidatePath(`/formularios/${formId.data}`);
  redirect(`/formularios/${formId.data}`);
}

export async function setLeadFormStatus(formData: FormData) {
  const formId = z.string().uuid().safeParse(formData.get("formId"));
  const status = z.enum(["draft", "published", "archived"]).safeParse(formData.get("status"));
  if (!formId.success || !status.success) return;
  const workspace = await getActionWorkspace();
  if ("error" in workspace) return;

  await workspace.supabase
    .from("lead_forms")
    .update({ status: status.data })
    .eq("id", formId.data)
    .eq("organization_id", workspace.organizationId);
  refreshForms();
  revalidatePath(`/formularios/${formId.data}`);
}

export async function deleteLeadForm(formData: FormData) {
  const formId = z.string().uuid().safeParse(formData.get("formId"));
  if (!formId.success) return;
  const workspace = await getActionWorkspace();
  if ("error" in workspace) return;

  await workspace.supabase
    .from("lead_forms")
    .delete()
    .eq("id", formId.data)
    .eq("organization_id", workspace.organizationId);
  refreshForms();
  redirect("/formularios");
}
