import type { MediaReference } from "../types";

export type RevealDirection = "from-left" | "from-right";

export function Media({
  media,
  className = "",
  preview = false,
  revealDirection,
  loading = "lazy",
}: {
  media: MediaReference;
  className?: string;
  preview?: boolean;
  revealDirection?: RevealDirection;
  loading?: "eager" | "lazy";
}) {
  if (media.assetId) {
    const contentPath = preview
      ? `/api/admin/media/${media.assetId}/content`
      : `/api/media/${media.assetId}/content`;
    return (
      <img
        className={`media ${className}`}
        src={contentPath}
        alt={media.alt}
        data-reveal={revealDirection}
        loading={loading}
      />
    );
  }

  return (
    <div
      className={`media media--placeholder ${className}`}
      role="img"
      aria-label={media.alt || "사진 준비 중"}
      data-reveal={revealDirection}
    >
      <span>{media.placeholder || "PHOTO"}</span>
    </div>
  );
}
