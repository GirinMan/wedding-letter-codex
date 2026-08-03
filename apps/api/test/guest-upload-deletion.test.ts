import assert from "node:assert/strict";
import test from "node:test";

import { guestUploadIdBatchSchema } from "../src/domain/guest-upload.js";

test("guest upload deletion accepts a bounded batch of unique upload ids", () => {
  const first = "11111111-1111-4111-8111-111111111111";
  const second = "22222222-2222-4222-8222-222222222222";

  assert.deepEqual(guestUploadIdBatchSchema.parse({ uploadIds: [first, second, first] }), {
    uploadIds: [first, second],
  });
});

test("guest upload deletion rejects empty batches", () => {
  assert.throws(() => guestUploadIdBatchSchema.parse({ uploadIds: [] }));
});
