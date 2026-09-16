import { FilePlus2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageEyebrow } from "@/components/page-eyebrow";
import { getCurrentWorkspace } from "@/lib/current-workspace";
import { FormBuilder } from "../form-builder";

export const dynamic = "force-dynamic";

export default async function NewFormPage() {
  const { organization } = await getCurrentWorkspace();
  return (
    <AppShell organization={organization}>
      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
        <header className="border-b border-border pb-8">
          <div className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand"><FilePlus2 size={22} /></div>
          <PageEyebrow className="mt-6">Captura de clientes</PageEyebrow>
          <h1 className="mt-3 text-4xl font-medium tracking-[-0.04em] sm:text-5xl">Novo formulário</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">Escolha os dados necessários e publique uma entrada conectada ao workspace atual.</p>
        </header>
        <div className="mt-10"><FormBuilder /></div>
      </div>
    </AppShell>
  );
}
