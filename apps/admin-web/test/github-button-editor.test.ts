import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("sharing settings let an administrator toggle the GitHub invitation button", async () => {
  const source = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");

  assert.match(source, /<h3>GitHub 버튼<\/h3>/);
  assert.match(source, /draftContent\.sharing\.githubButton\.enabled/);
  assert.match(source, /draft\.sharing\.githubButton\.enabled = event\.target\.checked/);
  assert.match(source, /GirinMan\/wedding-letter-codex/);
});
