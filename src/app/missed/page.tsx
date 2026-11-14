import { Suspense } from "react";
import type { Metadata } from "next";
import { MissedForm } from "@/components/missed/missed-form";
import { Reveal } from "@/components/motion/reveal";
import { SiteShell } from "@/components/site/shell";

export const metadata: Metadata = {
  title: "Missed a payment | Haggle",
  description: "Missed a credit card payment? Haggle calls the bank to ask for the late fee back and your old rate.",
};

export default function MissedPage() {
  return (
    <SiteShell wide>
      <Reveal as="header" y={16} className="mb-8 max-w-2xl">
        <span className="inline-flex rounded-full bg-hg-blue-soft px-3 py-1 text-xs font-semibold text-hg-blue">Missed a payment</span>
        <h1 className="mt-3 text-[clamp(32px,5vw,48px)] leading-[1.1] font-semibold text-hg-ink">
          Get the late fee <em>back</em>
        </h1>
        <p className="mt-3 text-lg text-hg-muted">
          Banks often forgive one slip as a courtesy, if you ask. Tell us what happened and Haggle makes the call: the fee, your old
          rate and your credit report.
        </p>
      </Reveal>
      {/* The form reads today's date, which is only known on each visit. */}
      <Suspense fallback={<div className="hg-shimmer h-[520px] rounded-[28px]" />}>
        <MissedForm />
      </Suspense>
    </SiteShell>
  );
}
