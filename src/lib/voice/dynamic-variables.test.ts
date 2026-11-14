import { describe, expect, it } from "vitest";
import { openingLine, systemPrompt } from "@/lib/negotiator";
import { AGENT_FIRST_MESSAGE, PINNED_RULES, agentPrompt, placeholdersIn } from "./agent-prompt";
import { agentConfig, transferToolFor } from "./agent-config";
import { MAX_VARIABLES_BYTES, dynamicVariablesFor, variablesBytes } from "./dynamic-variables";
import { mariaBrief } from "./test-support";

describe("dynamicVariablesFor", () => {
  const brief = mariaBrief();
  const variables = dynamicVariablesFor(brief);

  it("fills exactly the variables the agent's prompt and first message use", () => {
    const config = JSON.stringify(agentConfig({ llm: "test" }).conversation_config.agent.prompt.built_in_tools);
    const used = new Set([...placeholdersIn(agentPrompt(PINNED_RULES) + AGENT_FIRST_MESSAGE), ...placeholdersIn(config)]);
    expect(Object.keys(variables).sort()).toEqual([...used].sort());
  });

  it("writes a real number into the transfer tool, never a placeholder", () => {
    expect(transferToolFor(null).params.transfers).toEqual([]);
    const tool = transferToolFor("+15552345678");
    expect(tool.params.transfers[0].transfer_destination).toEqual({ type: "phone", phone_number: "+15552345678" });
    expect(placeholdersIn(JSON.stringify(tool))).toEqual([]);
  });

  it("gives the voice agent the same instructions and opening line as the typed call", () => {
    expect(variables.call_instructions.startsWith(systemPrompt(brief))).toBe(true);
    expect(variables.opening_line).toBe(openingLine(brief));
  });

  it("lets the agent connect the cardholder only when their phone was given", () => {
    expect(variables.call_instructions).toContain("Maria cannot be connected to this call.");
    const withPhone = dynamicVariablesFor(brief, { cardholderPhone: "+15552345678" });
    expect(withPhone.call_instructions).toContain("use the transfer_to_number tool");
    expect(withPhone.call_instructions).not.toContain("+15552345678");
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
