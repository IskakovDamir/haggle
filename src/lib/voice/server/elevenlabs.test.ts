// The ElevenLabs REST calls with a fake fetch. Nothing here touches the network.
import { describe, expect, it } from "vitest";
import { DEFAULT_AGENT_LLM, agentConfig } from "../agent-config";
import { ElevenLabsError, createAgent, mintConversationToken, updateAgent, type Fetch } from "./elevenlabs";

type Sent = { url: string; method?: string; headers?: HeadersInit; body: unknown };

function fakeFetch(status: number, answer: unknown) {
  const sent: Sent[] = [];
  const fetcher: Fetch = async (input, init) => {
    sent.push({
      url: String(input),
      method: init?.method,
      headers: init?.headers,
      body: typeof init?.body === "string" ? JSON.parse(init.body) : undefined,
    });
    return Response.json(answer, { status });
  };
  return { fetcher, sent };
}

const config = agentConfig({ llm: DEFAULT_AGENT_LLM });

describe("mintConversationToken", () => {
  it("asks for a token for the agent, with the key in the xi-api-key header", async () => {
    const { fetcher, sent } = fakeFetch(200, { token: "abc", conversation_id: "conv_1" });
    expect(await mintConversationToken({ apiKey: "key", agentId: "agent 1" }, fetcher)).toBe("abc");
    expect(sent).toEqual([
      {
        url: "https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=agent%201",
        method: "GET",
        headers: { "xi-api-key": "key" },
        body: undefined,
      },
    ]);
  });

  it("fails when the answer has no token", async () => {
    await expect(mintConversationToken({ apiKey: "key", agentId: "agent_1" }, fakeFetch(200, {}).fetcher)).rejects.toThrow('no "token"');
  });

  it("turns an error status into an ElevenLabsError with the service's own words", async () => {
    const { fetcher } = fakeFetch(401, { detail: { status: "invalid_api_key", message: "Invalid API key" } });
    const error = await mintConversationToken({ apiKey: "key", agentId: "agent_1" }, fetcher).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ElevenLabsError);
    expect(error).toMatchObject({ status: 401, detail: "Invalid API key" });
  });
});

describe("createAgent and updateAgent", () => {
  it("creates with POST /v1/convai/agents/create and returns the new id", async () => {
    const { fetcher, sent } = fakeFetch(200, { agent_id: "agent_new" });
    expect(await createAgent("key", config, fetcher)).toBe("agent_new");
    expect(sent[0]).toMatchObject({
      url: "https://api.elevenlabs.io/v1/convai/agents/create",
      method: "POST",
      headers: { "xi-api-key": "key", "Content-Type": "application/json" },
      body: config,
    });
  });

  it("updates with PATCH /v1/convai/agents/{id}", async () => {
    const { fetcher, sent } = fakeFetch(200, { agent_id: "agent_old", name: "Haggle negotiator" });
    expect(await updateAgent("key", "agent_old", config, fetcher)).toBe("agent_old");
    expect(sent[0]).toMatchObject({ url: "https://api.elevenlabs.io/v1/convai/agents/agent_old", method: "PATCH", body: config });
  });

  it("keeps a validation error readable", async () => {
    const detail = [{ loc: ["body", "conversation_config", "agent", "prompt", "llm"], msg: "Input should be a known model", type: "enum" }];
    const error = await createAgent("key", config, fakeFetch(422, { detail }).fetcher).catch((e: unknown) => e);
    expect(error).toMatchObject({ status: 422 });
    expect((error as ElevenLabsError).detail).toContain("Input should be a known model");
  });
});
