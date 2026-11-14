// Suggested lines for the visitor who plays the bank in a typed practice call. They follow the order a
// real goodwill call takes: ask what happened, grant part of it, refuse the rest, confirm the terms.
// Every figure comes from the card and the brief, so the agent's read-back and the outcome check work
// on numbers the "bank" really said.
import { formatApr } from "@/lib/format";
import type { Locale } from "@/lib/i18n/locale";
import { formatShort } from "@/lib/money";
import type { CardAccount, NegotiationBrief } from "@/lib/types";

type Lines = {
  what: string;
  lateFee: (fee: string) => string;
  aprBack: (apr: string) => string;
  interestNo: string;
  creditReport: string;
  rateOffer: (apr: string) => string;
  rateFinal: string;
  feeWaive: (fee: string) => string;
  check: string;
  no: string;
  confirm: string;
  bye: string;
};

const LINES: Record<Locale, Lines> = {
  en: {
    what: "Sure, I can look into that. What happened with the payment?",
    lateFee: (fee) => `As a one-time courtesy, I can refund the ${fee} late fee.`,
    aprBack: (apr) => `I can also put your APR back to ${apr}, starting with your next statement. It stays there unless the account terms change.`,
    interestNo: "I can't refund the interest, I'm sorry. That's final.",
    creditReport: "I'll note the account so this late payment isn't reported to the credit bureaus.",
    rateOffer: (apr) => `I can lower your APR to ${apr}.`,
    rateFinal: "That's the best I can do, it's final.",
    feeWaive: (fee) => `I can waive the ${fee} annual fee this year.`,
    check: "Let me check what I can do on this account.",
    no: "I'm sorry, I can't do that today.",
    confirm: "Yes, that's correct.",
    bye: "You're welcome. Have a good day.",
  },
  es: {
    what: "Claro, lo reviso. ¿Qué pasó con el pago?",
    lateFee: (fee) => `Como cortesía por única vez, puedo reembolsar el cargo por atraso de ${fee}.`,
    aprBack: (apr) => `También puedo devolver su APR a ${apr}, a partir del próximo estado de cuenta. Se queda así salvo que cambien los términos de la cuenta.`,
    interestNo: "No puedo reembolsar los intereses, lo siento. Es definitivo.",
    creditReport: "Voy a anotar la cuenta para que este atraso no se reporte a las agencias de crédito.",
    rateOffer: (apr) => `Puedo bajar su APR a ${apr}.`,
    rateFinal: "Es lo mejor que puedo hacer, es definitivo.",
    feeWaive: (fee) => `Puedo exonerar la cuota anual de ${fee} este año.`,
    check: "Déjeme revisar qué puedo hacer con esta cuenta.",
    no: "Lo siento, hoy no puedo hacer eso.",
    confirm: "Sí, es correcto.",
    bye: "De nada. Que tenga un buen día.",
  },
};

/** The bank's suggested lines for this call, in order. Empty when the call asks in the cardholder's own words. */
export function bankReplies(brief: NegotiationBrief, card: CardAccount, locale: Locale): string[] {
  const t = LINES[locale];
  // A request in the cardholder's own words can be about anything: the visitor answers it themselves.
  if (brief.request) return [t.check, t.no, t.confirm, t.bye];

  switch (brief.goal) {
    case "missed_payment": {
      const lines = [t.what];
      if (card.lateFeeCents > 0) lines.push(t.lateFee(formatShort(card.lateFeeCents)));
      if (brief.askAprBps !== null && brief.askAprBps < brief.currentAprBps) lines.push(t.aprBack(formatApr(brief.askAprBps)));
      lines.push(t.interestNo, t.creditReport, t.confirm, t.bye);
      return lines;
    }
    case "apr_reduction":
    case "penalty_apr_review": {
      if (brief.acceptAprBps === null || brief.askAprBps === null) return [t.check, t.no, t.confirm, t.bye];
      // An offer at the win line, then "final" when the agent counters for more.
      return [t.check, t.rateOffer(formatApr(brief.acceptAprBps)), t.rateFinal, t.confirm, t.bye];
    }
    case "annual_fee_waiver":
      return brief.annualFeeCents > 0
        ? [t.check, t.feeWaive(formatShort(brief.annualFeeCents)), t.confirm, t.bye]
        : [t.check, t.no, t.confirm, t.bye];
    case "late_fee_refund":
      return card.lateFeeCents > 0
        ? [t.check, t.lateFee(formatShort(card.lateFeeCents)), t.confirm, t.bye]
        : [t.check, t.no, t.confirm, t.bye];
    default:
      return [t.check, t.no, t.confirm, t.bye];
  }
}
