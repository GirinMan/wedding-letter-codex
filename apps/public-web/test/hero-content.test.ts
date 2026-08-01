import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Photo Editorial renders the optional hero subtitle", async () => {
  const source = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");

  assert.match(source, /className="photo-hero__subtitle"[^>]*>\{content\.hero\.subtitle\}/);
});

test("family relationship labels remain visible without parent contact records", async () => {
  const source = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");

  assert.match(source, /if \(!hasParentContacts\)[\s\S]*?\{content\.couple\.partnerOne\.familyRelation\}[\s\S]*?\{content\.couple\.partnerTwo\.familyRelation\}/);
});

test("family relationship labels remain visible when parent names are configured", async () => {
  const source = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");

  assert.match(
    source,
    /<div className="family-relation"[\s\S]*?family-relation__label[\s\S]*?family-relation__details[\s\S]*?parents\.map[\s\S]*?\{partner\.familyRelation\}/,
  );
});
