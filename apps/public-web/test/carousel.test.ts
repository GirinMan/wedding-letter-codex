import assert from "node:assert/strict";
import test from "node:test";

import * as carousel from "../src/carousel.ts";

const { moveCarouselIndex } = carousel;

test("carousel navigation wraps in both directions", () => {
  assert.equal(moveCarouselIndex(0, -1, 3), 2);
  assert.equal(moveCarouselIndex(2, 1, 3), 0);
  assert.equal(moveCarouselIndex(1, 1, 3), 2);
});

test("carousel navigation stays at zero for an empty or single-item list", () => {
  assert.equal(moveCarouselIndex(0, 1, 0), 0);
  assert.equal(moveCarouselIndex(0, -1, 1), 0);
});

test("carousel preload window stays bounded to the active slide and its neighbors", () => {
  assert.equal(typeof carousel.getCarouselPreloadIndices, "function");
  const getCarouselPreloadIndices = carousel.getCarouselPreloadIndices!;
  assert.deepEqual(getCarouselPreloadIndices(0, 0), []);
  assert.deepEqual(getCarouselPreloadIndices(0, 1), [0]);
  assert.deepEqual(getCarouselPreloadIndices(0, 5), [4, 0, 1]);
  assert.deepEqual(getCarouselPreloadIndices(4, 5), [3, 4, 0]);
});
