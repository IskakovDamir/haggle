import type { Metadata } from "next";
import { PlanScreen } from "@/components/plan/plan-screen";
import { SiteShell } from "@/components/site/shell";

export const metadata: Metadata = {
  title: "Your plan | Haggle",
  description: "What your card debt costs, what is worth asking the bank for, and in what order.",
};

export default function PlanPage() {
  return (
    <SiteShell>
      <PlanScreen />
    </SiteShell>
  );
}
