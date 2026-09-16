"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Informe seu nome."),
  email: z.string().trim().email("Informe um e-mail válido."),
  password: z.string().trim().refine((value) => value === "" || value.length >= 8, "A senha deve ter ao menos 8 caracteres."),
  avatarUrl: z.string().trim().url("Informe uma URL válida.").or(z.literal("")),
  defaultWorkspaceId: z.string().uuid("Selecione um workspace válido."),
});

export type ProfileSettingsState = { error?: string; success?: string };

export async function updateProfileSettings(_previousState: ProfileSettingsState, formData: FormData): Promise<ProfileSettingsState> {
  const parsed = profileSchema.safeParse({ fullName: formData.get("fullName"), email: formData.get("email"), password: formData.get("password"), avatarUrl: formData.get("avatarUrl"), defaultWorkspaceId: formData.get("defaultWorkspaceId") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return { error: "Sua sessão expirou. Entre novamente." };
  const { data: userData } = await supabase.auth.getUser();
  const updates: { email?: string; password?: string; data: { full_name: string } } = { data: { full_name: parsed.data.fullName } };
  if (parsed.data.email !== userData.user?.email) updates.email = parsed.data.email;
  if (parsed.data.password) updates.password = parsed.data.password;
  const { error: authError } = await supabase.auth.updateUser(updates);
  if (authError) return { error: authError.message };
  const { error: profileError } = await supabase.from("profiles").update({ full_name: parsed.data.fullName, avatar_url: parsed.data.avatarUrl || null }).eq("id", userId);
  if (profileError) return { error: "Não foi possível salvar seu perfil." };
  const { error: workspaceError } = await supabase.rpc("switch_organization", { target_organization_id: parsed.data.defaultWorkspaceId });
  if (workspaceError) return { error: "Não foi possível definir o workspace padrão." };
  revalidatePath("/", "layout");
  return { success: updates.email ? "Perfil atualizado. Confirme o novo e-mail para concluir a troca." : "Perfil atualizado." };
}
