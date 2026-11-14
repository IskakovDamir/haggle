import type { Metadata } from "next";
import { RememberLocale } from "@/components/i18n/locale-switch";
import { InsightsFooter, InsightsHeader } from "@/components/insights/chrome";
import { siteUrl } from "@/lib/benchmarks/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  openGraph: { siteName: "Haggle", type: "article", locale: "es_US" },
  twitter: { card: "summary_large_image" },
};

// The Spanish phone directory. It remembers Spanish, like the /es landing, so the app screens follow.
export default function TelefonosLayout({ children }: LayoutProps<"/es/telefonos">) {
  return (
    <div lang="es-US" className="flex flex-1 flex-col bg-white font-manrope">
      <RememberLocale locale="es" />
      <InsightsHeader lang="es" />
      <main className="flex-1">{children}</main>
      <InsightsFooter lang="es" />
    </div>
  );
}
