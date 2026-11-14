// The sample PDFs in public/samples are checked in. These tests read the files themselves, so a change to
// scripts/make-samples.ts that is not followed by `pnpm samples` shows up here.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFArray, PDFDocument, PDFRawStream, decodePDFRawStream } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { minimumPaymentCents, monthlyInterestCents } from "@/lib/engine";
import { formatCents } from "@/lib/money";
import { SAMPLE_STATEMENTS } from "./samples";
import { sniffMediaType } from "./upload";

const MAX_SAMPLE_BYTES = 200 * 1024;
const SAMPLE_NOTICE = "SAMPLE DATA, NOT A REAL STATEMENT";

const sampleBytes = async (file: string) => new Uint8Array(await readFile(path.join(process.cwd(), "public", file)));

/** The text drawn on each page. pdf-lib writes every line as a hex string followed by the Tj operator. */
async function pageTexts(bytes: Uint8Array): Promise<string[]> {
  const doc = await PDFDocument.load(bytes);
  return doc.getPages().map((page) => {
    const contents = page.node.Contents();
    const streams = contents instanceof PDFArray ? contents.asArray().map((ref) => doc.context.lookup(ref)) : [contents];
    const operators = streams
      .filter((stream) => stream instanceof PDFRawStream)
      .map((stream) => Buffer.from(decodePDFRawStream(stream).decode()).toString("latin1"))
      .join("\n");
    return [...operators.matchAll(/<([0-9A-Fa-f]+)>\s*Tj/g)]
      .map(([, hex]) => Buffer.from(hex, "hex").toString("latin1"))
      .join("\n");
  });
}

/** What each blurb in samples.ts promises, plus the figures the engine's rules give for those numbers. */
const PRINTED: Record<string, string[]> = {
  "maria-chase": [
    "Chase",
    "Freedom Unlimited credit card statement",
    "MARIA LOPEZ",
    "XXXX XXXX XXXX 4417",
    "$8,400.00",
    "27.24% (v)",
    "$10,000.00",
    "Cardmember since 2020",
    "Nov 6, 2026",
    "Dec 1, 2026",
    formatCents(monthlyInterestCents(840_000, 2724)),
    formatCents(minimumPaymentCents(840_000, 2724)),
  ],
  "maria-capital-one": [
    "Capital One",
    "Quicksilver credit card statement",
    "MARIA LOPEZ",
    "$3,100.00",
    "29.99% (v)",
    "$4,000.00",
    "ANNUAL MEMBERSHIP FEE",
    "$95.00",
    "Nov 3, 2026",
    formatCents(monthlyInterestCents(310_000, 2999)),
    formatCents(minimumPaymentCents(310_000, 2999)),
  ],
  "maria-citi": [
    "Citi",
    "Simplicity credit card statement",
    "MARIA LOPEZ",
    "$5,250.00",
    "0.00%",
    "Dec 25, 2026",
    "26.49% (v)",
    "LATE FEE",
    "$41.00",
    "$7,500.00",
    "Nov 8, 2026",
    formatCents(minimumPaymentCents(525_000, 0)),
  ],
};

describe("sample statements", () => {
  it("has printed figures to check for every listed sample", () => {
    expect(SAMPLE_STATEMENTS.map((sample) => sample.id).sort()).toEqual(Object.keys(PRINTED).sort());
  });

  describe.each(SAMPLE_STATEMENTS)("$id", (sample) => {
    it("exists in public/samples as a PDF under 200 KB", async () => {
      const bytes = await sampleBytes(sample.file);
      expect(sniffMediaType(bytes)).toBe("application/pdf");
      expect(bytes.length).toBeGreaterThan(1000);
      expect(bytes.length).toBeLessThan(MAX_SAMPLE_BYTES);
    });

    it("says it is sample data on every page", async () => {
      const pages = await pageTexts(await sampleBytes(sample.file));
      expect(pages.length).toBeGreaterThan(0);
      for (const page of pages) expect(page).toContain(SAMPLE_NOTICE);
    });

    it("prints the numbers its blurb promises", async () => {
      const lines = (await pageTexts(await sampleBytes(sample.file))).join("\n").split("\n");
      for (const printed of PRINTED[sample.id]) expect(lines).toContain(printed);
    });

    it("masks the account number", async () => {
      const text = (await pageTexts(await sampleBytes(sample.file))).join("\n");
      expect(text).toMatch(/XXXX XXXX XXXX \d{4}/);
      expect(text).not.toMatch(/\d(?:[ -]?\d){12,}/);
    });
  });
});
