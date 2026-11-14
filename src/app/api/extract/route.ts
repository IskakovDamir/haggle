import { allow, ok, problem } from "@/lib/server/http";
import { StatementError } from "@/lib/statement/errors";
import { extractStatement } from "@/lib/statement/extract";
import { readStatementUpload } from "@/lib/statement/upload";

// Reading a multi-page PDF can take a while; give the function room past the 45 s model timeout.
export const maxDuration = 60;

// POST multipart form-data with `file` (PDF, PNG, JPEG or WebP, 4 MB at most): { extraction }.
// Sample statements are posted here like any upload, with `source=sample` so the page can badge them.
// The file is held in memory for this one request and is not stored.
export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return problem("not_configured", "Statement reading is not set up on this server. You can type the numbers instead.");
  }
  if (!allow(request, "extract", 10, 60_000)) {
    return problem("rate_limited", "That is a lot of statements in one minute. Wait a moment and try again.");
  }

  try {
    const upload = await readStatementUpload(request);
    const extraction = await extractStatement(upload.file);
    return ok({ extraction: { ...extraction, source: upload.source } });
  } catch (error) {
    if (error instanceof StatementError) return problem(error.code, error.message);
    console.error("[extract] unexpected error:", error instanceof Error ? error.name : typeof error);
    return problem("failed", "We could not read the statement this time. Try again, or type the numbers.");
  }
}
