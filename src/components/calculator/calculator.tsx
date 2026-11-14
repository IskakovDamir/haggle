"use client";

// The interactive calculator. The server renders it with the default values, so the results read in full
// with no JavaScript; typing recomputes everything through the engine on the visitor's device.
import { useId, useMemo, useState } from "react";
import { ProductButton } from "@/components/insights/product-button";
import { Provenance } from "@/components/insights/provenance";
import { getMarketStat } from "@/lib/benchmarks";
import { calculate, defaultInput, minimumPaymentRule, readInput, type CalculatorResult, type Scenario } from "@/lib/calculator/model";
import { formatApr, formatDuration, formatPoints } from "@/lib/format";
import { formatCents, formatDollars } from "@/lib/money";
import { cn } from "@/lib/utils";

const start = defaultInput();
const START_FIELDS = {
  balance: String(start.balanceCents / 100),
  apr: String(start.aprBps / 100),
  cut: formatPoints(start.cutBps),
};

function Field({
  label,
  suffix,
  prefix,
  value,
  onChange,
  error,
  hint,
}: {
  label: string;
  suffix?: string;
  prefix?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint: React.ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[15px] leading-5 font-semibold text-hg-ink">
        {label}
      </label>
      <div
        className={cn(
          "flex items-center gap-2 rounded-2xl border bg-white px-4 py-3 transition-colors focus-within:border-hg-blue",
          error ? "border-alarm" : "border-hg-line",
        )}
      >
        {prefix && <span className="text-[20px] font-semibold text-hg-muted">{prefix}</span>}
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={`${id}-hint`}
          className="w-full min-w-0 bg-transparent text-[22px] leading-7 font-semibold tracking-[-0.02em] text-hg-ink tabular-nums outline-none"
        />
        {suffix && <span className="text-[15px] font-semibold whitespace-nowrap text-hg-muted">{suffix}</span>}
      </div>
      <p id={`${id}-hint`} className={cn("text-[13px] leading-[18px] font-medium", error ? "text-alarm" : "text-hg-muted")}>
        {error ?? hint}
      </p>
    </div>
  );
}

function payoffText(s: Scenario): string {
  return s.paidOff ? formatDuration(s.payoffMonths) : "Not paid off in 100 years";
}

