// The upload checks that run before any model call: one file, 4 MB at most, and really a PDF or an
// image. The type comes from the file's first bytes, not from the name or the browser's label.
import type { Extraction } from "@/lib/types";
import { StatementError } from "./errors";

export const MAX_STATEMENT_BYTES = 4 * 1024 * 1024;

export const STATEMENT_MEDIA_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"] as const;
export type StatementMediaType = (typeof STATEMENT_MEDIA_TYPES)[number];

/** For the file input's `accept` attribute. */
export const STATEMENT_ACCEPT = STATEMENT_MEDIA_TYPES.join(",");

export type StatementFile = { bytes: Uint8Array; mediaType: string };

export type StatementUpload = {
  file: { bytes: Uint8Array; mediaType: StatementMediaType };
  /** "sample" when the page says it sent one of our sample PDFs. It only drives the sample badge. */
  source: Extract<Extraction["source"], "upload" | "sample">;
};

const startsWith = (bytes: Uint8Array, signature: number[], offset = 0) =>
  signature.every((byte, index) => bytes[offset + index] === byte);

/** Reads the file signature. Null when the bytes are not one of the four types we accept. */
export function sniffMediaType(bytes: Uint8Array): StatementMediaType | null {
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return "application/pdf"; // %PDF-
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  const riff = startsWith(bytes, [0x52, 0x49, 0x46, 0x46]); // RIFF....WEBP
  if (riff && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return "image/webp";
  return null;
}

const TOO_LARGE = "That file is larger than 4 MB. Upload a smaller PDF or a photo of the first page.";
const UNSUPPORTED = "Upload a PDF, or a PNG, JPEG or WebP photo of the statement.";

/**
 * Takes the `file` out of a multipart request and checks it.
 * Throws a StatementError with `too_large` or `unsupported`; nothing is sent anywhere from here.
 */
export async function readStatementUpload(request: Request): Promise<StatementUpload> {
  // A multipart body is a little larger than its file, so this only stops clearly oversized requests
  // before they are read into memory. The exact check on the file follows.
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_STATEMENT_BYTES + 64 * 1024) throw new StatementError("too_large", TOO_LARGE);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw new StatementError("unsupported", UNSUPPORTED);
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) throw new StatementError("unsupported", UNSUPPORTED);
  if (file.size > MAX_STATEMENT_BYTES) throw new StatementError("too_large", TOO_LARGE);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mediaType = sniffMediaType(bytes);
  if (!mediaType) throw new StatementError("unsupported", UNSUPPORTED);

  return { file: { bytes, mediaType }, source: form.get("source") === "sample" ? "sample" : "upload" };
}
