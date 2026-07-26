import assert from "node:assert/strict";
import test from "node:test";

import { rsvpPromptStorageKey, shouldShowRsvpWelcomePrompt } from "../src/rsvp-welcome-prompt.ts";

test("RSVP welcome prompt is invitation-specific and can be dismissed for the current day", () => {
  const today = new Date("2026-07-27T10:00:00+09:00");
  const storageKey = rsvpPromptStorageKey("our-wedding");

  assert.equal(storageKey, "wedding:rsvp-welcome:our-wedding");
  assert.equal(shouldShowRsvpWelcomePrompt(null, today), true);
  assert.equal(shouldShowRsvpWelcomePrompt("2026-07-27", today), false);
  assert.equal(shouldShowRsvpWelcomePrompt("2026-07-26", today), true);
});
