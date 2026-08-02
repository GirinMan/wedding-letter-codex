import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("media settings expose emoji and uploaded-image favicon controls", async () => {
  const source = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");

  assert.match(source, /title="브라우저 아이콘"/);
  assert.match(source, /value="none">사용 안 함/);
  assert.match(source, /value="emoji">이모지/);
  assert.match(source, /value="image">업로드 이미지/);
  assert.match(source, /label="아이콘 이미지"/);
});
