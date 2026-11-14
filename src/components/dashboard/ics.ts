// A calendar file (.ics, RFC 5545) built in the browser from the next steps. No server involved.
import type { IsoDate } from "@/lib/types";

export type CalendarEvent = {
  /** Stable id, so importing the file twice updates the event and does not duplicate it. */
  uid: string;
  /** The day of the all-day event. */
  date: IsoDate;
  title: string;
  description: string;
};

const CRLF = "\r\n";
/** RFC 5545 asks for lines of at most 75 octets. */
const MAX_LINE_OCTETS = 75;

/** Backslash, semicolon and comma are escaped in text values. A line break becomes a backslash and "n". */
function escapeText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

const octets = (text: string) => new TextEncoder().encode(text).length;

/** Fold a long line: continuation lines start with one space. A character is never split in two. */
function fold(line: string): string {
  const pieces: string[] = [];
  let piece = "";
  for (const char of line) {
    // A continuation line carries its leading space inside the 75 octets.
    const room = pieces.length === 0 ? MAX_LINE_OCTETS : MAX_LINE_OCTETS - 1;
    if (octets(piece + char) > room) {
      pieces.push(piece);
      piece = "";
    }
    piece += char;
  }
  pieces.push(piece);
  return pieces.join(`${CRLF} `);
}

const compactDate = (iso: IsoDate) => iso.replace(/-/g, "");

/** "20261114T093000Z" */
function utcStamp(at: Date): string {
  return `${at.toISOString().slice(0, 19).replace(/[-:]/g, "")}Z`;
}

/** The day after a calendar date. An all-day event ends on the day after it starts. */
function nextDay(iso: IsoDate): IsoDate {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

/** One all-day event per step. `createdAt` is passed in, so the same input always gives the same file. */
export function buildIcs(events: CalendarEvent[], createdAt: Date): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Haggle//Next steps//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events.flatMap((event) => [
      "BEGIN:VEVENT",
      `UID:${escapeText(event.uid)}`,
      `DTSTAMP:${utcStamp(createdAt)}`,
      `DTSTART;VALUE=DATE:${compactDate(event.date)}`,
      `DTEND;VALUE=DATE:${compactDate(nextDay(event.date))}`,
      `SUMMARY:${escapeText(event.title)}`,
      `DESCRIPTION:${escapeText(event.description)}`,
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ];
  return lines.map(fold).join(CRLF) + CRLF;
}
