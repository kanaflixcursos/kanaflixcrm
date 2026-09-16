import Link from "next/link";
import { Building2, ExternalLink, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageEyebrow } from "@/components/page-eyebrow";
import { getCurrentWorkspace } from "@/lib/current-workspace";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const { supabase, organization } = await getCurrentWorkspace();
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name, website, created_at")
    .order("created_at", { ascending: false });

  return (
    <AppShell organization={organization}>
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
        <header className="flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <PageEyebrow>Contas da sua base</PageEyebrow>
            <h1 className="mt-3 text-4xl font-medium tracking-[-0.04em] sm:text-5xl">Empresas</h1>
            <p className="mt-3 text-base text-muted-foreground sm:text-lg">Organize os contatos por empresa e acompanhe as relações com mais contexto.</p>
          </div>
          <Link href="/empresas/novo" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand px-5 text-sm font-medium text-brand-foreground shadow-sm transition-colors hover:bg-brand-hover">
            <Plus size={18} /> Nova empresa
          </Link>
        </header>

        <section className="mt-10 overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
          <div className="flex items-center justify-between border-b border-border p-6"><div><p className="text-base font-medium">Sua base de empresas</p><p className="mt-1 text-sm text-muted-foreground">{companies?.length ?? 0} registro(s) encontrado(s)</p></div><Building2 className="text-brand" size={22} /></div>
          {companies?.length ? <div className="divide-y divide-border">
            {companies.map((company) => <Link key={company.id} href={`/empresas/${company.id}`} className="flex flex-col gap-3 px-6 py-5 transition-colors hover:bg-surface-muted/60 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand"><Building2 size={18} /></div><p className="truncate text-sm font-medium">{company.name}</p></div>
              {company.website ? <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"><span className="max-w-64 truncate">{company.website.replace(/^https?:\/\//, "")}</span><ExternalLink size={15} /></span> : <p className="text-sm text-muted-foreground">Sem site informado</p>}
            </Link>)}
          </div> : <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center"><div className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand"><Building2 size={22} /></div><h2 className="mt-5 text-lg font-medium">Sua base de empresas começa aqui</h2><p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Cadastre uma empresa para associar os contatos da sua operação.</p><Link href="/empresas/novo" className="mt-6 text-sm font-medium text-brand hover:text-brand-hover">Criar primeira empresa</Link></div>}
        </section>
      </div>
    </AppShell>
  );
}
