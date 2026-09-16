"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageEyebrow } from "@/components/page-eyebrow";

export function DashboardHero() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative py-8 sm:py-10 lg:py-12">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <motion.div
        className="max-w-2xl"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        >
        <PageEyebrow className="mb-3">Visão do cliente atual</PageEyebrow>
        <h1 className="text-4xl font-medium tracking-[-0.04em] sm:text-5xl">Entenda cada lead que chegou.</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">Acompanhe captura, origem, qualificação e conversões sem perder tempo configurando um CRM pesado.</p>
        </motion.div>
        <Link href="/contatos/novo" className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-brand px-5 text-sm font-medium text-brand-foreground shadow-sm transition-colors hover:bg-brand-hover">
          <Plus size={19} strokeWidth={2.1} aria-hidden="true" />
          Novo lead
        </Link>
      </div>
    </section>
  );
}
