"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarClock, FileText, Upload, type LucideIcon } from "lucide-react";
import { cardLabel } from "@/components/call/ask";
import { Notice } from "@/components/call/page-states";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { caption } from "@/components/site/app-ui";
import { useClock } from "@/components/site/use-clock";
import { useCaseFile } from "@/lib/store";
import type { CaseFile, IsoDate } from "@/lib/types";
import { cn } from "@/lib/utils";
import { InterestChart } from "./interest-chart";
import { overviewFor } from "./overview-model";
import { KpiRow, NextStepsPanel, RecentCalls, SampleTag, SURFACE, YourCards } from "./overview-panels";

/** Grey blocks in the shape of the overview, until the case and the clock are read in the browser. */
function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="Loading your overview">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <div key={key} className="hg-shimmer h-[143px] rounded-[24px]" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="hg-shimmer h-[380px] rounded-[28px]" />
        <div className="hg-shimmer h-[380px] rounded-[28px]" />
      </div>
    </div>
  );
}

type WayIn = {
  href: string;
  title: string;
  text: string;
  icon: LucideIcon;
  /** Graphite, the blue gradient, or a pale blue wash with a hairline. */
  tone: "dark" | "blue" | "pale";
  sample?: boolean;
  /** A 3D object peeking out of the top right corner. Decorative. */
  art?: { src: string; width: number; height: number };
};

const WAYS_IN: WayIn[] = [
  {
    href: "/start",
    title: "Add a statement",
    text: "Upload a PDF or a photo, or type three numbers.",
    icon: Upload,
    tone: "dark",
    art: { src: "/app/3d/upload-tray-3d.png", width: 120, height: 119 },
  },
  {
    href: "/start?sample=maria-chase",
    title: "Try Maria's sample",
    text: "A sample Chase statement, read the same way as an upload.",
    icon: FileText,
    tone: "blue",
    sample: true,
  },
  { href: "/missed", title: "I missed a payment", text: "Ask for the late fee and your old rate back.", icon: CalendarClock, tone: "pale" },
];

const WAY_TONE = {
  dark: {
    card: cn(SURFACE.dark, "hover:shadow-[0_18px_40px_-24px_rgb(11_18_32/0.8)]"),
    tile: "bg-white/8 text-white",
    title: "text-white",
    text: "text-white/70",
    start: "text-white",
  },
  blue: {
    card: cn(SURFACE.blue, "hover:shadow-[0_18px_40px_-24px_rgb(47_107_255/0.9)]"),
    tile: "bg-white/8 text-white",
    title: "text-white",
    text: "text-white/70",
    start: "text-white",
  },
  pale: {
    card: "border border-hg-blue-tint bg-[linear-gradient(180deg,#e6f0fd_0%,#f7faff_100%)] hover:shadow-[0_18px_40px_-24px_rgb(47_107_255/0.55)]",
    tile: "bg-hg-blue-soft text-hg-blue",
    title: "text-hg-ink",
    text: "text-hg-muted",
    start: "text-hg-blue",
  },
} as const;

/** No case yet: what Haggle does, and three ways in. */
function FirstRun() {
  return (
    <Stagger onMount gap={0.08} className="flex flex-col gap-4">
      <StaggerItem>
        <section className={cn(SURFACE.blue, "relative overflow-hidden rounded-[32px] p-7 sm:p-10 lg:min-h-[360px] lg:rounded-[40px]")}>
          <Image
            src="/app/3d/wallet-3d.png"
            alt=""
            width={400}
            height={447}
            sizes="(min-width: 1024px) 37vw, 0px"
            priority
            className="pointer-events-none absolute -top-[17px] right-[2.75%] hidden h-auto w-[36.8%] max-w-[400px] select-none lg:block"
          />
          <div className="relative max-w-[40rem] lg:max-w-[56%]">
            <p className={cn(caption, "inline-flex rounded-full bg-white/15 px-3 py-1 text-white")}>Your overview</p>
            <h1 className="mt-4 text-[clamp(30px,3.6vw,46px)] leading-[1.08] font-semibold tracking-[-0.035em] text-white">
              Let&apos;s see what your cards <span className="text-[#c9dbff]">really cost you</span>
            </h1>
            <p className="mt-4 max-w-[35rem] text-[16px] leading-7 font-medium text-white/80">
              Add a credit card statement. Haggle works out the interest, what is worth asking the bank for, and makes the calls. You
              pay only after a win.
            </p>
          </div>
        </section>
      </StaggerItem>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {WAYS_IN.map((way) => {
          const tone = WAY_TONE[way.tone];
          return (
            <StaggerItem key={way.href} className="h-full">
              <Link
                href={way.href}
                className={cn(
                  "group relative flex h-full min-h-[200px] flex-col overflow-hidden rounded-[28px] p-5 transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1",
                  tone.card,
                )}
              >
                {way.art && (
                  <Image
                    src={way.art.src}
                    alt=""
                    width={way.art.width}
                    height={way.art.height}
                    sizes={`${way.art.width}px`}
                    className="pointer-events-none absolute -top-3.5 -right-2.5 h-auto w-[120px] select-none"
                  />
                )}
                <span className="relative flex items-center justify-between gap-2">
                  <span className={cn("flex size-10 items-center justify-center rounded-2xl", tone.tile)}>
                    <way.icon className="size-[18px]" aria-hidden />
                  </span>
                  {way.sample && <SampleTag tone="blue" />}
                </span>
                <span className={cn("relative mt-3.5 text-[17px] leading-6 font-semibold tracking-[-0.01em]", tone.title)}>
                  {way.title}
                </span>
                <span className={cn("relative mt-3 text-sm leading-[19px] font-medium", tone.text)}>{way.text}</span>
                <span className={cn(caption, "relative mt-auto inline-flex items-center gap-1 pt-4", tone.start)}>
                  Start
                  <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            </StaggerItem>
          );
        })}
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
          <SampleTag />
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
