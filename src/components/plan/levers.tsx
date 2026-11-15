import { ChevronDown, Phone } from "lucide-react";
import { Badge, Card } from "@/components/ui/primitives";
import { Lift, Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import type { Lever } from "@/lib/types";
import { cn } from "@/lib/utils";
import { GrowBar } from "./animated";
import { leverWorth } from "./labels";
import { BLUE_PANEL, INK_PANEL } from "./surfaces";

/**
 * How a lever card is filled: the best call is bright blue, other calls are white, and asks you do
 * yourself (no call) are dark ink.
 */
type LeverTone = "blue" | "white" | "ink";

/** One ask that applies: what it is worth, why, how often it works, and whether it takes a call. */
function LeverCard({ lever, cardName, tone }: { lever: Lever; cardName: string | null; tone: LeverTone }) {
  const worth = leverWorth(lever);
  const onDark = tone !== "white";

  return (
    <Card
      className={cn("flex h-full flex-col p-5 sm:rounded-[28px] sm:p-7", onDark && "border-transparent text-white")}
      style={tone === "blue" ? BLUE_PANEL : tone === "ink" ? INK_PANEL : undefined}
    >
      <div className="flex flex-wrap gap-1.5">
        {lever.needsCall ? (
          <Badge tone="lime" className={cn(tone === "blue" && "bg-white/16")}>
            <Phone className="size-3" aria-hidden />
            Needs a call
          </Badge>
        ) : (
          <Badge tone="neutral" className={cn(onDark && "bg-white/8 text-white/68")}>
            No call needed
          </Badge>
        )}
        {cardName && (
          <Badge tone="outline" className={cn(onDark && "border-white/14 text-white/68")}>
            {cardName}
          </Badge>
        )}
      </div>

      <h3 className={cn("mt-4 text-lg leading-snug font-semibold tracking-[-0.015em]", onDark ? "text-white" : "text-hg-ink")}>
        {lever.title}
      </h3>
      {worth ? (
        <p className="mt-2 flex flex-wrap items-baseline gap-x-2">
          <span
            className={cn(
              "tabular text-[clamp(36px,4vw,48px)] leading-none font-semibold tracking-[-0.045em]",
              tone === "blue" ? "text-white" : tone === "ink" ? "text-[#a9c6ff]" : "text-hg-blue",
            )}
          >
            {worth}
          </span>
          <span className={cn("text-sm font-medium", onDark ? "text-white/68" : "text-muted")}>expected in the first year</span>
        </p>
      ) : (
        <p className={cn("mt-2 text-sm font-semibold", onDark ? "text-white/68" : "text-muted")}>Not counted in dollars</p>
      )}
      <p className={cn("mt-3 text-sm leading-relaxed", onDark ? "text-white/68" : "text-muted")}>{lever.why}</p>

      {lever.successRatePct !== null && (
        <div className="mt-auto pt-5">
          <GrowBar
            percent={lever.successRatePct}
            className={cn("mb-3 h-2", onDark && "bg-white/25")}
            fillClassName={onDark ? "bg-white/85" : undefined}
          />
          <p className={cn("text-sm", onDark ? "text-white" : "text-hg-ink")}>
            <strong className="tabular font-semibold">{lever.successRatePct}%</strong> published success rate for cardholders who asked
            {lever.source && (
              <>
                {" ("}
                <a
                  href={lever.source.url}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    "underline underline-offset-2",
                    onDark ? "decoration-white/50 hover:decoration-white" : "decoration-line hover:decoration-ink",
                  )}
                >
                  {lever.source.label}
                </a>
                )
              </>
            )}
            .
          </p>
        </div>
      )}
    </Card>
  );
}

/** Picks each card's fill. Only the first call that is worth money gets the bright blue. */
function leverTones(levers: Lever[]): LeverTone[] {
  const featured = levers.findIndex((lever) => lever.needsCall && leverWorth(lever) !== null);
  return levers.map((lever, index) => (index === featured ? "blue" : lever.needsCall ? "white" : "ink"));
}

/**
 * Every lever the engine looked at. The ones that apply are cards; the ones that do not are listed
 * with the reason, so the visitor can see nothing was skipped.
 */
export function Levers({ levers, cardNames }: { levers: Lever[]; cardNames: Map<string, string> }) {
  const eligible = levers.filter((lever) => lever.eligible);
  const ruledOut = levers.filter((lever) => !lever.eligible);
  // With one card the name on every lever would be noise.
  const nameOf = (lever: Lever) => (cardNames.size > 1 ? (cardNames.get(lever.cardId) ?? null) : null);
  const tones = leverTones(eligible);

  return (
    <div>
      {eligible.length > 0 ? (
        <Stagger className="grid gap-3 sm:gap-4 md:grid-cols-2">
          {eligible.map((lever, index) => (
            <StaggerItem key={`${lever.cardId}:${lever.kind}`} className="h-full">
              <Lift className="h-full">
                <LeverCard lever={lever} cardName={nameOf(lever)} tone={tones[index]} />
              </Lift>
            </StaggerItem>
          ))}
        </Stagger>
      ) : (
        <Reveal>
          <Card className="p-5 text-muted sm:p-6">Nothing on these statements is worth a call right now.</Card>
        </Reveal>
      )}

      {ruledOut.length > 0 && (
        <Reveal y={12}>
          <details className="group mt-3 rounded-[27px] border border-line/80 bg-card px-5 py-4 text-sm sm:mt-4 sm:px-6">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-hg-ink [&::-webkit-details-marker]:hidden">
              <span>
                {ruledOut.length === 1 ? "1 ask that does not apply" : `${ruledOut.length} asks that do not apply`}, and why
              </span>
              <ChevronDown
                className="size-4 shrink-0 text-muted transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <ul className="mt-3 space-y-2.5 text-muted">
              {ruledOut.map((lever) => (
                <li key={`${lever.cardId}:${lever.kind}`}>
                  <span className="font-medium text-ink">{lever.title}.</span> {lever.ineligibleReason ?? lever.why}
                  {nameOf(lever) && ` (${nameOf(lever)})`}
                </li>
              ))}
            </ul>
          </details>
        </Reveal>
      )}
    </div>
  );
}
