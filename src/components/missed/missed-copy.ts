// The missed-payment form's words in each language. The reasons and the field errors come from
// src/lib and src/components/start in English; they are put into Spanish here, at the screen's edge.
import type { Copy, Locale } from "@/lib/i18n/locale";
import { MISSED_REASONS } from "@/lib/missed";
import type { MissedReason } from "@/lib/types";

type MissedCopy = {
  fillSample: string;
  sampleData: string;
  reasonTitle: string;
  reasonLead: string;
  reasonGroup: string;
  noteLabel: string;
  optional: string;
  notePlaceholder: string;
  noteCount: (count: number, max: number) => string;
  cardTitle: string;
  cardLead: string;
  bank: string;
  firstName: string;
  balance: string;
  aprNow: string;
  last4: string;
  memberSince: string;
  memberSinceHint: string;
  aprRaised: string;
  aprBefore: string;
  missedTitle: string;
  missedLead: string;
  lateFee: string;
  interest: string;
  daysLate: string;
  paidSince: string;
  firstInYear: string;
  submit: (bank: string) => string;
  practice: string;
  asksTitle: string;
  asksEmpty: string;
  worthTitle: string;
  payNothing: string;
  payOnWin: (fee: string) => string;
  askLateFee: (fee: string) => string;
  askAprBack: (apr: string) => string;
  askInterest: (amount: string) => string;
  askCreditReport: string;
};

export const MISSED_COPY: Copy<MissedCopy> = {
  en: {
    fillSample: "Fill in Maria's example",
    sampleData: "Sample data",
    reasonTitle: "Why you missed it",
    reasonLead: "Pick what is true. The agent says this reason to the bank and nothing else.",
    reasonGroup: "Why you missed the payment",
    noteLabel: "In your own words",
    optional: "optional",
    notePlaceholder: "One sentence the agent can repeat, like what happened with autopay.",
    noteCount: (count, max) => `Only what is true. ${count}/${max}`,
    cardTitle: "Your card",
    cardLead: "Numbers from your statement or your banking app.",
    bank: "Bank",
    firstName: "Your first name",
    balance: "Card balance",
    aprNow: "APR now",
    last4: "Last four digits",
    memberSince: "Customer since",
    memberSinceHint: "optional, year",
    aprRaised: "The bank raised my APR after the missed payment",
    aprBefore: "APR before",
    missedTitle: "The missed payment",
    missedLead: "Leave out anything you are not sure about.",
    lateFee: "Late fee",
    interest: "Interest that month",
    daysLate: "Days late",
    paidSince: "I have paid it since",
    firstInYear: "It is my first late payment in the last 12 months",
    submit: (bank) => `Have Haggle call ${bank || "my bank"}`,
    practice: "A practice call: you play the bank.",
    asksTitle: "What the agent asks for",
    asksEmpty: "Fill in the bank, the balance, the APR and the reason, and this fills in with what the agent will ask for.",
    worthTitle: "Worth in the first year",
    payNothing: "You pay nothing unless the bank says yes.",
    payOnWin: (fee) => `You pay ${fee} only if the bank says yes.`,
    askLateFee: (fee) => `Refund the ${fee} late fee`,
    askAprBack: (apr) => `Put the APR back to ${apr}`,
    askInterest: (amount) => `Refund the ${amount} of interest`,
    askCreditReport: "Keep it off your credit report",
  },
  es: {
    fillSample: "Usar el ejemplo de Maria",
    sampleData: "Datos de ejemplo",
    reasonTitle: "Por qué se te pasó",
    reasonLead: "Elige lo que es cierto. El agente le dice esta razón al banco y nada más.",
    reasonGroup: "Por qué no hiciste el pago",
    noteLabel: "En tus propias palabras",
    optional: "opcional",
    notePlaceholder: "Una frase que el agente pueda repetir, como lo que pasó con el pago automático.",
    noteCount: (count, max) => `Solo lo que es cierto. ${count}/${max}`,
    cardTitle: "Tu tarjeta",
    cardLead: "Los números de tu estado de cuenta o de la app de tu banco.",
    bank: "Banco",
    firstName: "Tu nombre",
    balance: "Saldo de la tarjeta",
    aprNow: "APR actual",
    last4: "Últimos cuatro dígitos",
    memberSince: "Cliente desde",
    memberSinceHint: "opcional, año",
    aprRaised: "El banco me subió el APR después del pago atrasado",
    aprBefore: "APR anterior",
    missedTitle: "El pago atrasado",
    missedLead: "Deja fuera lo que no sepas con seguridad.",
    lateFee: "Cargo por pago tardío",
    interest: "Intereses de ese mes",
    daysLate: "Días de atraso",
    paidSince: "Ya lo pagué",
    firstInYear: "Es mi primer pago atrasado en los últimos 12 meses",
    submit: (bank) => `Que Haggle llame a ${bank || "mi banco"}`,
    practice: "Una llamada de práctica: tú haces de banco.",
    asksTitle: "Lo que pide el agente",
    asksEmpty: "Llena el banco, el saldo, el APR y la razón, y aquí verás lo que el agente va a pedir.",
    worthTitle: "Lo que vale el primer año",
    payNothing: "No pagas nada a menos que el banco diga que sí.",
    payOnWin: (fee) => `Pagas ${fee} solo si el banco dice que sí.`,
    askLateFee: (fee) => `Devolver el cargo por pago tardío de ${fee}`,
    askAprBack: (apr) => `Regresar el APR a ${apr}`,
    askInterest: (amount) => `Devolver los ${amount} de intereses`,
    askCreditReport: "Que no aparezca en tu reporte de crédito",
  },
};

