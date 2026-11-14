// "Interest paid per month" on the overview: the twelve months of this year, each at the rates in force
// that month. Months before a confirmed rate cut use the statement's rate, the cut's month and the months
// after use the lowered one. Pure: the engine does the interest, this only lines the months up.
import { monthlyInterestCents } from "@/lib/engine";
import { formatApr } from "@/lib/format";
import type { Bps, CallRecord, CardAccount, Cents, IsoDate } from "@/lib/types";
import { callDate, isWin } from "@/components/dashboard/progress";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

/** One confirmed win that lowered a card's APR. */
export type RateCut = {
  callId: string;
  cardId: string;
  /** The calendar day of the call. */
  date: IsoDate;
  beforeBps: Bps;
  afterBps: Bps;
};

export type InterestMonth = {
  /** 1 to 12. */
  month: number;
  /** "Jun" */
  name: string;
  /** "J" */
  letter: string;
  /** Interest for the month across every card, at the rates in force that month. */
  interestCents: Cents;
  /** At least one card is on a lowered rate this month. */
  lowered: boolean;
  current: boolean;
  /** A month still ahead: an estimate. */
  future: boolean;
  /** The bar's height as a share of the tallest month, 0 to 100. */
  heightPct: number;
};

export type InterestSeries = {
  year: number;
  months: InterestMonth[];
  /** One month of interest at the statement's rates, before any win. */
  baselineMonthlyCents: Cents;
  /** This month's interest at the rates in force now. */
  currentMonthlyCents: Cents;
  /** What the wins take off each month now. Never negative. */
  monthlyCutCents: Cents;
  /** The latest rate cut this year, to name on its month: "Call · 27.24% → 19.99%". null when there was none. */
  marker: { month: number; label: string } | null;
};

const balanceOf = (card: CardAccount) => Math.max(0, card.balanceCents);

/**
 * Every confirmed win that lowered a card's rate, oldest first, each with the rate it replaced.
 * A later win only counts when it goes lower still, the same rule the plan applies to the cards.
 */
export function rateCuts(cards: CardAccount[], calls: CallRecord[]): RateCut[] {
  const wins = calls.filter(isWin).sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  const cuts: RateCut[] = [];
  for (const card of cards) {
    let rate = card.purchaseAprBps;
    for (const call of wins) {
      const after = call.outcome?.aprAfterBps;
      if (call.cardId !== card.id || after == null || after < 0 || after >= rate) continue;
      cuts.push({ callId: call.id, cardId: card.id, date: callDate(call), beforeBps: rate, afterBps: after });
      rate = after;
    }
  }
  return cuts.sort((a, b) => a.date.localeCompare(b.date));
}

const pad = (month: number) => String(month).padStart(2, "0");

/** The rate a card charges in a month: the statement's, or the last cut made on or before the month's end. */
function aprInMonth(card: CardAccount, cuts: RateCut[], monthEnd: IsoDate): Bps {
  const last = cuts.filter((cut) => cut.cardId === card.id && cut.date <= monthEnd).at(-1);
  return last ? last.afterBps : card.purchaseAprBps;
}

/** The twelve months of `today`'s year. Balances are held where they are today, as the plan assumes. */
export function interestSeries(cards: CardAccount[], calls: CallRecord[], today: IsoDate): InterestSeries {
  const year = Number(today.slice(0, 4));
  const currentMonth = Number(today.slice(5, 7));
  const cuts = rateCuts(cards, calls);

  const amounts = MONTH_NAMES.map((_, index) => {
    // "YYYY-MM-31" sorts after every real day of the month, so it works as the month's end for any month.
    const monthEnd = `${year}-${pad(index + 1)}-31`;
    const rates = cards.map((card) => aprInMonth(card, cuts, monthEnd));
    return {
      interestCents: cards.reduce((sum, card, i) => sum + monthlyInterestCents(balanceOf(card), rates[i]), 0),
      lowered: cards.some((card, i) => rates[i] < card.purchaseAprBps),
    };
  });
  const tallest = Math.max(0, ...amounts.map((amount) => amount.interestCents));

  const months: InterestMonth[] = amounts.map((amount, index) => ({
    month: index + 1,
    name: MONTH_NAMES[index],
    letter: MONTH_NAMES[index].charAt(0),
    interestCents: amount.interestCents,
    lowered: amount.lowered,
    current: index + 1 === currentMonth,
    future: index + 1 > currentMonth,
    heightPct: tallest > 0 ? Math.round((amount.interestCents / tallest) * 1000) / 10 : 0,
  }));

  const baselineMonthlyCents = cards.reduce((sum, card) => sum + monthlyInterestCents(balanceOf(card), card.purchaseAprBps), 0);
  const currentMonthlyCents = months[currentMonth - 1]?.interestCents ?? baselineMonthlyCents;

  const latest = cuts.filter((cut) => cut.date.startsWith(`${year}-`) && cut.date <= today).at(-1);
  const named = latest && cards.length > 1 ? cards.find((card) => card.id === latest.cardId)?.issuerName.trim() : "";
  const marker = latest
    ? {
        month: Number(latest.date.slice(5, 7)),
        label: `${named ? `${named} call` : "Call"} · ${formatApr(latest.beforeBps)} → ${formatApr(latest.afterBps)}`,
      }
    : null;

  return {
    year,
    months,
    baselineMonthlyCents,
    currentMonthlyCents,
    monthlyCutCents: Math.max(0, baselineMonthlyCents - currentMonthlyCents),
    marker,
  };
}
