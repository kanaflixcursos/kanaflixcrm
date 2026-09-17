"use client";

import { useActionState, useMemo, useState } from "react";
import { GripVertical, LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { createLeadForm, updateLeadForm, type LeadFormActionState } from "./actions";
import { requiredLeadFields, slugifyFormName, type LeadFormField } from "@/lib/lead-forms";

type FormValue = {
  id: string;
  name: string;
  slug: string;
  title: string;
  description: string | null;
  success_message: string;
  redirect_url: string | null;
  status: "draft" | "published";
  fields: LeadFormField[];
  campaign_name: string | null;
  default_tags: string[];
  allowed_origins: string[];
};

const initialState: LeadFormActionState = {};

export function FormBuilder({ form }: Readonly<{ form?: FormValue }>) {
  const action = form ? updateLeadForm : createLeadForm;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [name, setName] = useState(form?.name ?? "");
  const [slug, setSlug] = useState(form?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(form));
  const [fields, setFields] = useState<LeadFormField[]>(form?.fields ?? requiredLeadFields);

  const fieldCountLabel = useMemo(() => `${fields.length} de 12 campos`, [fields.length]);

  function updateField(key: string, changes: Partial<LeadFormField>) {
    setFields((current) => current.map((field) => field.key === key ? { ...field, ...changes } : field));
  }

  function changeFieldType(key: string, type: LeadFormField["type"]) {
    const field = fields.find((candidate) => candidate.key === key);
    updateField(key, {
      type,
      options: type === "select" ? (field?.options?.length ? field.options : ["", ""]) : undefined,
    });
  }

  function updateOption(key: string, index: number, value: string) {
    const field = fields.find((candidate) => candidate.key === key);
    updateField(key, { options: (field?.options ?? []).map((option, optionIndex) => optionIndex === index ? value : option) });
  }

  function addOption(key: string) {
    const field = fields.find((candidate) => candidate.key === key);
    const options = field?.options ?? [];
    if (options.length >= 10) return;
    updateField(key, { options: [...options, ""] });
  }

  function removeOption(key: string, index: number) {
    const field = fields.find((candidate) => candidate.key === key);
    if (!field?.options || field.options.length <= 2) return;
    updateField(key, { options: field.options.filter((_, optionIndex) => optionIndex !== index) });
  }

  function addField() {
    if (fields.length >= 12) return;
    const key = `custom_${Date.now().toString(36)}`;
    setFields((current) => [...current, {
      key,
      label: "",
      type: "text",
      required: false,
      placeholder: "",
    }]);
  }

  return (
    <form action={formAction} className="space-y-6">
      {form && <input type="hidden" name="formId" value={form.id} />}
      <input type="hidden" name="fields" value={JSON.stringify(fields)} />

      <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <div>
          <h2 className="text-lg font-medium">Identificação e endereço</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">O nome organiza o CRM; o título aparece para quem preencher.</p>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium">Nome interno</span>
            <input
              name="name"
              required
              value={name}
              onChange={(event) => {
                const nextName = event.target.value;
                setName(nextName);
                if (!slugTouched) setSlug(slugifyFormName(nextName));
              }}
              className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm"
              placeholder="Ex.: Contato do site"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Endereço personalizado</span>
            <div className="flex h-12 items-center rounded-2xl border border-border bg-surface px-4 focus-within:outline focus-within:outline-[3px] focus-within:outline-brand/45">
              <span className="shrink-0 text-sm text-muted-foreground">/f/</span>
              <input
                name="slug"
                required
                value={slug}
                onChange={(event) => { setSlugTouched(true); setSlug(slugifyFormName(event.target.value)); }}
                className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
                placeholder="contato-site"
              />
            </div>
          </label>
          <label className="block space-y-2 sm:col-span-2">
            <span className="text-sm font-medium">Título público</span>
            <input name="title" required defaultValue={form?.title ?? ""} placeholder="Fale com a nossa equipe" className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm" />
          </label>
          <label className="block space-y-2 sm:col-span-2">
            <span className="text-sm font-medium">Descrição</span>
            <textarea name="description" rows={3} defaultValue={form?.description ?? ""} placeholder="Preencha seus dados e entraremos em contato." className="w-full resize-y rounded-2xl border border-border bg-surface px-4 py-3 text-sm" />
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-medium">Segurança da captação</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Restrinja envios feitos pelo navegador a origens específicas. Deixe vazio para aceitar qualquer origem; integrações server-to-server continuam funcionando.</p>
        <label className="mt-6 block space-y-2">
          <span className="text-sm font-medium">Origens autorizadas <span className="font-normal text-muted-foreground">(opcional)</span></span>
          <textarea name="allowedOrigins" rows={4} defaultValue={form?.allowed_origins.join("\n") ?? ""} placeholder={'https://www.seusite.com.br\nhttps://landing.seusite.com.br'} className="w-full resize-y rounded-2xl border border-border bg-surface px-4 py-3 text-sm" />
          <span className="block text-xs leading-5 text-muted-foreground">Uma origem por linha, sem caminho ou barra final. Até 20 origens.</span>
        </label>
      </section>

      <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <div>
          <h2 className="text-lg font-medium">Organização dos leads</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Todo envio herda esta campanha e estas tags. UTMs recebidas pelo site continuam sendo registradas automaticamente.</p>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="block space-y-2 sm:col-span-2">
            <span className="text-sm font-medium">Campanha padrão</span>
            <input name="campaignName" defaultValue={form?.campaign_name ?? ""} className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm" placeholder="Ex.: Lançamento agosto" />
            <span className="block text-xs text-muted-foreground">Usada quando a conversão chegar sem `utm_campaign`.</span>
          </label>
          <label className="block space-y-2 sm:col-span-2">
            <span className="text-sm font-medium">Tags automáticas</span>
            <textarea name="defaultTags" rows={3} defaultValue={form?.default_tags.join("\n") ?? ""} className="w-full resize-y rounded-2xl border border-border bg-surface px-4 py-3 text-sm" placeholder={'Uma tag por linha\nEx.: landing-page\nmaterial-rico'} />
            <span className="block text-xs text-muted-foreground">Use uma linha para cada tag.</span>
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium">Campos do formulário</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Nome, e-mail e telefone são fixos. Adicione apenas o contexto que realmente será usado.</p>
          </div>
          <span className="rounded-full bg-surface-muted px-3 py-1.5 text-xs text-muted-foreground">{fieldCountLabel}</span>
        </div>

        <div className="mt-6 space-y-4">
          {fields.map((field) => {
            const isLocked = requiredLeadFields.some((required) => required.key === field.key);
            return (
              <div key={field.key} className="rounded-2xl border border-border p-4 sm:p-5">
                <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)_160px_auto] sm:items-end">
                  <GripVertical className="hidden text-muted-foreground/50 sm:block sm:self-center" size={18} aria-hidden="true" />
                  <label className="block space-y-2">
                    <span className="text-xs font-medium text-muted-foreground">Rótulo</span>
                    <input
                      value={field.label}
                      disabled={isLocked}
                      onChange={(event) => updateField(field.key, { label: event.target.value })}
                      placeholder="Nome do campo"
                      className="h-11 w-full rounded-2xl border border-border bg-surface px-4 text-sm disabled:bg-surface-muted disabled:text-muted-foreground"
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-xs font-medium text-muted-foreground">Tipo</span>
                    <select
                      value={field.type}
                      disabled={isLocked}
                      onChange={(event) => changeFieldType(field.key, event.target.value as LeadFormField["type"])}
                      className="h-11 w-full rounded-2xl border border-border bg-surface px-3 text-sm disabled:bg-surface-muted"
                    >
                      {isLocked ? (
                        <option value={field.type}>{field.type === "email" ? "E-mail" : field.type === "tel" ? "Telefone" : "Texto curto"}</option>
                      ) : (
                        <>
                          <option value="text">Texto curto</option>
                          <option value="textarea">Texto longo</option>
                          <option value="select">Lista de opções</option>
                          <option value="checkbox">Confirmação</option>
                        </>
                      )}
                    </select>
                  </label>
                  {isLocked ? (
                    <span className="inline-flex h-11 items-center justify-center rounded-2xl bg-brand-soft px-3 text-xs font-medium text-brand">Obrigatório</span>
                  ) : (
                    <button type="button" onClick={() => setFields((current) => current.filter((candidate) => candidate.key !== field.key))} className="grid size-11 place-items-center rounded-2xl text-danger transition-colors hover:bg-surface-muted" aria-label={`Remover ${field.label}`}>
                      <Trash2 size={17} />
                    </button>
                  )}
                </div>
                {!isLocked && (
                  <div className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-[1fr_auto]">
                    {field.type === "select" ? (
                      <div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-medium text-muted-foreground">Opções da lista</span>
                          <span className="text-xs text-muted-foreground">{field.options?.length ?? 0} de 10</span>
                        </div>
                        <div className="mt-2 space-y-2">
                          {(field.options ?? []).map((option, optionIndex) => (
                            <div key={`${field.key}-${optionIndex}`} className="flex gap-2">
                              <input
                                value={option}
                                onChange={(event) => updateOption(field.key, optionIndex, event.target.value)}
                                placeholder={`Opção ${optionIndex + 1}`}
                                className="h-11 min-w-0 flex-1 rounded-2xl border border-border bg-surface px-4 text-sm"
                                aria-label={`Opção ${optionIndex + 1} de ${field.label || "campo sem nome"}`}
                              />
                              <button
                                type="button"
                                onClick={() => removeOption(field.key, optionIndex)}
                                disabled={(field.options?.length ?? 0) <= 2}
                                className="grid size-11 shrink-0 place-items-center rounded-2xl text-danger transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-35"
                                aria-label={`Remover opção ${optionIndex + 1}`}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button type="button" onClick={() => addOption(field.key)} disabled={(field.options?.length ?? 0) >= 10} className="mt-3 inline-flex h-10 items-center gap-2 rounded-2xl border border-border px-3 text-xs font-medium transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"><Plus size={15} />Adicionar opção</button>
                      </div>
                    ) : field.type !== "checkbox" ? (
                      <label className="block space-y-2">
                        <span className="text-xs font-medium text-muted-foreground">Texto de exemplo</span>
                        <input value={field.placeholder ?? ""} onChange={(event) => updateField(field.key, { placeholder: event.target.value })} className="h-11 w-full rounded-2xl border border-border bg-surface px-4 text-sm" />
                      </label>
                    ) : <div />}
                    <label className="flex h-11 items-center gap-2 self-end text-sm">
                      <input type="checkbox" checked={field.required} onChange={(event) => updateField(field.key, { required: event.target.checked })} className="size-4 accent-[var(--brand)]" />
                      Obrigatório
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button type="button" onClick={addField} disabled={fields.length >= 12} className="mt-5 inline-flex h-11 items-center gap-2 rounded-2xl border border-border px-4 text-sm font-medium transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50">
          <Plus size={17} />Adicionar campo
        </button>
      </section>

      <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-medium">Confirmação e publicação</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-[1fr_180px]">
          <label className="block space-y-2">
            <span className="text-sm font-medium">Mensagem após o envio</span>
            <input name="successMessage" required defaultValue={form?.success_message ?? ""} placeholder="Recebemos seus dados. Em breve entraremos em contato." className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm" />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Status</span>
            <select name="status" defaultValue={form?.status ?? "draft"} className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm">
              <option value="draft">Rascunho</option>
              <option value="published">Publicado</option>
            </select>
          </label>
          <label className="block space-y-2 sm:col-span-2">
            <span className="text-sm font-medium">URL de redirecionamento <span className="font-normal text-muted-foreground">(opcional)</span></span>
            <input name="redirectUrl" type="url" defaultValue={form?.redirect_url ?? ""} placeholder="https://seusite.com.br/obrigado" className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm" />
            <span className="block text-xs leading-5 text-muted-foreground">Quando preenchida, a pessoa será enviada para esta página após o formulário ser registrado.</span>
          </label>
        </div>

        {state.error && <p className="mt-5 rounded-2xl bg-brand-soft px-4 py-3 text-sm">{state.error}</p>}
        <div className="mt-8 flex justify-end border-t border-border pt-6">
          <button disabled={isPending} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand px-5 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60">
            {isPending ? <LoaderCircle className="animate-spin" size={18} /> : <Save size={18} />}
            {form ? "Salvar alterações" : "Criar formulário"}
          </button>
        </div>
      </section>
    </form>
  );
}
