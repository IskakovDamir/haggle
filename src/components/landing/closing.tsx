import Link from "next/link";
import { ArrowRight, Upload } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SAMPLE_HREF, START_HREF } from "./links";
import { Section } from "./section";

const REAL = [
  "Reading your statement, and the checks on what was read",
  "Every number: interest, payoff time, credit use, savings",
  "The plan and its dates",
  "The agent's side of the negotiation",
  "Reading the outcome from the transcript, and the code check on it",
  "Stripe's hosted checkout, in test mode",
];

const PRACTICE = [
  "The bank on the other end is you, or whoever you hand the microphone to. Not a bank.",
  "A call to a real bank needs the cardholder on the line and a phone bridge. That is the next step, and it is not in this build.",
  "No results are seeded and the bank's lines are not scripted. What you say decides how the call ends.",
];

function Column({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-6">
      <h3 className="text-xs font-bold tracking-widest text-muted uppercase">{title}</h3>
      <ul className="mt-3 list-disc space-y-2 pl-5">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

/** What is real in this build and what is practice, said plainly, then the two ways in again. */
export function ClosingSection() {
  return (
    <Section
      id="honest"
      eyebrow="06 This build"
      title={
        <>
          What is real, and what is <em>practice</em>
        </>
      }
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Column title="Real" items={REAL} />
        <Column title="Practice" items={PRACTICE} />
      </div>

      <div className="mt-10 rounded-2xl bg-ink p-7 text-paper sm:p-10">
        <h2 className="max-w-[18ch] text-3xl leading-[1.1] font-extrabold sm:text-[2.75rem]">
          See what your card <em>costs you</em>
        </h2>
        <p className="mt-3 max-w-[52ch] text-paper/75">
          One statement is enough. No login. Your numbers stay in this browser.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {/* On the dark panel the buttons swap to lime and to a light outline. cn() lets these win over the variant. */}
          <Link href={START_HREF} className={cn(buttonVariants({ size: "lg" }), "bg-lime text-ink hover:bg-lime/90")}>
            <Upload className="size-4" aria-hidden />
            Upload a statement
          </Link>
          <Link
            href={SAMPLE_HREF}
            className={cn(buttonVariants({ size: "lg", variant: "ghost" }), "border border-paper/30 text-paper hover:bg-paper/10")}
          >
            Try Maria&apos;s statement
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </Section>
  );
}
