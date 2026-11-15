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

const STEPS = ["Fill in Maria's example", "See what the call is worth", "Get a real call", "Play the bank", "See the result"];

export function JudgesPage() {
  const router = useRouter();
  const capabilities = useCapabilities();
  const ready = capabilities.status === "ready" ? capabilities.capabilities : null;
  const prefixes = ready?.phoneOpen ?? [];
  const phoneLine =
    capabilities.status === "loading"
      ? "Checking phone calls…"
      : ready?.phone && prefixes.length > 0
        ? `A ${prefixes.join(" or ")} phone, optional`
        : "No phone needed today";

  function start() {
    startTour();
    router.push("/missed");
  }

  return (
    <main className="flex-1 bg-white font-manrope">
      <div className="mx-auto flex w-full max-w-[880px] flex-col px-4 pt-6 pb-20 sm:px-8 sm:pt-8">
        <HgLogo href="/" />

        <Stagger onMount gap={0.07} className="mt-12 flex flex-col items-start sm:mt-16">
          <StaggerItem
            as="h1"
            className="text-[clamp(36px,6vw,56px)] leading-[1.05] font-semibold tracking-[-0.035em] text-hg-ink"
          >
            See Haggle win a call in 3 minutes
          </StaggerItem>
          <StaggerItem as="p" className="mt-4 max-w-[680px] text-[17px] leading-7 font-medium text-hg-ink-2 sm:text-lg">
            Haggle calls your card&apos;s bank after a missed payment and gets the fee and your old rate back. You pay only if it
            wins.
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
        </Stagger>

        <section aria-labelledby="judges-steps" className="mt-14">
          <h2 id="judges-steps" className="sr-only">
            What you&apos;ll do
          </h2>
          <Stagger as="ol" gap={0.06} className="grid gap-3 sm:grid-cols-5">
            {STEPS.map((step, index) => (
              <StaggerItem as="li" key={step} className="flex items-center gap-3 rounded-[20px] bg-hg-surface p-4 sm:flex-col sm:items-start">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-hg-blue text-sm font-bold text-white">
                  {index + 1}
                </span>
                <span className="text-[15px] leading-5 font-semibold tracking-[-0.01em] text-hg-ink">{step}</span>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[15px] font-medium text-hg-ink-2">
          <li className="flex items-center gap-2">
            <Clock className="size-4 shrink-0 text-hg-blue" aria-hidden />3 minutes
          </li>
          <li className="flex items-center gap-2">
            <Smartphone className="size-4 shrink-0 text-hg-blue" aria-hidden />
            {phoneLine}
          </li>
          <li className="flex items-center gap-2">
            <Volume2 className="size-4 shrink-0 text-hg-blue" aria-hidden />
            Sound on
          </li>
        </ul>
      </div>
    </main>
  );
}
