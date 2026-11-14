// Writes the three sample statements listed in src/lib/statement/samples.ts to public/samples.
// Run with `pnpm samples`. The output is the same on every run.
//
// The PDFs are plain documents: text and tables, no bank logo or trade dress, fictional people, masked
// account numbers, and "SAMPLE DATA, NOT A REAL STATEMENT" on every page. The app reads them through
// /api/extract like any upload. Nothing in the app knows what is printed here.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import {
  minimumPaymentCents,
  monthlyInterestCents,
  simulateFixedPayment,
  simulateMinimumPayments,
} from "@/lib/engine";
import { daysBetween, formatApr, formatDate, formatDuration } from "@/lib/format";
import { formatCents } from "@/lib/money";
import { SAMPLE_STATEMENTS } from "@/lib/statement/samples";
import type { Bps, Cents, IsoDate } from "@/lib/types";

/** One made-up cardholder with three cards at three banks, for the multi-bank demo. */
const MARIA_ADDRESS = ["100 Example Street, Apt 4", "Columbus, OH 43215"];

const SAMPLE_NOTICE = "SAMPLE DATA, NOT A REAL STATEMENT";
const OUTPUT_DIR = path.join(process.cwd(), "public", "samples");

// ---- the three statements ---------------------------------------------------------------

type Posting = { on: IsoDate; description: string; cents: Cents };

/** What we decide about a sample. Every other printed figure is worked out from these in `figuresFor`. */
type SampleInput = {
  /** Matches an id in SAMPLE_STATEMENTS. */
  id: string;
  issuerName: string;
  cardName: string;
  holderName: string;
  addressLines: string[];
  maskedAccount: string;
  memberSinceYear: number | null;
  /** Printed only when not null. */
  latePaymentsLast12m: number | null;
  opensOn: IsoDate;
  closesOn: IsoDate;
  dueOn: IsoDate;
  newBalanceCents: Cents;
  creditLimitCents: Cents;
  purchaseAprBps: Bps;
  promo: { aprBps: Bps; endsOn: IsoDate } | null;
  payment: Posting;
  purchases: Posting[];
  /** Fees charged in this period. */
  fees: Posting[];
  annualFeeCents: Cents;
  /** The fee the Late Payment Warning threatens. Not a charge. */
  possibleLateFeeCents: Cents;
  yearToDate: { feesCents: Cents; interestCents: Cents };
};

const SAMPLES: SampleInput[] = [
  {
    id: "maria-chase",
    issuerName: "Chase",
    cardName: "Freedom Unlimited",
    holderName: "MARIA LOPEZ",
    addressLines: MARIA_ADDRESS,
    maskedAccount: "XXXX XXXX XXXX 4417",
    memberSinceYear: 2020,
    latePaymentsLast12m: 0,
    opensOn: "2026-10-07",
    closesOn: "2026-11-06",
    dueOn: "2026-12-01",
    newBalanceCents: 840_000,
    creditLimitCents: 1_000_000,
    purchaseAprBps: 2724,
    promo: null,
    payment: { on: "2026-10-28", description: "PAYMENT RECEIVED, THANK YOU", cents: 27_500 },
    purchases: [
      { on: "2026-10-12", description: "GROCERY MART COLUMBUS OH", cents: 5437 },
      { on: "2026-10-21", description: "FUEL STOP COLUMBUS OH", cents: 3845 },
    ],
    fees: [],
    annualFeeCents: 0,
    possibleLateFeeCents: 4000,
    yearToDate: { feesCents: 0, interestCents: 187_136 },
  },
  {
    id: "maria-capital-one",
    issuerName: "Capital One",
    cardName: "Quicksilver",
    holderName: "MARIA LOPEZ",
    addressLines: MARIA_ADDRESS,
    maskedAccount: "XXXX XXXX XXXX 8062",
    memberSinceYear: null,
    latePaymentsLast12m: null,
    opensOn: "2026-10-04",
    closesOn: "2026-11-03",
    dueOn: "2026-11-28",
    newBalanceCents: 310_000,
    creditLimitCents: 400_000,
    purchaseAprBps: 2999,
    promo: null,
    payment: { on: "2026-10-27", description: "PAYMENT RECEIVED, THANK YOU", cents: 11_000 },
    purchases: [
      { on: "2026-10-09", description: "PHARMACY PLUS COLUMBUS OH", cents: 2160 },
      { on: "2026-10-18", description: "SCHOOL SUPPLY CO COLUMBUS OH", cents: 2840 },
    ],
    fees: [{ on: "2026-11-01", description: "ANNUAL MEMBERSHIP FEE", cents: 9500 }],
    annualFeeCents: 9500,
    possibleLateFeeCents: 4000,
    yearToDate: { feesCents: 9500, interestCents: 74_219 },
  },
  {
    id: "maria-citi",
    issuerName: "Citi",
    cardName: "Simplicity",
    holderName: "MARIA LOPEZ",
    addressLines: MARIA_ADDRESS,
    maskedAccount: "XXXX XXXX XXXX 2291",
    memberSinceYear: null,
    latePaymentsLast12m: 1,
    opensOn: "2026-10-09",
    closesOn: "2026-11-08",
    dueOn: "2026-12-05",
    newBalanceCents: 525_000,
    creditLimitCents: 750_000,
    purchaseAprBps: 2649,
    promo: { aprBps: 0, endsOn: "2026-12-25" },
    payment: { on: "2026-11-06", description: "PAYMENT RECEIVED, THANK YOU", cents: 5500 },
    purchases: [
      { on: "2026-10-15", description: "HARDWARE DEPOT COLUMBUS OH", cents: 4725 },
      { on: "2026-10-24", description: "CORNER CAFE COLUMBUS OH", cents: 3650 },
    ],
    fees: [{ on: "2026-11-05", description: "LATE FEE", cents: 4100 }],
    annualFeeCents: 0,
    possibleLateFeeCents: 4100,
    yearToDate: { feesCents: 4100, interestCents: 0 },
  },
];

