import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("catalog RSVP welcome dialog uses active design tokens instead of fixed white and black surfaces", async () => {
  const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

  assert.match(
    styles,
    /\.page-shell--catalog \.dialog--rsvp-welcome\s*\{[^}]*background:\s*var\(--paper\);/s,
  );
  assert.match(
    styles,
    /\.page-shell--catalog \.dialog--rsvp-welcome \.dialog__header\s*\{[^}]*background:\s*var\(--ink\);/s,
  );
  assert.match(
    styles,
    /\.page-shell--catalog \.dialog--rsvp-welcome \.dialog__body\s*\{[^}]*background:\s*var\(--paper\);/s,
  );
  assert.match(
    styles,
    /\.page-shell--catalog \.rsvp-welcome__actions \.primary-button\s*\{[^}]*background:\s*var\(--ink\);/s,
  );
});
