import Link from "next/link";
import { Building2, CalendarClock, Check, ExternalLink, Mail, Megaphone, Pencil, Phone, Tags } from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageEyebrow } from "@/components/page-eyebrow";
import { LeadStatusBadge } from "@/components/lead-status-badge";
import { getCurrentWorkspace } from "@/lib/current-workspace";
import { leadStatuses, type LeadStatus } from "@/lib/lead-status";
import { quickUpdateLeadStatus } from "../actions";

export const dynamic = "force-dynamic";

type LeadEvent = {
  id: string;
  event_name: string;
  source: string;
  properties: Record<string, unknown>;
  occurred_at: string;
};

export default async function ContactPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const { supabase, organization } = await getCurrentWorkspace();
  const { data: lead } = await supabase
    .from("contacts")
    .select("id, full_name, email, phone, source, notes, company_id, created_at, status, tags, discard_reason, utm_source, utm_medium, utm_campaign, utm_content, utm_term, gclid, fbclid, landing_page_url, referrer_url, first_conversion_at, last_conversion_at")
    .eq("id", id)
    .maybeSingle();
  if (!lead) notFound();

  const [{ data: company }, { data: activities }, { data: events }] = await Promise.all([
    lead.company_id ? supabase.from("companies").select("id, name").eq("id", lead.company_id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("activities").select("id, activity_type, description, due_at, completed_at, created_at").eq("contact_id", lead.id).order("created_at", { ascending: false }).limit(20),
    supabase.from("lead_events").select("id, event_name, source, properties, occurred_at").eq("contact_id", lead.id).order("occurred_at", { ascending: false }).limit(30),
  ]);

  const timeline = [
    ...((events ?? []) as LeadEvent[]).map((event) => ({
      id: event.id,
      title: eventTitle(event),
      detail: eventDetail(event),
      date: event.occurred_at,
    })),
    ...(activities ?? []).map((activity) => ({
      id: activity.id,
      title: activity.description,
      detail: activity.completed_at ? "Atividade concluída" : "Atividade registrada",
      date: activity.completed_at ?? activity.created_at,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <AppShell organization={organization}>
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
        <header className="flex flex-col gap-6 border-b border-border pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3"><PageEyebrow>Perfil do lead</PageEyebrow><LeadStatusBadge status={lead.status as LeadStatus} /></div>
            <h1 className="mt-3 text-4xl font-medium tracking-[-0.04em] sm:text-5xl">{lead.full_name}</h1>
            <p className="mt-3 text-sm text-muted-foreground">Capturado em {formatDate(lead.first_conversion_at ?? lead.created_at)}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={`/contatos/${lead.id}/editar`} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-5 text-sm font-medium transition-colors hover:bg-surface-muted"><Pencil size={17} />Editar</Link>
            <Link href={`/atividades?contactId=${lead.id}#planejar`} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand px-5 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-hover"><CalendarClock size={18} />Registrar acompanhamento</Link>
          </div>
        </header>

        <section className="mt-6 flex flex-col gap-4 rounded-2xl bg-surface-muted px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-sm font-medium">Atualização rápida</p><p className="mt-1 text-xs text-muted-foreground">Mude o status sem abrir a edição completa.</p></div>
          <form action={quickUpdateLeadStatus} className="flex flex-col gap-2 sm:flex-row">
            <input type="hidden" name="contactId" value={lead.id} />
            <select name="status" defaultValue={lead.status} className="h-11 rounded-2xl border border-border bg-surface px-4 pr-11 text-sm">{leadStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select>
            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 text-sm font-medium transition-colors hover:bg-background"><Check size={17} />Atualizar</button>
          </form>
        </section>

        <div className="mt-10 grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
              <h2 className="text-base font-medium">Dados do lead</h2>
              <div className="mt-5 space-y-4 text-sm">
                {lead.email && <a href={`mailto:${lead.email}`} className="flex items-center gap-3 text-muted-foreground hover:text-brand"><Mail size={17} />{lead.email}</a>}
                {lead.phone && <a href={`tel:${lead.phone}`} className="flex items-center gap-3 text-muted-foreground hover:text-brand"><Phone size={17} />{lead.phone}</a>}
                {company && <Link href={`/empresas/${company.id}`} className="flex items-center gap-3 text-muted-foreground hover:text-brand"><Building2 size={17} />{company.name}</Link>}
                <div className="flex items-center gap-3 text-muted-foreground"><Megaphone size={17} />{lead.source || "Origem não identificada"}</div>
              </div>
              {lead.tags?.length ? <div className="mt-6 border-t border-border pt-5"><p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"><Tags size={14} />Tags</p><div className="mt-3 flex flex-wrap gap-2">{lead.tags.map((tag: string) => <span key={tag} className="rounded-full bg-surface-muted px-2.5 py-1 text-xs">{tag}</span>)}</div></div> : null}
              {lead.notes && <div className="mt-6 border-t border-border pt-5"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Observações</p><p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">{lead.notes}</p></div>}
              {lead.discard_reason && <div className="mt-6 border-t border-border pt-5"><p className="text-xs font-medium uppercase tracking-wide text-danger">Motivo de descarte</p><p className="mt-3 text-sm leading-6 text-muted-foreground">{lead.discard_reason}</p></div>}
            </section>
          </aside>

          <div className="space-y-6">
            <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
              <div><h2 className="text-lg font-medium">Atribuição</h2><p className="mt-1 text-sm text-muted-foreground">Dados da primeira conversão identificada para este lead.</p></div>
              <dl className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <Attribution label="Origem" value={lead.utm_source} />
                <Attribution label="Mídia" value={lead.utm_medium} />
                <Attribution label="Campanha" value={lead.utm_campaign} />
                <Attribution label="Conteúdo" value={lead.utm_content} />
                <Attribution label="Termo" value={lead.utm_term} />
                <Attribution label="Google Click ID" value={lead.gclid} />
                <Attribution label="Meta Click ID" value={lead.fbclid} />
                <Attribution label="Última conversão" value={lead.last_conversion_at ? formatDate(lead.last_conversion_at) : null} />
              </dl>
              {(lead.landing_page_url || lead.referrer_url) && <div className="mt-6 space-y-3 border-t border-border pt-5 text-sm">{lead.landing_page_url && <SafeLink label="Página de conversão" href={lead.landing_page_url} />}{lead.referrer_url && <SafeLink label="Referência" href={lead.referrer_url} />}</div>}
            </section>

            <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
              <div><h2 className="text-lg font-medium">Histórico</h2><p className="mt-1 text-sm text-muted-foreground">Conversões, mudanças de status e acompanhamentos em uma única linha do tempo.</p></div>
              {timeline.length ? <div className="mt-6 divide-y divide-border">{timeline.map((item) => <article key={item.id} className="py-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-medium">{item.title}</p>{item.detail && <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>}</div><time className="shrink-0 text-xs text-muted-foreground">{formatDate(item.date)}</time></div></article>)}</div> : <div className="mt-6 rounded-2xl bg-surface-muted px-5 py-6 text-sm text-muted-foreground">O histórico começará na próxima interação ou conversão.</div>}
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Attribution({ label, value }: Readonly<{ label: string; value: string | null }>) {
  return <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-2 text-sm font-medium">{value || "Não identificado"}</dd></div>;
}

function SafeLink({ label, href }: Readonly<{ label: string; href: string }>) {
  return <a href={href} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-2 text-muted-foreground hover:text-brand"><ExternalLink size={15} className="shrink-0" /><span className="font-medium text-foreground">{label}:</span><span className="truncate">{href}</span></a>;
}

function eventTitle(event: LeadEvent) {
  if (event.event_name === "lead.captured") return event.properties.is_new_lead ? "Lead capturado" : "Nova conversão registrada";
  if (event.event_name === "lead.status_changed") return "Status atualizado";
  if (event.event_name === "lead.automation_applied") return "Automação aplicada";
  if (event.event_name === "lead.created") return "Lead criado manualmente";
  return event.event_name;
}

function eventDetail(event: LeadEvent) {
  if (event.event_name === "lead.captured") return typeof event.properties.form_name === "string" ? `Formulário: ${event.properties.form_name}` : "Formulário";
  if (event.event_name === "lead.status_changed") return `${String(event.properties.from ?? "-")} → ${String(event.properties.to ?? "-")}`;
  if (event.event_name === "lead.automation_applied") return typeof event.properties.rule_name === "string" ? event.properties.rule_name : "Regra automática";
  return event.source === "crm" ? "Registrado no CRM" : event.source;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
