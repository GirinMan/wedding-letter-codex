export function moveCarouselIndex(index: number, direction: -1 | 1, count: number) {
  if (count <= 1) return 0;
  return (index + direction + count) % count;
}

export function getCarouselPreloadIndices(activeIndex: number, count: number) {
  if (count <= 0) return [];
  if (count === 1) return [0];
  return [
    moveCarouselIndex(activeIndex, -1, count),
    activeIndex,
    moveCarouselIndex(activeIndex, 1, count),
  ];
}
