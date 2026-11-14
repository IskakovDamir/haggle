import { Suspense } from "react";
import type { Metadata } from "next";
import { MissedForm } from "@/components/missed/missed-form";
import { MissedHeader } from "@/components/missed/missed-header";
import { SiteShell } from "@/components/site/shell";

export const metadata: Metadata = {
  title: "Missed a payment | Haggle",
  description: "Missed a credit card payment? Haggle calls the bank to ask for the late fee back and your old rate.",
};

export default function MissedPage() {
  return (
    <SiteShell wide>
      <MissedHeader />
      {/* The form reads today's date, which is only known on each visit. */}
      <Suspense fallback={<div className="hg-shimmer h-[520px] rounded-[28px]" />}>
        <MissedForm />
      </Suspense>
    </SiteShell>
  );
}
