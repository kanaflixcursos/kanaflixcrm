"use client";

import { FormEvent, useEffect, useState } from "react";
import { Building2, Check, ChevronDown, LoaderCircle, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Organization = { id: string; name: string };

export function TenantSwitcher({ currentOrganization }: { currentOrganization: Organization }) {
  const [organizations, setOrganizations] = useState<Organization[]>([currentOrganization]);
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    void supabase
      .from("organizations")
      .select("id, name")
      .order("name")
      .then(({ data }) => {
        if (data?.length) setOrganizations(data);
      });
  }, []);

  async function switchOrganization(organizationId: string) {
    if (organizationId === currentOrganization.id) {
      setIsOpen(false);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { error: switchError } = await supabase.rpc("switch_organization", {
      target_organization_id: organizationId,
    });

    if (switchError) {
      setError("Não foi possível trocar de espaço agora.");
      setIsSubmitting(false);
      return;
    }

    window.location.assign("/");
  }

  async function createOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("organizationName") ?? "");

    setIsSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { error: createError } = await supabase.rpc("create_organization", {
      organization_name: name,
    });

    if (createError) {
      setError("Não foi possível criar o espaço. Tente outro nome.");
      setIsSubmitting(false);
      return;
    }

    window.location.assign("/");
  }

  return (
    <div className="relative mb-7 px-2">
      <button
        type="button"
        onClick={() => {
          setIsOpen((open) => !open);
          setIsCreating(false);
          setError(null);
        }}
        className="flex w-full items-center gap-3 rounded-2xl bg-surface-muted px-3 py-2.5 text-left transition-colors hover:bg-border"
        aria-expanded={isOpen}
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
          <Building2 size={18} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{currentOrganization.name}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">Espaço de trabalho</span>
        </span>
        <ChevronDown size={17} className={isOpen ? "rotate-180 transition-transform" : "transition-transform"} aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="absolute left-2 right-2 z-20 mt-2 rounded-2xl border border-border bg-surface p-2 shadow-lg">
          {isCreating ? (
            <form onSubmit={createOrganization} className="space-y-3 p-2">
              <label className="block space-y-2">
                <span className="text-xs font-medium text-muted-foreground">Nome do novo espaço</span>
                <input
                  name="organizationName"
                  required
                  minLength={2}
                  maxLength={80}
                  autoFocus
                  className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm"
                  placeholder="Ex.: Kanaflix Vendas"
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-3 text-sm font-medium text-brand-foreground disabled:opacity-60"
                >
                  {isSubmitting && <LoaderCircle className="animate-spin" size={16} />}
                  Criar espaço
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="h-10 rounded-xl px-3 text-sm text-muted-foreground hover:bg-surface-muted"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="max-h-52 space-y-1 overflow-auto">
                {organizations.map((organization) => (
                  <button
                    key={organization.id}
                    type="button"
                    onClick={() => switchOrganization(organization.id)}
                    disabled={isSubmitting}
                    className="flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-sm hover:bg-surface-muted disabled:opacity-60"
                  >
                    <span className="min-w-0 flex-1 truncate">{organization.name}</span>
                    {organization.id === currentOrganization.id && <Check size={16} className="text-brand" aria-hidden="true" />}
                  </button>
                ))}
              </div>
              <div className="mt-2 border-t border-border pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className="flex h-10 w-full items-center gap-2 rounded-xl px-3 text-sm font-medium text-brand hover:bg-brand-soft"
                >
                  <Plus size={16} aria-hidden="true" />
                  Criar novo espaço
                </button>
              </div>
            </>
          )}
          {error && <p className="px-3 pb-2 pt-1 text-xs text-brand">{error}</p>}
        </div>
      )}
    </div>
  );
}
