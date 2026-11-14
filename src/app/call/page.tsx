import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/call/page-states";
import { SiteShell } from "@/components/site/shell";
import { CallScreen } from "@/components/call/call-screen";

export const metadata: Metadata = { title: "Practice call · Haggle" };

// The call: Haggle asks, and you play the bank.
// The screen reads the URL's query string, so it sits behind a Suspense boundary and the shell is prerendered.
export default function Page() {
  return (
    <SiteShell>
      <Suspense fallback={<PageSkeleton />}>
        <CallScreen />
      </Suspense>
    </SiteShell>
  );
}