// ---- the figures a statement prints, worked out with the engine's own rules ---------------

const sum = (postings: Posting[]) => postings.reduce((total, posting) => total + posting.cents, 0);

/** The smallest fixed payment that clears the balance within three years. */
function threeYearPaymentCents(balanceCents: Cents, aprBps: Bps): Cents {
  const clearsInThreeYears = (payment: Cents) => {
    const payoff = simulateFixedPayment(balanceCents, aprBps, payment);
    return payoff.paidOff && payoff.months <= 36;
  };
  let tooLow = 0;
  let enough = balanceCents;
  while (enough - tooLow > 1) {
    const middle = Math.floor((tooLow + enough) / 2);
    if (clearsInThreeYears(middle)) enough = middle;
    else tooLow = middle;
  }
  return enough;
}

function figuresFor(sample: SampleInput) {
  // Interest accrues at the rate in effect: the promotional rate while it runs.
  const rateInEffectBps = sample.promo ? sample.promo.aprBps : sample.purchaseAprBps;
  const interestCents = monthlyInterestCents(sample.newBalanceCents, rateInEffectBps);
  const purchasesCents = sum(sample.purchases);
  const feesCents = sum(sample.fees);
  // The previous balance is whatever makes the account summary add up to the new balance.
  const previousBalanceCents =
    sample.newBalanceCents - purchasesCents - feesCents - interestCents + sample.payment.cents;

  const daysInPeriod = daysBetween(sample.opensOn, sample.closesOn) + 1;
  // Banks print the average daily balance that produced the interest. With no interest there is
  // nothing to work back from, so the midpoint of the period stands in.
  const balanceSubjectToInterestCents =
    interestCents > 0
      ? Math.round((interestCents * 365 * 10_000) / (rateInEffectBps * daysInPeriod))
      : Math.round((previousBalanceCents + sample.newBalanceCents) / 2);

  // The warning box looks years ahead, so it uses the standard rate, not a promotion that is about to end.
  const minimumOnly = simulateMinimumPayments(sample.newBalanceCents, sample.purchaseAprBps);
  const threeYearCents = threeYearPaymentCents(sample.newBalanceCents, sample.purchaseAprBps);
  const threeYear = simulateFixedPayment(sample.newBalanceCents, sample.purchaseAprBps, threeYearCents);

  return {
    interestCents,
    purchasesCents,
    feesCents,
    previousBalanceCents,
    daysInPeriod,
    balanceSubjectToInterestCents,
    minimumPaymentCents: minimumPaymentCents(sample.newBalanceCents, rateInEffectBps),
    availableCreditCents: sample.creditLimitCents - sample.newBalanceCents,
    minimumOnly,
    threeYear: { paymentCents: threeYearCents, ...threeYear },
  };
}

// ---- a page to write on -------------------------------------------------------------------

const PAGE = { width: 612, height: 792, margin: 48 };
const CONTENT_WIDTH = PAGE.width - 2 * PAGE.margin;
const BODY_SIZE = 10;
const LINE_HEIGHT = 14;
const FOOTER_HEIGHT = 24;
const INK = rgb(0, 0, 0);
const GRAY = rgb(0.35, 0.35, 0.35);
const RULE = rgb(0.6, 0.6, 0.6);

