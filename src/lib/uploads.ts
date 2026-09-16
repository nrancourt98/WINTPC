import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads");

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const MAX_BYTES = 8 * 1024 * 1024;

export async function saveUpload(file: File): Promise<string> {
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    throw new Error("Unsupported image type. Use JPEG, PNG, WEBP, or GIF.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image is too large (max 8MB).");
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return filename;
}

export async function deleteUpload(filename: string | null | undefined): Promise<void> {
  if (!filename) return;
  const safeName = path.basename(filename);
  try {
    await fs.unlink(path.join(UPLOAD_DIR, safeName));
  } catch {
    // Already gone — nothing to clean up.
  }
}

export function resolveUploadPath(segments: string[]): string {
  const safeName = path.basename(segments.join("/"));
  return path.join(UPLOAD_DIR, safeName);
}
