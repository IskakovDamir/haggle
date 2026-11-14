import { ChevronDown, Phone } from "lucide-react";
import { Badge, Card } from "@/components/ui/primitives";
import { Lift, Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import type { Lever } from "@/lib/types";
import { GrowBar } from "./animated";
import { leverWorth } from "./labels";

/** One ask that applies: what it is worth, why, how often it works, and whether it takes a call. */
function LeverCard({ lever, cardName }: { lever: Lever; cardName: string | null }) {
  const worth = leverWorth(lever);

  return (
    <Card className="flex h-full flex-col p-5 sm:rounded-[32px] sm:p-7">
      <div className="flex flex-wrap gap-1.5">
        {lever.needsCall ? (
          <Badge tone="lime">
            <Phone className="size-3" aria-hidden />
            Needs a call
          </Badge>
        ) : (
          <Badge tone="neutral">No call needed</Badge>
        )}
        {cardName && <Badge tone="outline">{cardName}</Badge>}
      </div>

      <h3 className="mt-4 text-lg leading-snug font-semibold tracking-[-0.015em]">{lever.title}</h3>
      {worth ? (
        <p className="mt-2 flex flex-wrap items-baseline gap-x-2">
          <span className="tabular text-[clamp(36px,4vw,48px)] leading-none font-semibold tracking-[-0.045em] text-hg-blue">{worth}</span>
          <span className="text-sm font-medium text-muted">expected in the first year</span>
        </p>
      ) : (
        <p className="mt-2 text-sm font-semibold text-muted">Not counted in dollars</p>
      )}
      <p className="mt-3 text-sm leading-relaxed text-muted">{lever.why}</p>

      {lever.successRatePct !== null && (
        <div className="mt-auto pt-5">
          <GrowBar percent={lever.successRatePct} className="mb-3 h-2" />
          <p className="text-sm">
            <strong className="tabular font-semibold">{lever.successRatePct}%</strong> published success rate for cardholders who asked
            {lever.source && (
              <>
                {" ("}
                <a
                  href={lever.source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-line underline-offset-2 hover:decoration-ink"
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

/**
 * Every lever the engine looked at. The ones that apply are cards; the ones that do not are listed
 * with the reason, so the visitor can see nothing was skipped.
 */
export function Levers({ levers, cardNames }: { levers: Lever[]; cardNames: Map<string, string> }) {
  const eligible = levers.filter((lever) => lever.eligible);
  const ruledOut = levers.filter((lever) => !lever.eligible);
  // With one card the name on every lever would be noise.
  const nameOf = (lever: Lever) => (cardNames.size > 1 ? (cardNames.get(lever.cardId) ?? null) : null);

  return (
    <div>
      {eligible.length > 0 ? (
        <Stagger className="grid gap-3 sm:gap-4 md:grid-cols-2">
          {eligible.map((lever) => (
            <StaggerItem key={`${lever.cardId}:${lever.kind}`} className="h-full">
              <Lift className="h-full">
                <LeverCard lever={lever} cardName={nameOf(lever)} />
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
          <details className="group mt-4 rounded-[24px] border border-line/80 bg-card px-5 py-4 text-sm sm:px-6">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold [&::-webkit-details-marker]:hidden">
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
