import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { IssuerPageBody } from "@/components/directory/issuer-page";
import { ISSUERS, getIssuer } from "@/lib/directory";
import { issuerMetadata } from "@/lib/directory/meta";

export function generateStaticParams() {
  return ISSUERS.map((issuer) => ({ issuer: issuer.slug }));
}

export async function generateMetadata({ params }: PageProps<"/phone/[issuer]">): Promise<Metadata> {
  const issuer = getIssuer((await params).issuer);
  return issuer ? issuerMetadata(issuer, "en") : {};
}

// `params` is read inside Suspense so client navigations can show the shell at once; every issuer is prerendered.
export default function IssuerPage({ params }: PageProps<"/phone/[issuer]">) {
  return (
    <Suspense fallback={<div className="min-h-[80vh]" />}>
      <IssuerView params={params} />
    </Suspense>
  );
}

async function IssuerView({ params }: { params: PageProps<"/phone/[issuer]">["params"] }) {
  const issuer = getIssuer((await params).issuer);
  if (!issuer) notFound();
  return <IssuerPageBody issuer={issuer} lang="en" />;
}
