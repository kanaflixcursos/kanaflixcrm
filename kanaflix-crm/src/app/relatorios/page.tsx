import Link from "next/link";
import { ChartNoAxesColumnIncreasing, Megaphone, Target } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageEyebrow } from "@/components/page-eyebrow";
import { getCurrentWorkspace } from "@/lib/current-workspace";

export const dynamic = "force-dynamic";

const periods = [
  { value: "7", label: "7 dias" },
  { value: "30", label: "30 dias" },
  { value: "90", label: "90 dias" },
  { value: "all", label: "Todo período" },
] as const;

export default async function ReportsPage({ searchParams }: Readonly<{ searchParams: Promise<{ period?: string }> }>) {
  const { period: requestedPeriod } = await searchParams;
  const period = periods.some((item) => item.value === requestedPeriod) ? requestedPeriod! : "30";
  const { supabase, organization } = await getCurrentWorkspace();
  let query = supabase.from("contacts").select("id, status, source, utm_source, utm_campaign, first_conversion_at, created_at");
  if (period !== "all") {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - Number(period));
    query = query.gte("created_at", cutoff.toISOString());
  }
  const { data } = await query;
  const leads = data ?? [];
  const qualified = leads.filter((lead) => ["qualified", "follow_up", "converted"].includes(lead.status)).length;
  const converted = leads.filter((lead) => lead.status === "converted").length;
  const campaigns = groupLeads(leads, (lead) => lead.utm_campaign || "Sem campanha");
  const sources = groupLeads(leads, (lead) => lead.utm_source || lead.source || "Não identificada");
  const maxCampaign = Math.max(...campaigns.map((item) => item.total), 1);
  const maxSource = Math.max(...sources.map((item) => item.total), 1);

  return (
    <AppShell organization={organization}>
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
        <header className="flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div><PageEyebrow>Aquisição e qualidade</PageEyebrow><h1 className="mt-3 text-4xl font-medium tracking-[-0.04em] sm:text-5xl">Relatórios</h1><p className="mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">Compare volume e conversão sem misturar os dados de outros clientes.</p></div>
          <nav aria-label="Período do relatório" className="flex flex-wrap gap-2">{periods.map((item) => <Link key={item.value} href={`/relatorios?period=${item.value}`} className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${period === item.value ? "bg-brand-soft text-brand" : "bg-surface-muted text-muted-foreground hover:text-foreground"}`}>{item.label}</Link>)}</nav>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <Metric label="Leads capturados" value={leads.length} detail="No período selecionado" />
          <Metric label="Taxa de qualificação" value={`${rate(qualified, leads.length)}%`} detail={`${qualified} lead(s) avançaram`} />
          <Metric label="Taxa de conversão" value={`${rate(converted, leads.length)}%`} detail={`${converted} convertido(s)`} />
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <Ranking title="Campanhas" description="Volume e resultado por utm_campaign." icon={Target} items={campaigns} max={maxCampaign} />
          <Ranking title="Origens" description="Canais que trouxeram os leads." icon={Megaphone} items={sources} max={maxSource} />
        </div>
      </div>
    </AppShell>
  );
}

type GroupedItem = { label: string; total: number; converted: number };

function groupLeads<T extends { status: string }>(leads: T[], labelFor: (lead: T) => string) {
  const grouped = new Map<string, GroupedItem>();
  for (const lead of leads) {
    const label = labelFor(lead);
    const current = grouped.get(label) ?? { label, total: 0, converted: 0 };
    current.total += 1;
    if (lead.status === "converted") current.converted += 1;
    grouped.set(label, current);
  }
  return [...grouped.values()].sort((a, b) => b.total - a.total).slice(0, 10);
}

function Metric({ label, value, detail }: Readonly<{ label: string; value: string | number; detail: string }>) {
  return <article className="rounded-3xl border border-border bg-surface p-6 shadow-sm"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-4 text-4xl font-medium tracking-[-0.04em]">{value}</p><p className="mt-2 text-sm text-muted-foreground">{detail}</p></article>;
}

function Ranking({ title, description, icon: Icon, items, max }: Readonly<{ title: string; description: string; icon: typeof ChartNoAxesColumnIncreasing; items: GroupedItem[]; max: number }>) {
  return <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-medium">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p></div><Icon className="text-brand" size={21} /></div>{items.length ? <div className="mt-6 space-y-5">{items.map((item) => <div key={item.label}><div className="flex items-center justify-between gap-4 text-sm"><p className="truncate font-medium">{item.label}</p><p className="shrink-0 text-muted-foreground">{item.total} lead(s) · {rate(item.converted, item.total)}% conv.</p></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-muted"><div className="h-full rounded-full bg-brand" style={{ width: `${Math.max((item.total / max) * 100, 4)}%` }} /></div></div>)}</div> : <div className="mt-6 rounded-2xl bg-surface-muted px-5 py-8 text-center text-sm text-muted-foreground">Sem dados suficientes neste período.</div>}</section>;
}

function rate(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0;
}
