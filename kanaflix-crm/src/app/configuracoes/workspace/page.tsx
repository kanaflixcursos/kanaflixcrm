import { Building2, Palette } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageEyebrow } from "@/components/page-eyebrow";
import { BrandColorControl } from "@/components/brand-color-control";
import { getCurrentWorkspace } from "@/lib/current-workspace";
import { WorkspaceSettingsForm } from "./workspace-settings-form";
import { MembersManager } from "./members-manager";
export const dynamic = "force-dynamic";
export default async function WorkspaceSettingsPage() {
 const { supabase, organization, userId } = await getCurrentWorkspace();
 const [{ data: workspace }, { data: memberRows }] = await Promise.all([supabase.from("organizations").select("name, logo_url").eq("id", organization.id).single(), supabase.from("organization_members").select("user_id, role").eq("organization_id", organization.id)]);
 const ids = memberRows?.map((member) => member.user_id) ?? [];
 const { data: profiles } = ids.length ? await supabase.from("profiles").select("id, full_name").in("id", ids) : { data: [] };
 const profileNames = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name ?? "Usuário"]));
 const currentRole = memberRows?.find((member) => member.user_id === userId)?.role ?? "member";
 if (!workspace) return null;
 return <AppShell organization={organization}><div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14"><header className="max-w-3xl border-b border-border pb-8"><div className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand"><Building2 size={22} /></div><PageEyebrow className="mt-6">Ambiente compartilhado</PageEyebrow><h1 className="mt-3 text-4xl font-medium tracking-[-0.04em] sm:text-5xl">Configurações do workspace</h1><p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">Gerencie identidade, pessoas e a propriedade deste espaço de trabalho.</p></header><div className="mt-10"><WorkspaceSettingsForm workspace={workspace} /><section className="mt-12 max-w-3xl rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8"><div className="grid size-11 place-items-center rounded-2xl bg-brand-soft text-brand"><Palette size={20} /></div><h2 className="mt-5 text-lg font-medium">Cor da marca</h2><p className="mt-2 text-sm text-muted-foreground">A cor é compartilhada por todo o workspace.</p><div className="mt-6"><BrandColorControl /></div></section><MembersManager currentUserId={userId} currentRole={currentRole} members={(memberRows ?? []).map((member) => ({ userId: member.user_id, role: member.role, name: profileNames.get(member.user_id) ?? "Usuário" }))} /></div></div></AppShell>;
}