type Style = { size?: number; bold?: boolean; gray?: boolean };
type Column = { header: string; width: number; align?: "right" };

/** Splits text into lines that fit a width. */
function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const longer = line ? `${line} ${word}` : word;
    if (line && font.widthOfTextAtSize(longer, size) > width) {
      lines.push(line);
      line = word;
    } else {
      line = longer;
    }
  }
  return line ? [...lines, line] : lines;
}

/** A cursor that writes down the page and starts a new page, with the sample notice, when one is full. */
class Sheet {
  private page!: PDFPage;
  /** Top of the next line. */
  private y = 0;

  constructor(
    private readonly doc: PDFDocument,
    private readonly fonts: { regular: PDFFont; bold: PDFFont },
  ) {
    this.startPage();
  }

  private font(style: Style): PDFFont {
    return style.bold ? this.fonts.bold : this.fonts.regular;
  }

  private put(text: string, x: number, style: Style = {}, rightEdge?: number): void {
    const size = style.size ?? BODY_SIZE;
    const font = this.font(style);
    const left = rightEdge === undefined ? x : rightEdge - font.widthOfTextAtSize(text, size);
    this.page.drawText(text, { x: left, y: this.y - size, size, font, color: style.gray ? GRAY : INK });
  }

  private rule(): void {
    const at = { y: this.y - 2 };
    this.page.drawLine({
      start: { x: PAGE.margin, ...at },
      end: { x: PAGE.width - PAGE.margin, ...at },
      thickness: 0.5,
      color: RULE,
    });
  }

  private startPage(): void {
    this.page = this.doc.addPage([PAGE.width, PAGE.height]);
    this.y = PAGE.height - PAGE.margin;
    const noticeSize = 20;
    const noticeWidth = this.fonts.bold.widthOfTextAtSize(SAMPLE_NOTICE, noticeSize);
    this.page.drawRectangle({
      x: PAGE.margin,
      y: this.y - 52,
      width: CONTENT_WIDTH,
      height: 52,
      borderColor: INK,
      borderWidth: 2,
    });
    this.gap(10);
    this.put(SAMPLE_NOTICE, (PAGE.width - noticeWidth) / 2, { size: noticeSize, bold: true });
    this.gap(26);
    const note = "Made for the Haggle demo. The person, the account and every number are fictional.";
    this.put(note, (PAGE.width - this.fonts.regular.widthOfTextAtSize(note, 8)) / 2, { size: 8 });
    this.gap(32);
  }

  /** Starts a new page when the next block would not fit on this one. */
  private need(height: number): void {
    if (this.y - height < PAGE.margin + FOOTER_HEIGHT) this.startPage();
  }

  gap(points: number): void {
    this.y -= points;
  }

  line(text: string, style: Style = {}): void {
    const height = (style.size ?? BODY_SIZE) + 4;
    this.need(height);
    this.put(text, PAGE.margin, style);
    this.gap(height);
  }

  paragraph(text: string, style: Style = {}): void {
    const lines = wrap(text, this.font(style), style.size ?? BODY_SIZE, CONTENT_WIDTH);
    this.need(lines.length * LINE_HEIGHT);
    for (const line of lines) this.line(line, style);
  }

  /** A section title with a rule under it. `roomFor` keeps the title on the same page as what follows. */
  heading(text: string, roomFor = 3 * LINE_HEIGHT): void {
    this.need(LINE_HEIGHT + 22 + roomFor);
    this.gap(12);
    this.put(text, PAGE.margin, { size: 11, bold: true });
    this.gap(16);
    this.rule();
    this.gap(6);
  }

  /** A label on the left and its value on the right. */
  row(label: string, value: string, style: Style = {}): void {
    this.need(LINE_HEIGHT);
    this.put(label, PAGE.margin, style);
    this.put(value, 0, style, PAGE.width - PAGE.margin);
    this.gap(LINE_HEIGHT);
  }

  table(columns: Column[], rows: string[][]): void {
    const padding = 6;
    const cellLines = (cells: string[], style: Style) =>
      cells.map((cell, index) => wrap(cell, this.font(style), BODY_SIZE, columns[index].width - padding));
    const drawRow = (cells: string[], style: Style) => {
      const lines = cellLines(cells, style);
      const height = Math.max(...lines.map((cell) => cell.length)) * LINE_HEIGHT;
      this.need(height);
      let x = PAGE.margin;
      lines.forEach((cell, index) => {
        const column = columns[index];
        const top = this.y;
        for (const text of cell) {
          const rightEdge = column.align === "right" ? x + column.width : undefined;
          this.put(text, x, style, rightEdge);
          this.gap(LINE_HEIGHT);
        }
        this.y = top;
        x += column.width;
      });
      this.gap(height);
    };

    drawRow(columns.map((column) => column.header), { bold: true });
    this.rule();
    this.gap(4);
    for (const cells of rows) drawRow(cells, {});
  }

