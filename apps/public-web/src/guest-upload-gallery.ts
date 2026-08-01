import type { MediaReference } from "./types";

export type GuestUploadPhoto = {
  id: string;
  url: string;
  alt: string;
};

export type GuestUploadGallery =
  | { source: "guest"; items: readonly GuestUploadPhoto[] }
  | { source: "fallback"; items: readonly MediaReference[] };

export function selectGuestUploadGallery(
  guestPhotos: readonly GuestUploadPhoto[],
  fallbackItems: readonly MediaReference[],
): GuestUploadGallery {
  if (guestPhotos.length > 0) return { source: "guest", items: guestPhotos };
  return { source: "fallback", items: fallbackItems.filter((item) => item.assetId).slice(0, 3) };
}
