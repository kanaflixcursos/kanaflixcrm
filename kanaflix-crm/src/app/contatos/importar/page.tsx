import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageEyebrow } from "@/components/page-eyebrow";
import { getCurrentWorkspace } from "@/lib/current-workspace";
import { ImportContactsForm } from "./import-contacts-form";

export const dynamic = "force-dynamic";

export default async function ImportContactsPage() {
  const { organization } = await getCurrentWorkspace();
  return <AppShell organization={organization}><div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
    <header className="border-b border-border pb-8"><Link href="/contatos" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft size={16} />Voltar para leads</Link><div className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand"><Upload size={22} /></div><PageEyebrow className="mt-6">Qualidade dos dados</PageEyebrow><h1 className="mt-3 text-4xl font-medium tracking-[-0.04em] sm:text-5xl">Importar leads</h1><p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">Adicione contatos ao workspace atual a partir de um arquivo CSV, com deduplicação automática por e-mail ou telefone.</p></header>
    <div className="mt-10"><ImportContactsForm /></div>
  </div></AppShell>;
}
