import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AprGuideBody } from "@/components/insights/apr-guide";
import { BANKS, getBank } from "@/lib/benchmarks";
import { aprGuideMetadata } from "@/lib/benchmarks/meta";

export function generateStaticParams() {
  return BANKS.map((bank) => ({ bank: bank.slug }));
}

export async function generateMetadata({ params }: PageProps<"/es/datos/[bank]/bajar-la-tasa">): Promise<Metadata> {
  const bank = getBank((await params).bank);
  return bank ? aprGuideMetadata(bank, "es") : {};
}

// `params` is read inside Suspense so client navigations can show the shell at once; every bank is prerendered.
export default function GuiaBajarLaTasaPage({ params }: PageProps<"/es/datos/[bank]/bajar-la-tasa">) {
  return (
    <Suspense fallback={<div className="min-h-[80vh]" />}>
      <GuideView params={params} />
    </Suspense>
  );
}

async function GuideView({ params }: { params: PageProps<"/es/datos/[bank]/bajar-la-tasa">["params"] }) {
  const bank = getBank((await params).bank);
  if (!bank) notFound();
  return <AprGuideBody bank={bank} lang="es" />;
}
