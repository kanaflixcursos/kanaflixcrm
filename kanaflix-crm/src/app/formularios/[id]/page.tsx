import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { BarChart3, Eye, FileText, Pause, Pencil, Play, Settings2, UsersRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageEyebrow } from "@/components/page-eyebrow";
import { getCurrentWorkspace } from "@/lib/current-workspace";
import type { LeadFormField } from "@/lib/lead-forms";
import { setLeadFormStatus } from "../actions";
import { DeleteFormButton } from "./delete-form-button";
import { IntegrationPanel } from "./integration-panel";

export const dynamic = "force-dynamic";

export default async function FormDetailsPage({ params, searchParams }: Readonly<{ params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }>) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const activeTab = query.tab === "configuracoes" ? "configuracoes" : "resumo";
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:8081";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const { supabase, organization } = await getCurrentWorkspace();
  const [{ data: form }, { data: submissions }, { count: submissionsCount }] = await Promise.all([
    supabase.from("lead_forms").select("id, name, slug, title, description, success_message, status, fields, created_at").eq("id", id).maybeSingle(),
    supabase.from("form_submissions").select("id, contact_id, payload, source_url, created_at").eq("form_id", id).order("created_at", { ascending: false }).limit(50),
    supabase.from("form_submissions").select("id", { count: "exact", head: true }).eq("form_id", id),
  ]);
  if (!form) notFound();
  const fields = form.fields as unknown as LeadFormField[];

  return (
    <AppShell organization={organization}>
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
        <header className="flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <PageEyebrow>Formulário de captura</PageEyebrow>
              <span className={`rounded-full px-2.5 py-1 text-xs ${form.status === "published" ? "bg-brand-soft text-brand" : "bg-surface-muted text-muted-foreground"}`}>{form.status === "published" ? "Publicado" : form.status === "draft" ? "Rascunho" : "Arquivado"}</span>
            </div>
            <h1 className="mt-3 text-4xl font-medium tracking-[-0.04em] sm:text-5xl">{form.name}</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">{form.title}</p>
          </div>
          <Link href={`/formularios/${form.id}/editar`} className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-brand px-5 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-hover"><Pencil size={17} />Editar formulário</Link>
        </header>

        <nav aria-label="Seções do formulário" className="mt-6 flex gap-2 border-b border-border">
          <TabLink href={`/formularios/${form.id}`} active={activeTab === "resumo"} icon={<BarChart3 size={17} />}>Resumo</TabLink>
          <TabLink href={`/formularios/${form.id}?tab=configuracoes`} active={activeTab === "configuracoes"} icon={<Settings2 size={17} />}>Configurações</TabLink>
        </nav>

        {activeTab === "resumo" ? (
          <div className="mt-8 space-y-6">
            <section aria-label="Resumo do formulário" className="grid gap-4 sm:grid-cols-3">
              <Metric label="Contatos capturados" value={String(submissionsCount ?? 0)} detail="Total de envios registrados" />
              <Metric label="Campos" value={String(fields.length)} detail={`${fields.filter((field) => field.required).length} obrigatórios`} />
              <Metric label="Status" value={form.status === "published" ? "Ativo" : "Pausado"} detail={form.status === "published" ? "Aceitando novos envios" : "Sem receber novos envios"} highlighted={form.status === "published"} />
            </section>

            <section className="rounded-3xl border border-border bg-surface shadow-sm">
              <div className="flex items-center justify-between border-b border-border p-5 sm:p-6">
                <div><h2 className="text-lg font-medium">Envios recentes</h2><p className="mt-1 text-sm text-muted-foreground">Cada envio também cria um contato no CRM.</p></div>
                <UsersRound className="text-brand" size={21} />
              </div>
              {submissions?.length ? (
                <div className="divide-y divide-border">
                  {submissions.map((submission) => {
                    const payload = submission.payload as Record<string, string>;
                    return (
                      <div key={submission.id} className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{payload.name || "Contato sem nome"}</p>
                          <p className="mt-1 truncate text-sm text-muted-foreground">{payload.email} · {payload.phone}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <time className="text-xs text-muted-foreground">{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(submission.created_at))}</time>
                          {submission.contact_id && <Link href={`/contatos/${submission.contact_id}`} className="text-sm font-medium text-brand hover:text-brand-hover">Ver contato</Link>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center"><FileText className="text-muted-foreground" size={24} /><h3 className="mt-4 text-base font-medium">Nenhum envio ainda</h3><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Publique e integre o formulário para começar a receber contatos.</p><Link href={`/formularios/${form.id}?tab=configuracoes`} className="mt-5 text-sm font-medium text-brand hover:text-brand-hover">Abrir configurações</Link></div>
              )}
            </section>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <IntegrationPanel slug={form.slug} origin={origin} fields={fields} />
            <aside className="space-y-6">
              <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
                <div className="grid size-11 place-items-center rounded-2xl bg-brand-soft text-brand">{form.status === "published" ? <Eye size={19} /> : <Pause size={19} />}</div>
                <h2 className="mt-5 text-lg font-medium">Publicação</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{form.status === "published" ? "O link, iframe e endpoint estão aceitando novos envios." : "O formulário não aceita envios enquanto estiver em rascunho."}</p>
                <form action={setLeadFormStatus} className="mt-6">
                  <input type="hidden" name="formId" value={form.id} />
                  <input type="hidden" name="status" value={form.status === "published" ? "draft" : "published"} />
                  <button className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-medium transition-colors ${form.status === "published" ? "border border-border hover:bg-surface-muted" : "bg-brand text-brand-foreground hover:bg-brand-hover"}`}>{form.status === "published" ? <><Pause size={17} />Pausar captação</> : <><Play size={17} />Publicar agora</>}</button>
                </form>
              </section>
              <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
                <h2 className="text-base font-medium">Campos publicados</h2>
                <div className="mt-4 divide-y divide-border">{fields.map((field) => <div key={field.key} className="flex items-center justify-between gap-3 py-3 text-sm"><span>{field.label}</span><span className="text-xs text-muted-foreground">{field.required ? "Obrigatório" : "Opcional"}</span></div>)}</div>
              </section>
              <section className="rounded-3xl border border-danger/25 bg-surface p-6 shadow-sm">
                <h2 className="text-base font-medium">Excluir formulário</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Os contatos capturados permanecem no CRM; o histórico de envios será removido.</p>
                <div className="mt-5"><DeleteFormButton formId={form.id} /></div>
              </section>
            </aside>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function TabLink({ href, active, icon, children }: Readonly<{ href: string; active: boolean; icon: React.ReactNode; children: React.ReactNode }>) {
  return <Link href={href} aria-current={active ? "page" : undefined} className={`relative inline-flex h-12 items-center gap-2 px-3 text-sm font-medium transition-colors ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{icon}{children}{active && <span className="absolute inset-x-2 bottom-[-1px] h-0.5 rounded-full bg-brand" />}</Link>;
}

function Metric({ label, value, detail, highlighted = false }: Readonly<{ label: string; value: string; detail: string; highlighted?: boolean }>) {
  return <article className={`rounded-3xl border bg-surface p-6 shadow-sm ${highlighted ? "border-brand/30" : "border-border"}`}><p className="text-sm text-muted-foreground">{label}</p><p className="mt-4 text-3xl font-medium tracking-[-0.04em]">{value}</p><p className="mt-2 text-sm text-muted-foreground">{detail}</p></article>;
}
