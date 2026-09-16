import Link from "next/link";
import { CalendarClock, CheckCircle2, ChevronRight, Clock3, Inbox } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageEyebrow } from "@/components/page-eyebrow";
import { LeadStatusBadge } from "@/components/lead-status-badge";
import { getCurrentWorkspace } from "@/lib/current-workspace";
import type { LeadStatus } from "@/lib/lead-status";
import { completeActivity } from "@/app/atividades/actions";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const { supabase, organization } = await getCurrentWorkspace();
  const currentTime = new Date();
  const staleDate = new Date(currentTime);
  staleDate.setDate(staleDate.getDate() - 3);
  const staleLimit = staleDate.toISOString();
  const now = currentTime.toISOString();
  const [{ data: newLeads }, { data: staleLeads }, { data: overdue }, { data: allLeads }] = await Promise.all([
    supabase.from("contacts").select("id, full_name, email, status, source, utm_campaign, created_at").eq("status", "new").order("created_at", { ascending: false }).limit(20),
    supabase.from("contacts").select("id, full_name, email, status, source, utm_campaign, updated_at").in("status", ["reviewing", "qualified", "follow_up"]).lt("updated_at", staleLimit).order("updated_at").limit(20),
    supabase.from("activities").select("id, description, due_at, contact_id").is("completed_at", null).lt("due_at", now).order("due_at").limit(20),
    supabase.from("contacts").select("id, full_name"),
  ]);
  const leadNames = new Map((allLeads ?? []).map((lead) => [lead.id, lead.full_name]));
  const attentionCount = (newLeads?.length ?? 0) + (staleLeads?.length ?? 0) + (overdue?.length ?? 0);

  return (
    <AppShell organization={organization}>
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
        <header className="border-b border-border pb-8">
          <PageEyebrow>Rotina do cliente atual</PageEyebrow>
          <h1 className="mt-3 text-4xl font-medium tracking-[-0.04em] sm:text-5xl">Hoje</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">{attentionCount ? `${attentionCount} item(ns) merecem sua atenção.` : "Tudo em dia neste workspace."}</p>
        </header>

        <div className="mt-10 grid gap-6 xl:grid-cols-3">
          <TodaySection icon={Inbox} title="Novos leads" description="Ainda não foram analisados." empty="Nenhum lead novo.">
            {newLeads?.map((lead) => <LeadRow key={lead.id} lead={lead} detail={lead.utm_campaign || lead.source || "Origem não identificada"} />)}
          </TodaySection>
          <TodaySection icon={Clock3} title="Sem atualização" description="Parados há mais de 3 dias." empty="Nenhum lead esquecido.">
            {staleLeads?.map((lead) => <LeadRow key={lead.id} lead={lead} detail={`Atualizado em ${formatDate(lead.updated_at)}`} />)}
          </TodaySection>
          <TodaySection icon={CalendarClock} title="Acompanhamentos vencidos" description="Atividades com prazo ultrapassado." empty="Nenhum acompanhamento vencido.">
            {overdue?.map((activity) => <article key={activity.id} className="py-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-medium">{activity.description}</p><p className="mt-1 truncate text-xs text-muted-foreground">{activity.contact_id ? leadNames.get(activity.contact_id) ?? "Lead" : "Sem lead"} · {activity.due_at ? formatDate(activity.due_at) : "Sem data"}</p></div><form action={completeActivity}><input type="hidden" name="activityId" value={activity.id} /><button aria-label="Concluir acompanhamento" className="grid size-9 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-surface-muted hover:text-success"><CheckCircle2 size={17} /></button></form></div></article>)}
          </TodaySection>
        </div>
      </div>
    </AppShell>
  );
}

function TodaySection({ icon: Icon, title, description, empty, children }: Readonly<{ icon: typeof Inbox; title: string; description: string; empty: string; children: React.ReactNode }>) {
  const hasItems = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return <section className="self-start rounded-3xl border border-border bg-surface p-6 shadow-sm"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-medium">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p></div><Icon className="text-brand" size={21} /></div>{hasItems ? <div className="mt-5 divide-y divide-border">{children}</div> : <p className="mt-6 rounded-2xl bg-surface-muted px-4 py-5 text-sm text-muted-foreground">{empty}</p>}</section>;
}

function LeadRow({ lead, detail }: Readonly<{ lead: { id: string; full_name: string; email: string | null; status: string }; detail: string }>) {
  return <Link href={`/contatos/${lead.id}`} className="flex items-center justify-between gap-3 py-4 transition-colors hover:text-brand"><div className="min-w-0"><p className="truncate text-sm font-medium">{lead.full_name}</p><p className="mt-1 truncate text-xs text-muted-foreground">{detail}</p></div><div className="flex shrink-0 items-center gap-2"><LeadStatusBadge status={lead.status as LeadStatus} /><ChevronRight size={16} /></div></Link>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
