import assert from 'node:assert/strict';
import test from 'node:test';
import { guestUploadPageSchema } from '../src/domain/guest-upload.js';
test('photo pagination bounds page size and validates cursor', () => {
  assert.deepEqual(guestUploadPageSchema.parse({}), { limit: 30 });
  assert.deepEqual(guestUploadPageSchema.parse({limit: '50'}), {limit: 50});
  for (const query of [{limit: 0}, {limit: 51}, {limit: 1.5}, {cursor: 'invalid'}]) {
    assert.equal(guestUploadPageSchema.safeParse(query).success, false);
  }
});
