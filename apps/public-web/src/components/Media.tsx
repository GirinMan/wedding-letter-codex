import type { MediaReference } from "../types";

export function Media({
  media,
  className = "",
}: {
  media: MediaReference;
  className?: string;
}) {
  if (media.assetId) {
    return (
      <img
        className={`media ${className}`}
        src={`/api/media/${media.assetId}/content`}
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
