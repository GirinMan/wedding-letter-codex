import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("RSVP marks only the core answers as required and explains optional public messages", async () => {
  const app = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");

  assert.match(app, /참석 여부.*required-mark/s);
  assert.match(app, /이름.*required-mark/s);
  assert.match(app, /구분.*required-mark/s);
  assert.match(app, /식사 여부.*required-mark/s);
  assert.match(app, /name="meal"[^>]*required/);
  assert.match(app, /name="phone"[^>]*maxLength=\{30\}/);
  assert.doesNotMatch(app, /name="phone"[^>]*required/);
  assert.match(app, /name="guestbookMessage"/);
  assert.match(app, /입력한 축하 메시지는 이름과 함께 방명록에 공개됩니다/);
  assert.match(app, /className="field-label">이름 <span className="required-mark"/);
  assert.match(app, /className="field-label">구분 <span className="required-mark"/);
});

test("RSVP privacy consent states its purpose and retention period", async () => {
  const app = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");

  assert.match(
    app,
    /당일 예식 참석자 규모를 확인하고 원활하게 대응하는 목적 외에는 사용하지 않으며, 결혼식 이후 폐기할 예정입니다/,
  );
});

test("RSVP groups matching attendance choices first and keeps all required fields ahead of optional fields", async () => {
  const app = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
  const start = app.indexOf('<Dialog open={dialog === "rsvp"}');
  const end = app.indexOf('<Dialog open={dialog === "guestbook"}', start);
  const form = app.slice(start, end);

  const attending = form.indexOf("참석 여부");
  const meal = form.indexOf("식사 여부");
  const name = form.indexOf("field-label\">이름");
  const party = form.indexOf("field-label\">구분");
  const phone = form.indexOf("연락처 (선택)");

  assert.ok(attending < meal && meal < name && name < party && party < phone);
  assert.match(form, /<fieldset className="choice-grid">\s*<legend>식사 여부/s);
  assert.match(form, /type="radio" name="meal" value="yes" required/);
  assert.doesNotMatch(form, /<select name="meal"/);
});

test("RSVP-origin guestbook entries do not offer an unusable delete action", async () => {
  const app = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
  const types = await readFile(new URL("../src/types.ts", import.meta.url), "utf8");

  assert.match(types, /canDelete:\s*boolean/);
  assert.match(app, /entry\.canDelete\s*\?/);
});
