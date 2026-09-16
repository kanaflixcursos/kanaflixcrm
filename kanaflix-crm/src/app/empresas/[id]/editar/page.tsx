import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageEyebrow } from "@/components/page-eyebrow";
import { getCurrentWorkspace } from "@/lib/current-workspace";
import { CompanyEditForm } from "./company-edit-form";

export const dynamic = "force-dynamic";

export default async function EditCompanyPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const { supabase, organization } = await getCurrentWorkspace();
  const { data: company } = await supabase.from("companies").select("id, name, website").eq("id", id).maybeSingle();
  if (!company) notFound();
  return <AppShell organization={organization}><div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14"><header className="border-b border-border pb-8"><PageEyebrow>Ficha da empresa</PageEyebrow><h1 className="mt-3 text-4xl font-medium tracking-[-0.04em] sm:text-5xl">Editar {company.name}</h1><p className="mt-3 text-base text-muted-foreground sm:text-lg">Mantenha a conta atualizada para dar contexto a contatos e negociações.</p></header><div className="mt-10"><CompanyEditForm company={company} /></div></div></AppShell>;
}
