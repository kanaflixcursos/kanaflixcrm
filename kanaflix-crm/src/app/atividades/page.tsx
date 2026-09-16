import Link from "next/link";
import { CalendarClock, Check, CheckCircle2, ListTodo, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageEyebrow } from "@/components/page-eyebrow";
import { getCurrentWorkspace } from "@/lib/current-workspace";
import { ActivityForm } from "./activity-form";
import { completeActivity } from "./actions";

export const dynamic = "force-dynamic";

const labels: Record<string, string> = { task: "Tarefa", call: "Ligação", email: "E-mail", meeting: "Reunião", note: "Nota" };

type ActivityView = "open" | "overdue" | "completed";

const views: { value: ActivityView; label: string }[] = [
  { value: "open", label: "Pendentes" },
  { value: "overdue", label: "Atrasadas" },
  { value: "completed", label: "Concluídas" },
];

export default async function ActivitiesPage({ searchParams }: Readonly<{ searchParams: Promise<{ contactId?: string; dealId?: string; view?: string }> }>) {
  const { contactId, dealId, view: requestedView } = await searchParams;
  const view: ActivityView = requestedView === "overdue" || requestedView === "completed" ? requestedView : "open";
  const { supabase, organization } = await getCurrentWorkspace();
  const activityFields = "id, activity_type, description, due_at, contact_id, deal_id, completed_at";
  const activitiesQuery = view === "completed"
    ? supabase.from("activities").select(activityFields).not("completed_at", "is", null).order("completed_at", { ascending: false })
    : view === "overdue"
      ? supabase.from("activities").select(activityFields).is("completed_at", null).lt("due_at", new Date().toISOString()).order("due_at", { ascending: true })
      : supabase.from("activities").select(activityFields).is("completed_at", null).order("due_at", { ascending: true, nullsFirst: false });
  const [{ data: activities }, { data: contacts }, { data: deals }] = await Promise.all([
    activitiesQuery,
    supabase.from("contacts").select("id, full_name").order("full_name"),
    supabase.from("deals").select("id, title").eq("outcome", "open").order("created_at", { ascending: false }),
  ]);
  const contactNames = new Map((contacts ?? []).map((contact) => [contact.id, contact.full_name]));
  const dealNames = new Map((deals ?? []).map((deal) => [deal.id, deal.title]));
  const defaultRelatedTo = contactId && contactNames.has(contactId) ? `contact:${contactId}` : dealId && dealNames.has(dealId) ? `deal:${dealId}` : "";

  return (
    <AppShell organization={organization}>
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
        <header className="flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div><PageEyebrow>Ritmo da operação</PageEyebrow><h1 className="mt-3 text-4xl font-medium tracking-[-0.04em] sm:text-5xl">Atividades</h1><p className="mt-3 text-base text-muted-foreground sm:text-lg">Organize cada próximo passo e mantenha as conversas em movimento.</p></div>
          <Link href="#planejar" className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-brand px-5 text-sm font-medium text-brand-foreground shadow-sm transition-colors hover:bg-brand-hover"><Plus size={18} /> Planejar atividade</Link>
        </header>
        <div className="mt-10 grid max-w-5xl gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-3xl border border-border bg-surface shadow-sm">
            <div className="flex items-center justify-between border-b border-border p-6">
              <div><h2 className="text-base font-medium">{view === "completed" ? "Atividades concluídas" : view === "overdue" ? "Atividades atrasadas" : "Próximas atividades"}</h2><p className="mt-1 text-sm text-muted-foreground">{activities?.length ?? 0} registro(s) nesta visão</p></div>
              <CalendarClock className="text-brand" size={21} />
            </div>
            <div className="flex gap-2 overflow-x-auto border-b border-border px-6 py-4">
              {views.map((item) => <Link key={item.value} href={`/atividades?view=${item.value}`} className={`shrink-0 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${view === item.value ? "bg-brand-soft text-brand" : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"}`}>{item.label}</Link>)}
            </div>
            {activities?.length ? <div className="divide-y divide-border">
              {activities.map((activity) => <article key={activity.id} className="flex gap-4 px-6 py-5">
                <div className={`mt-0.5 grid size-10 shrink-0 place-items-center rounded-2xl ${activity.completed_at ? "bg-surface-muted text-muted-foreground" : "bg-brand-soft text-brand"}`}>{activity.completed_at ? <CheckCircle2 size={18} /> : <ListTodo size={18} />}</div>
                <div className="min-w-0 flex-1"><p className="text-sm font-medium">{activity.description}</p><p className="mt-1 text-sm text-muted-foreground">{labels[activity.activity_type] ?? "Atividade"} · {activity.contact_id ? contactNames.get(activity.contact_id) ?? "Contato" : activity.deal_id ? dealNames.get(activity.deal_id) ?? "Oportunidade" : "Sem vínculo"}{activity.due_at ? ` · ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(activity.due_at))}` : ""}</p></div>
                {activity.completed_at ? <span className="mt-1 text-xs text-muted-foreground">Concluída</span> : <form action={completeActivity}><input type="hidden" name="activityId" value={activity.id} /><button aria-label="Concluir atividade" className="grid size-10 place-items-center rounded-2xl text-muted-foreground transition-colors hover:bg-surface-muted hover:text-success"><Check size={18} /></button></form>}
              </article>)}
            </div> : <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center"><div className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand"><Check size={22} /></div><h2 className="mt-5 text-lg font-medium">{view === "completed" ? "Nenhuma atividade concluída ainda" : view === "overdue" ? "Nenhuma atividade atrasada" : "Tudo em dia"}</h2><p className="mt-2 text-sm text-muted-foreground">{view === "open" ? "Planeje a próxima atividade para continuar no ritmo." : "Acompanhe os próximos passos pela visão de pendentes."}</p></div>}
          </section>
          <ActivityForm contacts={contacts ?? []} deals={deals ?? []} defaultRelatedTo={defaultRelatedTo} />
        </div>
      </div>
    </AppShell>
  );
}
