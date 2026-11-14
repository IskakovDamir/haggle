import { describe, expect, it } from "vitest";
import { addMonths, laterOf } from "./dates";

describe("addMonths", () => {
  it("keeps the day of the month", () => {
    expect(addMonths("2026-11-14", 6)).toBe("2027-05-14");
    expect(addMonths("2026-11-14", 280)).toBe("2050-03-14");
    expect(addMonths("2026-11-14", 0)).toBe("2026-11-14");
  });

  it("stops at the last day of a shorter month", () => {
    expect(addMonths("2027-01-31", 1)).toBe("2027-02-28");
    expect(addMonths("2028-01-31", 1)).toBe("2028-02-29");
    expect(addMonths("2026-08-31", 6)).toBe("2027-02-28");
  });
});

describe("laterOf", () => {
  it("returns the later calendar date", () => {
    expect(laterOf("2026-11-14", "2027-01-01")).toBe("2027-01-01");
    expect(laterOf("2027-01-01", "2026-11-14")).toBe("2027-01-01");
  });
});
