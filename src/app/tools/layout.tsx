import type { Metadata } from "next";
import { InsightsFooter, InsightsHeader } from "@/components/insights/chrome";
import { siteUrl } from "@/lib/benchmarks/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  openGraph: { siteName: "Haggle", type: "website", locale: "en_US" },
  twitter: { card: "summary_large_image" },
};

export default function ToolsLayout({ children }: LayoutProps<"/tools">) {
  return (
    <div className="flex flex-1 flex-col bg-white font-manrope">
      <InsightsHeader />
      <main className="flex-1">{children}</main>
      <InsightsFooter />
    </div>
  );
}
