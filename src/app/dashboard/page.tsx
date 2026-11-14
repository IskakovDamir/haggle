import type { Metadata } from "next";
import { SiteShell } from "@/components/site/shell";
import { OverviewScreen } from "@/components/overview/overview-screen";

export const metadata: Metadata = { title: "Overview · Haggle" };

// What the debt costs now, what the wins saved, interest month by month, the cards, next steps and recent calls.
export default function Page() {
  return (
    <SiteShell wide>
      <OverviewScreen />
    </SiteShell>
  );
}
