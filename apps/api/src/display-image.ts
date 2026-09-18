import { createHash } from "node:crypto";
import sharp from "sharp";
import { z } from "zod";
import { getObject, putObject } from "./storage.js";

// Fixed cached renditions only; callers cannot trigger arbitrary transforms.
export const imageSizeQuery = z.object({ size: z.enum(["display", "thumbnail"]).optional() });
type ImageSize = 'display' | 'thumbnail';
const MAX_SOURCE_BYTES = 32 * 1024 * 1024;
class UnsupportedDisplayImage extends Error {}
const supportedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);
sharp.cache({ memory: 16, files: 0, items: 16 });
sharp.concurrency(1);

export async function createDisplayImage(input: Buffer, size: ImageSize = 'display'): Promise<Buffer> {
  if (input.length > MAX_SOURCE_BYTES) throw new Error("Image source too large");
  return sharp(input, { limitInputPixels: 64_000_000, animated: false })
    .timeout({ seconds: 15 })
    .rotate()
    .resize({ width: size === 'thumbnail' ? 480 : 1280, height: size === 'thumbnail' ? 480 : 1280, fit: "inside", withoutEnlargement: true })
    .webp({ quality: size === 'thumbnail' ? 72 : 82, effort: 3 })
    .toBuffer();
}

type StoredObject = Awaited<ReturnType<typeof getObject>>;
type Storage = { getObject: typeof getObject; putObject: typeof putObject };

export function createDisplayImageStore(storage: Storage) {
  const pending = new Map<string, Promise<void>>();
  const failures = new Map<string, number>();
  let tail = Promise.resolve();
  return async function getDisplayObject(key: string, size: ImageSize = 'display'): Promise<StoredObject> {
    const cacheKey = `${size === 'thumbnail' ? 'thumbnail-images' : 'display-images'}/v1/${createHash("sha256").update(key).digest("hex")}.webp`;
    try {
      return await storage.getObject(cacheKey);
    } catch (error) {
      const missing = error as { name?: string; $metadata?: { httpStatusCode?: number } };
      if (missing.name !== "NoSuchKey" && missing.$metadata?.httpStatusCode !== 404) {
        return storage.getObject(key);
      }
    }
    if ((failures.get(cacheKey) ?? 0) > Date.now()) return storage.getObject(key);
    // Bound both CPU and queued work; originals remain available under a burst.
    if (!pending.has(cacheKey) && pending.size >= 16) return storage.getObject(key);
    let work = pending.get(cacheKey);
    if (!work) {
      work = tail.then(async () => {
        const original = await storage.getObject(key);
        try {
          if (!supportedTypes.has(original.contentType) || (original.contentLength ?? 0) > MAX_SOURCE_BYTES) {
            throw new UnsupportedDisplayImage("Unsupported display image");
          }
          const chunks: Buffer[] = [];
          let length = 0;
          for await (const chunk of original.body) {
            const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            length += bytes.length;
            if (length > MAX_SOURCE_BYTES) throw new Error("Image source too large");
            chunks.push(bytes);
          }
          const body = await createDisplayImage(Buffer.concat(chunks), size);
          await storage.putObject({ key: cacheKey, body, contentType: "image/webp" });
        } finally {
          original.body.destroy();
        }
      });
      pending.set(cacheKey, work);
      tail = work.catch(() => {});
      void work.finally(() => pending.delete(cacheKey)).catch(() => {});
    }
    try {
      await work;
      return await storage.getObject(cacheKey);
    } catch (error) {
      // HEIC/unsupported/corrupt originals still use the existing delivery path.
      if (failures.size >= 256) failures.delete(failures.keys().next().value!);
      failures.set(cacheKey, Date.now() + (error instanceof UnsupportedDisplayImage ? 60 * 60_000 : 60_000));
      return storage.getObject(key);
    }
  };
}

export const getDisplayObject = createDisplayImageStore({ getObject, putObject });
