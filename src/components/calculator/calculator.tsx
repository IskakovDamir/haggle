"use client";

// The interactive calculator, in English or Spanish. The server renders it with the default values, so the results
// read in full with no JavaScript; typing recomputes everything through the engine on the visitor's device.
import { useId, useMemo, useState } from "react";
import { ProductButton } from "@/components/insights/product-button";
import { Provenance } from "@/components/insights/provenance";
import { getMarketStat } from "@/lib/benchmarks";
import { calculate, defaultInput, minimumPaymentRule, readInput, type CalculatorResult, type FieldError, type Scenario } from "@/lib/calculator/model";
import { formatApr, formatDuration, formatPoints } from "@/lib/format";
import type { Copy, Locale } from "@/lib/i18n/locale";
import { formatCents, formatDollars } from "@/lib/money";
import { cn } from "@/lib/utils";

const start = defaultInput();
const START_FIELDS = {
  balance: String(start.balanceCents / 100),
  apr: String(start.aprBps / 100),
  cut: formatPoints(start.cutBps),
};

type CalcCopy = {
  form: string;
  balance: string;
  balanceHint: string;
  apr: string;
  aprHint: [string, string];
  cut: string;
  points: string;
  cutHint: [string, string];
  private: string;
  errors: Record<FieldError, string>;
  wouldSave: (points: string) => string;
  firstYear: string;
  payoffSaved: (amount: string) => string;
  sooner: (time: string) => string;
  bars: [string, string];
  calculated: string;
  tableLabel: string;
  measure: string;
  now: string;
  after: string;
  rows: [string, string, string, string, string, string];
  never: string;
  fee: [string, string];
  cta: string;
  assumes: (rule: string) => string;
};

