import type { Metadata } from "next";
import { SiteShell } from "@/components/site/shell";
import { AlertsScreen } from "@/components/alerts/alerts-screen";

export const metadata: Metadata = {
  title: "Alerts · Haggle",
  description: "Promo rates that end, steps coming due, what the bank asked for, and fees waiting after a win.",
};

export default function Page() {
  return (
    <SiteShell>
      <AlertsScreen />
    </SiteShell>
  );
}
