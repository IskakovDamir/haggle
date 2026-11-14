// The browser's side of statement reading: get the file ready, send it to POST /api/extract, and turn
// whatever comes back into either an Extraction or one plain sentence. A sample statement is fetched
// as a file and sent through the very same request as an upload.
import type { SampleStatement } from "@/lib/statement/samples";
import { MAX_STATEMENT_BYTES } from "@/lib/statement/upload";
import type { ApiError, Extraction } from "@/lib/types";
import { sampleCardId } from "./sample-cards";
import { photoAsJpeg } from "./shrink-photo";

export type ReadingJob = { kind: "file"; file: File } | { kind: "sample"; sample: SampleStatement };

/** Where a reading is right now. `sent` is the uploaded share, from 0 to 1. */
export type ReadingProgress = { phase: "preparing" } | { phase: "uploading"; sent: number } | { phase: "reading" };

export type ReadingResult =
  | { ok: true; extraction: Extraction }
  | { ok: false; cancelled: true }
  | { ok: false; cancelled: false; message: string };

/** The server gives a reading up to 60 seconds. Past this the request is lost, not slow. */
const TIMEOUT_MS = 75_000;

const TOO_LARGE = "That file is larger than 4 MB. Upload a smaller PDF or a photo of the first page.";
const UNSUPPORTED = "Upload a PDF, or a photo of the statement.";
const PHOTO_UNREADABLE = "We could not open that photo. Try a JPEG or PNG, or upload the PDF.";
const SAMPLE_MISSING = "We could not load that sample. Try another one, or type the numbers.";
const OFFLINE = "We could not reach the server. Check your connection and try again.";
const FAILED = "We could not read the statement this time. Try again, or type the numbers.";

/** A problem with a sentence the page can print as is. */
class ReadingProblem extends Error {}

type PreparedFile = { blob: Blob; name: string };

/** A PDF goes as it is. A photo is scaled down and re-encoded first. */
async function prepareFile(file: File): Promise<PreparedFile> {
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  if (isPdf) {
    if (file.size > MAX_STATEMENT_BYTES) throw new ReadingProblem(TOO_LARGE);
    return { blob: file, name: file.name };
  }
  if (!file.type.startsWith("image/")) throw new ReadingProblem(UNSUPPORTED);

  let jpeg: Blob;
  try {
    jpeg = await photoAsJpeg(file);
  } catch {
    throw new ReadingProblem(PHOTO_UNREADABLE);
  }
  if (jpeg.size > MAX_STATEMENT_BYTES) throw new ReadingProblem(TOO_LARGE);
  return { blob: jpeg, name: "statement.jpg" };
}

async function fetchSample(sample: SampleStatement, signal: AbortSignal): Promise<PreparedFile> {
  let response: Response;
  try {
    response = await fetch(sample.file, { signal });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new ReadingProblem(OFFLINE);
  }
  if (!response.ok) throw new ReadingProblem(SAMPLE_MISSING);
  return { blob: await response.blob(), name: `${sample.id}.pdf` };
}

type ServerAnswer = { status: number; body: unknown };

/**
 * POST multipart to /api/extract. XMLHttpRequest instead of fetch, because only it reports how much
 * of the upload has been sent, and on a phone connection that is most of the wait for a photo.
 */
function postStatement(
  form: FormData,
  onProgress: (progress: ReadingProgress) => void,
  signal: AbortSignal,
): Promise<ServerAnswer> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/extract");
    request.timeout = TIMEOUT_MS;

    request.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) onProgress({ phase: "uploading", sent: event.loaded / event.total });
    };
    // The whole file has left the browser: from here the wait is the model reading it.
    request.upload.onload = () => onProgress({ phase: "reading" });

    request.onload = () => {
      let body: unknown = null;
      try {
        body = JSON.parse(request.responseText);
      } catch {
        // A proxy's HTML error page, or an empty body. The status alone decides the sentence.
      }
      resolve({ status: request.status, body });
    };
    request.onerror = () => reject(new ReadingProblem(OFFLINE));
    request.ontimeout = () => reject(new ReadingProblem(FAILED));
    request.onabort = () => reject(new DOMException("Reading cancelled", "AbortError"));

    signal.addEventListener("abort", () => request.abort(), { once: true });
    request.send(form);
  });
}

function isApiError(body: unknown): body is ApiError {
  return typeof body === "object" && body !== null && typeof (body as ApiError).error === "string";
}

function extractionIn(body: unknown): Extraction | null {
  if (typeof body !== "object" || body === null) return null;
  const extraction = (body as { extraction?: Partial<Extraction> }).extraction;
  const complete = extraction && typeof extraction.card === "object" && extraction.card !== null && Array.isArray(extraction.warnings);
  return complete ? (extraction as Extraction) : null;
}

/** The server's answer as an Extraction, or the sentence it sent in `{ error, code }`. */
function extractionFrom(answer: ServerAnswer): Extraction {
  const extraction = answer.status === 200 ? extractionIn(answer.body) : null;
  if (extraction) return extraction;
  if (isApiError(answer.body)) throw new ReadingProblem(answer.body.error);
  // 413 with no JSON body is the hosting platform refusing the request before our route ran.
  throw new ReadingProblem(answer.status === 413 ? TOO_LARGE : FAILED);
}

/**
 * Reads one statement. Never throws: every failure is a sentence, and a cancelled reading says so.
 * A card read from a sample gets the sample's own id, see sample-cards.ts.
 */
export async function readStatement(
  job: ReadingJob,
  onProgress: (progress: ReadingProgress) => void,
  signal: AbortSignal,
): Promise<ReadingResult> {
  try {
    const prepared = job.kind === "file" ? await prepareFile(job.file) : await fetchSample(job.sample, signal);
    if (signal.aborted) return { ok: false, cancelled: true };

    const form = new FormData();
    form.append("file", prepared.blob, prepared.name);
    form.append("source", job.kind === "sample" ? "sample" : "upload");
    onProgress({ phase: "uploading", sent: 0 });

    const extraction = extractionFrom(await postStatement(form, onProgress, signal));
    if (job.kind === "file") return { ok: true, extraction };
    return {
      ok: true,
      extraction: { ...extraction, source: "sample", card: { ...extraction.card, id: sampleCardId(job.sample.id) } },
    };
  } catch (error) {
    if (signal.aborted) return { ok: false, cancelled: true };
    return { ok: false, cancelled: false, message: error instanceof ReadingProblem ? error.message : FAILED };
  }
}
