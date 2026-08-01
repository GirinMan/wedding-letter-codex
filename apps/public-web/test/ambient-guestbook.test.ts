import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import type { GuestbookEntry } from "../src/types.ts";

const entries: GuestbookEntry[] = [
  {
    id: "letter-one",
    name: "김하객",
    message: "두 사람의 모든 날을 응원할게요.",
    createdAt: "2026-07-30T10:00:00+09:00",
  },
  {
    id: "letter-two",
    name: "이하객",
    message: "언제나 지금처럼 행복하세요.",
    createdAt: "2026-07-29T10:00:00+09:00",
  },
];

test("ambient guestbook selects only an unseen letter", async () => {
  let source = "";
  try {
    source = await readFile(new URL("../src/ambient-guestbook.ts", import.meta.url), "utf8");
  } catch {
    // The assertion below records the expected RED state before the module exists.
  }
  assert.match(source, /export function chooseAmbientGuestbookEntry/);

  const { chooseAmbientGuestbookEntry } = await import("../src/ambient-guestbook.ts");
  assert.equal(
    chooseAmbientGuestbookEntry(entries, new Set(["letter-one"]), 0)?.id,
    "letter-two",
  );
  assert.equal(
    chooseAmbientGuestbookEntry(entries, new Set(["letter-one", "letter-two"]), 0),
    null,
  );
});

test("ambient guestbook waits for safe scroll distance and an idle page", async () => {
  let source = "";
  try {
    source = await readFile(new URL("../src/ambient-guestbook.ts", import.meta.url), "utf8");
  } catch {
    // The assertion below records the expected RED state before the module exists.
  }
  assert.match(source, /export function shouldRevealAmbientGuestbook/);

  const { shouldRevealAmbientGuestbook } = await import("../src/ambient-guestbook.ts");
  const baseline = {
    entryCount: 2,
    shownCount: 0,
    scrollY: 700,
    viewportHeight: 800,
    lastRevealY: null,
    blocked: false,
    reducedMotion: false,
  };

  assert.equal(shouldRevealAmbientGuestbook(baseline), true);
  assert.equal(shouldRevealAmbientGuestbook({ ...baseline, scrollY: 400 }), false);
  assert.equal(shouldRevealAmbientGuestbook({ ...baseline, blocked: true }), false);
  assert.equal(shouldRevealAmbientGuestbook({ ...baseline, reducedMotion: true }), false);
  assert.equal(shouldRevealAmbientGuestbook({
    ...baseline,
    shownCount: 1,
    scrollY: 1_400,
    lastRevealY: 700,
  }), false);
  assert.equal(shouldRevealAmbientGuestbook({
    ...baseline,
    shownCount: 1,
    scrollY: 1_900,
    lastRevealY: 700,
  }), true);
  assert.equal(shouldRevealAmbientGuestbook({ ...baseline, shownCount: 3 }), false);
});

test("public invitation includes the lightweight ambient letter presentation", async () => {
  const [app, styles] = await Promise.all([
    readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/styles.css", import.meta.url), "utf8"),
  ]);

  assert.match(app, /className="ambient-guestbook-letter"/);
  assert.match(app, /className="ambient-guestbook-dock"/);
  assert.match(styles, /\.ambient-guestbook-letter\s*\{[^}]*position:\s*fixed;/s);
  assert.match(styles, /@keyframes ambient-letter-arrive/);
  assert.match(
    styles,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.ambient-guestbook-letter/,
  );
});
