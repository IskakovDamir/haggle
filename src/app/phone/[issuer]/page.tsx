import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CheckedOn, LinesTable, PhoneNumber, Script } from "@/components/directory/blocks";
import { FaqList, JsonLd } from "@/components/insights/blocks";
import { Breadcrumbs, SectionTitle, sectionPad } from "@/components/insights/chrome";
import { ProductButton } from "@/components/insights/product-button";
import { InlineStat, SourceLink } from "@/components/insights/provenance";
import { HgSection } from "@/components/landing-v2/ui";
import { getBank, getMarketStat } from "@/lib/benchmarks";
import { faqJsonLd } from "@/lib/benchmarks/seo";
import { ISSUERS, directoryPath, getIssuer, issuersAtoZ, mainLine, serviceName } from "@/lib/directory";
import { issuerFaq } from "@/lib/directory/faq";
import { breadcrumbJsonLd } from "@/lib/directory/seo";
import type { Issuer } from "@/lib/directory/types";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return ISSUERS.map((issuer) => ({ issuer: issuer.slug }));
}

/** "chase credit card customer service" -> "Chase Credit Card Customer Service", keeping words like "U.S." as written. */
function titleCase(text: string): string {
  return text.replace(/\b([a-z])/g, (c) => c.toUpperCase());
}

function copy(issuer: Issuer) {
  const line = mainLine(issuer);
  return {
    title: `${titleCase(serviceName(issuer))} Phone Number: ${line.display}`,
    description: `Call ${serviceName(issuer)} at ${line.display}. The official number${line.hours ? " and hours" : ""}, what to have ready, and what to say to get a late fee back or a lower rate.`,
  };
}

export async function generateMetadata({ params }: PageProps<"/phone/[issuer]">): Promise<Metadata> {
  const issuer = getIssuer((await params).issuer);
  if (!issuer) return {};
  const { title, description } = copy(issuer);
  const path = directoryPath(issuer);
  return { title, description, alternates: { canonical: path }, openGraph: { title, description, url: path } };
}

// `params` is read inside Suspense so client navigations can show the shell at once; every issuer is prerendered.
export default function IssuerPage({ params }: PageProps<"/phone/[issuer]">) {
  return (
    <Suspense fallback={<div className="min-h-[80vh]" />}>
      <IssuerView params={params} />
    </Suspense>
  );
}

const body = "text-[16px] leading-[26px] font-medium text-hg-ink-2";
const link = "font-semibold text-hg-ink-2 underline decoration-hg-ink-2/30 underline-offset-[3px] hover:text-hg-blue";

