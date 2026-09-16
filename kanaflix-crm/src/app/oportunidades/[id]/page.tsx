import Link from "next/link";
import { Building2, CalendarClock, ChevronRight, ContactRound, Pencil, Target } from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageEyebrow } from "@/components/page-eyebrow";
import { getCurrentWorkspace } from "@/lib/current-workspace";
import { DealOutcomeActions } from "../deal-outcome-actions";

export const dynamic = "force-dynamic";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const activityLabels: Record<string, string> = { task: "Tarefa", call: "Ligação", email: "E-mail", meeting: "Reunião", note: "Nota" };

export default async function DealDetailPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const { supabase, organization } = await getCurrentWorkspace();
  const { data: deal } = await supabase
    .from("deals")
    .select("id, title, amount, contact_id, company_id, stage_id, expected_close_date, outcome, closed_at, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!deal) notFound();

  const [{ data: contact }, { data: company }, { data: stage }, { data: activities }] = await Promise.all([
    deal.contact_id ? supabase.from("contacts").select("id, full_name, email, phone").eq("id", deal.contact_id).maybeSingle() : Promise.resolve({ data: null }),
    deal.company_id ? supabase.from("companies").select("id, name").eq("id", deal.company_id).maybeSingle() : Promise.resolve({ data: null }),
    deal.stage_id ? supabase.from("pipeline_stages").select("id, name").eq("id", deal.stage_id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("activities").select("id, activity_type, description, due_at, completed_at, created_at").eq("deal_id", deal.id).order("created_at", { ascending: false }),
  ]);

  return (
    <AppShell organization={organization}>
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
        <header className="flex flex-col gap-6 border-b border-border pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid size-14 shrink-0 place-items-center rounded-3xl bg-brand-soft text-brand"><Target size={25} /></div>
            <div>
              <PageEyebrow>Oportunidade</PageEyebrow>
              <h1 className="mt-2 text-4xl font-medium tracking-[-0.04em] sm:text-5xl">{deal.title}</h1>
              <p className="mt-3 text-sm text-muted-foreground">Criada em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(deal.created_at))}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3"><Link href={`/oportunidades/${deal.id}/editar`} className="inline-flex h-10 items-center gap-2 rounded-2xl border border-border bg-surface px-4 text-sm font-medium transition-colors hover:bg-surface-muted"><Pencil size={16} />Editar</Link><DealOutcomeActions dealId={deal.id} outcome={deal.outcome as "open" | "won" | "lost"} /></div>
        </header>

        <div className="mt-10 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
              <h2 className="text-base font-medium">Resumo</h2>
              <dl className="mt-5 space-y-4 text-sm">
                <div><dt className="text-muted-foreground">Valor estimado</dt><dd className="mt-1 text-lg font-medium">{currency.format(Number(deal.amount))}</dd></div>
                <div><dt className="text-muted-foreground">Etapa atual</dt><dd className="mt-1 font-medium">{stage?.name ?? "Sem etapa"}</dd></div>
                <div><dt className="text-muted-foreground">Previsão de fechamento</dt><dd className="mt-1 font-medium">{deal.expected_close_date ? new Intl.DateTimeFormat("pt-BR").format(new Date(`${deal.expected_close_date}T12:00:00`)) : "Não informada"}</dd></div>
                {deal.closed_at && <div><dt className="text-muted-foreground">Encerrada em</dt><dd className="mt-1 font-medium">{new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(deal.closed_at))}</dd></div>}
              </dl>
            </section>
            <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
              <h2 className="text-base font-medium">Relacionamentos</h2>
              <div className="mt-5 space-y-4 text-sm">
                {contact ? <Link href={`/contatos/${contact.id}`} className="flex items-center gap-3 text-muted-foreground hover:text-brand"><ContactRound size={17} />{contact.full_name}</Link> : <p className="text-muted-foreground">Sem contato associado</p>}
                {company && <Link href={`/empresas/${company.id}`} className="flex items-center gap-3 text-muted-foreground hover:text-brand"><Building2 size={17} />{company.name}</Link>}
              </div>
            </section>
          </aside>

          <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-5"><div><h2 className="text-lg font-medium">Atividades da negociação</h2><p className="mt-1 text-sm text-muted-foreground">Registro de conversas e próximos passos desta oportunidade.</p></div><Link href={`/atividades?dealId=${deal.id}#planejar`} className="inline-flex h-10 items-center gap-2 rounded-2xl border border-border px-4 text-sm font-medium transition-colors hover:bg-surface-muted"><CalendarClock size={17} />Planejar atividade</Link></div>
            {activities?.length ? <div className="mt-6 divide-y divide-border">{activities.map((activity) => <article key={activity.id} className="py-4"><div className="flex items-center justify-between gap-4"><p className="text-sm font-medium">{activity.description}</p><span className={`rounded-full px-2.5 py-1 text-xs ${activity.completed_at ? "bg-surface-muted text-muted-foreground" : "bg-brand-soft text-brand"}`}>{activity.completed_at ? "Concluída" : activityLabels[activity.activity_type]}</span></div><p className="mt-2 text-xs text-muted-foreground">{activity.due_at ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(activity.due_at)) : new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(activity.created_at))}</p></article>)}</div> : <div className="mt-6 rounded-2xl bg-surface-muted px-5 py-6 text-sm text-muted-foreground">Nenhuma atividade vinculada a esta oportunidade ainda.</div>}
            <Link href="/atividades" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-hover">Ver agenda completa <ChevronRight size={16} /></Link>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
