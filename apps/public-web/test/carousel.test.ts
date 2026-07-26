import assert from "node:assert/strict";
import test from "node:test";

import { moveCarouselIndex } from "../src/carousel.ts";

test("carousel navigation wraps in both directions", () => {
  assert.equal(moveCarouselIndex(0, -1, 3), 2);
  assert.equal(moveCarouselIndex(2, 1, 3), 0);
  assert.equal(moveCarouselIndex(1, 1, 3), 2);
});

test("carousel navigation stays at zero for an empty or single-item list", () => {
  assert.equal(moveCarouselIndex(0, 1, 0), 0);
  assert.equal(moveCarouselIndex(0, -1, 1), 0);
});