function Comparison({ result }: { result: CalculatorResult }) {
  const rows: { label: string; now: string; after: string }[] = [
    { label: "APR", now: formatApr(result.now.aprBps), after: formatApr(result.afterCut.aprBps) },
    { label: "Interest this month", now: formatCents(result.now.monthlyInterestCents), after: formatCents(result.afterCut.monthlyInterestCents) },
    { label: "Interest over a year", now: formatCents(result.now.annualInterestCents), after: formatCents(result.afterCut.annualInterestCents) },
    { label: "First minimum payment", now: formatCents(result.now.firstMinimumCents), after: formatCents(result.afterCut.firstMinimumCents) },
    { label: "Debt-free on minimum payments in", now: payoffText(result.now), after: payoffText(result.afterCut) },
    { label: "Total interest on minimums", now: formatDollars(result.now.payoffInterestCents), after: formatDollars(result.afterCut.payoffInterestCents) },
  ];
  return (
    <div role="region" aria-label="Your card now and after the cut" tabIndex={0} className="overflow-x-auto rounded-[24px] border border-hg-line bg-white">
      <table className="w-full">
        <thead>
          <tr className="text-left text-[13px] leading-[18px] font-semibold text-hg-muted">
            <th scope="col" className="px-3 py-3 sm:px-5">
              <span className="sr-only">Measure</span>
            </th>
            <th scope="col" className="px-3 py-3 sm:px-5">
              Now
            </th>
            <th scope="col" className="bg-hg-blue-soft px-3 py-3 text-hg-ink-2 sm:px-5">
              After the cut
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-hg-line">
              <th scope="row" className="px-3 py-3.5 text-left text-[14px] leading-5 font-medium text-hg-ink-2 sm:px-5 sm:text-[15px]">
                {row.label}
              </th>
              <td className="px-3 py-3.5 text-[15px] leading-5 font-semibold text-hg-ink tabular-nums sm:px-5 sm:text-[16px] sm:whitespace-nowrap">{row.now}</td>
              <td className="bg-hg-blue-soft px-3 py-3.5 text-[15px] leading-5 font-semibold text-hg-ink tabular-nums sm:px-5 sm:text-[16px] sm:whitespace-nowrap">{row.after}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function YearBars({ result }: { result: CalculatorResult }) {
  const max = Math.max(result.now.annualInterestCents, 1);
  const bars = [
    { label: "Interest this year now", cents: result.now.annualInterestCents, tone: "bg-white/45" },
    { label: "After the cut", cents: result.afterCut.annualInterestCents, tone: "bg-white" },
  ];
  return (
    <div className="flex flex-col gap-4">
      {bars.map((bar) => (
        <div key={bar.label} className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3 text-[15px] leading-5 font-semibold text-white">
            <span>{bar.label}</span>
            <span className="tabular-nums">{formatDollars(bar.cents)}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-lg bg-white/15">
            <div className={cn("h-3 rounded-lg transition-[width] duration-500 ease-out", bar.tone)} style={{ width: `${Math.round((bar.cents / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Calculator() {
  const [fields, setFields] = useState(START_FIELDS);
  // While a field is half typed, the results keep showing the last valid numbers, dimmed.
  const [lastValid, setLastValid] = useState(start);
  const { input, errors } = useMemo(() => readInput(fields), [fields]);
  const shown = useMemo(() => calculate(input ?? lastValid), [input, lastValid]);
  const result = input ? shown : null;
  const avgApr = getMarketStat("market-average-apr");
  const avgCut = getMarketStat("market-apr-cut");
  const set = (key: keyof typeof fields) => (value: string) => {
    const next = { ...fields, [key]: value };
    setFields(next);
    const read = readInput(next);
    if (read.input) setLastValid(read.input);
  };

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
      <form className="flex flex-col gap-6 rounded-[32px] bg-hg-surface p-6 sm:p-8" onSubmit={(e) => e.preventDefault()} aria-label="Your card">
        <Field label="Card balance" prefix="$" value={fields.balance} onChange={set("balance")} error={errors.balance} hint="What you owe on the card today." />
        <Field
          label="Your APR"
          suffix="%"
          value={fields.apr}
          onChange={set("apr")}
          error={errors.apr}
          hint={
            <>
              Printed on your statement. Starts at the US average, {formatApr(avgApr.value)} (<Provenance stat={avgApr} />
              ).
            </>
          }
        />
        <Field
          label="Rate cut to ask for"
          suffix="points"
          value={fields.cut}
          onChange={set("cut")}
          error={errors.cut}
          hint={
            <>
              Starts at the average cut people got when they asked, {formatPoints(avgCut.value)} points (<Provenance stat={avgCut} />
              ).
            </>
          }
        />
        <p className="text-[13px] leading-[18px] font-medium text-hg-muted">Your numbers stay in this browser tab. Nothing is sent or saved.</p>
      </form>

      <div aria-live="polite" className="flex flex-col gap-3">
        <div
          className={cn("flex flex-col gap-5 rounded-[32px] p-6 transition-opacity sm:p-8", !result && "opacity-60")}
          style={{ backgroundImage: "linear-gradient(161.82deg, #2453e6 14.286%, #0f2a9e 85.714%)" }}
        >
          <div className="flex flex-col gap-1">
            <p className="text-[15px] leading-5 font-semibold text-white/75">A {formatPoints(shown.now.aprBps - shown.afterCut.aprBps)}-point cut would save you</p>
            <p className="text-[clamp(44px,7vw,72px)] leading-none font-semibold tracking-[-0.04em] text-white tabular-nums">{formatDollars(shown.yearSavedCents)}</p>
            <p className="text-[15px] leading-6 font-medium text-white/80">
              in the first year
              {shown.payoffInterestSavedCents > 0 && (
                <>
                  , and {formatDollars(shown.payoffInterestSavedCents)} in interest over the whole payoff if you pay only the minimum
                  {shown.monthsSaved > 0 && <>, debt-free {formatDuration(shown.monthsSaved)} sooner</>}
                </>
              )}
              .
            </p>
          </div>
          <YearBars result={shown} />
          <p className="text-[13px] leading-[18px] font-medium text-white/65">Calculated from your numbers with Haggle&rsquo;s tested engine. Not a quote from your bank.</p>
        </div>
        <Comparison result={shown} />
        <div className="flex flex-col items-start gap-3 rounded-[24px] bg-hg-ink p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[15px] leading-6 font-medium text-white/80">
            Haggle can make this call. If the bank says yes, its fee is 20% of the first-year saving:{" "}
            <span className="font-semibold text-white tabular-nums">{formatCents(shown.haggleFeeCents)}</span> here. No yes, no fee.
          </p>
          <ProductButton path="/start" tone="white" className="shrink-0">
            Have Haggle ask for this cut
          </ProductButton>
        </div>
        <p className="text-[13px] leading-[18px] font-medium text-hg-muted">
          Assumes the balance stays the same for a year and no new purchases. The minimum payment is {minimumPaymentRule()}. Your card&rsquo;s rule is on
          your statement.
        </p>
      </div>
    </div>
  );
}
