import { describe, expect, it } from "vitest";
import { activeNav, greetingFor, initialOf, NAV_ITEMS } from "./nav";

describe("activeNav", () => {
  it("matches each item's own route", () => {
    for (const item of NAV_ITEMS) expect(activeNav(item.href)).toBe(item.id);
  });

  it("keeps Calls lit on the call and the result", () => {
    expect(activeNav("/call")).toBe("calls");
    expect(activeNav("/win")).toBe("calls");
  });

  it("lights My cards while a card is added", () => {
    expect(activeNav("/start")).toBe("cards");
  });

  it("does not match a route that only starts with the same letters", () => {
    expect(activeNav("/callsheet")).toBeNull();
    expect(activeNav("/cardsy")).toBeNull();
  });

  it("leaves pages outside the nav unlit", () => {
    expect(activeNav("/missed")).toBeNull();
    expect(activeNav("/")).toBeNull();
  });
});

describe("greetingFor", () => {
  it("follows the time of day", () => {
    expect(greetingFor(6)).toBe("Good morning!");
    expect(greetingFor(11)).toBe("Good morning!");
    expect(greetingFor(12)).toBe("Good afternoon!");
    expect(greetingFor(16)).toBe("Good afternoon!");
    expect(greetingFor(17)).toBe("Good evening!");
    expect(greetingFor(23)).toBe("Good evening!");
    expect(greetingFor(2)).toBe("Good evening!");
  });
});

describe("initialOf", () => {
  it("takes the first letter, in capitals", () => {
    expect(initialOf("maria")).toBe("M");
    expect(initialOf("  Ana ")).toBe("A");
  });

  it("falls back to H when there is no name", () => {
    expect(initialOf("")).toBe("H");
    expect(initialOf(null)).toBe("H");
  });
});
