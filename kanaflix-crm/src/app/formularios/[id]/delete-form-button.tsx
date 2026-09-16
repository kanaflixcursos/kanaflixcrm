"use client";

import { Trash2 } from "lucide-react";
import { deleteLeadForm } from "../actions";

export function DeleteFormButton({ formId }: Readonly<{ formId: string }>) {
  return (
    <form action={deleteLeadForm} onSubmit={(event) => { if (!window.confirm("Excluir este formulário e todo o histórico de envios? Os contatos já criados serão mantidos.")) event.preventDefault(); }}>
      <input type="hidden" name="formId" value={formId} />
      <button className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-danger/35 px-4 text-sm font-medium text-danger transition-colors hover:bg-danger hover:text-white"><Trash2 size={17} />Excluir formulário</button>
    </form>
  );
}
