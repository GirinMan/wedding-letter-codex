import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("admin RSVP management can review and publish selected legacy notes", async () => {
  const app = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
  const api = await readFile(new URL("../src/api.ts", import.meta.url), "utf8");
  const types = await readFile(new URL("../src/types.ts", import.meta.url), "utf8");

  assert.match(types, /guestbookEntryId:\s*string\s*\|\s*null/);
  assert.match(types, /guestbookEntryState:/);
  assert.match(api, /promoteRsvpNotes/);
  assert.match(app, /방명록 후보/);
  assert.match(app, /선택한 메모 공개/);
  assert.match(app, /guestbookEntryState === "visible"/);
  assert.match(app, /"숨김"/);
  assert.match(app, /"삭제됨"/);
});
