import { describe, expect, it } from "vitest";
import { StatementError } from "./errors";
import { MAX_STATEMENT_BYTES, readStatementUpload, sniffMediaType } from "./upload";

const PDF_BYTES = new TextEncoder().encode("%PDF-1.7\nsample");
const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
const WEBP_BYTES = new TextEncoder().encode("RIFF\x10\x00\x00\x00WEBPVP8 ");

function uploadRequest(fields: Record<string, string | File>): Request {
  const form = new FormData();
  for (const [name, value] of Object.entries(fields)) form.set(name, value);
  return new Request("http://localhost/api/extract", { method: "POST", body: form });
}

const file = (bytes: Uint8Array, name: string, type: string) => new File([new Uint8Array(bytes)], name, { type });

async function codeOf(request: Request): Promise<string> {
  const error: unknown = await readStatementUpload(request).catch((thrown) => thrown);
  return error instanceof StatementError ? error.code : "no error";
}

describe("sniffMediaType", () => {
  it("recognizes the four accepted types by their first bytes", () => {
    expect(sniffMediaType(PDF_BYTES)).toBe("application/pdf");
    expect(sniffMediaType(PNG_BYTES)).toBe("image/png");
    expect(sniffMediaType(JPEG_BYTES)).toBe("image/jpeg");
    expect(sniffMediaType(WEBP_BYTES)).toBe("image/webp");
  });

  it("returns null for anything else", () => {
    expect(sniffMediaType(new TextEncoder().encode("<html>"))).toBeNull();
    expect(sniffMediaType(new Uint8Array())).toBeNull();
  });
});

describe("readStatementUpload", () => {
  it("returns the bytes with the type read from the file itself, not from its label", async () => {
    const upload = await readStatementUpload(uploadRequest({ file: file(PDF_BYTES, "photo.png", "image/png") }));
    expect(upload.file.mediaType).toBe("application/pdf");
    expect(upload.file.bytes).toEqual(PDF_BYTES);
    expect(upload.source).toBe("upload");
  });

  it("marks a sample only when the page says so", async () => {
    const upload = await readStatementUpload(
      uploadRequest({ file: file(PDF_BYTES, "maria-chase.pdf", "application/pdf"), source: "sample" }),
    );
    expect(upload.source).toBe("sample");
  });

  it("refuses a file over 4 MB", async () => {
    const big = new Uint8Array(MAX_STATEMENT_BYTES + 1);
    big.set(PDF_BYTES);
    expect(await codeOf(uploadRequest({ file: file(big, "big.pdf", "application/pdf") }))).toBe("too_large");
  });

  it("refuses a request that declares an oversized body before reading it", async () => {
    const request = new Request("http://localhost/api/extract", {
      method: "POST",
      headers: { "content-length": String(50 * 1024 * 1024), "content-type": "multipart/form-data; boundary=x" },
      body: "--x--",
    });
    expect(await codeOf(request)).toBe("too_large");
  });

  it("refuses a file that is not a PDF or an image, whatever it is called", async () => {
    const text = new TextEncoder().encode("balance: 8400");
    expect(await codeOf(uploadRequest({ file: file(text, "statement.pdf", "application/pdf") }))).toBe("unsupported");
  });

  it("refuses a request with no file, an empty file or no form at all", async () => {
    expect(await codeOf(uploadRequest({ note: "hello" }))).toBe("unsupported");
    expect(await codeOf(uploadRequest({ file: file(new Uint8Array(), "empty.pdf", "application/pdf") }))).toBe("unsupported");
    const json = new Request("http://localhost/api/extract", { method: "POST", body: JSON.stringify({ file: "x" }) });
    expect(await codeOf(json)).toBe("unsupported");
  });
});
