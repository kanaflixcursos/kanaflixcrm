import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-sm font-medium text-brand">404</p>
      <h1 className="mt-3 text-3xl font-medium tracking-[-0.04em]">Página não encontrada</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">O endereço pode ter mudado ou você não tem acesso a este conteúdo.</p>
      <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-2xl bg-brand px-4 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-hover">Voltar ao início</Link>
    </main>
  );
}
