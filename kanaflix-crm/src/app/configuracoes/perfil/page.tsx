import { UserRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageEyebrow } from "@/components/page-eyebrow";
import { getCurrentWorkspace } from "@/lib/current-workspace";
import { ProfileSettingsForm } from "./profile-settings-form";
export const dynamic = "force-dynamic";
export default async function ProfileSettingsPage() {
  const { supabase, userId, organization } = await getCurrentWorkspace();
  const [{ data: profile }, { data: userData }, { data: workspaces }] = await Promise.all([
    supabase.from("profiles").select("full_name, avatar_url, current_organization_id").eq("id", userId).single(),
    supabase.auth.getUser(),
    supabase.from("organizations").select("id, name").order("name"),
  ]);
  if (!profile || !userData.user?.email) return null;
  return <AppShell organization={organization}><div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14"><header className="max-w-3xl border-b border-border pb-8"><div className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand"><UserRound size={22} /></div><PageEyebrow className="mt-6">Conta pessoal</PageEyebrow><h1 className="mt-3 text-4xl font-medium tracking-[-0.04em] sm:text-5xl">Seu perfil</h1><p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">Atualize dados de acesso, imagem e o workspace que deve abrir por padrão.</p></header><div className="mt-10"><ProfileSettingsForm profile={profile} email={userData.user.email} workspaces={workspaces ?? []} /></div></div></AppShell>;
}
