import { describe, expect, it } from "vitest";
import { openingLine, systemPrompt } from "@/lib/negotiator";
import { AGENT_FIRST_MESSAGE, PINNED_RULES, agentPrompt, placeholdersIn } from "./agent-prompt";
import { MAX_VARIABLES_BYTES, dynamicVariablesFor, variablesBytes } from "./dynamic-variables";
import { mariaBrief } from "./test-support";

describe("dynamicVariablesFor", () => {
  const brief = mariaBrief();
  const variables = dynamicVariablesFor(brief);

  it("fills exactly the variables the agent's prompt and first message use", () => {
    const used = placeholdersIn(agentPrompt(PINNED_RULES) + AGENT_FIRST_MESSAGE);
    expect(Object.keys(variables).sort()).toEqual([...used].sort());
  });

  it("gives the voice agent the same instructions and opening line as the typed call", () => {
    expect(variables.call_instructions).toBe(systemPrompt(brief));
    expect(variables.opening_line).toBe(openingLine(brief));
  });

  it("carries this call's facts and nobody else's", () => {
    expect(variables.call_instructions).toContain("27.24%");
    expect(variables.opening_line).toContain("Maria");

    const other = dynamicVariablesFor(mariaBrief({ holderFirstName: "Sam", goal: "annual_fee_waiver", annualFeeCents: 9500 }));
    expect(other.call_instructions).toContain("$95");
    expect(other.call_instructions).not.toBe(variables.call_instructions);
  });

  it("leaves no placeholder for ElevenLabs to stumble on", () => {
    expect(placeholdersIn(variables.call_instructions + variables.opening_line)).toEqual([]);
  });

  it("fits the budget for one WebRTC data message with room to spare", () => {
    expect(variablesBytes(variables)).toBeLessThan(MAX_VARIABLES_BYTES * 0.75);
  });
});

describe("variablesBytes", () => {
  it("counts UTF-8 bytes of the JSON, not characters", () => {
    expect(variablesBytes({ a: "é" })).toBe(new TextEncoder().encode('{"a":"é"}').length);
    expect(variablesBytes({ a: "é" })).toBe(10);
  });
});
