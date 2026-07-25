import type { MediaReference } from "../types";

export function Media({
  media,
  className = "",
  preview = false,
}: {
  media: MediaReference;
  className?: string;
  preview?: boolean;
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
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={`media media--placeholder ${className}`}
      role="img"
      aria-label={media.alt || "사진 준비 중"}
    >
      <span>{media.placeholder || "PHOTO"}</span>
    </div>
  );
}
