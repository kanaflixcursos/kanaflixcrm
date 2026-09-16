import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageEyebrow } from "@/components/page-eyebrow";
import { getCurrentWorkspace } from "@/lib/current-workspace";
import type { LeadFormField } from "@/lib/lead-forms";
import { FormBuilder } from "../../form-builder";

export const dynamic = "force-dynamic";

export default async function EditFormPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const { supabase, organization } = await getCurrentWorkspace();
  const { data: form } = await supabase.from("lead_forms").select("id, name, slug, title, description, success_message, redirect_url, status, fields, campaign_name, default_tags").eq("id", id).maybeSingle();
  if (!form) notFound();
  if (form.status === "archived") notFound();

  return (
    <AppShell organization={organization}>
      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
        <header className="border-b border-border pb-8">
          <div className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand"><Pencil size={21} /></div>
          <PageEyebrow className="mt-6">Captura de clientes</PageEyebrow>
          <h1 className="mt-3 text-4xl font-medium tracking-[-0.04em] sm:text-5xl">Editar formulário</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">Ajuste conteúdo, endereço e campos sem misturar os dados de outros workspaces.</p>
        </header>
        <div className="mt-10"><FormBuilder form={{ ...form, status: form.status as "draft" | "published", fields: form.fields as unknown as LeadFormField[] }} /></div>
      </div>
    </AppShell>
  );
}
