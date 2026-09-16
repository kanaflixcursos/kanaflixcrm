"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    const confirmation = String(data.get("confirmation") ?? "");
    if (password.length < 6 || password !== confirmation) {
      setPending(false);
      setError(password.length < 6 ? "A senha precisa ter pelo menos 6 caracteres." : "As senhas não coincidem.");
      return;
    }
    const { error: updateError } = await createClient().auth.updateUser({ password });
    setPending(false);
    if (updateError) {
      setError("Este link expirou ou não é mais válido. Solicite outro.");
      return;
    }
    setMessage("Senha atualizada. Você já pode entrar com a nova senha.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-5 sm:p-8" style={{ "--brand": "#FE6731", "--brand-foreground": "#FFFFFF" } as React.CSSProperties}>
      <section className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-medium tracking-[-0.04em]">Defina uma nova senha.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Escolha uma senha com pelo menos 6 caracteres.</p>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <label className="block space-y-2"><span className="text-sm font-medium">Nova senha</span><input name="password" type="password" required minLength={6} autoComplete="new-password" className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm" /></label>
          <label className="block space-y-2"><span className="text-sm font-medium">Confirme a senha</span><input name="confirmation" type="password" required minLength={6} autoComplete="new-password" className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm" /></label>
          {error && <p className="rounded-2xl bg-brand-soft px-4 py-3 text-sm" role="alert">{error}</p>}
          {message && <p className="rounded-2xl bg-brand-soft px-4 py-3 text-sm" role="status">{message}</p>}
          {message ? <Link href="/entrar" className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-brand px-5 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-hover">Voltar para entrar</Link> : <button disabled={pending} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand px-5 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60">{pending ? <LoaderCircle className="animate-spin" size={18} /> : <ArrowRight size={18} />}Atualizar senha</button>}
        </form>
      </section>
    </main>
  );
}
