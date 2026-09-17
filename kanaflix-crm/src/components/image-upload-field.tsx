"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function ImageUploadField({ name, label, defaultValue = "", scope = "user", scopeId }: Readonly<{ name: string; label: string; defaultValue?: string | null; scope?: "user" | "workspace"; scopeId?: string }>) {
  const inputId = useId();
  const [url, setUrl] = useState(defaultValue ?? "");
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  async function upload(file: File) {
    setError("");
    if (!ACCEPTED_TYPES.includes(file.type)) return setError("Envie uma imagem JPG, PNG ou WebP.");
    if (file.size > MAX_FILE_SIZE) return setError("A imagem deve ter no máximo 5 MB.");
    setIsUploading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Sua sessão expirou. Entre novamente."); setIsUploading(false); return; }
    const extension = file.name.split(".").pop()?.toLowerCase() || "png";
    if (scope === "workspace" && !scopeId) { setError("Não foi possível identificar o workspace."); setIsUploading(false); return; }
    const path = scope === "workspace"
      ? `workspace/${scopeId}/uploads/${crypto.randomUUID()}.${extension}`
      : `${user.id}/uploads/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("crm-images").upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) { setError("Não foi possível enviar a imagem."); setIsUploading(false); return; }
    const { data } = supabase.storage.from("crm-images").getPublicUrl(path);
    setUrl(data.publicUrl);
    setIsUploading(false);
  }

  return <div className="space-y-2"><span className="text-sm font-medium">{label}</span><input type="hidden" name={name} value={url} /><div className="flex flex-wrap items-center gap-4"><div className="grid size-24 place-items-center rounded-3xl border border-border bg-surface-muted p-[10px]">{url ? <Image src={url} alt="Imagem enviada" width={76} height={76} unoptimized className="size-full rounded-2xl object-cover" /> : <ImagePlus className="text-muted-foreground" size={22} />}</div><div><input id={inputId} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={isUploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} /><label htmlFor={inputId} className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-2xl border border-border bg-surface px-4 text-sm font-medium transition-colors hover:bg-surface-muted">{isUploading ? <LoaderCircle className="animate-spin" size={17} /> : <ImagePlus size={17} />}{isUploading ? "Enviando" : "Enviar imagem"}</label>{url && <button type="button" onClick={() => setUrl("")} className="ml-2 inline-flex h-11 items-center gap-2 rounded-2xl px-3 text-sm text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"><Trash2 size={16} />Remover</button>}<p className="mt-2 text-xs leading-5 text-muted-foreground">Até 5 MB. Prefira imagem quadrada (1:1). A visualização aplica 10px de respiro automático.</p>{error && <p className="mt-2 text-xs text-brand">{error}</p>}</div></div></div>;
}
