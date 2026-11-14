import Link from "next/link";
import { formatDate } from "@/lib/format";
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

  return (
    <Card className="p-6 sm:p-10">
      <Badge tone="outline">No win, no fee · practice call</Badge>
      <h1 className="mt-3 text-3xl leading-tight font-extrabold sm:text-5xl">{story.title}</h1>
      <p className="mt-3 max-w-[60ch] text-muted sm:text-lg">{story.body}</p>

      <div className="mt-6 rounded-2xl bg-paper p-5">
        <p className="text-xs font-semibold tracking-widest text-muted uppercase">What happens next</p>
        <p className="tabular mt-1 text-2xl font-extrabold">{declined ? formatDate(askAgainDate(call)) : formatDate(today)}</p>
        <p className="mt-1 max-w-[60ch]">
          {declined
            ? `Ask ${bankName} again in about ${ASK_AGAIN_AFTER_MONTHS} months. Banks often say yes once more on-time payments are on file.`
            : "You can call again today. A clear yes or no from the bank, with the numbers said out loud, gives a result."}
        </p>
        {noted && <p className="mt-2 max-w-[60ch] text-sm text-muted">Noted on the call: {noted}</p>}
        {declined && <p className="mt-2 text-sm text-muted">The date is on your dashboard, with a calendar file to download.</p>}
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
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
      </div>
    </Card>
  );
}
