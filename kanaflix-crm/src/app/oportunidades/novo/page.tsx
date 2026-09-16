import Link from "next/link";
import { ContactRound, Target } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageEyebrow } from "@/components/page-eyebrow";
import { getCurrentWorkspace } from "@/lib/current-workspace";
import { DealForm } from "./deal-form";

export const dynamic = "force-dynamic";

export default async function NewOpportunityPage() {
  const { supabase, organization } = await getCurrentWorkspace();
  const [{ data: contacts }, { data: pipelines }] = await Promise.all([
    supabase.from("contacts").select("id, full_name").order("full_name"),
    supabase.from("pipelines").select("id").order("created_at").limit(1),
  ]);
  const { data: stages } = pipelines?.[0]
    ? await supabase.from("pipeline_stages").select("id, name").eq("pipeline_id", pipelines[0].id).order("position")
    : { data: [] };

  return (
    <AppShell organization={organization}>
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
        <header>
          <div className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand"><Target size={22} /></div>
          <PageEyebrow className="mt-6">Pipeline</PageEyebrow>
          <h1 className="mt-3 text-4xl font-medium tracking-[-0.04em] sm:text-5xl">Nova oportunidade</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">Registre uma negociação e acompanhe cada avanço do pipeline.</p>
        </header>
        {!contacts?.length ? (
          <div className="mt-10 rounded-3xl border border-border bg-surface p-8 text-center shadow-sm">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand"><ContactRound size={22} /></div>
            <h2 className="mt-5 text-lg font-medium">Você precisa de um contato primeiro</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">As oportunidades sempre ficam ligadas a uma pessoa da sua base.</p>
            <Link href="/contatos/novo" className="mt-6 inline-flex h-11 items-center rounded-2xl bg-brand px-4 text-sm font-medium text-brand-foreground">Criar contato</Link>
          </div>
        ) : (
          <div className="mt-10"><DealForm contacts={contacts} stages={stages ?? []} /></div>
        )}
      </div>
    </AppShell>
  );
}
