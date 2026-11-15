import { createHash } from "node:crypto";
import { connection } from "next/server";

// POST: one line in the server log per page a visitor opens, so the team can tell when someone new is
// trying the product. The IP is never logged, only the first 8 hex digits of its hash.
export async function POST(request: Request) {
  await connection();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  const visitor = createHash("sha256").update(`haggle:${ip}`).digest("hex").slice(0, 8);
  let path = "";
  try {
    const body = (await request.json()) as { path?: unknown };
    path = typeof body.path === "string" ? body.path.slice(0, 80) : "";
  } catch {
    // No body: log the visit anyway.
  }
  const agent = (request.headers.get("user-agent") ?? "").match(/(iPhone|Android|Macintosh|Windows|Linux)/)?.[1] ?? "other";
  console.info(`[seen] visitor=${visitor} device=${agent} path=${path}`);
  return new Response(null, { status: 204 });
}
