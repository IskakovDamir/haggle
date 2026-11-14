// Phone calls, the pure part: which numbers may be rung, and how an ElevenLabs conversation record
// becomes our call status and our turns. No network here, so all of it is tested.
import type { Turn } from "@/lib/types";
import { turnFromMessage } from "./transcript";

/**
 * A US number as E.164 ("+15551234567"), from what a person types: "(555) 123-4567", "555.123.4567",
 * "+1 555 123 4567". Also accepts any other number already written with a "+" and 8 to 15 digits.
 * null when it is not a phone number.
 */
export function toE164(text: string): string | null {
  const trimmed = text.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+")) return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
  if (digits.length === 10 && /^[2-9]/.test(digits)) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1") && /^[2-9]/.test(digits.slice(1))) return `+${digits}`;
  return null;
}

/**
 * The numbers this server may ring, from PHONE_ALLOWED_NUMBERS (separated by commas).
 * A public page that rings any number it is given would let anyone use Haggle to call strangers,
 * so the list is required: no list, no phone calls.
 */
export function allowedNumbers(setting: string | undefined): Set<string> {
  const numbers = (setting ?? "")
    .split(/[,;\n]+/)
    .map((entry) => toE164(entry))
    .filter((entry): entry is string => entry !== null);
  return new Set(numbers);
}

/**
 * Country codes in which any number may be rung, from PHONE_OPEN_PREFIXES ("+1,+7"). This opens the
 * demo to visitors' own phones; each such call is held to the limits in the phone route. Empty or
 * unset: only the numbers in PHONE_ALLOWED_NUMBERS.
 */
export function openPrefixes(setting: string | undefined): string[] {
  return (setting ?? "")
    .split(/[,;\s]+/)
    .map((entry) => entry.trim())
    .filter((entry) => /^\+\d{1,3}$/.test(entry));
}

/** Premium-rate lines (+1 900, +1 976) are never rung, whatever the setting. */
const NEVER_RING = ["+1900", "+1976"];

export type RingPolicy = { allowed: Set<string>; open: string[] };

/** Whether this number may be rung, and whether it is one of the owner's approved phones. */
export function ringPolicyFor(e164: string, policy: RingPolicy): "approved" | "open" | "refused" {
  if (NEVER_RING.some((prefix) => e164.startsWith(prefix))) return "refused";
  if (policy.allowed.has(e164)) return "approved";
  return policy.open.some((prefix) => e164.startsWith(prefix)) ? "open" : "refused";
}

/** "+1 or +7", for the sentence that says which numbers can be rung. */
export function prefixList(open: string[]): string {
  return open.length <= 1 ? (open[0] ?? "") : `${open.slice(0, -1).join(", ")} or ${open.at(-1)}`;
}

/** "+15551234567" -> "•••• 4567", for messages and logs. */
export function maskNumber(e164: string): string {
  return `•••• ${e164.slice(-4)}`;
}

export type PhoneCallStatus = "dialing" | "live" | "wrapping" | "done" | "failed";

/** The parts of GET /v1/convai/conversations/{id} we read. Everything is optional: the record grows as the call goes. */
export type ConversationRecord = {
  agent_id?: string;
  status?: string;
  transcript?: {
    role?: string;
    message?: string | null;
    time_in_call_secs?: number;
    tool_calls?: { tool_name?: string | null }[] | null;
  }[] | null;
  metadata?: {
    termination_reason?: string | null;
    error?: unknown;
    phone_call?: { call_result?: string | null } | null;
  } | null;
};

const CALL_RESULT_SENTENCE: Record<string, string> = {
  busy: "The line was busy.",
  no_answer: "Nobody picked up.",
  voicemail: "The call went to voicemail, so the agent hung up.",
  failed: "The call could not be connected.",
};

/** Our status and turns for one conversation record. */
export function readConversation(record: ConversationRecord): {
  status: PhoneCallStatus;
  reason: string | null;
  turns: Turn[];
  /** True once the agent handed the call to the cardholder. What was said after that is not in the transcript. */
  transferred: boolean;
} {
  const transferred = (record.transcript ?? []).some((line) =>
    (line.tool_calls ?? []).some((call) => call.tool_name === "transfer_to_number"),
  );
  const read = readStatus(record);
  return { ...read, transferred };
}

function readStatus(record: ConversationRecord): { status: PhoneCallStatus; reason: string | null; turns: Turn[] } {
  const turns = (record.transcript ?? []).flatMap((line) => {
    if (typeof line.message !== "string" || (line.role !== "user" && line.role !== "agent")) return [];
    const turn = turnFromMessage({ role: line.role, message: line.message }, (line.time_in_call_secs ?? 0) * 1000);
    return turn ? [turn] : [];
  });

  const callResult = record.metadata?.phone_call?.call_result ?? null;
  const unanswered = callResult !== null && callResult !== "answered" ? CALL_RESULT_SENTENCE[callResult] ?? null : null;

  // An unanswered call can keep the status "initiated" for good, so the call result decides it first.
  if (unanswered && turns.length === 0) return { status: "failed", reason: unanswered, turns };

  switch (record.status) {
    case "failed":
      return { status: "failed", reason: unanswered ?? "The call could not be connected.", turns };
    case "done":
      if (unanswered && turns.every((turn) => turn.role === "agent")) return { status: "failed", reason: unanswered, turns };
      return { status: "done", reason: null, turns };
    case "processing":
      return { status: "wrapping", reason: null, turns };
    case "in-progress":
      return { status: "live", reason: null, turns };
    default:
      // "initiated", or a record that has no status yet: the phone is ringing.
      return { status: "dialing", reason: null, turns };
  }
}
