// POST /api/coach with a fake model. Nothing here touches the network.
import { describe, expect, it } from "vitest";
import { buildBrief } from "../brief";
import { checkOffers, coachAsk } from "../coach";
import { fakeModel, lever, mariaChase, post, transcript } from "../test-support";
import { COACH_INSTRUCTIONS, handleCoach, nextTip } from "./coach";

const brief = buildBrief({ card: mariaChase, holderFirstName: "Maria", lever: lever("apr_reduction", "chase") });
const none = { aprPercent: null, lateFeeRefundDollars: null, interestRefundDollars: null, otherCreditDollars: null };

function tip(overrides: Record<string, unknown> = {}) {
  return { say: "Could you lower my rate?", why: "Start with the ask.", avoid: null, stage: "opening", offers: none, ...overrides };
}

describe("checkOffers", () => {
  it("keeps only figures that were said, and grades a rate against the ask", () => {
    const ask = brief.askAprBps!;
    const between = (brief.currentAprBps + ask) / 2 / 100;
    const heard = [`I can do ${between.toFixed(2)} percent`, "and a forty dollar credit"];
    const offers = checkOffers(brief, { ...none, aprPercent: Number(between.toFixed(2)), otherCreditDollars: 40, lateFeeRefundDollars: 39 }, heard);
    expect(offers).toEqual([
      { kind: "apr", value: Math.round(Number(between.toFixed(2)) * 100), verdict: "counter" },
      { kind: "other_credit", value: 4000, verdict: "heard" },
    ]);
  });

  it("calls an offer at or under the ask good, and one no lower than today no better", () => {
    const ask = brief.askAprBps! / 100;
    const now = brief.currentAprBps / 100;
    expect(checkOffers(brief, { ...none, aprPercent: ask }, [`${ask}%`])[0].verdict).toBe("good");
    expect(checkOffers(brief, { ...none, aprPercent: now }, [`${now}%`])[0].verdict).toBe("no_better");
  });

  it("names the ask with its numbers", () => {
    expect(coachAsk(brief)).toContain("%");
  });
});

describe("nextTip", () => {
  it("sends the brief and what was heard, and cleans up the reply", async () => {
    const model = fakeModel(tip({ say: "  Could you\nlower my rate?  ", avoid: "" }));
    const result = await nextTip(brief, [], ["Card services, how can I help?"], model.ask);
    expect(result).toMatchObject({ say: "Could you lower my rate?", avoid: null, stage: "opening", offers: [] });
    expect(model.requests[0].system).toBe(COACH_INSTRUCTIONS);
    expect(model.requests[0].user).toContain('"text":"Card services, how can I help?"');
  });

  it("counts an offer the bank made to the agent before the handoff", async () => {
    const ask = brief.askAprBps! / 100;
    const earlier = transcript(["agent", "Hello."], ["bank", `I can lower it to ${ask}%.`]);
    const result = await nextTip(brief, earlier, [], fakeModel(tip({ offers: { ...none, aprPercent: ask } })).ask);
    expect(result.offers).toEqual([{ kind: "apr", value: brief.askAprBps, verdict: "good" }]);
  });
});

describe("POST /api/coach", () => {
  it("answers with a tip", async () => {
    const response = await handleCoach(post("/api/coach", { brief, earlier: [], heard: [] }), fakeModel(tip()).ask);
    expect(response.status).toBe(200);
    expect((await response.json()).tip.say).toBe("Could you lower my rate?");
  });

  it("refuses a bad body and a reply in the wrong shape", async () => {
    expect((await handleCoach(post("/api/coach", { brief, heard: "x" }), fakeModel(tip()).ask)).status).toBe(400);
    expect((await handleCoach(post("/api/coach", { brief, earlier: [], heard: [] }), fakeModel({ say: 1 }).ask)).status).toBe(500);
  });
});
