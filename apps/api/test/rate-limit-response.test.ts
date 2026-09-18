import assert from 'node:assert/strict';
import test from 'node:test';
import {createApp} from '../src/app.js';

test('rate-limited requests return 429 so upload clients can explain retry timing',async()=>{
  Object.assign(process.env,{NODE_ENV:'test',DATABASE_URL:'postgres://test:test@localhost/test',S3_ENDPOINT:'http://localhost:9000',S3_ACCESS_KEY:'test',S3_SECRET_KEY:'test',S3_BUCKET:'test'});
  const app=await createApp();
  app.get('/rate-test',{config:{rateLimit:{max:1,timeWindow:'1 hour'}}},async()=>({ok:true}));
  try {
    assert.equal((await app.inject('/rate-test')).statusCode,200);
    const limited=await app.inject('/rate-test');
    assert.equal(limited.statusCode,429);
    assert.ok(limited.headers['retry-after']);
  } finally {await app.close();}
});
