"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock, FileText, Upload, type LucideIcon } from "lucide-react";
import { cardLabel } from "@/components/call/ask";
import { Notice } from "@/components/call/page-states";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { caption } from "@/components/site/app-ui";
import { useClock } from "@/components/site/use-clock";
import { SampleBadge } from "@/components/ui/primitives";
import { useCaseFile } from "@/lib/store";
import type { CaseFile, IsoDate } from "@/lib/types";
import { cn } from "@/lib/utils";
import { InterestChart } from "./interest-chart";
import { overviewFor } from "./overview-model";
import { KpiRow, NextStepsPanel, RecentCalls, YourCards } from "./overview-panels";

/** Grey blocks in the shape of the overview, until the case and the clock are read in the browser. */
function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="Loading your overview">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <div key={key} className="hg-shimmer h-[132px] rounded-[20px]" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="hg-shimmer h-[380px] rounded-[20px]" />
        <div className="hg-shimmer h-[380px] rounded-[20px]" />
      </div>
    </div>
  );
}

const WAYS_IN: { href: string; title: string; text: string; icon: LucideIcon; sample?: boolean }[] = [
  { href: "/start", title: "Add a statement", text: "Upload a PDF or a photo, or type three numbers.", icon: Upload },
  {
    href: "/start?sample=maria-chase",
    title: "Try Maria's sample",
    text: "A sample Chase statement, read the same way as an upload.",
    icon: FileText,
    sample: true,
  },
  { href: "/missed", title: "I missed a payment", text: "Ask for the late fee and your old rate back.", icon: CalendarClock },
];

/** No case yet: what Haggle does, and three ways in. */
function FirstRun() {
  return (
    <Stagger onMount gap={0.08} className="flex flex-col gap-4">
      <StaggerItem>
        <section className="hg-panel relative overflow-hidden rounded-[28px] p-7 sm:p-10">
          <span aria-hidden className="pointer-events-none absolute -top-32 -right-24 size-[22rem] rounded-full bg-white/15 blur-3xl" />
          <span aria-hidden className="pointer-events-none absolute -bottom-40 -left-20 size-[20rem] rounded-full bg-[#1a3fb0]/50 blur-3xl" />
          <div className="relative max-w-[40rem]">
            <p className={cn(caption, "inline-flex rounded-full bg-white/15 px-3 py-1 text-white")}>Your overview</p>
            <h1 className="mt-4 text-[clamp(30px,4.4vw,46px)] leading-[1.08] font-semibold tracking-[-0.04em] text-white">
              Let&apos;s see what your cards <span className="text-[#bcd0ff]">really cost you</span>
            </h1>
            <p className="mt-4 max-w-[52ch] text-[16px] leading-7 font-medium text-white/80">
              Add a credit card statement. Haggle works out the interest, what is worth asking the bank for, and makes the calls. You
              pay only after a win.
            </p>
          </div>
        </section>
      </StaggerItem>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {WAYS_IN.map((way) => (
          <StaggerItem key={way.href} className="h-full">
            <Link
              href={way.href}
              className="group flex h-full flex-col gap-3 rounded-[20px] bg-white p-5 shadow-[0_1px_2px_rgb(11_18_32/0.03)] transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-[0_18px_40px_-24px_rgb(47_107_255/0.55)]"
            >
              <span className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-hg-blue-soft text-hg-blue">
                  <way.icon className="size-[18px]" aria-hidden />
                </span>
                {way.sample && <SampleBadge />}
              </span>
              <span className="text-[17px] leading-6 font-semibold tracking-[-0.01em] text-hg-ink">{way.title}</span>
              <span className="text-sm leading-snug font-medium text-hg-muted">{way.text}</span>
              <span className={cn(caption, "mt-auto inline-flex items-center gap-1 pt-1 text-hg-blue")}>
                Start
                <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          </StaggerItem>
        ))}
      </div>
    </Stagger>
  );
}

function OverviewBody({ caseFile, today }: { caseFile: CaseFile; today: IsoDate }) {
  const overview = useMemo(() => {
    try {
      return overviewFor(caseFile, today);
    } catch {
      return null;
    }
  }, [caseFile, today]);

  if (!overview) {
    return (
      <Notice tone="alarm">
        We could not work out your numbers just now. Your cards are safe in this browser. Please reload the page, or check the numbers on{" "}
        <Link href="/cards" className="font-semibold underline underline-offset-2">
          My cards
        </Link>
        .
      </Notice>
    );
  }

  const subtitle = caseFile.cards.length === 1 ? cardLabel(caseFile.cards[0]) : `All ${caseFile.cards.length} cards`;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="sr-only">Overview</h1>
      {overview.hasSample && (
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-hg-muted">
          <SampleBadge />
          Some of these numbers come from a sample statement.
        </p>
      )}
      <KpiRow overview={overview} />
      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <InterestChart series={overview.chart} subtitle={subtitle} />
        <YourCards overview={overview} />
      </div>
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <NextStepsPanel overview={overview} today={today} />
        <RecentCalls overview={overview} cards={caseFile.cards} />
      </div>
    </div>
  );
}

/** /dashboard: the overview, as in the dashboard picture on the landing page. */
export function OverviewScreen() {
  const { caseFile, ready } = useCaseFile();
  const clock = useClock();
  if (!ready || !clock) return <OverviewSkeleton />;
  if (!caseFile || caseFile.cards.length === 0) return <FirstRun />;
  return <OverviewBody caseFile={caseFile} today={clock.today} />;
}
