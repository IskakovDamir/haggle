// How every number on the insights pages shows where it came from: a source link, "Estimate" or "Measured by Haggle".
import { formatDate } from "@/lib/format";
import { formatStatValue, sourceName } from "@/lib/benchmarks";
import type { Locale } from "@/lib/i18n/locale";
import type { Source, Stat } from "@/lib/benchmarks/types";
import { cn } from "@/lib/utils";

type Tone = "light" | "dark";

export function SourceLink({ source, tone = "light", lang = "en", className }: { source: Source; tone?: Tone; lang?: Locale; className?: string }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "underline decoration-1 underline-offset-[3px] transition-colors",
        tone === "light" ? "text-hg-ink-2 decoration-hg-ink-2/30 hover:text-hg-blue" : "text-white/80 decoration-white/40 hover:text-white",
        className,
      )}
    >
      {sourceName(source.name, lang)}
    </a>
  );
}

/** The label next to a number. Every stat renders one. */
export function Provenance({
  stat,
  tone = "light",
  withDate = false,
  lang = "en",
  className,
}: {
  stat: Stat;
  tone?: Tone;
  withDate?: boolean;
  lang?: Locale;
  className?: string;
}) {
  const muted = tone === "light" ? "text-hg-muted" : "text-white/65";
  const date = withDate ? <span className={muted}>{` · ${formatDate(stat.asOf, lang)}`}</span> : null;
  if (stat.kind === "estimate") {
    return (
      <span className={cn(muted, className)} title={stat.note}>
        {lang === "es" ? "Estimación" : "Estimate"}
      </span>
    );
  }
  if (stat.kind === "measured") {
    return (
      <span className={cn(muted, className)}>
        {lang === "es" ? "Medido por Haggle" : "Measured by Haggle"}
        {date}
      </span>
    );
  }
  return (
    <span className={className} title={stat.note}>
      {stat.source && <SourceLink source={stat.source} tone={tone} lang={lang} />}
      {date}
    </span>
  );
}

/** A number inside a sentence, followed by its label in small muted type. */
export function InlineStat({ stat, tone = "light", lang = "en" }: { stat: Stat; tone?: Tone; lang?: Locale }) {
  return (
    <>
      <strong className={cn("font-semibold tabular-nums", tone === "light" ? "text-hg-ink" : "text-white")}>{formatStatValue(stat)}</strong>{" "}
      <span className="text-[0.8em]">
        (<Provenance stat={stat} tone={tone} lang={lang} />)
      </span>
    </>
  );
}

/** A big number with its label and provenance underneath. */
export function StatFigure({
  stat,
  tone = "light",
  size = "l",
  label,
  className,
}: {
  stat: Stat;
  tone?: Tone;
  size?: "xl" | "l" | "m";
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <p
        className={cn(
          "font-semibold tracking-[-0.03em] tabular-nums",
          size === "xl" && "text-[clamp(44px,6vw,64px)] leading-none",
          size === "l" && "text-[40px] leading-11",
          size === "m" && "text-[28px] leading-8",
          tone === "light" ? "text-hg-ink" : "text-white",
        )}
      >
        {formatStatValue(stat)}
      </p>
      <p className={cn("text-[14px] leading-5 font-medium tracking-[-0.005em]", tone === "light" ? "text-hg-ink-2" : "text-white/80")}>
        {label ?? stat.label}
      </p>
      <p className="text-[13px] leading-[18px] font-medium">
        <Provenance stat={stat} tone={tone} withDate={stat.kind !== "estimate"} />
      </p>
    </div>
  );
}
