"use client";

import { RotateCcw } from "lucide-react";
import { useBrandTheme } from "@/components/brand-theme-provider";

const suggestedColors = ["#FE6731", "#276EF1", "#0D8F69", "#7B47E8", "#D04770"];

export function BrandColorControl() {
  const { brandColor, resetBrandColor, setBrandColor } = useBrandTheme();

  return (
    <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <p className="text-base font-medium">Cor de destaque</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Personalize a cor principal do seu CRM. Botões, estados ativos e detalhes visuais são atualizados na hora.
          </p>
        </div>
        <label className="flex shrink-0 items-center gap-3 self-start rounded-2xl border border-border bg-surface-muted px-3 py-2 sm:self-auto">
          <input
            type="color"
            value={brandColor}
            onChange={(event) => setBrandColor(event.target.value)}
            className="size-9 cursor-pointer rounded-xl border-0 bg-transparent p-0"
            aria-label="Escolher cor de destaque"
          />
          <span className="text-sm font-medium uppercase tracking-wide">{brandColor}</span>
        </label>
      </div>
      <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-border pt-6">
        <span className="text-sm text-muted-foreground">Sugestões</span>
        {suggestedColors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => setBrandColor(color)}
            className="grid size-9 place-items-center rounded-full border-2 border-surface transition-colors hover:brightness-90 focus-visible:outline-none"
            style={{ backgroundColor: color, boxShadow: `0 0 0 1px ${color}` }}
            aria-label={`Usar a cor ${color}`}
          >
            {brandColor === color && <span className="size-2 rounded-full bg-white" />}
          </button>
        ))}
        <button
          type="button"
          onClick={resetBrandColor}
          className="ml-auto inline-flex h-10 items-center gap-2 rounded-2xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
        >
          <RotateCcw size={16} aria-hidden="true" />
          Restaurar original
        </button>
      </div>
    </div>
  );
}
