import Link from "next/link";
import { ArrowRight, Upload } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HERO_FACTS, type Fact } from "./facts";
import { SAMPLE_HREF, START_HREF } from "./links";
import { SourceLink } from "./section";

function HeroStat({ fact, big }: { fact: Fact; big: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border p-5",
        big ? "col-span-2 border-ink bg-ink text-paper lg:col-span-1" : "border-line bg-card",
      )}
    >
      <b
        className={cn(
          "tabular block leading-[1.1] font-extrabold tracking-tight",
          big ? "text-6xl text-lime" : "text-3xl",
        )}
      >
        {fact.value}
      </b>
      <span className={cn("mt-1.5 block text-sm leading-snug", big ? "text-paper/75" : "text-muted")}>
        {fact.claim}
      </span>
      <SourceLink
        source={fact.source}
        className={cn(
          "mt-auto pt-3 text-xs underline underline-offset-2",
          big ? "text-paper/60 hover:text-paper" : "text-muted hover:text-ink",
        )}
      />
    </div>
  );
}

export function Hero() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 pt-12 pb-14 sm:px-6 sm:pt-20">
      <p className="mb-4 text-xs font-semibold tracking-widest text-muted uppercase">On the borrower&apos;s side</p>
      <h1 className="max-w-[14ch] text-[clamp(2.5rem,7vw,5rem)] leading-[1.02] font-extrabold">
        An AI agent that{" "}
        <em className="bg-[linear-gradient(transparent_62%,var(--lime)_62%)] px-1">calls your bank</em>
      </h1>
      <p className="mt-6 max-w-[60ch] text-lg text-muted sm:text-xl">
        Haggle reads your credit card statement, shows what the debt costs you, and negotiates for a lower rate, a
        waived fee or a higher limit. You pay only after a win.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href={START_HREF} className={buttonVariants({ size: "lg" })}>
          <Upload className="size-4" aria-hidden />
          Upload a statement
        </Link>
        <Link href={SAMPLE_HREF} className={buttonVariants({ size: "lg", variant: "outline" })}>
          Try Maria&apos;s statement
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
      <p className="mt-4 max-w-[62ch] text-sm text-muted">
        <strong className="text-ink">Calls in this build are practice calls.</strong> You play the bank&apos;s
        representative and the agent negotiates with you, by typing or, when voice is switched on, out loud. No real
        bank is called. There is no login, and your case stays in this browser.
      </p>

      <div className="mt-12 grid grid-cols-2 gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        {HERO_FACTS.map((fact, index) => (
          <HeroStat key={fact.value} fact={fact} big={index === 0} />
        ))}
      </div>
      <p className="mt-7 max-w-[62ch] text-lg sm:text-xl">
        Most people who ask get a yes, and few ever ask.{" "}
        <strong className="rounded bg-lime px-1.5">Haggle asks for you.</strong>
      </p>
    </section>
  );
}
