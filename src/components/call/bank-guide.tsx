import { Check } from "lucide-react";
import { Card } from "@/components/ui/primitives";
import type { NegotiationBrief } from "@/lib/types";

const SUGGESTIONS = [
  { title: "Say no first", detail: "See what the agent does with a refusal." },
  { title: "Offer something smaller", detail: "A smaller cut, or a one-time credit." },
  { title: "Ask who you are speaking with", detail: "It has to say that it is an AI assistant." },
];

/** Beside the call: how to play the bank, and the only things the agent is allowed to state as fact. */
export function BankGuide({ brief }: { brief: NegotiationBrief }) {
  return (
    <aside className="flex flex-col gap-4">
      <Card className="p-5">
        <h2 className="text-lg font-extrabold">How to play the bank</h2>
        <p className="mt-1 text-sm text-muted">
          Answer the way a card services representative would. Make the agent work for it.
        </p>
        <ol className="mt-4 flex flex-col gap-3">
          {SUGGESTIONS.map((suggestion, index) => (
            <li key={suggestion.title} className="flex gap-3">
              <span className="tabular flex size-6 shrink-0 items-center justify-center rounded-full bg-lime text-xs font-bold">
                {index + 1}
              </span>
              <span className="text-sm leading-snug">
                <b className="block font-semibold">{suggestion.title}</b>
                <span className="text-muted">{suggestion.detail}</span>
              </span>
            </li>
          ))}
        </ol>
      </Card>

      <Card className="p-5">
        <h2 className="text-lg font-extrabold">What the agent may say</h2>
        <p className="mt-1 text-sm text-muted">
          Only these facts, taken from the statement you confirmed. It states nothing else as fact.
        </p>
        {brief.facts.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-2">
            {brief.facts.map((fact) => (
              <li key={fact} className="flex gap-2.5 text-sm leading-snug">
                <Check className="mt-0.5 size-4 shrink-0 text-green" aria-hidden />
                {fact}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm">The statement gave the agent no facts to state, so it will only ask.</p>
        )}

        <dl className="mt-4 flex flex-col gap-3 border-t border-line pt-4 text-sm leading-snug">
          <div>
            <dt className="font-semibold">It says this first</dt>
            <dd className="text-muted">{brief.disclosures.join(" ")}</dd>
          </div>
          <div>
            <dt className="font-semibold">If the bank says no</dt>
            <dd className="text-muted">{brief.fallback}</dd>
          </div>
        </dl>
      </Card>
    </aside>
  );
}
