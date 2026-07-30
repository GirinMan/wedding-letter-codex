import type { GuestbookEntry } from "./types";

const maximumAutomaticLetters = 3;
const firstRevealViewportRatio = 0.75;
const subsequentRevealViewportRatio = 1.25;

export function chooseAmbientGuestbookEntry(
  entries: GuestbookEntry[],
  shownIds: ReadonlySet<string>,
  randomValue = Math.random(),
) {
  const unseenEntries = entries.filter((entry) => !shownIds.has(entry.id));
  if (unseenEntries.length === 0) return null;

  const normalizedRandom = Math.max(0, Math.min(randomValue, 0.999_999));
  return unseenEntries[Math.floor(normalizedRandom * unseenEntries.length)] ?? null;
}

export function shouldRevealAmbientGuestbook({
  entryCount,
  shownCount,
  scrollY,
  viewportHeight,
  lastRevealY,
  blocked,
  reducedMotion,
}: {
  entryCount: number;
  shownCount: number;
  scrollY: number;
  viewportHeight: number;
  lastRevealY: number | null;
  blocked: boolean;
  reducedMotion: boolean;
}) {
  if (
    entryCount <= shownCount
    || shownCount >= maximumAutomaticLetters
    || blocked
    || reducedMotion
  ) {
    return false;
  }

  if (lastRevealY === null) {
    return scrollY >= viewportHeight * firstRevealViewportRatio;
  }

  return scrollY - lastRevealY >= viewportHeight * subsequentRevealViewportRatio;
}
