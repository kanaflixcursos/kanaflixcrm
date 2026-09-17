"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Download, LoaderCircle, Megaphone, Tags } from "lucide-react";
import { LeadStatusBadge } from "@/components/lead-status-badge";
import { leadStatuses, type LeadStatus } from "@/lib/lead-status";
import { bulkUpdateLeadStatus, type BulkLeadState } from "./actions";

type Lead = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: string;
  tags: string[];
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  landing_page_url?: string | null;
  referrer_url?: string | null;
  created_at?: string;
};

const initialState: BulkLeadState = {};

export function LeadList({ leads }: Readonly<{ leads: Lead[] }>) {
  const [selected, setSelected] = useState(() => new Set<string>());
  const [state, formAction, isPending] = useActionState(bulkUpdateLeadStatus, initialState);
  const allSelected = leads.length > 0 && selected.size === leads.length;

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function exportCsv() {
    const headers = ["id", "nome", "email", "telefone", "origem", "status", "tags", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "landing_page_url", "referrer_url", "criado_em"];
    const rows = leads.map((lead) => [
      lead.id,
      lead.full_name,
      lead.email ?? "",
      lead.phone ?? "",
      lead.source ?? "",
      lead.status,
      lead.tags?.join(" | ") ?? "",
      lead.utm_source ?? "",
      lead.utm_medium ?? "",
      lead.utm_campaign ?? "",
      lead.utm_content ?? "",
      lead.utm_term ?? "",
      lead.landing_page_url ?? "",
      lead.referrer_url ?? "",
      lead.created_at ?? "",
    ]);
    const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kanaflix-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <form action={formAction}>
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(leads.map((lead) => lead.id)))} className="size-4 accent-[var(--brand)]" /><span>{selected.size ? `${selected.size} selecionado(s)` : "Selecionar todos"}</span></label>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={exportCsv} disabled={!leads.length} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-medium transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"><Download size={16} />Exportar CSV</button>
          <select name="bulkStatus" defaultValue="" required className="h-10 rounded-xl border border-border bg-surface px-3 pr-10 text-sm"><option value="" disabled>Alterar status para</option>{leadStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select>
          <button disabled={!selected.size || isPending} className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50">{isPending && <LoaderCircle className="animate-spin" size={16} />}Aplicar</button>
        </div>
      </div>
      {state.error && <p className="border-b border-border bg-brand-soft px-6 py-3 text-sm">{state.error}</p>}
      {state.success && <p className="border-b border-border px-6 py-3 text-sm text-success">{state.success}</p>}
      <div className="divide-y divide-border">
        {leads.map((lead) => (
          <article key={lead.id} className="grid gap-4 px-5 py-5 transition-colors hover:bg-surface-muted/60 sm:grid-cols-[auto_minmax(220px,1.4fr)_minmax(160px,0.8fr)_auto] sm:items-center sm:px-6">
            <input name="leadIds" value={lead.id} type="checkbox" checked={selected.has(lead.id)} onChange={() => toggle(lead.id)} aria-label={`Selecionar ${lead.full_name}`} className="size-4 accent-[var(--brand)]" />
            <Link href={`/contatos/${lead.id}`} className="flex min-w-0 items-center gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-medium text-brand">{lead.full_name.slice(0, 1).toUpperCase()}</div>
              <div className="min-w-0"><p className="truncate text-sm font-medium">{lead.full_name}</p><p className="mt-1 truncate text-sm text-muted-foreground">{lead.email || lead.phone}</p></div>
            </Link>
            <Link href={`/contatos/${lead.id}`} className="min-w-0 text-sm text-muted-foreground">
              <p className="flex items-center gap-2 truncate"><Megaphone size={15} />{lead.utm_campaign || lead.source || "Origem não identificada"}</p>
              {lead.tags?.length ? <p className="mt-2 flex items-center gap-2 truncate text-xs"><Tags size={14} />{lead.tags.join(" · ")}</p> : null}
            </Link>
            <Link href={`/contatos/${lead.id}`}><LeadStatusBadge status={lead.status as LeadStatus} /></Link>
          </article>
        ))}
      </div>
    </form>
  );
}
