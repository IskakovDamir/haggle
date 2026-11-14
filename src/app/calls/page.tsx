import type { Metadata } from "next";
import { CallListScreen } from "@/components/calls/call-list";
import { SiteShell } from "@/components/site/shell";

export const metadata: Metadata = {
  title: "Your calls | Haggle",
  description: "Every call worth making, across every bank, with where each one stands.",
};

export default function CallsPage() {
  return (
    <SiteShell>
      <CallListScreen />
    </SiteShell>
  );
}
