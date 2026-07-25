import assert from "node:assert/strict";
import test from "node:test";

import {
  createPasswordVerifier,
  createSessionToken,
  digestSessionToken,
  verifyPassword,
} from "../src/security/credentials.js";

test("password verifiers round-trip without storing plaintext", async () => {
  const verifier = await createPasswordVerifier("correct horse battery staple");

  assert.doesNotMatch(verifier, /correct horse/);
  assert.equal(await verifyPassword("correct horse battery staple", verifier), true);
  assert.equal(await verifyPassword("wrong password", verifier), false);
});

test("session tokens are random and stored as fixed-size digests", () => {
  const first = createSessionToken();
  const second = createSessionToken();

  assert.notEqual(first, second);
  assert.match(first, /^[A-Za-z0-9_-]+$/);
  assert.equal(digestSessionToken(first).length, 64);
});
