import type { Metadata } from "next";
import { SiteShell } from "@/components/site/shell";
import { CardsScreen } from "@/components/cards/cards-screen";

export const metadata: Metadata = {
  title: "My cards · Haggle",
  description: "Every card in your case, with what it costs and what was won on it.",
};

export default function Page() {
  return (
    <SiteShell>
      <CardsScreen />
    </SiteShell>
  );
}
