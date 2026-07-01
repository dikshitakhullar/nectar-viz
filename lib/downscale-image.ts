/**
 * Client-side image downscale + JPEG re-encode, run before upload.
 *
 * Why: Vercel serverless functions reject request bodies over ~4.5MB with
 * HTTP 413 (FUNCTION_PAYLOAD_TOO_LARGE) *before* the function runs, so a
 * server-side resize can't help — the shrink must happen in the browser.
 * Re-encoding to JPEG also converts HEIC (iPhone) into a format that both
 * the <img> preview and the API can use.
 */

export interface DownscaleOptions {
  /** Longest-edge cap in pixels. */
  maxDim?: number;
  /** JPEG quality 0..1. */
  quality?: number;
}

/** Pure: fit (w,h) within a square of maxDim, preserving aspect ratio; never upscales. */
export function scaledDimensions(
  w: number,
  h: number,
  maxDim: number,
): { width: number; height: number } {
  if (w <= maxDim && h <= maxDim) return { width: w, height: h };
  const scale = maxDim / Math.max(w, h);
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}

/**
 * Decode, downscale, and re-encode `file` to JPEG. Returns a new File.
 * Falls back to the original file if the browser can't process it.
 */
export async function downscaleImage(
  file: File,
  { maxDim = 1568, quality = 0.85 }: DownscaleOptions = {},
): Promise<File> {
  try {
    // createImageBitmap decodes JPEG/PNG/WebP everywhere, and HEIC natively on Safari.
    const bitmap = await createImageBitmap(file);
    const { width, height } = scaledDimensions(bitmap.width, bitmap.height, maxDim);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close?.();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob) return file;

    const base = file.name.replace(/\.[^.]+$/, "") || "room";
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  } catch {
    // Decoding/canvas unsupported → best-effort: upload the original.
    return file;
  }
}
