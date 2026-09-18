import assert from "node:assert/strict";
import test from "node:test";
import { Readable } from "node:stream";
import sharp from "sharp";
import { createDisplayImage, createDisplayImageStore, imageSizeQuery } from "../src/display-image.js";

async function fixture() {
  return sharp({ create: { width: 2400, height: 1600, channels: 3, background: "#84705a" } })
    .jpeg().withMetadata({ orientation: 6 }).toBuffer();
}

test("display image rotates EXIF, limits both dimensions, strips metadata, and keeps small images small", async () => {
  const output = await createDisplayImage(await fixture());
  const metadata = await sharp(output).metadata();
  assert.equal(metadata.format, "webp");
  assert.equal(metadata.height, 1280);
  assert.equal(metadata.width, 853);
  assert.equal(metadata.exif, undefined);
  const small = await sharp({create: { width: 40, height: 30, channels: 3, background: "red" }}).png().toBuffer();
  assert.equal((await sharp(await createDisplayImage(small)).metadata()).width, 40);
});

test("display cache deduplicates concurrent work and preserves originals", async () => {
  const original = await fixture();
  const entries = new Map<string, {body: Buffer; contentType: string}>([["original/key.jpg", {body: original, contentType: "image/jpeg"}]]);
  let writes = 0;
  const get = createDisplayImageStore({
    async getObject(key) {
      const object = entries.get(key);
      if (!object) throw Object.assign(new Error("missing"), {name: "NoSuchKey"});
      return { body: Readable.from(object.body), contentType: object.contentType, contentLength: object.body.length };
    },
    async putObject(input) { writes++; entries.set(input.key, input); },
  });
  const results = await Promise.all([get("original/key.jpg"), get("original/key.jpg")]);
  assert.equal(writes, 1);
  assert.equal(results[0]!.contentType, "image/webp");
  results.forEach(result => result.body.destroy());
  (await get("original/key.jpg")).body.destroy();
  assert.equal(writes, 1);
  assert.equal(entries.get("original/key.jpg")!.body, original);
});

test("unsupported HEIC and corrupt images fall back to original without writing a derivative", async () => {
  for (const contentType of ["image/heic", "image/jpeg"]) {
    const bytes = Buffer.from("unsupported or corrupt");
    let reads = 0;
    const get = createDisplayImageStore({
      async getObject(key) {
        if (key !== "original") throw Object.assign(new Error("missing"), {name: "NoSuchKey"});
        reads++;
        return {body: Readable.from(bytes), contentType, contentLength: bytes.length};
      },
      async putObject() { assert.fail("must not cache failed transforms"); },
    });
    assert.equal((await get("original")).contentType, contentType);
    const second = await get("original");
    assert.equal(reads, 3, "second request skips failed conversion");
    const chunks = [];
    for await (const chunk of second.body) chunks.push(chunk);
    assert.deepEqual(Buffer.concat(chunks), bytes);
  }
});

test("only fixed renditions can be requested", () => {
  assert.deepEqual(imageSizeQuery.parse({size: "display"}), {size: "display"});
  assert.equal(imageSizeQuery.safeParse({size: "99999"}).success, false);
});

test("thumbnail rendition is smaller and has a separate cache from the display image", async () => {
  const original = await fixture();
  const entries = new Map<string, {body: Buffer; contentType: string}>([["photo",{body:original,contentType:"image/jpeg"}]]);
  const get = createDisplayImageStore({
    async getObject(key) {
      const object=entries.get(key);
      if (!object) throw Object.assign(new Error('missing'),{name:'NoSuchKey'});
      return {body:Readable.from(object.body),contentType:object.contentType,contentLength:object.body.length};
    },
    async putObject(input) {entries.set(input.key,input);},
  });
  const [small,large] = await Promise.all([get('photo','thumbnail'),get('photo','display')]);
  const read = async (body: Readable) => {const chunks:Buffer[]=[];for await(const chunk of body) chunks.push(Buffer.from(chunk));return Buffer.concat(chunks);};
  const smallBytes=await read(small.body), largeBytes=await read(large.body);
  assert.equal((await sharp(smallBytes).metadata()).height,480);
  assert.equal((await sharp(largeBytes).metadata()).height,1280);
  assert.ok(smallBytes.length < largeBytes.length);
  assert.equal(entries.size,3);
  (await get('photo','thumbnail')).body.destroy();
  assert.equal(entries.size,3);
  assert.deepEqual(imageSizeQuery.parse({size:'thumbnail'}),{size:'thumbnail'});
});
