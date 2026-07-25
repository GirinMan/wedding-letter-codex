import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateDday,
  formatDdayDescription,
  formatDdayLabel,
  formatWeddingDate,
} from "../app/scripts/lib/date.js";

test("formats a Korean wedding date without relying on the host locale", () => {
  assert.equal(
    formatWeddingDate("2030-05-18", "12:30"),
    "2030년 5월 18일 토요일 · 오후 12시 30분",
  );
});

test("calculates calendar-day distance in the configured timezone", () => {
  const beforeMidnightUtc = new Date("2030-05-17T14:59:00.000Z");
  const afterMidnightKorea = new Date("2030-05-17T15:01:00.000Z");

  assert.equal(calculateDday("2030-05-18", beforeMidnightUtc, "Asia/Seoul"), 1);
  assert.equal(calculateDday("2030-05-18", afterMidnightKorea, "Asia/Seoul"), 0);
});

test("formats upcoming, today, and elapsed D-day states", () => {
  assert.equal(formatDdayLabel(12), "D-12");
  assert.equal(formatDdayLabel(0), "오늘");
  assert.equal(formatDdayLabel(-7), "D+7");
  assert.match(formatDdayDescription(12), /12일 남았습니다/);
  assert.match(formatDdayDescription(0), /오늘/);
  assert.match(formatDdayDescription(-7), /7일 되었습니다/);
});

test("rejects malformed dates and times", () => {
  assert.throws(() => formatWeddingDate("18-05-2030", "12:30"), /Invalid ISO date/);
  assert.throws(() => formatWeddingDate("2030-05-18", "25:00"), /Invalid 24-hour time/);
});
