import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MIN_PAYMENT } from "@/lib/engine";
import { formatApr, formatDuration } from "@/lib/format";
import { formatDollars, formatShort } from "@/lib/money";
import { SAMPLE_STATEMENTS } from "@/lib/statement/samples";
import type { TrapExample } from "./examples";
import { CARRY_A_BALANCE, IN_DEBT_OVER_A_YEAR, type Fact } from "./facts";
import { SAMPLE_HREF } from "./links";
import { Section, SourceLink } from "./section";

function FactCard({ fact }: { fact: Fact }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <b className="tabular block text-4xl leading-[1.1] font-extrabold tracking-tight">{fact.value}</b>
      <p className="mt-1.5 text-sm leading-snug text-muted">{fact.claim}</p>
      <SourceLink source={fact.source} className="mt-2 inline-block text-xs text-muted underline underline-offset-2 hover:text-ink" />
    </div>
  );
}

/** The engine's own answer for a round-number balance, with the rule it used. */
function TrapCallout({ example }: { example: TrapExample }) {
  const { minimumOnly } = example;
  return (
    <div className="mt-3 rounded-2xl border border-leak/30 bg-leak-soft p-6">
      <p className="text-2xl leading-tight font-extrabold tracking-tight text-leak sm:text-3xl">
        {formatDollars(example.balanceCents)} at {formatApr(example.aprBps)}, paying only the minimum:{" "}
        {formatDuration(minimumOnly.months)} and {formatDollars(minimumOnly.totalInterestCents)} in interest
      </p>
      <p className="mt-3 max-w-[70ch] text-muted">
        The minimum here is {MIN_PAYMENT.percentOfBalanceBps / 100}% of the balance plus that month&apos;s interest, and
        at least {formatShort(MIN_PAYMENT.floorCents)}. In the first month, {formatShort(example.firstMonthInterestCents)}{" "}
        of the {formatShort(example.firstPaymentCents)} payment is interest. This is our calculation, done by the same
        tested code that builds your plan.
      </p>
    </div>
  );
}

/** The made-up cardholder behind the sample statements. Her numbers are the samples' own blurbs. */
function Persona() {
  const statements = SAMPLE_STATEMENTS.filter((sample) => sample.id.startsWith("maria-"));
  return (
    <div className="mt-3 grid gap-5 rounded-2xl border border-line bg-card p-6 sm:grid-cols-[auto_1fr]">
      <div
        aria-hidden
        className="flex size-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--lime),var(--green))] text-2xl font-extrabold"
      >
        M
      </div>
      <div>
        <h3 className="text-lg font-semibold">Maria, 34, a teacher in Columbus, Ohio, with two kids</h3>
        <ul className="mt-1.5 text-muted">
          {statements.map((sample) => (
            <li key={sample.id}>
              {sample.label}: {sample.blurb}.
            </li>
          ))}
        </ul>
        <p className="font-display mt-4 text-2xl leading-snug">
          &ldquo;I&apos;m scared to call. I don&apos;t know what to say. And forty minutes on hold with two kids is not
          happening.&rdquo;
        </p>
        <p className="mt-4 text-sm text-muted">
          Maria is made up. Her statements are sample PDF files that go through the product the same way an upload does.{" "}
          <Link href={SAMPLE_HREF} className="inline-flex items-center gap-1 font-medium text-green underline underline-offset-2">
            Try her Chase statement
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </p>
      </div>
    </div>
  );
}

export function TrapSection({ example }: { example: TrapExample | null }) {
  return (
    <Section
      id="trap"
      eyebrow="01 The problem"
      title={
        <>
          A card balance is a <em>trap</em> with no end date
        </>
      }
      lead="A credit card is revolving credit with no payoff schedule. Pay only the minimum and the balance barely moves, because much of each payment is interest."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <FactCard fact={CARRY_A_BALANCE} />
        <FactCard fact={IN_DEBT_OVER_A_YEAR} />
      </div>
      {example && <TrapCallout example={example} />}
      <Persona />
    </Section>
  );
}
