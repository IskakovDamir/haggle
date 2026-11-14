import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { IssuerPageBody } from "@/components/directory/issuer-page";
import { ISSUERS, getIssuer } from "@/lib/directory";
import { issuerMetadata } from "@/lib/directory/meta";

export function generateStaticParams() {
  return ISSUERS.map((issuer) => ({ issuer: issuer.slug }));
}

export async function generateMetadata({ params }: PageProps<"/es/telefonos/[issuer]">): Promise<Metadata> {
  const issuer = getIssuer((await params).issuer);
  return issuer ? issuerMetadata(issuer, "es") : {};
}

export default function EmisorPage({ params }: PageProps<"/es/telefonos/[issuer]">) {
  return (
    <Suspense fallback={<div className="min-h-[80vh]" />}>
      <EmisorView params={params} />
    </Suspense>
  );
}

async function EmisorView({ params }: { params: PageProps<"/es/telefonos/[issuer]">["params"] }) {
  const issuer = getIssuer((await params).issuer);
  if (!issuer) notFound();
  return <IssuerPageBody issuer={issuer} lang="es" />;
}
