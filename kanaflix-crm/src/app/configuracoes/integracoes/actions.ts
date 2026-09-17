"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentWorkspace } from "@/lib/current-workspace";

const integrationSchema = z.object({
  provider: z.enum(["meta_pixel", "google_tag_manager"]),
  externalId: z.string().trim().min(3).max(120),
  enabled: z.string().optional(),
});

export type IntegrationState = { error?: string; success?: string };

export async function saveTrackingIntegration(_state: IntegrationState, formData: FormData): Promise<IntegrationState> {
  const parsed = integrationSchema.safeParse({
    provider: formData.get("provider"),
    externalId: formData.get("externalId"),
    enabled: formData.get("enabled"),
  });
  if (!parsed.success) return { error: "Informe um identificador válido para a integração." };
  const validId = parsed.data.provider === "meta_pixel" ? /^\d{5,20}$/.test(parsed.data.externalId) : /^GTM-[A-Z0-9]+$/i.test(parsed.data.externalId);
  if (!validId) return { error: parsed.data.provider === "meta_pixel" ? "O Pixel ID deve conter somente números." : "O Container ID deve seguir o formato GTM-XXXXXXX." };

  const { supabase, organization } = await getCurrentWorkspace();
  const { error } = await supabase.from("tracking_integrations").upsert({
    organization_id: organization.id,
    provider: parsed.data.provider,
    external_id: parsed.data.externalId,
    status: parsed.data.enabled ? "configured" : "paused",
  }, { onConflict: "organization_id,provider" });

  if (error) return { error: "Não foi possível salvar a integração." };
  revalidatePath("/configuracoes/integracoes");
  return { success: "Integração atualizada para este workspace." };
}
