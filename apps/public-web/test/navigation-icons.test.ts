import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("navigation links render a provider SVG icon beside each service name", async () => {
  const source = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");

  assert.match(source, /function NavigationServiceIcon/);
  assert.match(source, /<NavigationServiceIcon provider=\{link\.provider\}/);
  assert.match(source, /provider: "naver"/);
  assert.match(source, /provider: "tmap"/);
  assert.match(source, /provider: "kakao"/);
});
