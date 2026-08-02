import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path: string) => readFile(new URL(path, import.meta.url), "utf8");

test("music control uses a recognizable musical-note icon", async () => {
  const app = await readSource("../src/App.tsx");

  assert.match(app, /function MusicNoteIcon/);
  assert.match(app, /className="music-note-icon"/);
  assert.match(app, /<MusicNoteIcon\s*\/>/);
  assert.doesNotMatch(app, /<span\s*\/><span\s*\/><span\s*\/>/);
});

test("gallery photos in carousel and grid open one shared enlarged viewer", async () => {
  const app = await readSource("../src/App.tsx");

  assert.match(app, /function GalleryPhotoButton/);
  assert.match(app, /function GalleryViewer/);
  assert.match(app, /aria-label=\{`\$\{item\.alt[^}]*\} 크게 보기`\}/);
  assert.match(app, /<GalleryCarousel[\s\S]*?onOpen=\{setGalleryViewerIndex\}/);
  assert.match(app, /className="gallery-grid"[\s\S]*?<GalleryPhotoButton/);
  assert.match(app, /<GalleryViewer[\s\S]*?onClose=\{\(\) => setGalleryViewerIndex\(null\)\}/);
});

test("looping gallery uses two inaccessible clones and bounded neighbor preloading", async () => {
  const [app, media] = await Promise.all([
    readSource("../src/App.tsx"),
    readSource("../src/components/Media.tsx"),
  ]);

  assert.match(app, /\[items\.at\(-1\)!, \.\.\.items, items\[0\]!\]/);
  assert.match(app, /getCarouselPreloadIndices/);
  assert.match(app, /function preloadGalleryItems/);
  assert.match(app, /await image\.decode\(\)/);
  assert.match(app, /aria-hidden=\{isClone \|\| undefined\}/);
  assert.match(app, /tabIndex=\{isClone \? -1 : 0\}/);
  assert.match(app, /inert=\{isClone \? true : undefined\}/);
  assert.match(app, /decoded=\{source === null \|\| decodedSources\.has\(source\)\}/);
  assert.match(media, /decoding="async"/);
});

test("floating celebration and menu controls include restrained visible labels", async () => {
  const [app, quickMenu] = await Promise.all([
    readSource("../src/App.tsx"),
    readSource("../src/components/QuickMenu.tsx"),
  ]);

  assert.match(app, /className="floating-action__label">화환<\/span>/);
  assert.match(quickMenu, /className="floating-action__label">메뉴<\/span>/);
});