const COPY: Copy<CalcCopy> = {
  en: {
    form: "Your card",
    balance: "Card balance",
    balanceHint: "What you owe on the card today.",
    apr: "Your APR",
    aprHint: ["Printed on your statement. Starts at the US average, ", ""],
    cut: "Rate cut to ask for",
    points: "points",
    cutHint: ["Starts at the average cut people got when they asked, ", " points"],
    private: "Your numbers stay in this browser tab. Nothing is sent or saved.",
    errors: {
      "balance-format": "Enter your balance in dollars, for example 5000.",
      "balance-max": "Enter a balance under $1,000,000.",
      "apr-format": "Enter your APR as a percent, for example 24.99.",
      "apr-max": "Enter an APR of 40% or less.",
      "cut-format": "Enter the cut in percentage points, for example 6.3.",
      "cut-over-apr": "The cut cannot be bigger than your APR.",
    },
    wouldSave: (points) => `A ${points}-point cut would save you`,
    firstYear: "in the first year",
    payoffSaved: (amount) => `, and ${amount} in interest over the whole payoff if you pay only the minimum`,
    sooner: (time) => `, debt-free ${time} sooner`,
    bars: ["Interest this year now", "After the cut"],
    calculated: "Calculated from your numbers with Haggle's tested engine. Not a quote from your bank.",
    tableLabel: "Your card now and after the cut",
    measure: "Measure",
    now: "Now",
    after: "After the cut",
    rows: ["APR", "Interest this month", "Interest over a year", "First minimum payment", "Debt-free on minimum payments in", "Total interest on minimums"],
    never: "Not paid off in 100 years",
    fee: ["Haggle can make this call. If the bank says yes, its fee is 20% of the first-year saving: ", " here. No yes, no fee."],
    cta: "Have Haggle ask for this cut",
    assumes: (rule) => `Assumes the balance stays the same for a year and no new purchases. The minimum payment is ${rule}. Your card's rule is on your statement.`,
  },
  es: {
    form: "Tu tarjeta",
    balance: "Saldo de la tarjeta",
    balanceHint: "Lo que debes hoy en la tarjeta.",
    apr: "Tu APR",
    aprHint: ["Aparece en tu estado de cuenta. Empieza en el promedio de EE. UU., ", ""],
    cut: "Reducción que vas a pedir",
    points: "puntos",
    cutHint: ["Empieza en la reducción promedio que consiguió quien la pidió, ", " puntos"],
    private: "Tus números se quedan en esta pestaña. No se envía ni se guarda nada.",
    errors: {
      "balance-format": "Escribe tu saldo en dólares, por ejemplo 5000.",
      "balance-max": "Escribe un saldo menor a $1,000,000.",
      "apr-format": "Escribe tu APR como porcentaje, por ejemplo 24.99.",
      "apr-max": "Escribe un APR de 40% o menos.",
      "cut-format": "Escribe la reducción en puntos porcentuales, por ejemplo 6.3.",
      "cut-over-apr": "La reducción no puede ser mayor que tu APR.",
    },
    wouldSave: (points) => `Una reducción de ${points} puntos te ahorraría`,
    firstYear: "el primer año",
    payoffSaved: (amount) => `, y ${amount} en intereses en todo el pago de la deuda si pagas solo el mínimo`,
    sooner: (time) => `, y terminarías ${time} antes`,
    bars: ["Intereses este año, ahora", "Con la reducción"],
    calculated: "Calculado con tus números y el motor probado de Haggle. No es una oferta de tu banco.",
    tableLabel: "Tu tarjeta ahora y con la reducción",
    measure: "Medida",
    now: "Ahora",
    after: "Con la reducción",
    rows: ["APR", "Intereses este mes", "Intereses en un año", "Primer pago mínimo", "Sin deuda pagando el mínimo en", "Intereses totales pagando el mínimo"],
    never: "No se paga en 100 años",
    fee: ["Haggle puede hacer esta llamada. Si el banco dice que sí, su comisión es el 20% del ahorro del primer año: ", " en este caso. Si no dice que sí, no pagas."],
    cta: "Que Haggle pida esta reducción",
    assumes: (rule) =>
      `Supone que el saldo se mantiene igual durante un año y que no haces compras nuevas. El pago mínimo es el ${rule}. La regla de tu tarjeta aparece en tu estado de cuenta.`,
  },
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

function Comparison({ result, lang }: { result: CalculatorResult; lang: Locale }) {
  const t = COPY[lang];
  const payoff = (s: Scenario) => (s.paidOff ? formatDuration(s.payoffMonths, lang) : t.never);
  const values: [string, string][] = [
    [formatApr(result.now.aprBps), formatApr(result.afterCut.aprBps)],
    [formatCents(result.now.monthlyInterestCents), formatCents(result.afterCut.monthlyInterestCents)],
    [formatCents(result.now.annualInterestCents), formatCents(result.afterCut.annualInterestCents)],
    [formatCents(result.now.firstMinimumCents), formatCents(result.afterCut.firstMinimumCents)],
    [payoff(result.now), payoff(result.afterCut)],
    [formatDollars(result.now.payoffInterestCents), formatDollars(result.afterCut.payoffInterestCents)],
  ];
  return (
    <div role="region" aria-label={t.tableLabel} tabIndex={0} className="overflow-x-auto rounded-[24px] border border-hg-line bg-white">
      <table className="w-full">
        <thead>
          <tr className="text-left text-[13px] leading-[18px] font-semibold text-hg-muted">
            <th scope="col" className="px-3 py-3 sm:px-5">
              <span className="sr-only">{t.measure}</span>
            </th>
            <th scope="col" className="px-3 py-3 sm:px-5">
              {t.now}
            </th>
            <th scope="col" className="bg-hg-blue-soft px-3 py-3 text-hg-ink-2 sm:px-5">
              {t.after}
            </th>
          </tr>
        </thead>
        <tbody>
          {t.rows.map((label, i) => (
            <tr key={label} className="border-t border-hg-line">
              <th scope="row" className="px-3 py-3.5 text-left text-[14px] leading-5 font-medium text-hg-ink-2 sm:px-5 sm:text-[15px]">
                {label}
              </th>
              <td className="px-3 py-3.5 text-[15px] leading-5 font-semibold text-hg-ink tabular-nums sm:px-5 sm:text-[16px] sm:whitespace-nowrap">{values[i][0]}</td>
              <td className="bg-hg-blue-soft px-3 py-3.5 text-[15px] leading-5 font-semibold text-hg-ink tabular-nums sm:px-5 sm:text-[16px] sm:whitespace-nowrap">
                {values[i][1]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function YearBars({ result, lang }: { result: CalculatorResult; lang: Locale }) {
  const t = COPY[lang];
  const max = Math.max(result.now.annualInterestCents, 1);
  const bars = [
    { label: t.bars[0], cents: result.now.annualInterestCents, tone: "bg-white/45" },
    { label: t.bars[1], cents: result.afterCut.annualInterestCents, tone: "bg-white" },
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

export function Calculator({ lang = "en" }: { lang?: Locale }) {
  const t = COPY[lang];
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
  const error = (code?: FieldError) => (code ? t.errors[code] : undefined);

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
      <form className="flex flex-col gap-6 self-start rounded-[32px] bg-hg-surface p-6 sm:p-8" onSubmit={(e) => e.preventDefault()} aria-label={t.form}>
        <Field label={t.balance} prefix="$" value={fields.balance} onChange={set("balance")} error={error(errors.balance)} hint={t.balanceHint} />
        <Field
          label={t.apr}
          suffix="%"
          value={fields.apr}
          onChange={set("apr")}
          error={error(errors.apr)}
          hint={
            <>
              {t.aprHint[0]}
              {formatApr(avgApr.value)}
              {t.aprHint[1]} (<Provenance stat={avgApr} lang={lang} />
              ).
            </>
          }
        />
        <Field
          label={t.cut}
          suffix={t.points}
          value={fields.cut}
          onChange={set("cut")}
          error={error(errors.cut)}
          hint={
            <>
              {t.cutHint[0]}
              {formatPoints(avgCut.value)}
              {t.cutHint[1]} (<Provenance stat={avgCut} lang={lang} />
              ).
            </>
          }
        />
        <p className="text-[13px] leading-[18px] font-medium text-hg-muted">{t.private}</p>
      </form>

      <div aria-live="polite" className="flex flex-col gap-3">
        <div
          className={cn("flex flex-col gap-5 rounded-[32px] p-6 transition-opacity sm:p-8", !result && "opacity-60")}
          style={{ backgroundImage: "linear-gradient(161.82deg, #2453e6 14.286%, #0f2a9e 85.714%)" }}
        >
          <div className="flex flex-col gap-1">
            <p className="text-[15px] leading-5 font-semibold text-white/75">{t.wouldSave(formatPoints(shown.now.aprBps - shown.afterCut.aprBps))}</p>
            <p className="text-[clamp(44px,7vw,72px)] leading-none font-semibold tracking-[-0.04em] text-white tabular-nums">{formatDollars(shown.yearSavedCents)}</p>
            <p className="text-[15px] leading-6 font-medium text-white/80">
              {t.firstYear}
              {shown.payoffInterestSavedCents > 0 && (
                <>
                  {t.payoffSaved(formatDollars(shown.payoffInterestSavedCents))}
                  {shown.monthsSaved > 0 && t.sooner(formatDuration(shown.monthsSaved, lang))}
                </>
              )}
              .
            </p>
          </div>
          <YearBars result={shown} lang={lang} />
          <p className="text-[13px] leading-[18px] font-medium text-white/65">{t.calculated}</p>
        </div>
        <Comparison result={shown} lang={lang} />
        <div className="flex flex-col items-start gap-3 rounded-[24px] bg-hg-ink p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[15px] leading-6 font-medium text-white/80">
            {t.fee[0]}
            <span className="font-semibold text-white tabular-nums">{formatCents(shown.haggleFeeCents)}</span>
            {t.fee[1]}
          </p>
          <ProductButton path="/start" tone="white" className="shrink-0" lang={lang}>
            {t.cta}
          </ProductButton>
        </div>
        <p className="text-[13px] leading-[18px] font-medium text-hg-muted">{t.assumes(minimumPaymentRule(lang))}</p>
      </div>
    </div>
  );
}
