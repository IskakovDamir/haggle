// Which phones the demo may ring: the owner's approved list, plus any number in an open country code.
import { describe, expect, it } from "vitest";
import { openPrefixes, prefixList, ringPolicyFor } from "./phone";

describe("ring policy", () => {
  const policy = { allowed: new Set(["+77755618871"]), open: openPrefixes("+1, +7; nonsense +44x") };

  it("reads only well formed country codes", () => {
    expect(policy.open).toEqual(["+1", "+7"]);
    expect(openPrefixes(undefined)).toEqual([]);
  });

  it("knows approved phones, opens the listed country codes, and refuses the rest", () => {
    expect(ringPolicyFor("+77755618871", policy)).toBe("approved");
    expect(ringPolicyFor("+15552345678", policy)).toBe("open");
    expect(ringPolicyFor("+447700900123", policy)).toBe("refused");
    expect(ringPolicyFor("+15552345678", { allowed: new Set(), open: [] })).toBe("refused");
  });

  it("never rings premium-rate lines", () => {
    expect(ringPolicyFor("+19005551234", policy)).toBe("refused");
    expect(ringPolicyFor("+19765551234", { allowed: new Set(["+19765551234"]), open: [] })).toBe("refused");
  });

  it("names the open codes in a sentence", () => {
    expect(prefixList(["+1", "+7"])).toBe("+1 or +7");
    expect(prefixList(["+1"])).toBe("+1");
  });
});
