import { describe, expect, it } from "vitest";
import { buildIcs, type CalendarEvent } from "./ics";

const CREATED = new Date("2026-11-14T09:30:00.000Z");
const event: CalendarEvent = {
  uid: "case-1-chase:apr_reduction@haggle",
  date: "2027-05-14",
  title: "Haggle: Ask Chase to lower your APR",
  description: "The bank said no on Nov 14, 2026.",
};

const linesOf = (ics: string) => ics.split("\r\n");
const octetsOf = (line: string) => new TextEncoder().encode(line).length;

describe("buildIcs", () => {
  it("wraps the events in one calendar with CRLF line ends", () => {
    const ics = buildIcs([event], CREATED);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/);
    expect(linesOf(ics).slice(0, 5)).toEqual([
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Haggle//Next steps//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ]);
  });

  it("writes an all-day event that ends the next day", () => {
    const lines = linesOf(buildIcs([event], CREATED));
    expect(lines).toContain("UID:case-1-chase:apr_reduction@haggle");
    expect(lines).toContain("DTSTAMP:20261114T093000Z");
    expect(lines).toContain("DTSTART;VALUE=DATE:20270514");
    expect(lines).toContain("DTEND;VALUE=DATE:20270515");
    expect(lines).toContain("SUMMARY:Haggle: Ask Chase to lower your APR");
  });

  it("rolls the end date over a month and a year", () => {
    const lines = linesOf(buildIcs([{ ...event, date: "2026-12-31" }], CREATED));
    expect(lines).toContain("DTEND;VALUE=DATE:20270101");
  });

  it("escapes commas, semicolons, backslashes and line breaks in text", () => {
    const tricky = { ...event, title: "A, B; C\\D", description: "Line one\nLine two" };
    const lines = linesOf(buildIcs([tricky], CREATED));
    expect(lines).toContain("SUMMARY:A\\, B\\; C\\\\D");
    expect(lines).toContain("DESCRIPTION:Line one\\nLine two");
  });

  it("folds long lines at 75 octets and unfolds to the original text", () => {
    const long = { ...event, description: "Ask again. ".repeat(30).trim() };
    const ics = buildIcs([long], CREATED);
    for (const line of linesOf(ics)) expect(octetsOf(line)).toBeLessThanOrEqual(75);
    expect(ics.replace(/\r\n /g, "")).toContain(`DESCRIPTION:${long.description}`);
  });

  it("counts octets, not characters, so a multi-byte character is never split", () => {
    const accented = { ...event, description: "é".repeat(120) };
    const ics = buildIcs([accented], CREATED);
    for (const line of linesOf(ics)) expect(octetsOf(line)).toBeLessThanOrEqual(75);
    expect(ics.replace(/\r\n /g, "")).toContain(`DESCRIPTION:${accented.description}`);
  });

  it("writes one event per step and none for an empty list", () => {
    const count = (ics: string) => linesOf(ics).filter((line) => line === "BEGIN:VEVENT").length;
    expect(count(buildIcs([], CREATED))).toBe(0);
    expect(count(buildIcs([event, { ...event, uid: "other" }], CREATED))).toBe(2);
  });
});
