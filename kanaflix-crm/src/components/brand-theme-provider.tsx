"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";

const DEFAULT_BRAND_COLOR = "#FE6731";
const STORAGE_KEY = "kanaflix-crm-brand-color";

type BrandThemeContextValue = {
  brandColor: string;
  setBrandColor: (color: string) => void;
  resetBrandColor: () => void;
};

const BrandThemeContext = createContext<BrandThemeContextValue | null>(null);

function getContrastColor(hex: string) {
  const red = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const green = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const blue = Number.parseInt(hex.slice(5, 7), 16) / 255;
  const linearChannels = [red, green, blue].map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  const luminance =
    0.2126 * linearChannels[0] + 0.7152 * linearChannels[1] + 0.0722 * linearChannels[2];

  return luminance > 0.48 ? "#171716" : "#FFFFFF";
}

function applyBrandColor(color: string) {
  document.documentElement.style.setProperty("--brand", color);
  document.documentElement.style.setProperty("--brand-foreground", getContrastColor(color));
}

export function BrandThemeProvider({
  children,
  initialBrandColor = DEFAULT_BRAND_COLOR,
}: {
  children: React.ReactNode;
  initialBrandColor?: string;
}) {
  const [brandColor, setBrandColorState] = useState(initialBrandColor);

  useEffect(() => {
    applyBrandColor(initialBrandColor);

    const supabase = createSupabaseClient();
    void supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("current_organization_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile?.current_organization_id) return;

      const { data: organization } = await supabase
        .from("organizations")
        .select("brand_color")
        .eq("id", profile.current_organization_id)
        .maybeSingle();

      if (!organization?.brand_color || !/^#[0-9A-F]{6}$/i.test(organization.brand_color)) return;

      const savedOrganizationColor = organization.brand_color.toUpperCase();
      setBrandColorState(savedOrganizationColor);
      applyBrandColor(savedOrganizationColor);
    });
  }, [initialBrandColor]);

  const value = useMemo<BrandThemeContextValue>(
    () => ({
      brandColor,
      setBrandColor: (color) => {
        if (!/^#[0-9A-F]{6}$/i.test(color)) return;

        const normalizedColor = color.toUpperCase();
        setBrandColorState(normalizedColor);
        applyBrandColor(normalizedColor);
        window.localStorage.setItem(STORAGE_KEY, normalizedColor);

        const supabase = createSupabaseClient();
        void supabase.auth.getUser().then(async ({ data: { user } }) => {
          if (!user) return;

          const { data: profile } = await supabase
            .from("profiles")
            .select("current_organization_id")
            .eq("id", user.id)
            .maybeSingle();

          if (!profile?.current_organization_id) return;

          await supabase
            .from("organizations")
            .update({ brand_color: normalizedColor })
            .eq("id", profile.current_organization_id);
        });
      },
      resetBrandColor: () => {
        setBrandColorState(DEFAULT_BRAND_COLOR);
        applyBrandColor(DEFAULT_BRAND_COLOR);
        window.localStorage.removeItem(STORAGE_KEY);

        const supabase = createSupabaseClient();
        void supabase.auth.getUser().then(async ({ data: { user } }) => {
          if (!user) return;

          const { data: profile } = await supabase
            .from("profiles")
            .select("current_organization_id")
            .eq("id", user.id)
            .maybeSingle();

          if (!profile?.current_organization_id) return;

          await supabase
            .from("organizations")
            .update({ brand_color: DEFAULT_BRAND_COLOR })
            .eq("id", profile.current_organization_id);
        });
      },
    }),
    [brandColor],
  );

  return <BrandThemeContext.Provider value={value}>{children}</BrandThemeContext.Provider>;
}

export function useBrandTheme() {
  const context = useContext(BrandThemeContext);

  if (!context) {
    throw new Error("useBrandTheme must be used within BrandThemeProvider");
  }

  return context;
}
