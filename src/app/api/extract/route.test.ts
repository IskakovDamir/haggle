// POST /api/extract with the model call replaced by a mock: what is checked, and in which order.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StatementError } from "@/lib/statement/errors";
import { extractStatement } from "@/lib/statement/extract";
import { extractionFromManual } from "@/lib/statement/manual";
import { MAX_STATEMENT_BYTES } from "@/lib/statement/upload";
import { POST } from "./route";

vi.mock("@/lib/statement/extract", () => ({ extractStatement: vi.fn() }));
const modelCall = vi.mocked(extractStatement);

const PDF_BYTES = new TextEncoder().encode("%PDF-1.7\nsample");
const READ_CARD = extractionFromManual({ issuerName: "Chase", balance: "8400", purchaseApr: "27.24" }, "card-1");

let visitor = 0;

/** A multipart request from a visitor of its own, so one test's requests never count against another's limit. */
function upload(bytes: Uint8Array, fields: Record<string, string> = {}, ip = `203.0.113.${++visitor}`): Request {
  const form = new FormData();
  form.set("file", new File([new Uint8Array(bytes)], "statement.pdf", { type: "application/pdf" }));
  for (const [name, value] of Object.entries(fields)) form.set(name, value);
  return new Request("http://localhost/api/extract", { method: "POST", body: form, headers: { "x-forwarded-for": ip } });
}

beforeEach(() => {
  vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
  modelCall.mockResolvedValue({ ...READ_CARD, source: "upload" });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});

describe("POST /api/extract", () => {
  it("returns the extraction for a PDF", async () => {
    const response = await POST(upload(PDF_BYTES));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = await response.json();
    expect(body.extraction.card).toEqual(READ_CARD.card);
    expect(body.extraction.source).toBe("upload");
    expect(modelCall).toHaveBeenCalledWith({ bytes: PDF_BYTES, mediaType: "application/pdf" });
  });

  it("marks a sample statement as a sample and reads it the same way", async () => {
    const response = await POST(upload(PDF_BYTES, { source: "sample" }));

    expect((await response.json()).extraction.source).toBe("sample");
    expect(modelCall).toHaveBeenCalledTimes(1);
  });

  it("answers not_configured without a key, before reading anything", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const response = await POST(upload(PDF_BYTES));

    expect(response.status).toBe(503);
    expect((await response.json()).code).toBe("not_configured");
    expect(modelCall).not.toHaveBeenCalled();
  });

  it("refuses a file over 4 MB without calling the model", async () => {
    const big = new Uint8Array(MAX_STATEMENT_BYTES + 1);
    big.set(PDF_BYTES);
    const response = await POST(upload(big));

    expect(response.status).toBe(413);
    expect((await response.json()).code).toBe("too_large");
    expect(modelCall).not.toHaveBeenCalled();
  });

  it("refuses a file that is not a PDF or an image without calling the model", async () => {
    const response = await POST(upload(new TextEncoder().encode("balance: 8400")));

    expect(response.status).toBe(415);
    expect((await response.json()).code).toBe("unsupported");
    expect(modelCall).not.toHaveBeenCalled();
  });

  it("passes on the reason when the document could not be read", async () => {
    modelCall.mockRejectedValue(new StatementError("unreadable", "This does not look like a credit card statement."));
    const response = await POST(upload(PDF_BYTES));

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      error: "This does not look like a credit card statement.",
      code: "unreadable",
    });
  });

  it("answers failed, with no detail, on an unexpected error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    modelCall.mockRejectedValue(new Error("socket hang up at 10.0.0.5"));
    const response = await POST(upload(PDF_BYTES));

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.code).toBe("failed");
    expect(body.error).not.toContain("socket");
  });

  it("allows ten statements a minute from one visitor and refuses the eleventh", async () => {
    const ip = "198.51.100.7";
    for (let request = 0; request < 10; request++) {
      expect((await POST(upload(PDF_BYTES, {}, ip))).status).toBe(200);
    }
    const response = await POST(upload(PDF_BYTES, {}, ip));

    expect(response.status).toBe(429);
    expect((await response.json()).code).toBe("rate_limited");
    expect(modelCall).toHaveBeenCalledTimes(10);
  });
});
