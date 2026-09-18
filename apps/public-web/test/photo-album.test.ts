import assert from 'node:assert/strict';
import test from 'node:test';
import * as album from '../src/photo-route.ts';

test('album upload guidance honors both feature flags and exact opening time', () => {
  assert.equal(typeof album.albumUploadState, 'function');
  const content = {guestUploads:{enabled:true,opensAt:'2030-01-01T00:00:00Z'},sections:[{id:'guestUploads',enabled:true}]};
  assert.equal(album.albumUploadState(content, Date.parse('2029-12-31T23:59:59Z')), 'scheduled');
  assert.equal(album.albumUploadState(content, Date.parse('2030-01-01T00:00:00Z')), 'open');
  assert.equal(album.albumUploadState({...content, sections:[]}, Infinity), 'disabled');
  assert.equal(album.albumUploadState({...content,guestUploads:{...content.guestUploads,enabled:false}}, Infinity), 'disabled');
});
