import { describe, expect, it } from "vitest";
import { spokenVoiceId, AGENT_VOICES, SPANISH_AGENT_VOICES } from "@/lib/voice/voices";
import { buildBrief, openingLine, systemPrompt } from "./index";
import { lever, mariaChase } from "./test-support";

const english = buildBrief({ card: mariaChase, holderFirstName: "Maria", lever: lever("apr_reduction", mariaChase.id) });
const spanish = buildBrief({ card: mariaChase, holderFirstName: "Maria", lever: lever("apr_reduction", mariaChase.id), language: "es" });

describe("a call in Spanish", () => {
  it("leaves English calls exactly as they were", () => {
    expect(english.language).toBeUndefined();
    expect(openingLine(english)).toMatch(/^Hello\. This is Haggle, an AI assistant/);
    expect(systemPrompt(english)).not.toContain("LANGUAGE");
  });

  it("gives the disclosures and the opening line in Spanish", () => {
    expect(spanish.language).toBe("es");
    const line = openingLine(spanish);
    expect(line).toContain("asistente de inteligencia artificial");
    expect(line).toContain("Esta llamada está siendo grabada.");
    expect(line).toContain("para pedir una tasa de interés más baja");
  });

  it("keeps the facts and the rules, and tells the agent to speak Spanish", () => {
    const prompt = systemPrompt(spanish);
    expect(prompt).toContain("This call is in Spanish.");
    for (const fact of spanish.facts) expect(prompt).toContain(`- ${fact}`);
    expect(spanish.facts).toEqual(english.facts);
  });

  it("speaks with the Spanish voice that matches the one picked", () => {
    expect(spokenVoiceId(AGENT_VOICES.male.id, "es")).toBe(SPANISH_AGENT_VOICES.male.id);
    expect(spokenVoiceId(AGENT_VOICES.female.id, "es")).toBe(SPANISH_AGENT_VOICES.female.id);
    expect(spokenVoiceId(AGENT_VOICES.male.id, "en")).toBe(AGENT_VOICES.male.id);
    expect(spokenVoiceId(undefined, "es")).toBeUndefined();
  });
});
