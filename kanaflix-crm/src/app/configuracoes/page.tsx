import Link from "next/link";
import { Building2, ChevronRight, GitBranch, PlugZap, UserRound } from "lucide-react";
import { getCurrentWorkspace } from "@/lib/current-workspace";
import { AppShell } from "@/components/app-shell";
import { PageEyebrow } from "@/components/page-eyebrow";

export const dynamic = "force-dynamic";

const items = [
  { href: "/configuracoes/perfil", icon: UserRound, title: "Seu perfil", description: "Nome, e-mail, senha, imagem e workspace padrão.", action: "Abrir perfil" },
  { href: "/configuracoes/workspace", icon: Building2, title: "Este workspace", description: "Nome, logo, cor, convidados e transferência de propriedade.", action: "Abrir workspace" },
  { href: "/configuracoes/pipeline", icon: GitBranch, title: "Pipeline de vendas", description: "Nome e ordem das etapas da operação comercial.", action: "Configurar pipeline" },
  { href: "/configuracoes/integracoes", icon: PlugZap, title: "Integrações de marketing", description: "Prepare Meta Pixel e Google Tag Manager para este cliente.", action: "Abrir integrações" },
];

export default async function SettingsPage() {
  const { organization } = await getCurrentWorkspace();
  return (
    <AppShell organization={organization}>
      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
        <section>
          <div className="max-w-2xl">
            <PageEyebrow>Preferências</PageEyebrow>
            <h1 className="mt-3 text-4xl font-medium tracking-[-0.04em] sm:text-5xl">Configurações</h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">Gerencie sua conta e as preferências do workspace atual.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {items.map(({ href, icon: Icon, title, description, action }) => (
              <Link key={href} href={href} className="rounded-3xl border border-border bg-surface p-6 shadow-sm transition-colors hover:border-brand/30">
                <div className="grid size-11 place-items-center rounded-2xl bg-brand-soft text-brand"><Icon size={20} /></div>
                <h2 className="mt-5 text-lg font-medium">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-brand">{action} <ChevronRight size={16} /></span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