  /** Draws a border around whatever `content` writes. `height` is an estimate that keeps it on one page. */
  boxed(height: number, content: () => void): void {
    this.need(height + 24);
    this.gap(16);
    const top = this.y + 6;
    content();
    this.page.drawRectangle({
      x: PAGE.margin - 8,
      y: this.y - 4,
      width: CONTENT_WIDTH + 16,
      height: top - this.y + 4,
      borderColor: INK,
      borderWidth: 1,
    });
    this.gap(10);
  }

  /** Page numbers and the sample notice at the foot of every page, once the page count is known. */
  finish(): void {
    const pages = this.doc.getPages();
    pages.forEach((page, index) => {
      page.drawText(`${SAMPLE_NOTICE}. Page ${index + 1} of ${pages.length}.`, {
        x: PAGE.margin,
        y: PAGE.margin - 12,
        size: 8,
        font: this.fonts.regular,
        color: GRAY,
      });
    });
  }
}

// ---- what a statement says ----------------------------------------------------------------

function writeStatement(sheet: Sheet, sample: SampleInput): void {
  const figures = figuresFor(sample);
  const variable = (aprBps: Bps) => `${formatApr(aprBps)} (v)`;

  sheet.line(sample.issuerName, { size: 18, bold: true });
  sheet.line(`${sample.cardName} credit card statement`, { size: 12 });
  sheet.gap(6);
  sheet.row("Account number", sample.maskedAccount);
  sheet.row("Statement closing date", formatDate(sample.closesOn));
  sheet.row(
    "Billing period",
    `${formatDate(sample.opensOn)} to ${formatDate(sample.closesOn)} (${figures.daysInPeriod} days)`,
  );
  sheet.gap(8);
  sheet.line(sample.holderName, { bold: true });
  for (const addressLine of sample.addressLines) sheet.line(addressLine);
  if (sample.memberSinceYear !== null) sheet.line(`Cardmember since ${sample.memberSinceYear}`);

  sheet.heading("Payment information");
  sheet.row("New balance", formatCents(sample.newBalanceCents), { bold: true });
  sheet.row("Minimum payment due", formatCents(figures.minimumPaymentCents), { bold: true });
  sheet.row("Payment due date", formatDate(sample.dueOn), { bold: true });

  sheet.boxed(10 * LINE_HEIGHT, () => {
    sheet.paragraph(
      `Late Payment Warning: If we do not receive your minimum payment by the date listed above, you may have to pay a late fee of up to ${formatCents(sample.possibleLateFeeCents)}.`,
    );
    sheet.gap(6);
    sheet.paragraph(
      "Minimum Payment Warning: If you make only the minimum payment each period, you will pay more in interest and it will take you longer to pay off your balance. For example:",
    );
    sheet.gap(6);
    sheet.table(
      [
        { header: "If you make no additional charges using this card and each month you pay...", width: 180 },
        { header: "You will pay off the balance shown on this statement in about...", width: 160 },
        { header: "And you will end up paying an estimated total of...", width: 176 },
      ],
      [
        [
          "Only the minimum payment",
          formatDuration(figures.minimumOnly.months),
          formatCents(figures.minimumOnly.totalPaidCents),
        ],
        [
          formatCents(figures.threeYear.paymentCents),
          formatDuration(figures.threeYear.months),
          `${formatCents(figures.threeYear.totalPaidCents)} (Savings = ${formatCents(figures.minimumOnly.totalPaidCents - figures.threeYear.totalPaidCents)})`,
        ],
      ],
    );
    if (sample.promo) {
      sheet.gap(4);
      sheet.paragraph(
        `These estimates use the standard purchase APR of ${formatApr(sample.purchaseAprBps)}, which applies after the promotional rate ends.`,
        { size: 8 },
      );
    }
  });

  sheet.heading("Account summary", 8 * LINE_HEIGHT);
  sheet.row("Previous balance", formatCents(figures.previousBalanceCents));
  sheet.row("Payments and credits", formatCents(-sample.payment.cents));
  sheet.row("Purchases", formatCents(figures.purchasesCents));
  sheet.row("Fees charged", formatCents(figures.feesCents));
  sheet.row("Interest charged", formatCents(figures.interestCents));
  sheet.row("New balance", formatCents(sample.newBalanceCents), { bold: true });
  sheet.row("Credit limit", formatCents(sample.creditLimitCents));
  sheet.row("Available credit", formatCents(figures.availableCreditCents));

  const amountColumns: Column[] = [
    { header: "Date", width: 100 },
    { header: "Description", width: 316 },
    { header: "Amount", width: 100, align: "right" },
  ];
  const postingRow = (posting: Posting) => [formatDate(posting.on), posting.description, formatCents(posting.cents)];
  const paymentAsCredit: Posting = { ...sample.payment, cents: -sample.payment.cents };
  const inDateOrder = [paymentAsCredit, ...sample.purchases].sort((a, b) => a.on.localeCompare(b.on));

  sheet.heading("Transactions", 5 * LINE_HEIGHT);
  sheet.table(amountColumns, inDateOrder.map(postingRow));

  sheet.heading("Fees charged");
  if (sample.fees.length > 0) sheet.table(amountColumns, sample.fees.map(postingRow));
  sheet.row("Total fees for this period", formatCents(figures.feesCents), { bold: true });

  sheet.heading("Interest charged");
  sheet.row("Interest charge on purchases", formatCents(figures.interestCents));
  sheet.row("Total interest for this period", formatCents(figures.interestCents), { bold: true });

  const year = sample.closesOn.slice(0, 4);
  sheet.heading(`${year} totals year to date`);
  sheet.row(`Total fees charged in ${year}`, formatCents(sample.yearToDate.feesCents));
  sheet.row(`Total interest charged in ${year}`, formatCents(sample.yearToDate.interestCents));

  sheet.heading("Interest charge calculation", 7 * LINE_HEIGHT);
  sheet.paragraph("Your Annual Percentage Rate (APR) is the annual interest rate on your account. (v) = variable rate.");
  sheet.gap(4);
  const rateColumns: Column[] = [
    { header: "Type of balance", width: 216 },
    { header: "Annual Percentage Rate (APR)", width: 100, align: "right" },
    { header: "Balance subject to interest rate", width: 100, align: "right" },
    { header: "Interest charge", width: 100, align: "right" },
  ];
  const balanceSubjectToInterest = formatCents(figures.balanceSubjectToInterestCents);
  sheet.table(
    rateColumns,
    sample.promo
      ? [
          [
            `Purchases, promotional APR until ${formatDate(sample.promo.endsOn)}`,
            formatApr(sample.promo.aprBps),
            balanceSubjectToInterest,
            formatCents(figures.interestCents),
          ],
          ["Purchases, standard APR after the promotion ends", variable(sample.purchaseAprBps), formatCents(0), formatCents(0)],
        ]
      : [["Purchases", variable(sample.purchaseAprBps), balanceSubjectToInterest, formatCents(figures.interestCents)]],
  );

  sheet.heading("Account details");
  if (sample.promo) {
    sheet.row("Promotional APR on purchases", formatApr(sample.promo.aprBps));
    sheet.row("Promotional APR ends", formatDate(sample.promo.endsOn));
    sheet.row("Standard purchase APR after the promotion ends", variable(sample.purchaseAprBps));
  } else {
    sheet.row("Purchase APR", variable(sample.purchaseAprBps));
  }
  sheet.row("Annual membership fee", formatCents(sample.annualFeeCents));
  if (sample.latePaymentsLast12m !== null) {
    sheet.row("Late payments in the last 12 months", String(sample.latePaymentsLast12m));
  }

  sheet.finish();
}

