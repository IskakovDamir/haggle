// Shared contracts. Every module codes against this file; change it only by agreement (see SPEC.md).

/** Integer cents. */
export type Cents = number;
/** Integer basis points: 27.24% APR = 2724. */
export type Bps = number;
/** Calendar date, YYYY-MM-DD. */
export type IsoDate = string;

export type Issuer =
  | "chase"
  | "capital_one"
  | "citi"
  | "amex"
  | "discover"
  | "bank_of_america"
  | "wells_fargo"
  | "other";

// ---- statement ------------------------------------------------------------------

/** One credit card, as read from one statement or typed by the user. */
export type CardAccount = {
  id: string;
  issuer: Issuer;
  /** Issuer name as printed on the statement. */
  issuerName: string;
  cardName: string;
  /** Last four digits only. Never store more of the number. */
  last4: string | null;
  /** Statement balance. */
  balanceCents: Cents;
  creditLimitCents: Cents | null;
  purchaseAprBps: Bps;
  penaltyAprBps: Bps | null;
  /** A promotional rate that is still running, and the day it ends. */
  promo: { aprBps: Bps; endsOn: IsoDate } | null;
  /** Minimum payment as printed. */
  minimumPaymentCents: Cents | null;
  /** Annual fee. 0 when there is none. */
  annualFeeCents: Cents;
  /** Late fee charged on this statement. 0 when there is none. */
  lateFeeCents: Cents;
  /** Interest charged on this statement. */
  interestChargedCents: Cents | null;
  statementDate: IsoDate | null;
  dueDate: IsoDate | null;
  memberSinceYear: number | null;
  latePaymentsLast12m: number | null;
  /** Set when the visitor came in because they missed a payment on this card. Absent on older saved cards. */
  missedPayment?: MissedPayment | null;
};

/** Why the payment was missed, picked by the visitor. The agent says only the reason picked, never a different one. */
export type MissedReason = "autopay_failed" | "account_changed" | "travel" | "medical" | "income_drop" | "forgot" | "other";

/** What the visitor told us about one missed payment. Everything here is their own account of it. */
export type MissedPayment = {
  reason: MissedReason;
  /** The visitor's own words, one short line. Empty when they added nothing. */
  note: string;
  /** How many days late the payment was or is. null when they did not say. */
  daysLate: number | null;
  /** True when the visitor says the missed payment has been paid since. */
  paidSince: boolean;
  /** True when the visitor says this is their first late payment in the last 12 months. */
  firstInYear: boolean;
  /** The APR before the bank raised it after the miss. null when the rate did not change. */
  aprBeforeBps: Bps | null;
};

export type ExtractionWarning = { field: keyof CardAccount | "document"; message: string };

/** One statement, read. The user confirms or edits it before anything is computed from it. */
export type Extraction = {
  card: CardAccount;
  holderFirstName: string | null;
  warnings: ExtractionWarning[];
  source: "upload" | "sample" | "manual";
};

// ---- engine ---------------------------------------------------------------------

export type Payoff = {
  months: number;
  totalInterestCents: Cents;
  totalPaidCents: Cents;
  /** False when the payment never covers the interest (or the simulation hit its cap). */
  paidOff: boolean;
};

export type LeverKind =
  | "missed_payment"
  | "apr_reduction"
  | "annual_fee_waiver"
  | "late_fee_refund"
  | "credit_limit_increase"
  | "balance_transfer"
  | "penalty_apr_review";

/** One thing worth asking for, with its value in dollars. */
export type Lever = {
  kind: LeverKind;
  cardId: string;
  /** "Ask Chase to lower your APR" */
  title: string;
  /** One sentence with the numbers. */
  why: string;
  /** Expected first-year value. 0 when the value is not money (a higher limit). */
  potentialAnnualCents: Cents;
  /** Published success rate, when there is one. */
  successRatePct: number | null;
  source: { label: string; url: string } | null;
  needsCall: boolean;
  eligible: boolean;
  ineligibleReason: string | null;
};

export type PlanStep = {
  /** `${cardId}:${kind}` */
  id: string;
  order: number;
  lever: Lever;
  /** When to do it. null means now. */
  dueOn: IsoDate | null;
};

