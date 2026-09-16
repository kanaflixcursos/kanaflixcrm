import Link from "next/link";
import { ChevronRight, Inbox, ListTodo, Megaphone } from "lucide-react";
import { getCurrentWorkspace } from "@/lib/current-workspace";
import { AppShell } from "@/components/app-shell";
import { DashboardHero } from "@/components/dashboard-hero";
import { LeadStatusBadge } from "@/components/lead-status-badge";
import type { LeadStatus } from "@/lib/lead-status";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { supabase, organization } = await getCurrentWorkspace();
  const [{ data: leads }, { data: upcomingActivities }] = await Promise.all([
    supabase.from("contacts").select("id, full_name, email, source, status, utm_campaign, created_at, last_conversion_at").order("last_conversion_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }),
    supabase.from("activities").select("id, description, due_at, contact_id").is("completed_at", null).order("due_at", { ascending: true, nullsFirst: false }).limit(5),
  ]);
  const allLeads = leads ?? [];
  const leadNames = new Map(allLeads.map((lead) => [lead.id, lead.full_name]));
  const metrics = [
    { label: "Leads", value: allLeads.length, detail: "Total no workspace" },
    { label: "Novos", value: allLeads.filter((lead) => lead.status === "new").length, detail: "Aguardando análise" },
    { label: "Qualificados", value: allLeads.filter((lead) => lead.status === "qualified").length, detail: "Prontos para avançar" },
    { label: "Convertidos", value: allLeads.filter((lead) => lead.status === "converted").length, detail: "Resultado registrado" },
  ];
  const recentLeads = allLeads.slice(0, 6);

  return (
    <AppShell organization={organization}>
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
        <DashboardHero />
        <section aria-label="Resumo de leads" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => <article key={metric.label} className="rounded-3xl border border-border bg-surface p-6 shadow-sm"><p className="text-sm text-muted-foreground">{metric.label}</p><p className="mt-4 text-4xl font-medium tracking-[-0.04em]">{metric.value}</p><p className="mt-2 text-sm text-muted-foreground">{metric.detail}</p></article>)}
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
          <article className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
            <div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-medium">Leads recentes</h2><p className="mt-1 text-sm text-muted-foreground">As últimas entradas e conversões deste cliente.</p></div><Inbox className="text-brand" size={22} /></div>
            {recentLeads.length ? <div className="mt-6 divide-y divide-border">{recentLeads.map((lead) => <Link key={lead.id} href={`/contatos/${lead.id}`} className="flex flex-col gap-3 py-4 transition-colors hover:text-brand sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-medium">{lead.full_name}</p><p className="mt-1 flex items-center gap-2 truncate text-sm text-muted-foreground"><Megaphone size={14} />{lead.utm_campaign || lead.source || "Origem não identificada"}</p></div><LeadStatusBadge status={lead.status as LeadStatus} /></Link>)}</div> : <div className="mt-8 rounded-2xl bg-surface-muted px-6 py-10 text-center"><p className="text-sm font-medium">Nenhum lead capturado</p><p className="mt-2 text-sm text-muted-foreground">Publique um formulário ou cadastre o primeiro lead.</p></div>}
            <Link href="/contatos" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-hover">Abrir Central de Leads <ChevronRight size={17} /></Link>
          </article>

          <article className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
            <div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-medium">Acompanhamentos</h2><p className="mt-1 text-sm text-muted-foreground">Próximas ações registradas.</p></div><ListTodo className="text-brand" size={22} /></div>
            {upcomingActivities?.length ? <div className="mt-6 divide-y divide-border">{upcomingActivities.map((activity) => <div key={activity.id} className="py-4"><p className="text-sm font-medium">{activity.description}</p><p className="mt-1 text-xs text-muted-foreground">{activity.contact_id ? leadNames.get(activity.contact_id) ?? "Lead" : "Sem lead"}{activity.due_at ? ` · ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(activity.due_at))}` : ""}</p></div>)}</div> : <div className="mt-6 rounded-2xl bg-surface-muted px-5 py-6 text-sm text-muted-foreground">Nenhum acompanhamento pendente.</div>}
            <Link href="/atividades" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-hover">Ver acompanhamentos <ChevronRight size={17} /></Link>
          </article>
        </section>
      </div>
    </AppShell>
  );
}
