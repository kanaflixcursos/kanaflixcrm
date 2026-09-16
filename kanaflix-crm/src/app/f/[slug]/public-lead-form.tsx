"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { CheckCircle2, LoaderCircle, Send } from "lucide-react";
import type { LeadFormField } from "@/lib/lead-forms";

export function PublicLeadForm({ slug, fields, successMessage, redirectUrl, initialSubmitted = false }: Readonly<{ slug: string; fields: LeadFormField[]; successMessage: string; redirectUrl?: string | null; initialSubmitted?: boolean }>) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(initialSubmitted);
  const attributionRef = useRef<Record<string, string>>({});

  useEffect(() => {
    const storageKey = "kanaflix_attribution_v1";
    const parameterKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"];
    let stored: Record<string, string> = {};
    try { stored = JSON.parse(window.localStorage.getItem(storageKey) || "{}"); } catch {}
    const query = new URLSearchParams(window.location.search);
    const current = Object.fromEntries(parameterKeys.map((key) => [key, query.get(key)]).filter((entry): entry is [string, string] => Boolean(entry[1])));
    attributionRef.current = { ...stored, ...current, landing_page_url: window.location.href, ...(document.referrer ? { referrer_url: document.referrer } : {}) };
    try { window.localStorage.setItem(storageKey, JSON.stringify(attributionRef.current)); } catch {}

    const receiveAttribution = (event: MessageEvent) => {
      if (event.source !== window.parent || event.data?.type !== "kanaflix:attribution" || !event.data.attribution || typeof event.data.attribution !== "object") return;
      attributionRef.current = { ...attributionRef.current, ...event.data.attribution };
    };
    window.addEventListener("message", receiveAttribution);
    return () => window.removeEventListener("message", receiveAttribution);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    for (const [key, value] of Object.entries(attributionRef.current)) payload[`_${key}`] = value;

    try {
      const response = await fetch(`/api/forms/${slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Não foi possível enviar seus dados.");
      if (redirectUrl) {
        window.location.assign(redirectUrl);
        return;
      }
      setSubmitted(true);
      form.reset();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Não foi possível enviar seus dados.");
    } finally {
      setIsPending(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center px-4 text-center" role="status">
        <div className="grid size-14 place-items-center rounded-3xl bg-brand-soft text-brand"><CheckCircle2 size={26} /></div>
        <h2 className="mt-5 text-2xl font-medium tracking-[-0.03em]">Tudo certo</h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">{successMessage}</p>
        <button type="button" onClick={() => setSubmitted(false)} className="mt-6 text-sm font-medium text-brand transition-colors hover:text-brand-hover">Enviar outra resposta</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8">
      <label className="sr-only" aria-hidden="true">Não preencha este campo<input name="_company_website" tabIndex={-1} autoComplete="off" /></label>
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((field, index) => {
          const wide = field.type === "textarea" || field.type === "checkbox" || index === 0;
          if (field.type === "textarea") {
            return <label key={field.key} className="block space-y-2 sm:col-span-2"><FieldLabel field={field} /><textarea name={field.key} required={field.required} rows={4} placeholder={field.placeholder} className="w-full resize-y rounded-2xl border border-border bg-surface px-4 py-3 text-sm" /></label>;
          }
          if (field.type === "select") {
            return <label key={field.key} className={`block space-y-2 ${wide ? "sm:col-span-2" : ""}`}><FieldLabel field={field} /><select name={field.key} required={field.required} defaultValue="" className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm"><option value="" disabled>Selecione</option>{field.options?.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
          }
          if (field.type === "checkbox") {
            return <label key={field.key} className="flex items-start gap-3 rounded-2xl border border-border p-4 text-sm leading-6 sm:col-span-2"><input name={field.key} value="Sim" required={field.required} type="checkbox" className="mt-1 size-4 accent-[var(--brand)]" /><span>{field.label}{field.required && <span className="text-brand"> *</span>}</span></label>;
          }
          return <label key={field.key} className={`block space-y-2 ${wide ? "sm:col-span-2" : ""}`}><FieldLabel field={field} /><input name={field.key} type={field.type} required={field.required} autoComplete={field.key === "name" ? "name" : field.key === "email" ? "email" : field.key === "phone" ? "tel" : undefined} placeholder={field.placeholder} className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm" /></label>;
        })}
      </div>

      {error && <p className="mt-5 rounded-2xl bg-brand-soft px-4 py-3 text-sm" role="alert">{error}</p>}
      <div className="mt-8 flex justify-end border-t border-border pt-6">
        <button disabled={isPending} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand px-5 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
          {isPending ? <LoaderCircle className="animate-spin" size={18} /> : <Send size={17} />}
          {isPending ? "Enviando" : "Enviar dados"}
        </button>
      </div>
    </form>
  );
}

function FieldLabel({ field }: Readonly<{ field: LeadFormField }>) {
  return <span className="text-sm font-medium">{field.label}{field.required && <span className="text-brand"> *</span>}</span>;
}
