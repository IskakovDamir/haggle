import { Phone } from "lucide-react";
import { Badge, Card } from "@/components/ui/primitives";
import type { Lever } from "@/lib/types";
import { leverWorth } from "./labels";

/** One ask that applies: what it is worth, why, how often it works, and whether it takes a call. */
function LeverCard({ lever, cardName }: { lever: Lever; cardName: string | null }) {
  const worth = leverWorth(lever);

  return (
    <Card className="flex flex-col p-5 sm:p-6">
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

      <h3 className="mt-3 text-lg leading-snug font-semibold">{lever.title}</h3>
      {worth ? (
        <p className="mt-2 flex flex-wrap items-baseline gap-x-2">
          <span className="tabular text-4xl font-extrabold tracking-tight text-green">{worth}</span>
          <span className="text-sm text-muted">expected in the first year</span>
        </p>
      ) : (
        <p className="mt-2 text-sm font-medium text-muted">Not counted in dollars</p>
      )}
      <p className="mt-3 text-sm leading-relaxed text-muted">{lever.why}</p>

      {lever.successRatePct !== null && (
        <p className="mt-auto pt-4 text-sm">
          <strong className="tabular">{lever.successRatePct}%</strong> published success rate for cardholders who asked
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
        <div className="grid gap-3 md:grid-cols-2">
          {eligible.map((lever) => (
            <LeverCard key={`${lever.cardId}:${lever.kind}`} lever={lever} cardName={nameOf(lever)} />
          ))}
        </div>
      ) : (
        <Card className="p-5 text-muted sm:p-6">Nothing on these statements is worth a call right now.</Card>
      )}

      {ruledOut.length > 0 && (
        <details className="mt-4 rounded-2xl border border-line bg-card px-5 py-4 text-sm">
          <summary className="cursor-pointer font-medium">
            {ruledOut.length === 1 ? "1 ask that does not apply" : `${ruledOut.length} asks that do not apply`}, and why
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
      )}
    </div>
  );
}
