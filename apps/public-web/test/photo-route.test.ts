import assert from 'node:assert/strict';
import test from 'node:test';
import { resolvePhotoSlug } from '../src/photo-route.ts';
test('album routes resolve default and explicit invitations without hijacking preview', () => {
  assert.equal(resolvePhotoSlug('/photos', 'our-wedding'), 'our-wedding');
  assert.equal(resolvePhotoSlug('/photos/', 'our-wedding'), 'our-wedding');
  assert.equal(resolvePhotoSlug('/another-wedding/photos', 'our-wedding'), 'another-wedding');
  for (const path of ['/', '/our-wedding', '/preview/', '/preview/photos', '/a/photos/extra']) {
    assert.equal(resolvePhotoSlug(path, 'our-wedding'), null);
  }
});
