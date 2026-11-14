import { Check } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { Card } from "@/components/ui/primitives";
import type { NegotiationBrief } from "@/lib/types";

const SUGGESTIONS = [
  { title: "Say no first", detail: "See what the agent does with a refusal." },
  { title: "Offer something smaller", detail: "A smaller cut, or a one-time credit." },
  { title: "Ask who you are speaking with", detail: "It has to say that it is an AI assistant." },
];

const heading = "text-[20px] leading-tight font-semibold tracking-[-0.03em] text-hg-ink";

/** Beside the call: how to play the bank, and the only things the agent is allowed to state as fact. */
export function BankGuide({ brief }: { brief: NegotiationBrief }) {
  return (
    <aside>
      <Stagger onMount gap={0.12} delay={0.15} className="flex flex-col gap-4">
        <StaggerItem>
          <Card className="p-6">
            <h2 className={heading}>How to play the bank</h2>
            <p className="mt-1.5 text-sm text-muted">
              Answer the way a card services representative would. Make the agent work for it.
            </p>
            <Stagger as="ol" onMount gap={0.14} delay={0.4} className="mt-5 flex flex-col gap-4">
              {SUGGESTIONS.map((suggestion, index) => (
                <StaggerItem as="li" key={suggestion.title} className="relative flex gap-3">
                  {index < SUGGESTIONS.length - 1 && (
                    <span aria-hidden className="absolute top-8 -bottom-3 left-[13px] w-px bg-hg-blue-tint" />
                  )}
                  <span className="tabular relative flex size-7 shrink-0 items-center justify-center rounded-full bg-hg-blue text-xs font-bold text-white shadow-[0_6px_14px_-6px_rgb(47_107_255/0.7)]">
                    {index + 1}
                  </span>
                  <span className="pt-0.5 text-sm leading-snug">
                    <b className="block font-semibold text-hg-ink">{suggestion.title}</b>
                    <span className="text-muted">{suggestion.detail}</span>
                  </span>
                </StaggerItem>
              ))}
            </Stagger>
          </Card>
        </StaggerItem>
  
        <StaggerItem>
          <Card className="p-6">
            <h2 className={heading}>What the agent may say</h2>
            <p className="mt-1.5 text-sm text-muted">
              Only these facts, taken from the statement you confirmed. It states nothing else as fact.
            </p>
            {brief.facts.length > 0 ? (
              <Stagger as="ul" onMount gap={0.08} delay={0.7} className="mt-4 flex flex-col gap-2.5">
                {brief.facts.map((fact) => (
                  <StaggerItem as="li" key={fact} className="flex gap-2.5 text-sm leading-snug">
                    <span aria-hidden className="mt-px flex size-[18px] shrink-0 items-center justify-center rounded-full bg-hg-blue-soft text-hg-blue">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                    {fact}
                  </StaggerItem>
                ))}
              </Stagger>
            ) : (
              <p className="mt-4 text-sm">The statement gave the agent no facts to state, so it will only ask.</p>
            )}
  
            <dl className="mt-5 flex flex-col gap-3 border-t border-line pt-4 text-sm leading-snug">
              <div className="rounded-2xl bg-hg-surface px-4 py-3">
                <dt className="font-semibold text-hg-ink">It says this first</dt>
                <dd className="mt-0.5 text-muted">{brief.disclosures.join(" ")}</dd>
              </div>
              <div className="px-1">
                <dt className="font-semibold text-hg-ink">If the bank says no</dt>
                <dd className="mt-0.5 text-muted">{brief.fallback}</dd>
              </div>
            </dl>
          </Card>
        </StaggerItem>
      </Stagger>
    </aside>
  );
}
