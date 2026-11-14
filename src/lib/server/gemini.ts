// The Gemini API over plain fetch: one call that returns JSON following a schema. Server only.
// Used when the server has GEMINI_API_KEY and no ANTHROPIC_API_KEY (see aiProvider in http.ts).
import type { ProblemCode } from "@/lib/server/http";

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

export function geminiModel(): string {
  // 3.5 Flash accepts the "minimal" thinking level that live turns use; newer Flash models refuse it.
  return process.env.GEMINI_MODEL || "gemini-3.5-flash";
}

/** A file sent alongside the text: a PDF or an image. */
export type GeminiFile = { mediaType: string; bytes: Uint8Array };

export type GeminiJsonRequest = {
  system: string;
  user: string;
  /** JSON schema of the reply. */
  schema: Record<string, unknown>;
  maxTokens: number;
  file?: GeminiFile;
  /** How much the model reasons before answering. Unset uses the model default. "minimal" for live turns. */
  thinkingLevel?: "minimal" | "low" | "medium" | "high";
  /** For tests. */
  fetchImpl?: typeof fetch;
};

/** A failed call, already sorted into the codes our routes return. The provider's text stays in the log. */
export class GeminiError extends Error {
  constructor(
    readonly code: ProblemCode,
    readonly detail: string,
  ) {
    super(detail);
    this.name = "GeminiError";
  }
}

type GenerateResponse = {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
};

function codeForStatus(status: number): ProblemCode {
  if (status === 401 || status === 403) return "not_configured";
  if (status === 429) return "rate_limited";
  if (status === 400 || status === 413) return "unreadable";
  return "failed";
}

/** Ask Gemini for one JSON value that follows the schema. Rejects with GeminiError. */
export async function askGeminiJson(request: GeminiJsonRequest): Promise<unknown> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new GeminiError("not_configured", "GEMINI_API_KEY is not set.");

  const parts: Record<string, unknown>[] = [];
  if (request.file) {
    parts.push({ inlineData: { mimeType: request.file.mediaType, data: Buffer.from(request.file.bytes).toString("base64") } });
  }
  parts.push({ text: request.user });

  const body = {
    systemInstruction: { parts: [{ text: request.system }] },
    contents: [{ role: "user", parts }],
    generationConfig: {
      responseMimeType: "application/json",
      responseJsonSchema: request.schema,
      // Room for the model's own reasoning plus the reply.
      maxOutputTokens: request.maxTokens + 8000,
      ...(request.thinkingLevel ? { thinkingConfig: { thinkingLevel: request.thinkingLevel } } : {}),
    },
  };

  const doFetch = request.fetchImpl ?? fetch;
  let response: Response;
  try {
    response = await doFetch(`${ENDPOINT}/${geminiModel()}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    });
  } catch (error) {
    throw new GeminiError("failed", `request failed: ${error instanceof Error ? error.name : "unknown"}`);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new GeminiError(codeForStatus(response.status), `status ${response.status}: ${text.slice(0, 300)}`);
  }

  const data = (await response.json().catch(() => null)) as GenerateResponse | null;
  if (data?.promptFeedback?.blockReason) {
    throw new GeminiError("failed", `blocked: ${data.promptFeedback.blockReason}`);
  }
  const candidate = data?.candidates?.[0];
  if (!candidate || candidate.finishReason !== "STOP") {
    throw new GeminiError("failed", `did not finish: ${candidate?.finishReason ?? "no candidate"}`);
  }
  const text = (candidate.content?.parts ?? [])
    .filter((part) => !part.thought && typeof part.text === "string")
    .map((part) => part.text)
    .join("");
  try {
    return JSON.parse(text);
  } catch {
    throw new GeminiError("failed", "the reply was not JSON");
  }
}
