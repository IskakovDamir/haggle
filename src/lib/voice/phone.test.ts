import { describe, expect, it } from "vitest";
import { allowedNumbers, maskNumber, readConversation, toE164 } from "./phone";

describe("toE164", () => {
  it.each([
    ["(555) 234-5678", "+15552345678"],
    ["555.234.5678", "+15552345678"],
    ["1 555 234 5678", "+15552345678"],
    ["+1 555 234 5678", "+15552345678"],
    ["+7 701 234 5678", "+77012345678"],
  ])("reads %s", (typed, e164) => {
    expect(toE164(typed)).toBe(e164);
  });

  it.each(["", "12345", "055 234 5678", "+12", "call me"])("refuses %s", (typed) => {
    expect(toE164(typed)).toBeNull();
  });
});

describe("allowedNumbers", () => {
  it("reads a list in any common spelling and drops junk", () => {
    expect([...allowedNumbers("(555) 234-5678, +77012345678, nope")]).toEqual(["+15552345678", "+77012345678"]);
  });

  it("is empty when nothing is set", () => {
    expect(allowedNumbers(undefined).size).toBe(0);
  });
});

describe("maskNumber", () => {
  it("keeps the last four digits only", () => {
    expect(maskNumber("+15552345678")).toBe("•••• 5678");
  });
});

describe("readConversation", () => {
  const transcript = [
    { role: "agent", message: "Hello. This is Haggle, an AI assistant.", time_in_call_secs: 0 },
    { role: "user", message: "Hi, how can I help?", time_in_call_secs: 4 },
    { role: "agent", message: null, time_in_call_secs: 6 },
    { role: "user", message: "...", time_in_call_secs: 7 },
  ];

  it("maps the person who answered to the bank and skips empty lines", () => {
    const read = readConversation({ status: "in-progress", transcript });
    expect(read.status).toBe("live");
    expect(read.turns).toEqual([
      { role: "agent", text: "Hello. This is Haggle, an AI assistant.", at: 0 },
      { role: "bank", text: "Hi, how can I help?", at: 4000 },
    ]);
  });

  it("follows the call from ringing to done", () => {
    expect(readConversation({ status: "initiated" }).status).toBe("dialing");
    expect(readConversation({}).status).toBe("dialing");
    expect(readConversation({ status: "processing", transcript }).status).toBe("wrapping");
    expect(readConversation({ status: "done", transcript, metadata: { phone_call: { call_result: "answered" } } }).status).toBe("done");
  });

  it("says why when nobody answered", () => {
    const noAnswer = readConversation({
      status: "done",
      transcript: [transcript[0]],
      metadata: { phone_call: { call_result: "no_answer" } },
    });
    expect(noAnswer).toMatchObject({ status: "failed", reason: "Nobody picked up." });
    expect(readConversation({ status: "failed" })).toMatchObject({ status: "failed", reason: "The call could not be connected." });
    // ElevenLabs can leave an unanswered call at "initiated".
    expect(readConversation({ status: "initiated", metadata: { phone_call: { call_result: "no_answer" } } })).toMatchObject({
      status: "failed",
      reason: "Nobody picked up.",
    });
  });
});
