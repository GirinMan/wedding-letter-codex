export function moveCarouselIndex(index: number, direction: -1 | 1, count: number) {
  if (count <= 1) return 0;
  return (index + direction + count) % count;
}
