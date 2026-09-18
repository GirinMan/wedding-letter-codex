import assert from 'node:assert/strict';
import test from 'node:test';
import * as helpers from '../src/photo-route.ts';

test('hour groups use invitation timezone, separate dates, and merge pagination fragments', () => {
  assert.equal(typeof helpers.groupPhotosByHour, 'function');
  const photos = [
    {id:'a',url:'/a',alt:'',createdAt:'2026-09-19T04:59:59Z'},
    {id:'b',url:'/b',alt:'',createdAt:'2026-09-19T04:00:00Z'},
    {id:'c',url:'/c',alt:'',createdAt:'2026-09-19T03:59:59Z'},
    {id:'d',url:'/d',alt:'',createdAt:'2026-09-18T04:00:00Z'},
  ];
  const groups = helpers.groupPhotosByHour(photos,'Asia/Seoul');
  assert.equal(groups.length,3);
  assert.deepEqual(groups[0].photos.map(p=>p.id),['a','b']);
  assert.match(groups[0].label,/13:00/);
  assert.match(groups[1].label,/12:00/);
  assert.notEqual(groups[0].key,groups[2].key);
});

test('preloader starts before scrolling, deduplicates, bounds concurrency, retries failure', async () => {
  const module = await import('../src/image-preload.ts').catch(() => null);
  assert.ok(module);
  let active = 0, peak = 0;
  const calls: string[] = [];
  const loader = module.createImagePreloader(async (url: string) => {
    active++; peak=Math.max(peak,active); calls.push(url);
    await new Promise(resolve=>setTimeout(resolve,5)); active--;
    if(url==='/bad' && calls.filter(u=>u==='/bad').length===1) throw new Error('transient');
  },2);
  const [a,b] = await Promise.all([loader(['/1','/2','/3','/bad']),loader(['/1','/2'])]);
  assert.deepEqual(a,['/1','/2','/3']); assert.deepEqual(b,['/1','/2']);
  assert.equal(calls.filter(u=>u==='/1').length,1); assert.equal(peak,2);
  assert.deepEqual(await loader(['/bad']),['/bad']);
});
