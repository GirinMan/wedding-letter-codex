import type { InvitationContent } from "./types";

export interface FaviconDescriptor {
  href: string;
  type?: string;
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function resolveInvitationFavicon(
  favicon: InvitationContent["favicon"],
  preview: boolean,
  revision: number,
): FaviconDescriptor | null {
  if (favicon.mode === "emoji") {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><text x="32" y="52" font-size="52" text-anchor="middle">${escapeXml(favicon.emoji)}</text></svg>`;
    return {
      href: `data:image/svg+xml,${encodeURIComponent(svg)}`,
      type: "image/svg+xml",
    };
  }

  if (favicon.mode === "image" && favicon.assetId) {
    const mediaBase = preview ? "/api/admin/media" : "/api/media";
    return {
      href: `${mediaBase}/${favicon.assetId}/content?v=${revision}`,
    };
  }

  return null;
}
