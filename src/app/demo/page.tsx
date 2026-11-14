import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/call/page-states";
import { DemoStart } from "@/components/missed/demo-start";
import { SiteShell } from "@/components/site/shell";

export const metadata: Metadata = {
  title: "Try the demo · Haggle",
  description: "A 60-second practice call with sample data: Haggle calls the bank about a missed payment, and you play the bank.",
};

export default function DemoPage() {
  return (
    <SiteShell>
      {/* The sample is saved in the browser, so the work happens on the client. */}
      <Suspense fallback={<PageSkeleton />}>
        <DemoStart />
      </Suspense>
    </SiteShell>
  );
}
