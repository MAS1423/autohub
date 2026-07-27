/**
 * Portable local-disk storage helpers.
 * Files are stored in the UPLOAD_DIR directory (default: ./uploads/).
 * Served via GET /uploads/<key>.
 *
 * The current implementation is local-disk only. Environment placeholders for
 * object storage exist in `_core/env.ts`, but an S3 adapter has not been added
 * to this module yet.
 */
import fs from "fs";
import path from "path";
import { ENV } from "./_core/env";

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

function getUploadDir(): string {
  const dir = path.resolve(ENV.uploadDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Save a file to local disk (or S3 if configured).
 * Returns { key, url } where url is the path to access the file.
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  _contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));
  const uploadDir = getUploadDir();
  const filePath = path.join(uploadDir, key);

  // Ensure subdirectory exists
  const fileDir = path.dirname(filePath);
  if (!fs.existsSync(fileDir)) {
    fs.mkdirSync(fileDir, { recursive: true });
  }

  const buffer = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
  fs.writeFileSync(filePath, buffer);

  return { key, url: `/uploads/${key}` };
}

/**
 * Get the URL to access a stored file.
 */
export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/uploads/${key}` };
}

/**
 * Get a direct URL for a stored file (same as storageGet for local disk).
 */
export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const key = normalizeKey(relKey);
  return `/uploads/${key}`;
}
