// Helpers for route handlers: one JSON shape for errors, no caching, and a small rate limiter.
import type { ApiError, Capabilities } from "@/lib/types";

const NO_STORE = { "Cache-Control": "no-store" };

export type ProblemCode =
  | "not_configured"
  | "bad_request"
  | "too_large"
  | "unsupported"
  | "unreadable"
  | "rate_limited"
  | "failed";

const STATUS: Record<ProblemCode, number> = {
  not_configured: 503,
  bad_request: 400,
  too_large: 413,
  unsupported: 415,
  unreadable: 422,
  rate_limited: 429,
  failed: 500,
};

export function ok<T>(data: T): Response {
  return Response.json(data, { headers: NO_STORE });
}

/** An error the page can show as is: `{ error, code }`. */
export function problem(code: ProblemCode, message: string): Response {
  const body: ApiError = { error: message, code };
  return Response.json(body, { status: STATUS[code], headers: NO_STORE });
}

/** The request body as a plain object. Empty or invalid JSON becomes {}. */
export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const data: unknown = await request.json();
    return data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

const hits = new Map<string, number[]>();

/**
 * Sliding-window limit per client IP and bucket. Returns true when the request may proceed.
 * In memory, so it is per server instance: enough to stop one open tab from burning the API budget,
 * not a substitute for a spend cap on the provider side.
 */
export function allow(request: Request, bucket: string, limit: number, windowMs: number): boolean {
  const key = `${bucket}:${clientKey(request)}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return true;
}

/** Which parts of the product the server's keys switch on. */
export function capabilities(): Capabilities {
  const claude = Boolean(process.env.ANTHROPIC_API_KEY);
  return {
    reading: claude,
    negotiation: claude,
    voice: Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_AGENT_ID),
    payments: Boolean(process.env.STRIPE_SECRET_KEY),
  };
}

/** The Claude model for every call. Override with ANTHROPIC_MODEL. */
export function claudeModel(): string {
  return process.env.ANTHROPIC_MODEL || "claude-opus-5-5";
}
