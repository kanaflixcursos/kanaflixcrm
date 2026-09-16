import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { AuthForm } from "./auth-form";

export default function LoginPage() {
  return (
    <main
      className="min-h-screen bg-background p-5 sm:p-8"
      style={{ "--brand": "#FE6731", "--brand-foreground": "#FFFFFF" } as React.CSSProperties}
    >
      <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-7xl overflow-hidden rounded-[2rem] border border-border bg-surface lg:grid-cols-[1.1fr_0.9fr] sm:min-h-[calc(100vh-4rem)]">
        <section className="relative flex flex-col justify-between overflow-hidden bg-foreground p-7 text-surface sm:p-10 lg:p-14">
          <Image
            src="/auth-abstract.jpg"
            alt=""
            fill
            priority
            className="object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-linear-to-b from-foreground/35 via-foreground/75 to-foreground" />
          <Link href="/" className="relative inline-flex w-fit rounded-xl bg-surface px-3 py-2">
            <Image src="/logo-kanaflix-crm.png" alt="Kanaflix CRM" width={155} height={24} priority />
          </Link>
          <div className="relative max-w-xl py-16 lg:py-0">
            <div className="grid size-12 place-items-center rounded-2xl bg-brand text-brand-foreground">
              <Sparkles size={22} aria-hidden="true" />
            </div>
            <h1 className="mt-7 text-4xl font-medium leading-[1.05] tracking-[-0.05em] sm:text-5xl">
              Menos ruído. Mais relacionamento.
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-surface/70 sm:text-lg">
              Um espaço simples para a equipe do Kanaflix cuidar de cada conversa que importa.
            </p>
          </div>
          <p className="relative flex items-center gap-2 text-sm text-surface/60">
            Kanaflix CRM <ArrowUpRight size={15} aria-hidden="true" />
          </p>
        </section>
        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-14">
          <AuthForm />
        </section>
      </div>
    </main>
  );
}
