"use client";

import { useActionState } from "react";
import { Building2, LoaderCircle, Save } from "lucide-react";
import { ImageUploadField } from "@/components/image-upload-field";
import { updateWorkspaceSettings, type WorkspaceSettingsState } from "./actions";

const initialState: WorkspaceSettingsState = {};

export function WorkspaceSettingsForm({ workspace }: Readonly<{ workspace: { id: string; name: string; logo_url: string | null } }>) {
  const [state, formAction, isPending] = useActionState(updateWorkspaceSettings, initialState);

  return (
    <form action={formAction} className="max-w-3xl rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <div className="grid size-11 place-items-center rounded-2xl bg-brand-soft text-brand"><Building2 size={20} /></div>
      <h2 className="mt-5 text-lg font-medium">Identidade do workspace</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">Defina como este espaço aparece para as pessoas da equipe.</p>
      <div className="mt-8 grid gap-5 border-t border-border pt-6">
        <label className="block space-y-2"><span className="text-sm font-medium">Nome do workspace</span><input name="name" required defaultValue={workspace.name} className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm" /></label>
        <ImageUploadField name="logoUrl" label="Logo do workspace" defaultValue={workspace.logo_url} scope="workspace" scopeId={workspace.id} />
      </div>
      {state.error && <p className="mt-5 text-sm text-brand">{state.error}</p>}
      {state.success && <p className="mt-5 text-sm text-success">{state.success}</p>}
      <div className="mt-8 border-t border-border pt-6"><button disabled={isPending} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-brand px-5 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-hover disabled:opacity-60">{isPending ? <LoaderCircle className="animate-spin" size={18} /> : <Save size={18} />}Salvar workspace</button></div>
    </form>
  );
}