const REASON_LABELS_ES: Record<MissedReason, string> = {
  autopay_failed: "El pago automático no se hizo",
  account_changed: "Cambié de cuenta bancaria",
  travel: "Estaba de viaje",
  medical: "Un problema de salud",
  income_drop: "Bajaron mis ingresos",
  forgot: "Simplemente se me olvidó",
  other: "Otra razón",
};

/** The label on a reason pill. English comes from src/lib/missed.ts as it is. */
export function reasonLabelFor(reason: MissedReason, locale: Locale): string {
  if (locale === "es") return REASON_LABELS_ES[reason];
  return MISSED_REASONS.find((candidate) => candidate.id === reason)?.label ?? REASON_LABELS_ES.other;
}

/** Field errors from readMissedForm and the typed-value readers, sentence by sentence. */
const ERRORS_ES: Record<string, string> = {
  "Type the bank's name.": "Escribe el nombre del banco.",
  "Type the card balance.": "Escribe el saldo de la tarjeta.",
  "Type the APR the card charges now.": "Escribe el APR que cobra la tarjeta ahora.",
  "Type the APR before the bank raised it.": "Escribe el APR que tenías antes de que el banco lo subiera.",
  "Pick the reason that is true for you.": "Elige la razón que es cierta para ti.",
  "Leave the card number out.": "No pongas el número de la tarjeta.",
  "The rate before should be lower than the rate now. If it did not go up, untick the box.":
    "La tasa anterior debe ser menor que la actual. Si no subió, apaga la opción.",
  "Type the amount without a minus sign.": "Escribe la cantidad sin signo de menos.",
  "Type a dollar amount, like 8,400.00.": "Escribe una cantidad en dólares, como 8,400.00.",
  "Use dollars and cents, like 8,400.00.": "Usa dólares y centavos, como 8,400.00.",
  "That amount looks too large. Check it against the statement.":
    "Esa cantidad parece demasiado alta. Revísala con tu estado de cuenta.",
  "Type the rate without a minus sign.": "Escribe la tasa sin signo de menos.",
  "Type a rate, like 27.24.": "Escribe una tasa, como 27.24.",
  "Use at most two decimals, like 27.24.": "Usa como máximo dos decimales, como 27.24.",
  "A rate is a percentage between 0 and 100.": "Una tasa es un porcentaje entre 0 y 100.",
  "Only the last four digits. We never keep the full card number.":
    "Solo los últimos cuatro dígitos. Nunca guardamos el número completo de la tarjeta.",
  "Type the last four digits of the card number.": "Escribe los últimos cuatro dígitos de la tarjeta.",
  "Leave the card number out. The last four digits are enough.":
    "No pongas el número de la tarjeta. Bastan los últimos cuatro dígitos.",
};

/** Errors that carry a number. The number is kept exactly as the English sentence has it. */
const PATTERNS_ES: [RegExp, (...parts: string[]) => string][] = [
  [/^Keep it under (\d+) characters\.$/, (max) => `Usa menos de ${max} caracteres.`],
  [/^Type a whole number from 0 to (\d+)\.$/, (max) => `Escribe un número entero del 0 al ${max}.`],
  [/^Type a year between (\d+) and (\d+)\.$/, (from, to) => `Escribe un año entre ${from} y ${to}.`],
];

/** A field error in the visitor's language. An English sentence this does not know is shown as it is. */
export function localizeMissedError(message: string, locale: Locale): string {
  if (locale === "en") return message;
  const exact = ERRORS_ES[message];
  if (exact) return exact;
  for (const [pattern, spanish] of PATTERNS_ES) {
    const match = message.match(pattern);
    if (match) return spanish(...match.slice(1));
  }
  return message;
}
