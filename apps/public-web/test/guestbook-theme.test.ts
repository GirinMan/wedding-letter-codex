import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("catalog guestbook actions use matching typography", async () => {
  const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

  assert.match(
    styles,
    /\.page-shell--catalog \.guestbook-section \.button-row button\s*\{[^}]*font-size:\s*\.67rem;[^}]*letter-spacing:\s*\.12em;[^}]*text-transform:\s*uppercase;/s,
  );
});
