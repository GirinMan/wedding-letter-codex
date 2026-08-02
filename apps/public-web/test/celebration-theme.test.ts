import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("celebration guidance preserves authored paragraphs and uses the active theme body font", async () => {
  const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

  assert.match(
    styles,
    /\.celebration-sheet__message\s*\{[^}]*font-family:\s*var\(--body-font\);[^}]*white-space:\s*pre-wrap;/s,
  );
});
