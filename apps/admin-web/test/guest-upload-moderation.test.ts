import assert from "node:assert/strict";
import test from "node:test";

import { partitionGuestUploads, toggleGuestUploadSelection } from "../src/guest-upload-moderation.js";

const uploads = [
  { id: "active-one", deletedAt: null },
  { id: "deleted", deletedAt: "2026-08-03T10:00:00.000Z" },
  { id: "active-two", deletedAt: null },
];

test("deleted guest uploads are separated from the active moderation list", () => {
  assert.deepEqual(partitionGuestUploads(uploads), {
    active: [uploads[0], uploads[2]],
    deleted: [uploads[1]],
  });
});

test("guest upload selection toggles without mutating the previous selection", () => {
  const selected = new Set(["active-one"]);
  const added = toggleGuestUploadSelection(selected, "active-two");
  const removed = toggleGuestUploadSelection(added, "active-one");

  assert.deepEqual([...selected], ["active-one"]);
  assert.deepEqual([...added], ["active-one", "active-two"]);
  assert.deepEqual([...removed], ["active-two"]);
});
