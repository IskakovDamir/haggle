import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BankBody } from "@/components/insights/bank-body";
import { BANKS, getBank } from "@/lib/benchmarks";
import { insightsBankMetadata } from "@/lib/benchmarks/meta";

export function generateStaticParams() {
  return BANKS.map((bank) => ({ bank: bank.slug }));
}

export async function generateMetadata({ params }: PageProps<"/es/datos/[bank]">): Promise<Metadata> {
  const bank = getBank((await params).bank);
  return bank ? insightsBankMetadata(bank, "es") : {};
}

export default function BancoPage({ params }: PageProps<"/es/datos/[bank]">) {
  return (
    <Suspense fallback={<div className="min-h-[80vh]" />}>
      <BancoView params={params} />
    </Suspense>
  );
}

async function BancoView({ params }: { params: PageProps<"/es/datos/[bank]">["params"] }) {
  const bank = getBank((await params).bank);
  if (!bank) notFound();
  return <BankBody bank={bank} lang="es" />;
}
