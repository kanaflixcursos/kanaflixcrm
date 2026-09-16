"use client";

import { useActionState } from "react";
import { LoaderCircle, Save } from "lucide-react";
import { ImageUploadField } from "@/components/image-upload-field";
import { updateProfileSettings, type ProfileSettingsState } from "./actions";

const initialState: ProfileSettingsState = {};

export function ProfileSettingsForm({ profile, email, workspaces }: Readonly<{ profile: { full_name: string | null; avatar_url: string | null; current_organization_id: string | null }; email: string; workspaces: { id: string; name: string }[] }>) {
  const [state, formAction, isPending] = useActionState(updateProfileSettings, initialState);
  return <form action={formAction} className="max-w-3xl rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8"><div className="grid gap-5 sm:grid-cols-2"><label className="space-y-2 sm:col-span-2"><span className="text-sm font-medium">Nome</span><input name="fullName" required defaultValue={profile.full_name ?? ""} className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm" /></label><label className="space-y-2"><span className="text-sm font-medium">E-mail</span><input name="email" type="email" required defaultValue={email} className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm" /></label><label className="space-y-2"><span className="text-sm font-medium">Nova senha</span><input name="password" type="password" autoComplete="new-password" placeholder="Deixe em branco para manter" className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm" /></label><div className="sm:col-span-2"><ImageUploadField name="avatarUrl" label="Sua imagem" defaultValue={profile.avatar_url} /></div><label className="space-y-2 sm:col-span-2"><span className="text-sm font-medium">Workspace padrão</span><select name="defaultWorkspaceId" defaultValue={profile.current_organization_id ?? ""} className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm">{workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}</select></label></div>{state.error && <p className="mt-5 text-sm text-brand">{state.error}</p>}{state.success && <p className="mt-5 text-sm text-success">{state.success}</p>}<button disabled={isPending} className="mt-8 inline-flex h-12 items-center gap-2 rounded-2xl bg-brand px-5 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-hover disabled:opacity-60">{isPending ? <LoaderCircle className="animate-spin" size={18} /> : <Save size={18} />}Salvar perfil</button></form>;
}
