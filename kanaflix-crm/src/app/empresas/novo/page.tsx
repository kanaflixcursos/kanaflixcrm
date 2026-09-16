import { Building2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageEyebrow } from "@/components/page-eyebrow";
import { getCurrentWorkspace } from "@/lib/current-workspace";
import { CompanyForm } from "./company-form";

export const dynamic = "force-dynamic";

export default async function NewCompanyPage() {
  const { organization } = await getCurrentWorkspace();
  return (
    <AppShell organization={organization}>
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
        <header><div className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand"><Building2 size={22} /></div><PageEyebrow className="mt-6">Empresas</PageEyebrow><h1 className="mt-3 text-4xl font-medium tracking-[-0.04em] sm:text-5xl">Nova empresa</h1><p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">Crie uma conta para reunir os contatos e negócios de uma mesma empresa.</p></header>
        <div className="mt-10"><CompanyForm /></div>
      </div>
    </AppShell>
  );
}
