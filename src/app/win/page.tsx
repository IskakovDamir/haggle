import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/call/page-states";
import { SiteShell } from "@/components/site/shell";
import { WinScreen } from "@/components/win/win-screen";

export const metadata: Metadata = { title: "Result · Haggle" };

// The result of a call, and what it is worth.
// The screen reads the URL's query string, so it sits behind a Suspense boundary and the shell is prerendered.
export default function Page() {
  return (
    <SiteShell>
      <Suspense fallback={<PageSkeleton />}>
        <WinScreen />
      </Suspense>
    </SiteShell>
  );
}
