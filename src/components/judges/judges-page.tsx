"use client";

// /judges: the front door for the Zimran Business Cup judges. Says what Haggle does in one paragraph,
// shows the five things they'll do, and starts the guided tour that walks them through it.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock, PlayCircle, Smartphone, Volume2 } from "lucide-react";
import { HgLogo } from "@/components/landing-v2/ui";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { useCapabilities } from "@/components/call/use-capabilities";
import { startTour } from "./tour-store";

const STEPS = [
  {
    title: "Fill in Maria's example",
    body: "One click loads a sample cardholder who missed a Chase payment. It's labelled as sample data everywhere.",
  },
  {
    title: "See what the call is worth",
    body: "A tested engine prices each ask in dollars: the $40 late fee, the old APR, the credit report. The AI never does math.",
  },
  {
    title: "Get a real call",
    body: "Type your phone number and Haggle calls you. Or type the call in your browser, no phone needed.",
  },
  {
    title: "Play the bank",
    body: "You're the Chase rep, with a script on screen. Push back and say no. Haggle counters honestly and reads back what you agreed.",
  },
  {
    title: "See the verified result",
    body: "Only what you said as the bank counts. Pay the 20% fee with a Stripe test card, then share the win card.",
  },
];

export function JudgesPage() {
  const router = useRouter();
  const capabilities = useCapabilities();
  const ready = capabilities.status === "ready" ? capabilities.capabilities : null;
  const prefixes = ready?.phoneOpen ?? [];
  const phoneLine =
    capabilities.status === "loading"
      ? "Checking whether phone calls are on…"
      : ready?.phone && prefixes.length > 0
        ? `A phone with a ${prefixes.join(" or ")} number, to get a real call. Optional.`
        : ready?.phone
          ? "Phone calls go to approved numbers only today, so you'll type the call instead."
          : "Phone calls are off right now, so you'll type the call instead.";

  function start() {
    startTour();
    router.push("/missed");
  }

  return (
    <main className="flex-1 bg-white font-manrope">
      <div className="mx-auto flex w-full max-w-[880px] flex-col px-4 pt-6 pb-20 sm:px-8 sm:pt-8">
        <HgLogo href="/" />

        <Stagger onMount gap={0.07} className="mt-12 flex flex-col items-start sm:mt-16">
          <StaggerItem>
            <span className="inline-flex rounded-full bg-hg-blue-soft px-3 py-1 text-xs font-semibold text-hg-blue">
              For Zimran Business Cup judges
            </span>
          </StaggerItem>
          <StaggerItem
            as="h1"
            className="mt-4 text-[clamp(36px,6vw,56px)] leading-[1.05] font-semibold tracking-[-0.035em] text-hg-ink"
          >
            See Haggle win a call in 3 minutes
          </StaggerItem>
          <StaggerItem as="p" className="mt-4 max-w-[680px] text-[17px] leading-7 font-medium text-hg-ink-2 sm:text-lg">
            Haggle is an AI agent that calls your credit card bank after a missed payment. It asks for the late fee back, your old
            rate back, and the late mark kept off your credit report. You pay 20% of what it saves you in the first year, and only
            after a verified win.
          </StaggerItem>

          <StaggerItem className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="xl" onClick={start} className="group w-full sm:w-auto">
              Start the guided tour
              <ArrowRight className="size-5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
            </Button>
            <Link
              href="/demo"
              className="flex h-12 items-center justify-center gap-1.5 rounded-full px-5 text-[15px] font-semibold text-hg-ink transition-colors hover:bg-hg-blue-soft"
            >
              <Smartphone className="size-4" aria-hidden />
              Skip the tour, call my phone
            </Link>
            <Link
              href="/#demo"
              className="flex h-12 items-center justify-center gap-1.5 rounded-full px-5 text-[15px] font-semibold text-hg-ink transition-colors hover:bg-hg-blue-soft"
            >
              <PlayCircle className="size-4" aria-hidden />
              Watch the 39-second video
            </Link>
          </StaggerItem>
          <StaggerItem as="p" className="mt-3 text-sm text-hg-muted">
            A small card guides you at each step and highlights what to press. Minimize or exit it any time.
          </StaggerItem>
        </Stagger>

        <section aria-labelledby="judges-steps" className="mt-14">
          <h2 id="judges-steps" className="text-[13px] font-semibold tracking-[0.08em] text-hg-muted uppercase">
            What you&apos;ll do
          </h2>
          <Stagger as="ol" gap={0.06} className="mt-4 flex flex-col gap-3">
            {STEPS.map((step, index) => (
              <StaggerItem
                as="li"
                key={step.title}
                className="flex items-start gap-4 rounded-[24px] border border-line bg-white p-5 shadow-[0_1px_2px_rgb(11_18_32/0.04)]"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-hg-blue text-[15px] font-bold text-white">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-[17px] leading-6 font-semibold tracking-[-0.015em] text-hg-ink">{step.title}</h3>
                  <p className="mt-1 text-[15px] leading-6 text-hg-ink-2">{step.body}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <section aria-labelledby="judges-need" className="rounded-[24px] bg-hg-surface p-5">
            <h2 id="judges-need" className="text-[15px] font-semibold text-hg-ink">
              What you need
            </h2>
            <ul className="mt-3 flex flex-col gap-2.5 text-[15px] leading-6 text-hg-ink-2">
              <li className="flex items-start gap-2.5">
                <Smartphone className="mt-1 size-4 shrink-0 text-hg-blue" aria-hidden />
                {phoneLine}
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="mt-1 size-4 shrink-0 text-hg-blue" aria-hidden />
                About 3 minutes.
              </li>
              <li className="flex items-start gap-2.5">
                <Volume2 className="mt-1 size-4 shrink-0 text-hg-blue" aria-hidden />
                Sound on, if you take the call.
              </li>
            </ul>
          </section>
          <section aria-labelledby="judges-honest" className="rounded-[24px] bg-hg-surface p-5">
            <h2 id="judges-honest" className="text-[15px] font-semibold text-hg-ink">
              Honest by design
            </h2>
            <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-[15px] leading-6 text-hg-ink-2 marker:text-hg-blue">
              <li>The agent says it&apos;s an AI assistant and that the call is recorded.</li>
              <li>It only states facts from the statement or from what the cardholder typed. It never invents a hardship.</li>
              <li>Every number you see comes from code, checked against what the bank actually said.</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
