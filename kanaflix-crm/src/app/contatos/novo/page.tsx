import { ContactRound } from "lucide-react";
import { ContactForm } from "./contact-form";
import { getCurrentWorkspace } from "@/lib/current-workspace";
import { AppShell } from "@/components/app-shell";
import { PageEyebrow } from "@/components/page-eyebrow";

export const dynamic = "force-dynamic";

export default async function NewContactPage() {
  const { supabase, organization } = await getCurrentWorkspace();

  const { data: companies } = await supabase.from("companies").select("id, name").order("name");

  return (
    <AppShell organization={organization}>
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
        <header>
          <div className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand">
            <ContactRound size={22} aria-hidden="true" />
          </div>
          <PageEyebrow className="mt-6">Central de leads</PageEyebrow>
          <h1 className="mt-3 text-4xl font-medium tracking-[-0.04em] sm:text-5xl">Novo lead</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Registre um lead manualmente sem perder a origem e o contexto de marketing.
          </p>
        </header>
        <div className="mt-10">
          <ContactForm companies={companies ?? []} />
        </div>
      </div>
    </AppShell>
  );
}
