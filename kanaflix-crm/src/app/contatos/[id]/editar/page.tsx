import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageEyebrow } from "@/components/page-eyebrow";
import { getCurrentWorkspace } from "@/lib/current-workspace";
import { ContactEditForm } from "./contact-edit-form";

export const dynamic = "force-dynamic";

export default async function EditContactPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const { supabase, organization } = await getCurrentWorkspace();
  const [{ data: contact }, { data: companies }] = await Promise.all([
    supabase.from("contacts").select("id, full_name, email, phone, company_id, source, notes, status, tags, discard_reason, utm_source, utm_medium, utm_campaign").eq("id", id).maybeSingle(),
    supabase.from("companies").select("id, name").order("name"),
  ]);
  if (!contact) notFound();

  return (
    <AppShell organization={organization}>
      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
        <header className="border-b border-border pb-8">
          <PageEyebrow>Ficha do lead</PageEyebrow>
          <h1 className="mt-3 text-4xl font-medium tracking-[-0.04em] sm:text-5xl">Editar {contact.full_name}</h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">Atualize a qualificação, a origem e o contexto deste lead.</p>
        </header>
        <div className="mt-10"><ContactEditForm contact={contact} companies={companies ?? []} /></div>
      </div>
    </AppShell>
  );
}
