"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import type { LeadFormField } from "@/lib/lead-forms";

export function IntegrationPanel({ slug, origin, fields = [] }: Readonly<{ slug: string; origin: string; fields?: LeadFormField[] }>) {
  const [copied, setCopied] = useState<string | null>(null);

  const publicUrl = `${origin}/f/${slug}`;
  const endpoint = `${origin}/api/forms/${slug}/submit`;
  const attributionScript = `<script async src="${origin}/kanaflix-attribution.js"></script>`;
  const iframe = `<iframe data-kanaflix-form src="${publicUrl}?embed=1" title="Formulário de contato" width="100%" height="640" style="border:0;background:transparent" loading="lazy" allowtransparency="true"></iframe>\n${attributionScript}`;
  const isLocalEndpoint = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
  const payload = JSON.stringify(Object.fromEntries(fields.map((field) => [field.key, sampleValue(field)])), null, 2);

  async function copy(label: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(null), 1600);
  }

  return (
    <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <div>
        <h2 className="text-lg font-medium">Integração</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Use o link direto, incorpore o iframe ou envie dados ao endpoint. O código recomendado preserva UTMs e IDs de clique automaticamente.</p>
      </div>
      <div className="mt-6 space-y-5">
        <IntegrationValue label="Endereço público" value={publicUrl} copied={copied === "url"} onCopy={() => copy("url", publicUrl)} external />
        <IntegrationValue label="Iframe HTML" value={iframe} copied={copied === "iframe"} onCopy={() => copy("iframe", iframe)} multiline />
        <IntegrationValue label="Endpoint POST" value={endpoint} copied={copied === "endpoint"} onCopy={() => copy("endpoint", endpoint)} />
        <IntegrationValue label="Helper de atribuição" value={attributionScript} copied={copied === "attribution"} onCopy={() => copy("attribution", attributionScript)} multiline />
      </div>
      <p className="mt-4 text-xs leading-5 text-muted-foreground">Em formulários HTML próprios, adicione <code className="rounded bg-surface-muted px-1.5 py-0.5">data-kanaflix-attribution</code> à tag <code className="rounded bg-surface-muted px-1.5 py-0.5">form</code> e carregue o helper. Para envios via JavaScript, use <code className="rounded bg-surface-muted px-1.5 py-0.5">window.KanaflixAttribution.get()</code>.</p>
      {isLocalEndpoint && <div className="mt-5 rounded-2xl border border-warning/30 bg-surface-muted px-4 py-3 text-xs leading-5 text-muted-foreground"><strong className="font-medium text-foreground">Endpoint local:</strong> este endereço funciona apenas em testes neste computador. Um formulário hospedado em site HTTPS precisa apontar para a URL HTTPS do Kanaflix CRM publicado.</div>}
      <div className="mt-6 rounded-2xl bg-surface-muted p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">Payload deste formulário</p>
          <button type="button" onClick={() => copy("payload", payload)} className="inline-flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-medium transition-colors hover:bg-surface" aria-label="Copiar payload">{copied === "payload" ? <Check className="text-success" size={15} /> : <Copy size={15} />}Copiar</button>
        </div>
        <pre className="mt-3 overflow-x-auto text-xs leading-6 text-muted-foreground">{payload}</pre>
        <div className="mt-5 border-t border-border pt-5">
          <p className="text-xs font-medium">Campos aceitos</p>
          <div className="mt-3 space-y-3">
            {fields.map((field) => (
              <div key={field.key} className="text-xs leading-5 text-muted-foreground">
                <div className="flex flex-wrap items-center gap-2"><code className="rounded-lg bg-surface px-2 py-0.5 text-foreground">{field.key}</code><span>{field.label}</span><span>·</span><span>{field.required ? "obrigatório" : "opcional"}</span></div>
                {field.type === "select" && field.options?.length ? <p className="mt-1 pl-2">Opções: {field.options.join(", ")}</p> : null}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-5 border-t border-border pt-5 text-xs leading-5 text-muted-foreground">
          <p className="font-medium text-foreground">Atribuição automática</p>
          <p className="mt-2">O helper envia <code>utm_source</code>, <code>utm_medium</code>, <code>utm_campaign</code>, <code>utm_content</code>, <code>utm_term</code>, <code>gclid</code>, <code>fbclid</code>, página de entrada e referrer como campos internos.</p>
        </div>
      </div>
    </section>
  );
}

function sampleValue(field: LeadFormField) {
  if (field.key === "name") return "Ana Martins";
  if (field.key === "email") return "ana@empresa.com";
  if (field.key === "phone") return "11999999999";
  if (field.type === "select") return field.options?.[0] ?? "";
  if (field.type === "checkbox") return "Sim";
  if (field.type === "textarea") return "Mensagem de exemplo";
  return field.placeholder || "Valor de exemplo";
}

function IntegrationValue({ label, value, copied, onCopy, multiline = false, external = false }: Readonly<{ label: string; value: string; copied: boolean; onCopy: () => void; multiline?: boolean; external?: boolean }>) {
  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <div className={`mt-2 flex gap-2 rounded-2xl border border-border bg-surface-muted p-2 ${multiline ? "items-start" : "items-center"}`}>
        <code className={`${multiline ? "min-h-16 whitespace-pre-wrap" : "truncate"} min-w-0 flex-1 px-2 py-1 text-xs leading-5 text-muted-foreground`}>{value || "Carregando endereço…"}</code>
        {external && value && <a href={value} target="_blank" rel="noreferrer" className="grid size-9 shrink-0 place-items-center rounded-xl transition-colors hover:bg-surface" aria-label="Abrir formulário"><ExternalLink size={16} /></a>}
        <button type="button" onClick={onCopy} disabled={!value} className="grid size-9 shrink-0 place-items-center rounded-xl transition-colors hover:bg-surface disabled:opacity-40" aria-label={`Copiar ${label.toLowerCase()}`}>
          {copied ? <Check className="text-success" size={16} /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  );
}
