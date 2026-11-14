import { Suspense } from "react";
import Link from "next/link";
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
      <Link
        href="/missed"
        className="group mb-6 flex items-center justify-between gap-3 rounded-2xl border border-hg-blue-tint bg-hg-blue-soft px-4 py-3 text-sm font-semibold text-hg-ink-2 transition-colors hover:bg-white"
      >
        <span>
          <span className="text-hg-blue">Missed a payment?</span> Start here to get the late fee and your old rate back.
        </span>
        <span aria-hidden className="text-hg-blue transition-transform group-hover:translate-x-0.5">
          →
        </span>
      </Link>
      {/* StartFlow reads ?sample= from the URL, which is only known in the browser. */}
      <Suspense fallback={<StartSkeleton />}>
        <StartFlow />
      </Suspense>
    </SiteShell>
  );
}
