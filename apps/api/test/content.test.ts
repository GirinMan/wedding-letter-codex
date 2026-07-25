import assert from "node:assert/strict";
import test from "node:test";

import {
  invitationContentSchema,
  invitationDesignSchema,
  sampleInvitationContent,
  sampleInvitationDesign,
} from "../src/domain/invitation.js";

test("sample invitation content satisfies the public contract", () => {
  const parsed = invitationContentSchema.parse(sampleInvitationContent);

  assert.equal(parsed.locale, "ko-KR");
  assert.ok(parsed.sections.length >= 10);
  assert.ok(parsed.timeline.length >= 3);
  assert.equal(new Set(parsed.sections.map((section) => section.id)).size, parsed.sections.length);
});

test("sample design satisfies the replaceable token contract", () => {
  const parsed = invitationDesignSchema.parse(sampleInvitationDesign);

  assert.match(parsed.colors.paper, /^#[0-9a-f]{6}$/i);
  assert.match(parsed.colors.ink, /^#[0-9a-f]{6}$/i);
  assert.ok(parsed.spacing.section >= 48);
});

test("an invalid public account is rejected", () => {
  const invalid = structuredClone(sampleInvitationContent);
  invalid.accounts[0]!.items[0]!.accountNumber = "";

  assert.throws(() => invitationContentSchema.parse(invalid));
});
