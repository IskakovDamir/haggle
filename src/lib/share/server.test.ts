import { describe, expect, it } from "vitest";
import { handleShare } from "./server";
import { readToken } from "./sign";

const turns = [
  { role: "agent" as const, text: "Hi, I'm an AI assistant calling for Maria about her Chase card.", at: 0 },
  { role: "bank" as const, text: "I can refund the $40 late fee.", at: 1000 },
  { role: "bank" as const, text: "I can also put the APR back to 27.24%.", at: 2000 },
];

const body = {
  bank: "Chase",
  card: { purchaseAprBps: 2999, balanceCents: 840_000, annualFeeCents: 0, aprBeforeMissBps: 2724 },
  outcome: {
    result: "won",
    aprAfterBps: 2724,
    annualFeeWaivedCents: null,
    lateFeeRefundCents: 4000,
    creditLimitAfterCents: null,
    statementCreditCents: null,
    followUp: null,
    evidence: [{ quote: "I can refund the $40 late fee.", turnIndex: 1 }],
  },
  turns,
  sample: true,
};

function post(data: unknown): Request {
  return new Request("http://localhost:3000/api/share", { method: "POST", body: JSON.stringify(data), headers: { "content-type": "application/json" } });
}

describe("POST /api/share", () => {
  it("signs a link built from what the bank actually said", async () => {
    process.env.SHARE_SECRET = "route-test-secret";
    const res = await handleShare(post(body));
    expect(res.status).toBe(200);
    const { url, token } = (await res.json()) as { url: string; token: string };
    expect(url).toBe(`http://localhost:3000/w/${token}`);
    const read = await readToken(token);
    expect(read?.signed).toBe(true);
    expect(read?.payload.wins.map((w) => w.kind)).toEqual(["late_fee", "apr"]);
    expect(read?.payload.practice).toBe(true);
    expect(read?.payload.annualSavingsCents).toBeGreaterThan(4000);
  });

  it("drops a number the bank never said, and refuses when nothing is left", async () => {
    const forged = { ...body, outcome: { ...body.outcome, lateFeeRefundCents: 9900, aprAfterBps: 1500, evidence: [] } };
    const res = await handleShare(post(forged));
    expect(res.status).toBe(422);
  });

  it("rejects a malformed body", async () => {
    const res = await handleShare(post({ bank: "Chase" }));
    expect(res.status).toBe(400);
  });
});
