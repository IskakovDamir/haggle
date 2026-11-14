import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { formatDate } from "@/lib/format";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { buttonVariants } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/primitives";
import type { CallRecord, IsoDate } from "@/lib/types";
import { cn } from "@/lib/utils";
import { callHref } from "@/components/call/resolve-call";
import { ASK_AGAIN_AFTER_MONTHS, askAgainDate, stepIdOf } from "@/components/dashboard/progress";
import type { OutcomeKind } from "./outcome-kind";

type Story = { title: React.ReactNode; body: string };

function storyFor(kind: Exclude<OutcomeKind, "win">, bankName: string): Story {
  switch (kind) {
    case "declined":
      return {
        title: (
          <>
            {bankName} said <em>no</em> this time
          </>
        ),
        body: "Nothing changed on the card, and you pay nothing. Haggle charges only after a win.",
      };
    case "unconfirmed":
      return {
        title: (
          <>
            We could not <em>confirm</em> this result
          </>
        ),
        body: "The agent heard an offer, but its numbers are not in the bank's own words on the call. Haggle does not count it and does not charge for it.",
      };
    case "unclear":
      return {
        title: (
          <>
            The call ended <em>without an answer</em>
          </>
        ),
        body: "The bank did not say yes or no, so nothing changed and you pay nothing.",
      };
  }
}

/** After a call with no confirmed win: what happened, and what happens next and on which date. */
export function NoWin({
  kind,
  call,
  bankName,
  today,
}: {
  kind: Exclude<OutcomeKind, "win">;
  call: CallRecord;
  bankName: string;
  today: IsoDate;
}) {
  const story = storyFor(kind, bankName);
  const declined = kind === "declined";
  const noted = call.outcome?.followUp ?? null;

  // Calm on purpose: no burst, no red, only the gentle rise used across the app.
  return (
    <Card className="relative overflow-hidden rounded-[32px] p-6 sm:p-10">
      <div aria-hidden className="pointer-events-none absolute -top-40 -right-32 size-[28rem] rounded-full bg-hg-blue-soft blur-3xl" />
      <Stagger onMount gap={0.1} className="relative">
        <StaggerItem>
          <Badge tone="outline" className="bg-white px-3 py-1">
            No win, no fee · practice call
          </Badge>
        </StaggerItem>
        <StaggerItem
          as="h1"
          className="mt-4 text-[clamp(32px,5vw,52px)] leading-[1.08] font-semibold tracking-[-0.035em] text-hg-ink"
        >
          {story.title}
        </StaggerItem>
        <StaggerItem as="p" className="mt-3 max-w-[60ch] text-[17px] leading-7 font-medium text-muted sm:text-lg">
          {story.body}
        </StaggerItem>

        <StaggerItem className="mt-7 flex gap-4 rounded-[24px] bg-hg-surface p-5 sm:p-6">
          <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-hg-blue shadow-[0_6px_16px_-10px_rgb(11_18_32/0.35)]">
            <CalendarClock className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-widest text-muted uppercase">What happens next</p>
            <p className="tabular mt-1 text-2xl font-semibold tracking-[-0.02em] text-hg-ink">
              {declined ? formatDate(askAgainDate(call)) : formatDate(today)}
            </p>
            <p className="mt-1 max-w-[60ch] text-hg-ink-2">
              {declined
                ? `Ask ${bankName} again in about ${ASK_AGAIN_AFTER_MONTHS} months. Banks often say yes once more on-time payments are on file.`
                : "You can call again today. A clear yes or no from the bank, with the numbers said out loud, gives a result."}
            </p>
            {noted && <p className="mt-2 max-w-[60ch] text-sm text-muted">Noted on the call: {noted}</p>}
            {declined && <p className="mt-2 text-sm text-muted">The date is on your dashboard, with a calendar file to download.</p>}
          </div>
        </StaggerItem>

        <StaggerItem className="mt-7 flex flex-col gap-2 sm:flex-row">
          {!declined && (
            <Link href={callHref(stepIdOf(call))} className={buttonVariants({ size: "lg" })}>
              Call again
            </Link>
          )}
          <Link href="/plan" className={cn(buttonVariants({ size: "lg", variant: declined ? "default" : "outline" }))}>
            Back to your plan
          </Link>
          <Link href="/dashboard" className={buttonVariants({ size: "lg", variant: "ghost" })}>
            See your dashboard
          </Link>
        </StaggerItem>
      </Stagger>
    </Card>
  );
}
