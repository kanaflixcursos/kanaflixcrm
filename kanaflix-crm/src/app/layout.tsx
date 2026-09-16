import type { Metadata } from "next";
import "@fontsource-variable/google-sans-flex/full.css";
import { BrandThemeProvider } from "@/components/brand-theme-provider";
import { getOptionalWorkspace } from "@/lib/current-workspace";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kanaflix CRM",
  description: "Relacionamentos que movem o Kanaflix.",
};

const DEFAULT_BRAND_COLOR = "#FE6731";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const workspace = await getOptionalWorkspace();
  const initialBrandColor = workspace?.organization.brand_color?.toUpperCase() ?? DEFAULT_BRAND_COLOR;

  return (
    <html lang="pt-BR" className="h-full" style={{ "--brand": initialBrandColor } as React.CSSProperties}>
      <body className="min-h-full">
        <BrandThemeProvider initialBrandColor={initialBrandColor}>{children}</BrandThemeProvider>
      </body>
    </html>
  );
}
