import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import type { LeadFormField } from "@/lib/lead-forms";
import { PublicLeadForm } from "./public-lead-form";

export const dynamic = "force-dynamic";

function foregroundFor(hex: string) {
  const normalized = hex.replace("#", "");
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  return (red * 299 + green * 587 + blue * 114) / 1000 > 150 ? "#171716" : "#FFFFFF";
}

export default async function PublicFormPage({ params, searchParams }: Readonly<{ params: Promise<{ slug: string }>; searchParams: Promise<{ embed?: string; submitted?: string }> }>) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const isEmbed = query.embed === "1";
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("get_public_lead_form", { target_slug: slug });
  const form = data?.[0];
  if (error || !form) notFound();
  const brandColor = form.brand_color || "#FE6731";

  return (
    <main className={`${isEmbed ? "public-form-embed bg-transparent p-2" : "min-h-screen bg-background px-4 py-8 sm:px-6 sm:py-12"} text-foreground`} style={{ "--brand": brandColor, "--brand-foreground": foregroundFor(brandColor) } as CSSProperties}>
      <div className="mx-auto max-w-2xl">
        <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
          <div className="h-1.5 w-16 rounded-full bg-brand" />
          <h1 className="mt-7 text-3xl font-medium tracking-[-0.04em] sm:text-4xl">{form.title}</h1>
          {form.description && <p className="mt-4 text-base leading-7 text-muted-foreground">{form.description}</p>}
          <PublicLeadForm slug={form.slug} fields={form.fields as LeadFormField[]} successMessage={form.success_message} redirectUrl={form.redirect_url} turnstileEnabled={form.turnstile_enabled} initialSubmitted={query.submitted === "1"} />
        </section>
        {!isEmbed && <p className="mt-5 text-center text-xs text-muted-foreground">Formulário seguro por Kanaflix CRM</p>}
      </div>
    </main>
  );
}
