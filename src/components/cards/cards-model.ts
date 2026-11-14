// "My cards": each card with the engine's numbers as it stands after its wins, the wins on it and the calls
// still open for it. Pure: the engine and the existing helpers do the math.
import { analyze } from "@/lib/engine";
import type { Bps, CardAccount, CardAnalysis, CaseFile, Cents, IsoDate, LeverKind } from "@/lib/types";
import { buildCallList } from "@/components/calls/call-list-model";
import { loweredAprBps } from "@/components/dashboard/debt-free";
import { callDate } from "@/components/dashboard/progress";
import { countedWins } from "@/components/dashboard/totals";
import { cardsAfterWins } from "@/components/plan/apply-wins";

export type CardWin = { callId: string; goal: LeverKind; date: IsoDate; savedCents: Cents };

export type CardEntry = {
  /** The card after its wins: a lowered rate and a waived fee are in force. */
  card: CardAccount;
  analysis: CardAnalysis;
  aprBeforeBps: Bps;
  aprAfterBps: Bps | null;
  /** Wins that count toward the savings, oldest first. */
  wins: CardWin[];
  savedCents: Cents;
  /** Calls in the plan for this card that are not won or declined yet. */
  openCalls: number;
};

export type CardsView = { entries: CardEntry[]; totalBalanceCents: Cents; annualInterestCents: Cents };

/** Every card in the case. Throws when the engine does; the screen catches it. */
export function cardsView(caseFile: CaseFile, today: IsoDate): CardsView {
  const { calls } = caseFile;
  const cardsNow = cardsAfterWins(caseFile.cards, calls);
  const analysis = analyze(cardsNow, today);
  const list = buildCallList(analysis.plan, cardsNow, calls);
  const wins = countedWins(calls).sort((a, b) => a.startedAt.localeCompare(b.startedAt));

  const entries = cardsNow.flatMap((card, index) => {
    const numbers = analysis.cards.find((candidate) => candidate.cardId === card.id);
    if (!numbers) return [];
    const onCard: CardWin[] = wins
      .filter((call) => call.cardId === card.id)
      .map((call) => ({ callId: call.id, goal: call.goal, date: callDate(call), savedCents: call.savings?.annualSavingsCents ?? 0 }));
    const group = list.groups.find((candidate) => candidate.cardId === card.id);
    return [
      {
        card,
        analysis: numbers,
        aprBeforeBps: caseFile.cards[index].purchaseAprBps,
        aprAfterBps: loweredAprBps(caseFile.cards[index], calls),
        wins: onCard,
        savedCents: onCard.reduce((sum, win) => sum + win.savedCents, 0),
        openCalls: group?.items.filter((item) => item.status.kind === "todo" || item.status.kind === "unclear").length ?? 0,
      },
    ];
  });

  return { entries, totalBalanceCents: analysis.totals.balanceCents, annualInterestCents: analysis.totals.annualInterestCents };
}
