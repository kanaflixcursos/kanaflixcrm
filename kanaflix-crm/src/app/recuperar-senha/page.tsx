"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RecoverPasswordPage() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    const { error: resetError } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/redefinir-senha`,
    });
    setPending(false);
    if (resetError) {
      setError("Não foi possível enviar o link agora. Tente novamente.");
      return;
    }
    setMessage("Se existir uma conta com este e-mail, enviaremos um link para redefinir a senha.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-5 sm:p-8" style={{ "--brand": "#FE6731", "--brand-foreground": "#FFFFFF" } as React.CSSProperties}>
      <section className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <Link href="/entrar" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft size={16} />Voltar para entrar</Link>
        <h1 className="mt-8 text-3xl font-medium tracking-[-0.04em]">Recupere seu acesso.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Informe o e-mail da sua conta e enviaremos as instruções.</p>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <label className="block space-y-2"><span className="text-sm font-medium">E-mail</span><input name="email" type="email" required autoComplete="email" className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm" placeholder="voce@empresa.com" /></label>
          {error && <p className="rounded-2xl bg-brand-soft px-4 py-3 text-sm" role="alert">{error}</p>}
          {message && <p className="rounded-2xl bg-brand-soft px-4 py-3 text-sm" role="status">{message}</p>}
          <button disabled={pending} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand px-5 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60">{pending ? <LoaderCircle className="animate-spin" size={18} /> : <ArrowRight size={18} />}Enviar instruções</button>
        </form>
      </section>
    </main>
  );
}
