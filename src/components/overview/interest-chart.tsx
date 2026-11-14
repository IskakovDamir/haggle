"use client";

import { motion } from "framer-motion";
import { EASE } from "@/components/motion/reveal";
import { ArrowText } from "@/components/ui/arrow-text";
import { caption, Panel, PanelHeader, Pill } from "@/components/site/app-ui";
import { formatCents, formatDollars } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { InterestMonth, InterestSeries } from "./interest-series";

const BAR_TONE = {
  current: "bg-hg-blue",
  lowered: "bg-hg-blue-tint",
  before: "bg-[#dce2ec]",
} as const;

const toneOf = (month: InterestMonth) => (month.current ? BAR_TONE.current : month.lowered ? BAR_TONE.lowered : BAR_TONE.before);

/** Keeps the dark pill inside the chart near its edges. */
function pillAlign(month: number): string {
  if (month <= 3) return "left-0";
  if (month >= 10) return "right-0";
  return "left-1/2 -translate-x-1/2";
}

function Legend({ lowered }: { lowered: boolean }) {
  const item = (tone: string, label: string) => (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className={cn("size-2.5 rounded-[3px]", tone)} />
      {label}
    </span>
  );
  return (
    <div className={cn(caption, "flex flex-wrap gap-x-4 gap-y-1.5 font-medium text-hg-muted")}>
      {item(BAR_TONE.before, lowered ? "Before the win" : "At your statement's rate")}
      {lowered && item(BAR_TONE.lowered, "After the win")}
      {item(BAR_TONE.current, "This month")}
    </div>
  );
}

/** "Interest paid per month": twelve bars, the current month in blue, the win named on its month. */
export function InterestChart({ series, subtitle }: { series: InterestSeries; subtitle: string }) {
  const anyLowered = series.months.some((month) => month.lowered);
  const marker = series.marker;

  return (
    <Panel aria-labelledby="interest-chart" className="flex min-w-0 flex-col gap-4">
      <PanelHeader
        id="interest-chart"
        title="Interest paid per month"
        sub={`${subtitle} · ${series.year}`}
        right={
          series.monthlyCutCents > 0 ? (
            <Pill>−{formatDollars(series.monthlyCutCents)} a month</Pill>
          ) : (
            <Pill tone="soft">{formatDollars(series.currentMonthlyCents)} a month</Pill>
          )
        }
      />

      <ul className="sr-only">
        {series.months.map((month) => (
          <li key={month.month}>
            {month.name}: {formatCents(month.interestCents)}
            {month.current ? " (this month)" : month.future ? " (estimate)" : ""}
          </li>
        ))}
      </ul>

      <div aria-hidden className="relative pt-10">
        <div className="pointer-events-none absolute inset-x-0 top-10 flex h-[180px] flex-col justify-between sm:h-[200px]">
          <span className="h-px bg-[#edf0f5]" />
          <span className="h-px bg-[#edf0f5]" />
          <span className="h-px bg-[#edf0f5]" />
        </div>

        <div className="relative flex justify-between gap-1 sm:gap-2.5">
          {series.months.map((month, index) => {
            const named = marker?.month === month.month;
            return (
              <div key={month.month} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="group relative flex h-[180px] w-full items-end justify-center sm:h-[200px]">
                  <motion.div
                    className={cn("w-full max-w-[26px] rounded-[6px] sm:rounded-lg", toneOf(month))}
                    initial={{ height: 0 }}
                    animate={{ height: `${month.heightPct}%` }}
                    transition={{ duration: 0.7, ease: EASE, delay: 0.1 + index * 0.04 }}
                  />
                  {named ? (
                    <motion.span
                      className={cn(
                        caption,
                        "absolute z-10 rounded-[10px] bg-hg-ink px-2.5 py-1.5 whitespace-nowrap text-white shadow-[0_10px_24px_-12px_rgb(11_18_32/0.7)]",
                        pillAlign(month.month),
                      )}
                      style={{ bottom: `calc(${month.heightPct}% + 10px)` }}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, ease: EASE, delay: 0.9 }}
                    >
                      <ArrowText text={marker.label} />
                    </motion.span>
                  ) : (
                    <span
                      className={cn(
                        caption,
                        "pointer-events-none absolute z-10 rounded-lg bg-hg-ink px-2 py-1 whitespace-nowrap text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100",
                        pillAlign(month.month),
                      )}
                      style={{ bottom: `calc(${month.heightPct}% + 8px)` }}
                    >
                      {formatDollars(month.interestCents)}
                    </span>
                  )}
                </div>
                <span className={cn(caption, month.current ? "text-hg-ink" : "text-hg-muted")}>{month.letter}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Legend lowered={anyLowered} />
        <p className="text-[12px] leading-4 font-medium text-hg-muted">
          The balance is held where it is today. Months ahead are an estimate.
        </p>
      </div>
    </Panel>
  );
}
