import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BankBody } from "@/components/insights/bank-body";
import { BANKS, getBank } from "@/lib/benchmarks";
import { insightsBankMetadata } from "@/lib/benchmarks/meta";

export function generateStaticParams() {
  return BANKS.map((bank) => ({ bank: bank.slug }));
}

export async function generateMetadata({ params }: PageProps<"/insights/[bank]">): Promise<Metadata> {
  const bank = getBank((await params).bank);
  return bank ? insightsBankMetadata(bank, "en") : {};
}

// The page reads `params` inside a Suspense boundary so a client navigation can show the shell at once.
// Every bank is prerendered by generateStaticParams, so a page load gets the full HTML.
export default function BankPage({ params }: PageProps<"/insights/[bank]">) {
  return (
    <Suspense fallback={<div className="min-h-[80vh]" />}>
      <BankView params={params} />
    </Suspense>
  );
}

async function BankView({ params }: { params: PageProps<"/insights/[bank]">["params"] }) {
  const bank = getBank((await params).bank);
  if (!bank) notFound();
  return <BankBody bank={bank} lang="en" />;
}