async function IssuerView({ params }: { params: PageProps<"/phone/[issuer]">["params"] }) {
  const issuer = getIssuer((await params).issuer);
  if (!issuer) notFound();
  const name = issuer.name;
  const line = mainLine(issuer);
  const bank = issuer.insights ? getBank(issuer.insights) : undefined;
  const faq = issuerFaq(issuer);
  const path = directoryPath(issuer);
  const others = issuersAtoZ().filter((i) => i.slug !== issuer.slug);

  return (
    <>
      <JsonLd data={faqJsonLd(faq)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Phone numbers", path: "/phone" },
          { name, path },
        ])}
      />

      <HgSection className={cn("flex flex-col gap-6 pt-10 pb-6 lg:pt-14", sectionPad)}>
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { href: "/phone", label: "Phone numbers" }, { label: name }]} />
        <h1 className="max-w-[22ch] text-[clamp(34px,5vw,56px)] leading-[1.08] font-semibold tracking-[-0.04em] text-hg-ink">
          {serviceName(issuer)} <em>phone number</em>
        </h1>
        {issuer.aliases.length > 0 && <p className="text-[15px] leading-6 font-medium text-hg-muted">Also searched as {issuer.aliases.join(", ")}.</p>}

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.4fr_1fr]">
          <div
            className="relative isolate flex flex-col gap-3 overflow-hidden rounded-[32px] p-7 md:p-10"
            style={{ backgroundImage: "linear-gradient(161.82deg, #2453e6 14.286%, #0f2a9e 85.714%)" }}
          >
            <p className="text-[15px] leading-5 font-semibold text-white/75">{line.label}</p>
            <PhoneNumber line={line} className="text-[clamp(30px,8.4vw,64px)] leading-none font-semibold tracking-[-0.03em] whitespace-nowrap text-white hover:text-white/85" />
            <p className="text-[16px] leading-6 font-medium text-white/85">{line.hours ?? `Hours are not listed on ${issuer.source.name}.`}</p>
            <p className="mt-2 text-[13px] leading-[18px] font-medium">
              <CheckedOn issuer={issuer} tone="dark" />
            </p>
          </div>
          <div className="flex flex-col gap-4 rounded-[32px] bg-hg-ink p-7 md:p-10">
            <p className="text-[24px] leading-[30px] font-semibold tracking-[-0.03em] text-white">
              Skip the hold. <span className="text-white/55">Haggle calls {name} for you.</span>
            </p>
            <p className="text-[15px] leading-6 font-medium text-white/75">
              It says it is an AI assistant, waits on hold, and asks for a late fee refund or a lower rate. You join only to verify it is you, and you pay
              only if {name} says yes.
            </p>
            <div className="mt-auto flex flex-col gap-2.5">
              <ProductButton path={`/missed?bank=${issuer.slug}`} tone="white">
                Call {name} about a missed payment
              </ProductButton>
              <ProductButton path={`/start?bank=${issuer.slug}`} tone="blue">
                Ask {name} for a lower rate
              </ProductButton>
            </div>
          </div>
        </div>
      </HgSection>

      <HgSection className={cn("flex flex-col gap-6 py-10", sectionPad)}>
        <SectionTitle title={`All ${name} numbers`} lead={`These are the numbers ${name} publishes on its own site. Use the one on the back of your card if it differs.`} />
        <LinesTable issuer={issuer} />
      </HgSection>

      <HgSection className={cn("grid grid-cols-1 gap-6 py-10 lg:grid-cols-2", sectionPad)}>
        <div className="flex flex-col gap-4 rounded-[28px] bg-hg-surface p-7">
          <p className="text-[17px] leading-6 font-semibold tracking-[-0.01em] text-hg-ink">How to reach a person</p>
          {issuer.menu.length > 0 ? (
            issuer.menu.map((fact) => (
              <p key={fact.id} className={body}>
                {fact.text} <span className="text-[13px]">(<SourceLink source={fact.source} />)</span>
              </p>
            ))
          ) : (
            <p className={body}>
              We have not recorded the {name} phone menu yet. Haggle will publish it once its own calls do. If the menu does not offer a person, saying
              &ldquo;representative&rdquo; usually moves you along.
            </p>
          )}
        </div>
        <div className="flex flex-col gap-4 rounded-[28px] bg-hg-ink p-7">
          <p className="text-[17px] leading-6 font-semibold tracking-[-0.01em] text-white">How long you wait</p>
          {bank ? (
            <>
              {bank.extraStats.length > 0 && (
                <p className="text-[16px] leading-[26px] font-medium text-white/80">
                  Public reports do not agree.{" "}
                  {bank.extraStats.map((stat, i) => (
                    <span key={stat.id}>
                      {i === 0 ? "One puts it at " : " Another puts it at "}
                      <InlineStat stat={stat} tone="dark" />, the {stat.label}.
                    </span>
                  ))}
                </p>
              )}
              <p className="text-[16px] leading-[26px] font-medium text-white/80">
                Our estimate until our own calls measure it: <InlineStat stat={bank.stats.waitToPerson} tone="dark" />.
              </p>
            </>
          ) : (
            <p className="text-[16px] leading-[26px] font-medium text-white/80">
              Nobody publishes reliable hold times for {name}, and we have not measured them yet. Haggle will publish its own numbers once it calls.
            </p>
          )}
        </div>
      </HgSection>

      <HgSection className={cn("flex flex-col gap-6 py-10", sectionPad)}>
        <SectionTitle title="Before you call" />
        <div className="grid grid-cols-1 gap-x-10 gap-y-5 rounded-[28px] border border-hg-line p-7 sm:p-8 md:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <p className="text-[16px] leading-6 font-semibold text-hg-ink">Your card and statement</p>
            <p className={body}>The card number, your balance, your APR and any late fee, all printed on your latest statement.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-[16px] leading-6 font-semibold text-hg-ink">A way to verify it is you</p>
            <p className={body}>Banks usually check details such as your billing ZIP code or date of birth. Never share a full card number or password with anyone who calls you.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-[16px] leading-6 font-semibold text-hg-ink">One clear ask</p>
            <p className={body}>A refund of a named fee, or a specific lower rate. Write down any terms the agent offers and read them back.</p>
          </div>
        </div>
      </HgSection>

      <HgSection className={cn("flex flex-col gap-6 py-10", sectionPad)}>
        <SectionTitle title="What to say" lead="Fill in the brackets with what is true for you. Do not add a reason you do not have: a short, honest ask works." />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Script
            title="If you missed a payment"
            lines={[
              `Hi, I'm calling about my ${name} card ending in [last 4 digits].`,
              "I missed the payment due on [date] and paid it on [date].",
              "I've been a customer for [years] and I'd like to ask for the late fee to be refunded as a courtesy.",
            ]}
            note="If they say no, ask once whether a supervisor or the retention team can look at it."
          />
          <Script
            title="If your rate is too high"
            lines={[
              `Hi, I'm calling about the interest rate on my ${name} card ending in [last 4 digits].`,
              "My APR is [current APR]. I'd like to keep using this card, and I'm asking whether you can lower my rate.",
              "Does a lower rate need a hard credit check?",
            ]}
            note="If they offer a cut, ask for the new APR and when it starts, and read it back before you hang up."
          />
        </div>
        <p className="text-[15px] leading-6 font-medium text-hg-muted">
          Why it is worth asking: <InlineStat stat={getMarketStat("market-late-fee-waived")} /> of people who asked got a late fee waived, and{" "}
          <InlineStat stat={getMarketStat("market-apr-ask-success")} /> of those who asked for a lower rate got one.
        </p>
      </HgSection>

      <HgSection className={cn("flex flex-col gap-6 py-10", sectionPad)}>
        <SectionTitle title={`Questions about calling ${name}`} />
        <FaqList items={faq} />
      </HgSection>

      <HgSection className={cn("flex flex-col gap-3 pt-4 pb-12", sectionPad)}>
        {bank && (
          <p className="text-[15px] leading-6 font-medium text-hg-muted">
            More on {bank.shortName}:{" "}
            <Link href={`/insights/${bank.slug}`} className={link}>
              late fees, refunds and rate cuts at {bank.name}
            </Link>
            .
          </p>
        )}
        <p className="text-[15px] leading-6 font-medium text-hg-muted">
          Read how to{" "}
          <Link href="/insights/missed-payment" className={link}>
            get a late fee back
          </Link>{" "}
          and how to{" "}
          <Link href="/insights/lower-apr" className={link}>
            ask for a lower APR
          </Link>
          , or{" "}
          <Link href="/tools/credit-card-interest-calculator" className={link}>
            see what a lower rate would save you
          </Link>
          . Other issuers:{" "}
          {others.map((other, i) => (
            <span key={other.slug}>
              {i > 0 && ", "}
              <Link href={directoryPath(other)} className={link}>
                {other.name}
              </Link>
            </span>
          ))}
          .
        </p>
        <p className="text-[13px] leading-[18px] font-medium text-hg-muted">
          Haggle is not affiliated with {name}. The numbers above are {name}&rsquo;s own, read from its site on the date shown.
        </p>
      </HgSection>
    </>
  );
}
