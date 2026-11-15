import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
        className="group mb-6 flex items-center justify-between gap-3 rounded-[14px] bg-[linear-gradient(90deg,#283143_0%,#151c2b_45%,#475674_100%)] px-4 py-3 text-sm font-semibold text-white/70 transition-[filter,box-shadow] duration-200 hover:shadow-[0_12px_28px_-14px_rgb(11_18_32/0.6)] hover:brightness-110"
      >
        <span>
          <span className="text-[#a9c6ff]">Missed a payment?</span> Start here to get the late fee and your old rate back.
        </span>
        <ArrowRight aria-hidden className="size-4 shrink-0 text-[#a9c6ff] transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.25} />
      </Link>
      {/* StartFlow reads ?sample= from the URL, which is only known in the browser. */}
      <Suspense fallback={<StartSkeleton />}>
        <StartFlow />
      </Suspense>
    </SiteShell>
  );
}
