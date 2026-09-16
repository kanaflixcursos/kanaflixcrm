import Link from "next/link";
import { ContactRound, Plus, Search } from "lucide-react";
import { getCurrentWorkspace } from "@/lib/current-workspace";
import { AppShell } from "@/components/app-shell";
import { PageEyebrow } from "@/components/page-eyebrow";
import { leadStatuses } from "@/lib/lead-status";
import { LeadList } from "./lead-list";

export const dynamic = "force-dynamic";

type SearchParams = { q?: string; status?: string; campaign?: string };

export default async function ContactsPage({ searchParams }: Readonly<{ searchParams: Promise<SearchParams> }>) {
  const query = await searchParams;
  const searchTerm = query.q?.trim() ?? "";
  const statusFilter = leadStatuses.some((item) => item.value === query.status) ? query.status : "";
  const campaignFilter = query.campaign?.trim() ?? "";
  const { supabase, organization } = await getCurrentWorkspace();

  const { data } = await supabase
    .from("contacts")
    .select("id, full_name, email, phone, source, status, tags, utm_campaign, last_conversion_at, created_at")
    .order("last_conversion_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  const leads = data ?? [];
  const normalizedSearch = searchTerm.toLocaleLowerCase("pt-BR");
  const filteredLeads = leads.filter((lead) => {
    if (statusFilter && lead.status !== statusFilter) return false;
    if (campaignFilter && lead.utm_campaign !== campaignFilter) return false;
    if (!normalizedSearch) return true;
    return [lead.full_name, lead.email, lead.phone, lead.source, lead.utm_campaign, ...(lead.tags ?? [])]
      .some((value) => value?.toLocaleLowerCase("pt-BR").includes(normalizedSearch));
  });
  const campaigns = [...new Set(leads.map((lead) => lead.utm_campaign).filter((value): value is string => Boolean(value)))].sort();
  const newCount = leads.filter((lead) => lead.status === "new").length;
  const qualifiedCount = leads.filter((lead) => lead.status === "qualified").length;
  const convertedCount = leads.filter((lead) => lead.status === "converted").length;

  return (
    <AppShell organization={organization}>
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
        <header className="flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <PageEyebrow>Aquisição e qualificação</PageEyebrow>
            <h1 className="mt-3 text-4xl font-medium tracking-[-0.04em] sm:text-5xl">Leads</h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
              Acompanhe quem chegou, de qual campanha veio e o que aconteceu depois da conversão.
            </p>
          </div>
          <Link href="/contatos/novo" className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-brand px-5 text-sm font-medium text-brand-foreground shadow-sm transition-colors hover:bg-brand-hover"><Plus size={18} />Novo lead</Link>
        </header>

        <section aria-label="Resumo de leads" className="mt-8 grid gap-4 sm:grid-cols-3">
          <Metric label="Novos" value={newCount} />
          <Metric label="Qualificados" value={qualifiedCount} />
          <Metric label="Convertidos" value={convertedCount} />
        </section>

        <section className="mt-8 rounded-3xl border border-border bg-surface shadow-sm">
          <form className="grid gap-3 border-b border-border p-5 sm:grid-cols-[minmax(220px,1fr)_190px_220px_auto] sm:p-6">
            <label className="relative">
              <span className="sr-only">Buscar leads</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
              <input name="q" type="search" defaultValue={searchTerm} placeholder="Nome, e-mail, tag ou origem" className="h-11 w-full rounded-2xl border border-border bg-surface-muted pl-10 pr-4 text-sm" />
            </label>
            <label>
              <span className="sr-only">Status</span>
              <select name="status" defaultValue={statusFilter} className="h-11 w-full rounded-2xl border border-border bg-surface px-4 pr-11 text-sm">
                <option value="">Todos os status</option>
                {leadStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
              </select>
            </label>
            <label>
              <span className="sr-only">Campanha</span>
              <select name="campaign" defaultValue={campaignFilter} className="h-11 w-full rounded-2xl border border-border bg-surface px-4 pr-11 text-sm">
                <option value="">Todas as campanhas</option>
                {campaigns.map((campaign) => <option key={campaign} value={campaign}>{campaign}</option>)}
              </select>
            </label>
            <button className="h-11 rounded-2xl border border-border bg-surface px-4 text-sm font-medium transition-colors hover:bg-surface-muted">Filtrar</button>
          </form>

          <div className="flex items-center justify-between border-b border-border px-5 py-4 text-sm sm:px-6">
            <p className="text-muted-foreground">{filteredLeads.length} lead(s) encontrado(s)</p>
            {(searchTerm || statusFilter || campaignFilter) && <Link href="/contatos" className="font-medium text-brand hover:text-brand-hover">Limpar filtros</Link>}
          </div>

          {filteredLeads.length ? (
            <LeadList leads={filteredLeads} />
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
              <div className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand"><ContactRound size={22} /></div>
              <h2 className="mt-5 text-lg font-medium">Nenhum lead por aqui</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Ajuste os filtros ou publique um formulário para iniciar a captura.</p>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: number }>) {
  return <article className="rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-6"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-3 text-3xl font-medium tracking-[-0.04em]">{value}</p></article>;
}
