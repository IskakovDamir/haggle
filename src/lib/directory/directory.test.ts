import { describe, expect, it } from "vitest";
import { getBank } from "@/lib/benchmarks";
import { answerText } from "@/lib/benchmarks/faq";
import { ISSUERS, issuerSchema } from "./data";
import { issuerFaq } from "./faq";
import { directoryPath, getIssuer, issuersAtoZ, mainLine, telHref } from "./index";

describe("phone directory data", () => {
  it("every issuer passes the schema", () => {
    for (const issuer of ISSUERS) expect(() => issuerSchema.parse(issuer), issuer.slug).not.toThrow();
  });

  it("every number is read from the issuer's own domain over https", () => {
    for (const issuer of ISSUERS) {
      const url = new URL(issuer.source.url);
      expect(url.protocol, issuer.slug).toBe("https:");
      expect(url.hostname.endsWith(issuer.domain), issuer.slug).toBe(true);
    }
  });

  it("the schema rejects a source on another domain and a malformed number", () => {
    const [chase] = ISSUERS;
    expect(() => issuerSchema.parse({ ...chase, source: { name: "x", url: "https://gethuman.com/x" } })).toThrow();
    expect(() => issuerSchema.parse({ ...chase, lines: [{ label: "x", display: "800 432 3117" }] })).toThrow();
  });

  it("slugs are unique and every insights link points at a real bank page", () => {
    const slugs = ISSUERS.map((i) => i.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const issuer of ISSUERS) if (issuer.insights) expect(getBank(issuer.insights), issuer.slug).toBeDefined();
  });

  it("no number appears twice within one issuer", () => {
    for (const issuer of ISSUERS) {
      const numbers = issuer.lines.map((l) => l.display);
      expect(new Set(numbers).size, issuer.slug).toBe(numbers.length);
    }
  });
});

describe("phone directory helpers", () => {
  it("builds tel links and paths", () => {
    expect(telHref("1-800-432-3117")).toBe("tel:+18004323117");
    expect(directoryPath({ slug: "chase" })).toBe("/phone/chase");
    expect(getIssuer("chase")?.name).toBe("Chase");
    expect(getIssuer("nope")).toBeUndefined();
  });

  it("sorts A to Z and keeps the card line first", () => {
    const names = issuersAtoZ().map((i) => i.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    for (const issuer of ISSUERS) expect(mainLine(issuer).label.toLowerCase(), issuer.slug).toMatch(/card|member/);
  });

  it("every FAQ answer names the issuer's real number or carries a label", () => {
    for (const issuer of ISSUERS) {
      const faq = issuerFaq(issuer);
      expect(faq.length).toBeGreaterThanOrEqual(5);
      expect(answerText(faq[0].answer)).toContain(mainLine(issuer).display);
      for (const item of faq) expect(answerText(item.answer).length, item.question).toBeGreaterThan(20);
    }
  });
});