// ---- write the files ------------------------------------------------------------------------

async function samplePdf(sample: SampleInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  // Fixed metadata dates keep the file byte-for-byte the same on every run.
  const stamped = new Date(`${sample.closesOn}T12:00:00Z`);
  doc.setCreationDate(stamped);
  doc.setModificationDate(stamped);
  doc.setTitle(`${sample.issuerName} ${sample.cardName} sample statement`);
  doc.setSubject(SAMPLE_NOTICE);
  doc.setAuthor("Haggle");
  doc.setCreator("scripts/make-samples.ts");

  const fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  };
  writeStatement(new Sheet(doc, fonts), sample);
  return doc.save();
}

async function main(): Promise<void> {
  await mkdir(OUTPUT_DIR, { recursive: true });
  for (const listed of SAMPLE_STATEMENTS) {
    const sample = SAMPLES.find((candidate) => candidate.id === listed.id);
    if (!sample) throw new Error(`samples.ts lists "${listed.id}" but this script has no statement for it.`);
    const bytes = await samplePdf(sample);
    const file = path.join(OUTPUT_DIR, path.basename(listed.file));
    await writeFile(file, bytes);
    console.log(`${path.relative(process.cwd(), file)}  ${(bytes.length / 1024).toFixed(1)} KB`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
