import assert from "node:assert/strict";
import test from "node:test";

import { formatHeroDate } from "../src/hero-date.ts";

test("hero date keeps the invitation's local day and editorial English formatting", () => {
  assert.deepEqual(
    formatHeroDate("2026-10-24T12:30:00+09:00", "Asia/Seoul"),
    {
      weekday: "SATURDAY",
      month: "OCTOBER",
      day: "24",
      ordinal: "TH",
      time: "12 : 30 PM",
    },
  );
});

test("hero date applies the correct ordinal suffixes", () => {
  assert.equal(formatHeroDate("2026-03-01T09:00:00+09:00", "Asia/Seoul").ordinal, "ST");
  assert.equal(formatHeroDate("2026-03-02T09:00:00+09:00", "Asia/Seoul").ordinal, "ND");
  assert.equal(formatHeroDate("2026-03-03T09:00:00+09:00", "Asia/Seoul").ordinal, "RD");
  assert.equal(formatHeroDate("2026-03-11T09:00:00+09:00", "Asia/Seoul").ordinal, "TH");
});
