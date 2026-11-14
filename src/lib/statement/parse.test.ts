import { describe, expect, it } from "vitest";
import {
  firstNameOf,
  issuerFromName,
  lastFourDigits,
  parseIsoDate,
  parseMoney,
  parsePercent,
  parseWholeNumber,
  stripCardNumbers,
} from "./parse";

describe("parseMoney", () => {
  it("reads printed amounts into cents", () => {
    expect(parseMoney("$8,400.00")).toBe(840_000);
    expect(parseMoney("8400")).toBe(840_000);
    expect(parseMoney(" $95.5 ")).toBe(9550);
    expect(parseMoney("$0.00")).toBe(0);
    expect(parseMoney("1,234.56 USD")).toBe(123_456);
  });

  it("reads the ways a statement prints a credit", () => {
    expect(parseMoney("-$12.00")).toBe(-1200);
    expect(parseMoney("$12.00 CR")).toBe(-1200);
    expect(parseMoney("($12.00)")).toBe(-1200);
  });

  it("returns null for anything that is not a plain amount", () => {
    expect(parseMoney("about $50")).toBeNull();
    expect(parseMoney("None")).toBeNull();
    expect(parseMoney("$1.234")).toBeNull();
    expect(parseMoney("")).toBeNull();
  });
});

describe("parsePercent", () => {
  it("reads printed rates into basis points", () => {
    expect(parsePercent("27.24%")).toBe(2724);
    expect(parsePercent("29.99% (v)")).toBe(2999);
    expect(parsePercent("0.00%")).toBe(0);
    expect(parsePercent("24")).toBe(2400);
    expect(parsePercent("19.9 %")).toBe(1990);
  });

  it("returns null for anything else", () => {
    expect(parsePercent("Prime + 12.74%")).toBeNull();
    expect(parsePercent("-5%")).toBeNull();
    expect(parsePercent("n/a")).toBeNull();
  });
});

describe("parseIsoDate", () => {
  it("accepts a real calendar day written as YYYY-MM-DD", () => {
    expect(parseIsoDate("2026-12-01")).toBe("2026-12-01");
    expect(parseIsoDate(" 2028-02-29 ")).toBe("2028-02-29");
  });

  it("rejects other formats and days that do not exist", () => {
    expect(parseIsoDate("12/01/2026")).toBeNull();
    expect(parseIsoDate("Dec 1, 2026")).toBeNull();
    expect(parseIsoDate("2026-02-30")).toBeNull();
    expect(parseIsoDate("2026-13-01")).toBeNull();
  });
});

describe("parseWholeNumber", () => {
  it("reads digits only", () => {
    expect(parseWholeNumber("2020")).toBe(2020);
    expect(parseWholeNumber(" 0 ")).toBe(0);
    expect(parseWholeNumber("two")).toBeNull();
    expect(parseWholeNumber("1.5")).toBeNull();
  });
});

describe("card numbers", () => {
  it("removes anything shaped like a full card number from text", () => {
    expect(stripCardNumbers("Chase 4111 1111 1111 1111")).toBe("Chase");
    expect(stripCardNumbers("Card 4111-1111-1111-1111 Visa")).toBe("Card Visa");
    expect(stripCardNumbers("378282246310005 Amex")).toBe("Amex");
  });

  it("leaves short numbers alone", () => {
    expect(stripCardNumbers("Freedom Unlimited 2020")).toBe("Freedom Unlimited 2020");
  });

  it("keeps only the last four digits of an account number", () => {
    expect(lastFourDigits("XXXX XXXX XXXX 4417")).toBe("4417");
    expect(lastFourDigits("4111 1111 1111 4417")).toBe("4417");
    expect(lastFourDigits("ending in 4417")).toBe("4417");
    expect(lastFourDigits("417")).toBeNull();
  });
});

describe("names", () => {
  it("takes the first name and fixes all capitals", () => {
    expect(firstNameOf("MARIA T LOPEZ")).toBe("Maria");
    expect(firstNameOf("James Carter")).toBe("James");
    expect(firstNameOf("   ")).toBeNull();
  });

  it("maps the printed bank name to an issuer", () => {
    expect(issuerFromName("JPMorgan Chase Bank, N.A.")).toBe("chase");
    expect(issuerFromName("Capital One")).toBe("capital_one");
    expect(issuerFromName("Citibank")).toBe("citi");
    expect(issuerFromName("First Example Credit Union")).toBe("other");
  });
});
