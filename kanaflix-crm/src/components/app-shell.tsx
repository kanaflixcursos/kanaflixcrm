"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  Building2,
  CircleHelp,
  ContactRound,
  FileText,
  LayoutDashboard,
  ListTodo,
  Menu,
  Search,
  Settings,
  Target,
  X,
  Zap,
} from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";
import { TenantSwitcher } from "@/components/tenant-switcher";

type Organization = {
  id: string;
  name: string;
};

const navigation = [
  { label: "Visão geral", icon: LayoutDashboard, href: "/" },
  { label: "Hoje", icon: CalendarDays, href: "/hoje" },
  { label: "Leads", icon: ContactRound, href: "/contatos" },
  { label: "Empresas", icon: Building2, href: "/empresas" },
  { label: "Oportunidades", icon: Target, href: "/oportunidades" },
  { label: "Atividades", icon: ListTodo, href: "/atividades" },
  { label: "Formulários", icon: FileText, href: "/formularios" },
  { label: "Automações", icon: Zap, href: "/automacoes" },
  { label: "Relatórios", icon: ChartNoAxesColumnIncreasing, href: "/relatorios" },
];

export function AppShell({
  children,
  organization,
}: Readonly<{
  children: React.ReactNode;
  organization: Organization;
}>) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="hidden h-dvh w-72 flex-col border-r border-border bg-surface px-5 py-7 lg:fixed lg:inset-y-0 lg:left-0 lg:flex">
        <Link href="/" className="mb-12 block px-3" aria-label="Kanaflix CRM">
          <Image src="/logo-kanaflix-crm.png" alt="Kanaflix CRM" width={166} height={26} priority />
        </Link>
        <TenantSwitcher currentOrganization={organization} />

        <nav aria-label="Navegação principal" className="space-y-1.5">
          {navigation.map(({ label, icon: Icon, href }) => {
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
            const className = `flex h-11 items-center gap-3 rounded-2xl px-3.5 text-sm transition-colors ${
              isActive
                ? "bg-brand-soft font-medium text-foreground"
                : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
            }`;

            return (
              <Link key={label} href={href} className={className}>
                <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-1.5 border-t border-border pt-5">
          <Link
            href="/configuracoes"
            className={`flex h-11 items-center gap-3 rounded-2xl px-3.5 text-sm transition-colors ${
              pathname === "/configuracoes"
                ? "bg-brand-soft font-medium text-foreground"
                : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
            }`}
          >
            <Settings size={19} strokeWidth={1.9} aria-hidden="true" />
            Configurações
          </Link>
          <span className="flex h-11 cursor-not-allowed items-center gap-3 rounded-2xl px-3.5 text-sm text-muted-foreground opacity-45" title="Em breve">
            <CircleHelp size={19} strokeWidth={1.9} aria-hidden="true" />
            Ajuda e suporte
          </span>
        </div>
      </aside>

      <main className="min-w-0 lg:pl-72">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-border bg-surface/95 px-5 backdrop-blur sm:px-8 lg:px-12">
          <div className="flex items-center gap-3 lg:hidden">
            <button type="button" onClick={() => setMobileOpen((open) => !open)} className="grid size-11 place-items-center rounded-2xl text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground" aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={mobileOpen}>
              {mobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            </button>
            <Link href="/" aria-label="Kanaflix CRM">
              <Image src="/logo-kanaflix-crm.png" alt="Kanaflix CRM" width={150} height={24} priority />
            </Link>
          </div>
          <label className="relative hidden min-w-0 flex-1 lg:block">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Buscar no CRM"
              className="h-11 w-full max-w-sm rounded-2xl border border-border bg-surface-muted pl-10 pr-4 text-sm placeholder:text-muted-foreground"
            />
          </label>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              className="grid size-11 place-items-center rounded-2xl text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
              aria-label="Ver notificações"
            >
              <Bell size={20} strokeWidth={1.9} aria-hidden="true" />
            </button>
            <SignOutButton />
          </div>
        </header>

        {mobileOpen && (
          <div className="fixed inset-0 top-20 z-30 bg-black/15 lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true">
            <aside className="h-full w-[min(20rem,calc(100vw-2rem))] border-r border-border bg-surface px-5 py-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
              <TenantSwitcher currentOrganization={organization} />
              <nav aria-label="Navegação principal" className="mt-6 space-y-1.5">
                {navigation.map(({ label, icon: Icon, href }) => {
                  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
                  return <Link key={label} href={href} onClick={() => setMobileOpen(false)} className={`flex h-11 items-center gap-3 rounded-2xl px-3.5 text-sm transition-colors ${isActive ? "bg-brand-soft font-medium text-foreground" : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"}`}><Icon size={19} strokeWidth={1.9} aria-hidden="true" />{label}</Link>;
                })}
              </nav>
              <div className="mt-6 border-t border-border pt-5">
                <Link href="/configuracoes" onClick={() => setMobileOpen(false)} className="flex h-11 items-center gap-3 rounded-2xl px-3.5 text-sm text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"><Settings size={19} strokeWidth={1.9} aria-hidden="true" />Configurações</Link>
              </div>
            </aside>
          </div>
        )}

        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
