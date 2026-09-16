import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageEyebrow } from "@/components/page-eyebrow";
import { getCurrentWorkspace } from "@/lib/current-workspace";
import { DealEditForm } from "./deal-edit-form";

export const dynamic = "force-dynamic";

export default async function EditDealPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const { supabase, organization } = await getCurrentWorkspace();
  const [{ data: deal }, { data: contacts }, { data: pipelines }] = await Promise.all([
    supabase.from("deals").select("id, title, contact_id, stage_id, amount, expected_close_date").eq("id", id).maybeSingle(),
    supabase.from("contacts").select("id, full_name").order("full_name"),
    supabase.from("pipelines").select("id").order("created_at").limit(1),
  ]);
  if (!deal) notFound();
  const { data: stages } = pipelines?.[0] ? await supabase.from("pipeline_stages").select("id, name").eq("pipeline_id", pipelines[0].id).order("position") : { data: [] };
  return <AppShell organization={organization}><div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14"><header className="border-b border-border pb-8"><PageEyebrow>Oportunidade</PageEyebrow><h1 className="mt-3 text-4xl font-medium tracking-[-0.04em] sm:text-5xl">Editar {deal.title}</h1><p className="mt-3 text-base text-muted-foreground sm:text-lg">Atualize a negociação sem perder o resultado nem o histórico.</p></header><div className="mt-10"><DealEditForm deal={deal} contacts={contacts ?? []} stages={stages ?? []} /></div></div></AppShell>;
}
