// A phone photo of a statement is several megabytes and far more pixels than a reader needs.
// Before upload the browser scales it down and re-encodes it as JPEG, which also keeps it under
// the 4 MB limit and drops the photo's metadata (location, device).

/** Claude's vision input gains nothing from a longer edge than this. */
export const MAX_PHOTO_EDGE = 1568;
const JPEG_QUALITY = 0.85;

/** The largest size with the same shape whose long edge is at most `maxEdge`. Never scales up. */
export function fitWithin(width: number, height: number, maxEdge: number): { width: number; height: number } {
  const longEdge = Math.max(width, height);
  if (longEdge <= maxEdge) return { width, height };
  const scale = maxEdge / longEdge;
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/**
 * Decodes an image the browser can open and returns it as a JPEG no larger than MAX_PHOTO_EDGE.
 * Rejects when the browser cannot decode the file (a HEIC photo on some systems, a damaged file).
 */
export async function photoAsJpeg(photo: Blob): Promise<Blob> {
  // "from-image" applies the camera's rotation, so a sideways phone photo arrives upright.
  const bitmap = await createImageBitmap(photo, { imageOrientation: "from-image" });
  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height, MAX_PHOTO_EDGE);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("no 2d canvas");
    // JPEG has no transparency: without this a transparent PNG would turn black.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("no jpeg"))), "image/jpeg", JPEG_QUALITY);
    });
  } finally {
    bitmap.close();
  }
}
