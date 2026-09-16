import Link from "next/link";
import { Building2, ChevronRight, ContactRound, ExternalLink, Pencil, Target } from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageEyebrow } from "@/components/page-eyebrow";
import { getCurrentWorkspace } from "@/lib/current-workspace";

export const dynamic = "force-dynamic";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default async function CompanyDetailPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const { supabase, organization } = await getCurrentWorkspace();
  const { data: company } = await supabase.from("companies").select("id, name, website, created_at").eq("id", id).maybeSingle();
  if (!company) notFound();

  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, full_name, email, phone, source")
    .eq("company_id", company.id)
    .order("full_name");
  const contactIds = (contacts ?? []).map((contact) => contact.id);
  const relatedDeals = [`company_id.eq.${company.id}`];
  if (contactIds.length) relatedDeals.push(`contact_id.in.(${contactIds.join(",")})`);
  const { data: deals } = await supabase
    .from("deals")
    .select("id, title, amount, expected_close_date")
    .or(relatedDeals.join(","))
    .order("created_at", { ascending: false });

  return (
    <AppShell organization={organization}>
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
        <header className="flex flex-col gap-6 border-b border-border pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid size-14 shrink-0 place-items-center rounded-3xl bg-brand-soft text-brand"><Building2 size={25} /></div>
            <div>
              <PageEyebrow>Ficha da empresa</PageEyebrow>
              <h1 className="mt-2 text-4xl font-medium tracking-[-0.04em] sm:text-5xl">{company.name}</h1>
              <p className="mt-3 text-sm text-muted-foreground">Adicionada em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(company.created_at))}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3"><Link href={`/empresas/${company.id}/editar`} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-5 text-sm font-medium transition-colors hover:bg-surface-muted"><Pencil size={17} />Editar</Link><Link href="/contatos/novo" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand px-5 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-hover"><ContactRound size={18} />Novo contato</Link></div>
        </header>

        <div className="mt-10 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside>
            <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
              <h2 className="text-base font-medium">Informações</h2>
              {company.website ? <a href={company.website} target="_blank" rel="noreferrer" className="mt-5 flex items-center gap-3 text-sm text-muted-foreground hover:text-brand"><ExternalLink size={17} /><span className="truncate">{company.website.replace(/^https?:\/\//, "")}</span></a> : <p className="mt-5 text-sm leading-6 text-muted-foreground">Nenhum site informado para esta empresa.</p>}
            </section>
          </aside>

          <div className="space-y-6">
            <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
              <div className="flex items-center justify-between"><div><h2 className="text-lg font-medium">Contatos</h2><p className="mt-1 text-sm text-muted-foreground">Pessoas vinculadas a esta empresa.</p></div><ContactRound className="text-brand" size={21} /></div>
              {contacts?.length ? <div className="mt-6 divide-y divide-border">{contacts.map((contact) => <Link key={contact.id} href={`/contatos/${contact.id}`} className="flex items-center justify-between gap-4 py-4 transition-colors hover:text-brand"><div className="min-w-0"><p className="truncate text-sm font-medium">{contact.full_name}</p><p className="mt-1 truncate text-sm text-muted-foreground">{contact.email || contact.phone || contact.source || "Sem contato informado"}</p></div><ChevronRight className="shrink-0 text-muted-foreground" size={17} /></Link>)}</div> : <div className="mt-6 rounded-2xl bg-surface-muted px-5 py-6 text-sm text-muted-foreground">Nenhum contato vinculado ainda.</div>}
            </section>

            <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
              <div className="flex items-center justify-between"><div><h2 className="text-lg font-medium">Oportunidades</h2><p className="mt-1 text-sm text-muted-foreground">Negociações que pertencem a esta conta.</p></div><Target className="text-brand" size={21} /></div>
              {deals?.length ? <div className="mt-6 divide-y divide-border">{deals.map((deal) => <div key={deal.id} className="flex items-center justify-between gap-4 py-4"><div><p className="text-sm font-medium">{deal.title}</p>{deal.expected_close_date && <p className="mt-1 text-xs text-muted-foreground">Previsão: {new Intl.DateTimeFormat("pt-BR").format(new Date(`${deal.expected_close_date}T12:00:00`))}</p>}</div><p className="shrink-0 text-sm font-medium">{currency.format(Number(deal.amount))}</p></div>)}</div> : <div className="mt-6 rounded-2xl bg-surface-muted px-5 py-6 text-sm text-muted-foreground">Nenhuma oportunidade vinculada ainda.</div>}
              <Link href="/oportunidades" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-hover">Ver pipeline <ChevronRight size={16} /></Link>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
