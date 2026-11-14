import { describe, expect, it } from "vitest";
import { VOICE_PROBLEM, microphoneProblem } from "./problems";
import { endReasonFrom, turnFromMessage } from "./transcript";

describe("turnFromMessage", () => {
  it("makes the human at the microphone the bank", () => {
    expect(turnFromMessage({ role: "user", message: "I can offer 19.99%." }, 4200)).toEqual({
      role: "bank",
      text: "I can offer 19.99%.",
      at: 4200,
    });
  });

  it("keeps the agent as the agent", () => {
    expect(turnFromMessage({ role: "agent", message: "Thank you. To confirm, 19.99%?" }, 9000)?.role).toBe("agent");
  });

  it("puts the text on one trimmed line", () => {
    expect(turnFromMessage({ role: "user", message: "  Let me\ncheck   that. " }, 0)?.text).toBe("Let me check that.");
  });

  it("rounds the time to whole milliseconds and never goes below zero", () => {
    expect(turnFromMessage({ role: "user", message: "Hello." }, 1234.56)?.at).toBe(1235);
    expect(turnFromMessage({ role: "user", message: "Hello." }, -3)?.at).toBe(0);
  });

  it.each(["", "   ", "...", "…", "?!"])("drops %j: nothing was said", (message) => {
    expect(turnFromMessage({ role: "user", message }, 100)).toBeNull();
  });

  it("keeps a turn that is only a number", () => {
    expect(turnFromMessage({ role: "user", message: "19.99" }, 100)?.text).toBe("19.99");
  });
});

describe("endReasonFrom", () => {
  it("passes on who hung up", () => {
    expect(endReasonFrom({ reason: "user" }, 4)).toBe("user");
    expect(endReasonFrom({ reason: "agent", context: { type: "close" } }, 4)).toBe("agent");
  });

  it("reports a dropped connection as an error", () => {
    expect(endReasonFrom({ reason: "error", context: { type: "connection_state_changed" } }, 4)).toBe("error");
    expect(endReasonFrom({ reason: "error" }, 0)).toBe("error");
  });

  it("treats the five-minute limit as a normal end, not a failure", () => {
    expect(endReasonFrom({ reason: "error", context: { type: "max_duration_exceeded" } }, 4)).toBe("agent");
  });

  it("treats the agent's side closing a silent call as a failure to start", () => {
    expect(endReasonFrom({ reason: "agent", context: { type: "close" } }, 0)).toBe("error");
  });

  it("lets the visitor hang up a silent call without calling it a failure", () => {
    expect(endReasonFrom({ reason: "user" }, 0)).toBe("user");
  });
});

describe("microphoneProblem", () => {
  const named = (name: string) => Object.assign(new Error("x"), { name });

  it.each([
    ["NotAllowedError", VOICE_PROBLEM.microphoneBlocked],
    ["SecurityError", VOICE_PROBLEM.microphoneBlocked],
    ["NotFoundError", VOICE_PROBLEM.microphoneMissing],
    ["NotSupportedError", VOICE_PROBLEM.microphoneUnsupported],
    ["NotReadableError", VOICE_PROBLEM.microphoneBusy],
  ])("%s", (name, sentence) => {
    expect(microphoneProblem(named(name))).toBe(sentence);
  });

  it("has a sentence for anything else", () => {
    expect(microphoneProblem("boom")).toBe(VOICE_PROBLEM.microphoneBusy);
  });
});

describe("the sentences a visitor reads", () => {
  it("are plain sentences without dashes", () => {
    for (const sentence of Object.values(VOICE_PROBLEM)) {
      expect(sentence).not.toMatch(/[—–]/);
      expect(sentence.endsWith(".")).toBe(true);
    }
  });

  it("offer typing whenever a voice call could not start or dropped", () => {
    const { noBrief, ...callProblems } = VOICE_PROBLEM;
    expect(noBrief).not.toContain("type");
    for (const sentence of Object.values(callProblems)) expect(sentence.toLowerCase()).toContain("type the call instead");
  });
});
