"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const fullName = String(formData.get("fullName") ?? "");
    const supabase = createClient();

    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: fullName },
              emailRedirectTo: `${window.location.origin}/`,
            },
          });

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    if (mode === "signup" && !result.data.session) {
      setMessage("Conta criada. Confirme seu e-mail para entrar no CRM.");
      return;
    }

    window.location.assign("/");
  }

  async function handleGoogleSignIn() {
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data, error: googleError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (googleError) {
        setError(googleError.message);
        return;
      }

      if (!data.url) {
        setError("Não foi possível iniciar o acesso com Google. Tente novamente.");
        return;
      }

      window.location.assign(data.url);
    } catch {
      setError("Não foi possível conectar ao Google. Verifique sua conexão e tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <div className="mb-8 flex rounded-2xl bg-surface-muted p-1">
        {([
          ["login", "Entrar"],
          ["signup", "Criar conta"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setMode(value);
              setError(null);
              setMessage(null);
            }}
            className={`h-10 flex-1 rounded-xl text-sm font-medium transition-colors ${
              mode === value ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div>
        <h1 className="text-3xl font-medium tracking-[-0.04em]">
          {mode === "login" ? "Boas-vindas de volta." : "Comece com clareza."}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {mode === "login"
            ? "Entre para acompanhar seus relacionamentos e oportunidades."
            : "Crie seu espaço e organize cada novo relacionamento."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {mode === "signup" && (
          <label className="block space-y-2">
            <span className="text-sm font-medium">Seu nome</span>
            <input
              name="fullName"
              required
              autoComplete="name"
              className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm"
              placeholder="Como devemos chamar você?"
            />
          </label>
        )}
        <label className="block space-y-2">
          <span className="text-sm font-medium">E-mail</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm"
            placeholder="voce@empresa.com"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Senha</span>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm"
            placeholder="Mínimo de 6 caracteres"
          />
          </label>

        {mode === "login" && (
          <div className="-mt-2 text-right">
            <Link href="/recuperar-senha" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Esqueci minha senha</Link>
          </div>
        )}

        {error && <p className="rounded-2xl bg-brand-soft px-4 py-3 text-sm text-foreground">{error}</p>}
        {message && <p className="rounded-2xl bg-brand-soft px-4 py-3 text-sm text-foreground">{message}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand px-5 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? <LoaderCircle className="animate-spin" size={18} /> : <ArrowRight size={18} />}
          {mode === "login" ? "Entrar no CRM" : "Criar minha conta"}
        </button>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          <span>ou continue com</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-5 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <LoaderCircle className="animate-spin" size={18} />
          ) : (
            <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden="true">
              <path fill="#4285F4" d="M21.35 12.27c0-.79-.07-1.55-.23-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.42Z" />
              <path fill="#34A853" d="M12 21.7c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.7-1.72-5.47-4.03H3.29v2.53A9.74 9.74 0 0 0 12 21.7Z" />
              <path fill="#FBBC05" d="M6.53 13.78a5.86 5.86 0 0 1 0-3.56V7.69H3.29a9.74 9.74 0 0 0 0 8.62l3.24-2.53Z" />
              <path fill="#EA4335" d="M12 6.19c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.83 3.27 14.63 2.3 12 2.3a9.74 9.74 0 0 0-8.71 5.39l3.24 2.53C7.3 7.91 9.46 6.19 12 6.19Z" />
            </svg>
          )}
          Continuar com Google
        </button>
      </form>
    </div>
  );
}
