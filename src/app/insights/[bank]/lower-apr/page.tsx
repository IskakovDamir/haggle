import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AprGuideBody } from "@/components/insights/apr-guide";
import { BANKS, getBank } from "@/lib/benchmarks";
import { aprGuideMetadata } from "@/lib/benchmarks/meta";

export function generateStaticParams() {
  return BANKS.map((bank) => ({ bank: bank.slug }));
}

export async function generateMetadata({ params }: PageProps<"/insights/[bank]/lower-apr">): Promise<Metadata> {
  const bank = getBank((await params).bank);
  return bank ? aprGuideMetadata(bank, "en") : {};
}

// `params` is read inside Suspense so client navigations can show the shell at once; every bank is prerendered.
export default function LowerAprGuidePage({ params }: PageProps<"/insights/[bank]/lower-apr">) {
  return (
    <Suspense fallback={<div className="min-h-[80vh]" />}>
      <GuideView params={params} />
    </Suspense>
  );
}

async function GuideView({ params }: { params: PageProps<"/insights/[bank]/lower-apr">["params"] }) {
  const bank = getBank((await params).bank);
  if (!bank) notFound();
  return <AprGuideBody bank={bank} lang="en" />;
}
