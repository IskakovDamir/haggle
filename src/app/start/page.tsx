import { Suspense } from "react";
import type { Metadata } from "next";
import { SiteShell } from "@/components/site/shell";
import { StartFlow } from "@/components/start/start-flow";
import { StartSkeleton } from "@/components/start/start-skeleton";

export const metadata: Metadata = {
  title: "Add a statement | Haggle",
  description: "Upload a credit card statement, try a sample, or type the numbers.",
};

export default function StartPage() {
  return (
    <SiteShell>
      {/* StartFlow reads ?sample= from the URL, which is only known in the browser. */}
      <Suspense fallback={<StartSkeleton />}>
        <StartFlow />
      </Suspense>
    </SiteShell>
  );
}
