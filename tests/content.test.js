import test from "node:test";
import assert from "node:assert/strict";

import {
  accountClipboardValue,
  hasPlaceholder,
  isNonEmptyString,
  sectionEnabled,
} from "../app/scripts/lib/content.js";

test("normalizes an account into a clipboard-friendly string", () => {
  assert.equal(
    accountClipboardValue({
      bank: "예시은행",
      number: "123 456 789",
      holder: "홍길동",
    }),
    "예시은행 123456789 홍길동",
  );
});

test("detects placeholders and meaningful strings", () => {
  assert.equal(hasPlaceholder("[신랑 이름]"), true);
  assert.equal(hasPlaceholder("홍길동"), false);
  assert.equal(isNonEmptyString("  값  "), true);
  assert.equal(isNonEmptyString("  "), false);
});

test("requires both a feature flag and content for collection sections", () => {
  const invitation = { features: { gallery: true, accounts: false } };
  assert.equal(sectionEnabled(invitation, "gallery", [{ src: "photo.jpg" }]), true);
  assert.equal(sectionEnabled(invitation, "gallery", []), false);
  assert.equal(sectionEnabled(invitation, "accounts", [{ number: "123" }]), false);
});
