import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageEyebrow } from "@/components/page-eyebrow";
import { getCurrentWorkspace } from "@/lib/current-workspace";

export const dynamic = "force-dynamic";

const statusLabel = { draft: "Rascunho", published: "Publicado", archived: "Arquivado" } as const;

export default async function FormsPage() {
  const { supabase, organization } = await getCurrentWorkspace();
  const [{ data: forms }, { data: submissions }] = await Promise.all([
    supabase.from("lead_forms").select("id, name, title, slug, status, fields, campaign_name, default_tags, created_at").order("created_at", { ascending: false }),
    supabase.from("form_submissions").select("form_id"),
  ]);
  const counts = new Map<string, number>();
  for (const submission of submissions ?? []) counts.set(submission.form_id, (counts.get(submission.form_id) ?? 0) + 1);

  return (
    <AppShell organization={organization}>
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
        <header className="flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <PageEyebrow>Captura de clientes</PageEyebrow>
            <h1 className="mt-3 text-4xl font-medium tracking-[-0.04em] sm:text-5xl">Formulários</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">Crie pontos de entrada para o seu site e transforme cada envio em um contato do workspace atual.</p>
          </div>
          <Link href="/formularios/novo" className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-brand px-5 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-hover"><Plus size={18} />Novo formulário</Link>
        </header>

        <section className="mt-10 rounded-3xl border border-border bg-surface shadow-sm">
          <div className="border-b border-border p-5 sm:p-6">
            <h2 className="text-base font-medium">Seus formulários</h2>
            <p className="mt-1 text-sm text-muted-foreground">{forms?.length ?? 0} formulário(s) neste workspace</p>
          </div>
          {forms?.length ? (
            <div className="divide-y divide-border">
              {forms.map((form) => (
                <Link key={form.id} href={`/formularios/${form.id}`} className="flex flex-col gap-4 px-5 py-5 transition-colors hover:bg-surface-muted/60 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand"><FileText size={19} /></div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium">{form.name}</p>
                        <span className={`rounded-full px-2.5 py-1 text-xs ${form.status === "published" ? "bg-brand-soft text-brand" : "bg-surface-muted text-muted-foreground"}`}>{statusLabel[form.status as keyof typeof statusLabel]}</span>
                      </div>
                      <p className="mt-1 truncate text-sm text-muted-foreground">/f/{form.slug} · {Array.isArray(form.fields) ? form.fields.length : 0} campos{form.campaign_name ? ` · ${form.campaign_name}` : ""}</p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground"><span className="font-medium text-foreground">{counts.get(form.id) ?? 0}</span> envio(s)</div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
              <div className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand"><FileText size={22} /></div>
              <h2 className="mt-5 text-lg font-medium">Crie seu primeiro ponto de captura</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Publique por link, incorpore com iframe ou conecte seu site ao endpoint.</p>
              <Link href="/formularios/novo" className="mt-6 text-sm font-medium text-brand hover:text-brand-hover">Criar formulário</Link>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
