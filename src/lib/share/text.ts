// Words for the win card and the prefilled post, built only from the payload with the shared formatters.
import { formatApr } from "@/lib/format";
import { formatDollars, formatShort } from "@/lib/money";
import type { CardStatus } from "./sign";
import type { SharePayload, ShareWin } from "./payload";

/** "Late fee $40 refunded", "APR back to 27.24%", "APR down from 29.99% to 22.99%". */
export function winLine(win: ShareWin): string {
  switch (win.kind) {
    case "late_fee":
      return `Late fee ${formatShort(win.amountCents)} refunded`;
    case "annual_fee":
      return `Annual fee ${formatShort(win.amountCents)} waived`;
    case "credit":
      return `${formatShort(win.amountCents)} statement credit`;
    case "apr":
      return win.restored ? `APR back to ${formatApr(win.toBps)}` : `APR down from ${formatApr(win.fromBps)} to ${formatApr(win.toBps)}`;
  }
}

/** The short form for a post: "late fee refunded", "APR back to 27.24%". */
function postPart(win: ShareWin): string {
  switch (win.kind) {
    case "late_fee":
      return "late fee refunded";
    case "annual_fee":
      return "annual fee waived";
    case "credit":
      return `${formatShort(win.amountCents)} statement credit`;
    case "apr":
      return win.restored ? `APR back to ${formatApr(win.toBps)}` : `APR down to ${formatApr(win.toBps)}`;
  }
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "$271". The engine's figure is first-year savings, so the card says "in the first year" under it. */
export function savingsLine(payload: SharePayload): string {
  return formatDollars(payload.annualSavingsCents);
}

/**
 * The prefilled post. A practice call never claims Haggle called the bank: in a practice call the
 * person on the other end played the bank.
 */
export function shareText(payload: SharePayload): string {
  const parts = payload.wins.map(postPart);
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}` : parts[0];
  const saves = formatDollars(payload.annualSavingsCents);
  if (payload.practice) {
    return `I tried Haggle in a practice call with ${payload.bank}: ${list}. That would save ${saves} in the first year.`;
  }
  return `Haggle called ${payload.bank} for me. ${capitalize(parts.join(", "))}. Saves ${saves} in the first year.`;
}

export function footerLabel(status: CardStatus): string {
  return status === "verified" ? "Verified by Haggle" : status === "practice" ? "Practice call" : "Unverified";
}
