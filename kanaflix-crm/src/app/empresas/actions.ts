"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const companySchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da empresa."),
  website: z.string().trim().url("Informe uma URL válida.").or(z.literal("")),
});

export type CreateCompanyState = { error?: string };
export type UpdateCompanyState = { error?: string };

export async function createCompany(
  _previousState: CreateCompanyState,
  formData: FormData,
): Promise<CreateCompanyState> {
  const parsed = companySchema.safeParse({ name: formData.get("name"), website: formData.get("website") });
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

  const { error } = await supabase.from("companies").insert({
    organization_id: profile.current_organization_id,
    owner_id: userId,
    name: parsed.data.name,
    website: parsed.data.website || null,
  });
  if (error) return { error: "Não foi possível criar a empresa. Tente novamente." };

  revalidatePath("/empresas");
  revalidatePath("/contatos");
  revalidatePath("/contatos/novo");
  redirect("/empresas");
}

export async function updateCompany(
  _previousState: UpdateCompanyState,
  formData: FormData,
): Promise<UpdateCompanyState> {
  const companyId = z.string().uuid().safeParse(formData.get("companyId"));
  const parsed = companySchema.safeParse({ name: formData.get("name"), website: formData.get("website") });
  if (!companyId.success || !parsed.success) return { error: parsed.success ? "Empresa inválida." : parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return { error: "Sua sessão expirou. Entre novamente para continuar." };
  const { data: profile } = await supabase.from("profiles").select("current_organization_id").eq("id", userId).maybeSingle();
  if (!profile?.current_organization_id) return { error: "Não foi possível identificar seu espaço de trabalho." };

  const { error } = await supabase
    .from("companies")
    .update({ name: parsed.data.name, website: parsed.data.website || null })
    .eq("id", companyId.data)
    .eq("organization_id", profile.current_organization_id);
  if (error) return { error: "Não foi possível atualizar a empresa. Tente novamente." };

  revalidatePath("/empresas");
  revalidatePath(`/empresas/${companyId.data}`);
  revalidatePath("/contatos");
  revalidatePath("/contatos/novo");
  redirect(`/empresas/${companyId.data}`);
}

export async function deleteCompany(formData: FormData) {
  const companyId = z.string().uuid().safeParse(formData.get("companyId"));
  if (!companyId.success) return;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return;
  const { data: profile } = await supabase.from("profiles").select("current_organization_id").eq("id", userId).maybeSingle();
  if (!profile?.current_organization_id) return;

  const { error } = await supabase
    .from("companies")
    .delete()
    .eq("id", companyId.data)
    .eq("organization_id", profile.current_organization_id);
  if (error) return;

  revalidatePath("/empresas");
  revalidatePath("/contatos");
  revalidatePath("/contatos/novo");
  revalidatePath("/oportunidades");
  redirect("/empresas");
}
