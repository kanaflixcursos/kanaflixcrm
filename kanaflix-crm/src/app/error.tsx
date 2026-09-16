"use client";

import { RefreshCw } from "lucide-react";

export default function GlobalError({ reset }: Readonly<{ reset: () => void }>) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="text-2xl font-medium tracking-[-0.03em]">Não conseguimos carregar esta página</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">Tente novamente. Se o problema continuar, verifique sua conexão ou fale com o suporte.</p>
      <button type="button" onClick={reset} className="mt-6 inline-flex h-11 items-center gap-2 rounded-2xl bg-brand px-4 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-hover">
        <RefreshCw size={17} aria-hidden="true" /> Tentar novamente
      </button>
    </main>
  );
}
