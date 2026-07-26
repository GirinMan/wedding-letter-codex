import assert from "node:assert/strict";
import test from "node:test";

import { createCalendarFile } from "../src/event-calendar.ts";

test("calendar export converts the event instant to UTC and escapes text", () => {
  const calendar = createCalendarFile({
    startsAt: "2026-10-25T14:00:00+09:00",
    title: "신랑, 신부; 결혼식",
    location: "웨딩홀\\그랜드, 2층",
    description: "함께해 주세요.\n서울, 대한민국",
    uid: "our-wedding-2026@example.test",
  });

  assert.match(calendar, /DTSTART:20261025T050000Z/);
  assert.match(calendar, /SUMMARY:신랑\\, 신부\\; 결혼식/);
  assert.match(calendar, /LOCATION:웨딩홀\\\\그랜드\\, 2층/);
  assert.match(calendar, /DESCRIPTION:함께해 주세요\.\\n서울\\, 대한민국/);
});

test("calendar export rejects an invalid event instant", () => {
  assert.throws(() => createCalendarFile({
    startsAt: "not-a-date",
    title: "결혼식",
    location: "예식장",
    description: "",
    uid: "invalid@example.test",
  }));
});
