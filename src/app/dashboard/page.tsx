import type { Metadata } from "next";
import { SiteShell } from "@/components/site/shell";
import { DashboardScreen } from "@/components/dashboard/dashboard-screen";

export const metadata: Metadata = { title: "Your wins · Haggle" };

// Paid versus saved, the debt-free dates, what comes next, and every call with its transcript.
export default function Page() {
  return (
    <SiteShell>
      <DashboardScreen />
    </SiteShell>
  );
}
