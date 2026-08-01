import assert from "node:assert/strict";
import test from "node:test";

import { selectGuestUploadGallery } from "../src/guest-upload-gallery.ts";

test("guest upload gallery shows administrator fallback photos before any guest photo is approved", () => {
  const fallback = [
    { assetId: "fallback-one", alt: "첫 번째 기본 사진", placeholder: "" },
    { assetId: "fallback-two", alt: "두 번째 기본 사진", placeholder: "" },
    { assetId: "fallback-three", alt: "세 번째 기본 사진", placeholder: "" },
  ];

  assert.deepEqual(selectGuestUploadGallery([], fallback), {
    source: "fallback",
    items: fallback,
  });
});

test("guest upload gallery replaces fallback photos with approved guest photos", () => {
  const guestPhotos = [{ id: "guest-one", url: "/guest-one.jpg", alt: "하객이 공유한 사진" }];
  const fallback = [{ assetId: "fallback-one", alt: "기본 사진", placeholder: "" }];

  assert.deepEqual(selectGuestUploadGallery(guestPhotos, fallback), {
    source: "guest",
    items: guestPhotos,
  });
});
