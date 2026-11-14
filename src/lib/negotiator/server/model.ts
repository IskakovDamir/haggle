// The one place this module talks to Claude. Server only: never import it from a client component.
// Handlers take the model as a parameter (AskModel), so tests pass a fake and never touch the network.
import Anthropic from "@anthropic-ai/sdk";
import { claudeModel, problem, type ProblemCode } from "@/lib/server/http";

export type JsonRequest = {
  system: string;
  user: string;
  /** JSON schema of the reply. Every object needs additionalProperties: false and all keys required. */
  schema: Record<string, unknown>;
  maxTokens: number;
};

/** Ask the model for one JSON value that follows the schema. Rejects with ModelError. */
export type AskModel = (request: JsonRequest) => Promise<unknown>;

/** A model call that failed, already translated into what the page may show. */
export class ModelError extends Error {
  constructor(
    readonly code: ProblemCode,
    message: string,
  ) {
    super(message);
    this.name = "ModelError";
  }
}

let client: Anthropic | null = null;

export const askClaude: AskModel = async ({ system, user, schema, maxTokens }) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new ModelError("not_configured", "The negotiator needs ANTHROPIC_API_KEY on the server. It is not set.");
  }
  client ??= new Anthropic({ timeout: 45_000, maxRetries: 1 });

  let message: Anthropic.Message;
  try {
    message = await client.messages.create({
      model: claudeModel(),
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
      // Low effort keeps a spoken turn fast. The schema makes the reply parseable; zod still checks it.
      output_config: { effort: "low", format: { type: "json_schema", schema } },
    });
  } catch (error) {
    throw fromProviderError(error);
  }
  return readJsonReply(message);
};

/** The JSON in a finished reply. A refusal or a reply cut off by the token limit is a failed call. */
export function readJsonReply(message: Pick<Anthropic.Message, "stop_reason" | "content">): unknown {
  if (message.stop_reason !== "end_turn") {
    throw new ModelError("failed", "The AI did not finish its answer. Try again.");
  }
  const text = message.content.flatMap((block) => (block.type === "text" ? [block.text] : [])).join("");
  try {
    return JSON.parse(text);
  } catch {
    throw new ModelError("failed", "The AI answered in a form we could not read. Try again.");
  }
}

/** Provider errors become our own codes and sentences. The provider's message never reaches the page. */
export function fromProviderError(error: unknown): ModelError {
  if (error instanceof ModelError) return error;
  if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
    return new ModelError("not_configured", "The server's Claude API key was not accepted.");
  }
  if (error instanceof Anthropic.RateLimitError) {
    return new ModelError("rate_limited", "The AI service is busy. Wait a moment and try again.");
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return new ModelError("failed", "We could not reach the AI service. Try again.");
  }
  if (error instanceof Anthropic.APIError) {
    return new ModelError("failed", "The AI service returned an error. Try again.");
  }
  return new ModelError("failed", "Something went wrong on our side. Try again.");
}

/** The response for a failed model call. Logs the cause on the server and sends only our own wording. */
export function modelProblem(route: string, error: unknown): Response {
  const { code, message } = fromProviderError(error);
  // A missing key is a known state of the deployment, not a failure worth a log line per request.
  if (code !== "not_configured" || !(error instanceof ModelError)) {
    console.error(`[${route}] model call failed:`, error instanceof Error ? `${error.name}: ${error.message}` : error);
  }
  return problem(code, message);
}
