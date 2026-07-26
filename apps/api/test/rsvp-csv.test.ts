import assert from "node:assert/strict";
import test from "node:test";

import { createRsvpCsv } from "../src/export/rsvp-csv.js";

test("RSVP CSV is Excel-compatible, localized, and safe from formulas", () => {
  const csv = createRsvpCsv([
    {
      createdAt: new Date("2026-07-26T10:00:00.000Z"),
      attending: true,
      party: "partnerOne",
      name: "홍, 길동",
      phone: "010-1234-5678",
      additionalGuests: 2,
      meal: "yes",
      shuttle: "undecided",
      note: "축하합니다\n꼭 갈게요",
    },
    {
      createdAt: "2026-07-26T11:00:00.000Z",
      attending: false,
      party: "partnerTwo",
      name: "=HYPERLINK(\"https://example.com\")",
      phone: "+82-10-0000-0000",
      additionalGuests: 0,
      meal: null,
      shuttle: "no",
      note: "@SUM(1+1)",
    },
  ]);

  assert.equal(
    csv,
    "\uFEFF접수일,참석 여부,구분,이름,대표 연락처,총 인원,추가 인원,식사,셔틀,메모\r\n"
      + "2026-07-26T10:00:00.000Z,참석,신랑 측,\"홍, 길동\",010-1234-5678,3,2,식사함,미정,\"축하합니다\n꼭 갈게요\"\r\n"
      + "2026-07-26T11:00:00.000Z,불참,신부 측,\"'=HYPERLINK(\"\"https://example.com\"\")\",'+82-10-0000-0000,1,0,미수집,이용 안 함,'@SUM(1+1)\r\n",
  );
});

test("empty RSVP CSV still contains its header row", () => {
  assert.equal(
    createRsvpCsv([]),
    "\uFEFF접수일,참석 여부,구분,이름,대표 연락처,총 인원,추가 인원,식사,셔틀,메모\r\n",
  );
});
