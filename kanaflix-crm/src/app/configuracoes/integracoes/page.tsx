import { PlugZap } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageEyebrow } from "@/components/page-eyebrow";
import { getCurrentWorkspace } from "@/lib/current-workspace";
import { IntegrationForm } from "./integration-form";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const { supabase, organization } = await getCurrentWorkspace();
  const { data } = await supabase.from("tracking_integrations").select("provider, external_id, status");
  const integrations = new Map((data ?? []).map((item) => [item.provider, item]));
  const meta = integrations.get("meta_pixel");
  const gtm = integrations.get("google_tag_manager");

  return (
    <AppShell organization={organization}>
      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
        <header className="border-b border-border pb-8">
          <div className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand"><PlugZap size={22} /></div>
          <PageEyebrow className="mt-6">Workspace atual</PageEyebrow>
          <h1 className="mt-3 text-4xl font-medium tracking-[-0.04em] sm:text-5xl">Integrações de marketing</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">Guarde os identificadores do cliente agora. O disparo de eventos via navegador e servidor será conectado sobre esta mesma estrutura.</p>
        </header>
        <div className="mt-10 grid gap-6">
          <IntegrationForm provider="meta_pixel" title="Meta Pixel" description="Base para eventos como Lead e CompleteRegistration, com suporte futuro à Conversions API." externalId={meta?.external_id} active={meta?.status === "active"} placeholder="Ex.: 123456789012345" />
          <IntegrationForm provider="google_tag_manager" title="Google Tag Manager" description="Container do cliente para eventos padronizados no dataLayer e integração com Google Ads/GA4." externalId={gtm?.external_id} active={gtm?.status === "active"} placeholder="Ex.: GTM-XXXXXXX" />
        </div>
      </div>
    </AppShell>
  );
}