export type CardAnalysis = {
  cardId: string;
  /** Interest over the next 12 months if the balance stays where it is: balance x APR. */
  annualInterestCents: Cents;
  /** Paying only the minimum, starting from today's balance. */
  minimumOnly: Payoff;
  /** Balance / limit, one decimal. null when the limit is unknown. */
  utilizationPct: number | null;
  promoEndsInDays: number | null;
};

export type Analysis = {
  cards: CardAnalysis[];
  totals: {
    balanceCents: Cents;
    annualInterestCents: Cents;
    utilizationPct: number | null;
    /** Sum of the eligible levers that are worth money. */
    potentialAnnualCents: Cents;
  };
  levers: Lever[];
  plan: PlanStep[];
  /** Plain sentences the UI prints under the numbers. */
  assumptions: string[];
};

// ---- negotiation ----------------------------------------------------------------

/** One line of a call. The agent is ours. "bank" is whoever answers: a rep, or a juror playing one. */
export type Turn = { role: "agent" | "bank"; text: string; /** ms since the call started */ at: number };

/** Everything the agent may know and say on one call. Built by code, never by a model. */
export type NegotiationBrief = {
  holderFirstName: string;
  issuer: Issuer;
  issuerName: string;
  cardName: string;
  last4: string | null;
  goal: LeverKind;
  /** Facts from the statement or typed by the user. The agent may state nothing else as fact. */
  facts: string[];
  balanceCents: Cents;
  currentAprBps: Bps;
  annualFeeCents: Cents;
  /** The opening ask and the least that counts as a win. null when the goal is not about APR. */
  askAprBps: Bps | null;
  acceptAprBps: Bps | null;
  /** What the holder will do if the bank says no. An intention, never a claimed offer. */
  fallback: string;
  /** Lines the agent must say: it is an AI assistant, the call is recorded, the holder is present. */
  disclosures: string[];
  /** The language the agent speaks on the call. English when absent. Facts stay in English; the agent says them in this language. */
  language?: "en" | "es";
};

export type CallOutcome = {
  result: "won" | "partial" | "declined" | "unclear";
  aprAfterBps: Bps | null;
  annualFeeWaivedCents: Cents | null;
  lateFeeRefundCents: Cents | null;
  creditLimitAfterCents: Cents | null;
  /** A retention credit the bank put on the account. */
  statementCreditCents: Cents | null;
  /** "Ask again after six on-time payments." */
  followUp: string | null;
  /** The bank's own words for each thing it granted. */
  evidence: { quote: string; turnIndex: number }[];
  /** True when code confirmed that every granted number appears in a bank turn. */
  verified: boolean;
};

export type Savings = {
  annualSavingsCents: Cents;
  lines: { label: string; cents: Cents }[];
  /** What Haggle charges for this win. */
  feeCents: Cents;
};

// ---- browser state --------------------------------------------------------------

export type CallRecord = {
  id: string;
  cardId: string;
  goal: LeverKind;
  /** "phone": the agent rang a real phone and the person who answered played the bank. */
  mode: "voice" | "text" | "phone";
  startedAt: string;
  endedAt: string | null;
  turns: Turn[];
  outcome: CallOutcome | null;
  savings: Savings | null;
  paid: { amountCents: Cents; sessionId: string; at: string } | null;
};

/** Everything we keep for one visitor. Lives in the browser, no login. */
export type CaseFile = {
  version: 1;
  id: string;
  createdAt: string;
  holderFirstName: string;
  cards: CardAccount[];
  calls: CallRecord[];
};

/** Which parts of the product are switched on by the server's keys. */
export type Capabilities = {
  /** Statement reading (Claude). */
  reading: boolean;
  /** Text negotiation and outcome extraction (Claude). */
  negotiation: boolean;
  /** Voice calls in the browser (ElevenLabs). */
  voice: boolean;
  /** Pay after a win (Stripe test mode). */
  payments: boolean;
  /** The agent can ring a real phone number (ElevenLabs + a Twilio number). */
  phone: boolean;
};

export type ApiError = { error: string; code: string };
