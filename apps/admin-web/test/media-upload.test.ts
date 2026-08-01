import assert from "node:assert/strict";
import { File } from "node:buffer";
import test from "node:test";

test("bulk media upload infers a gallery purpose for images and music purpose for audio", async () => {
  const mediaUpload = await import("../src/media-upload.ts").catch(() => null);

  assert.ok(mediaUpload, "bulk upload helper should exist");
  assert.deepEqual(
    mediaUpload.planMediaUploads([
      { name: "hero.jpg", type: "image/jpeg" },
      { name: "song.mp3", type: "audio/mpeg" },
      { name: "gallery.webp", type: "image/webp" },
    ]),
    [
      { name: "hero.jpg", purpose: "gallery" },
      { name: "song.mp3", purpose: "music" },
      { name: "gallery.webp", purpose: "gallery" },
    ],
  );
});

test("bulk media upload excludes unsupported files before starting requests", async () => {
  const mediaUpload = await import("../src/media-upload.ts");

  assert.deepEqual(
    mediaUpload.planMediaUploads([
      { name: "photo.png", type: "image/png" },
      { name: "notes.pdf", type: "application/pdf" },
    ]),
    [{ name: "photo.png", purpose: "gallery" }],
  );
});

test("bulk media upload sends purpose before the multipart file", async () => {
  const mediaUpload = await import("../src/media-upload.ts");
  const [form] = mediaUpload.createMediaUploadForms([
    new File(["image"], "hero.jpg", { type: "image/jpeg" }),
  ]);

  assert.deepEqual([...form.keys()], ["purpose", "file"]);
  assert.equal(form.get("purpose"), "gallery");
});
