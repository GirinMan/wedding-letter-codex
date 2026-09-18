import { mediaImageUrl } from "../image-preload";
import type { MediaReference } from "../types";

export type RevealDirection = "from-left" | "from-right";

export function Media({
  media,
  className = "",
  preview = false,
  revealDirection,
  loading = "lazy",
  onLoad,
}: {
  media: MediaReference;
  className?: string;
  preview?: boolean;
  revealDirection?: RevealDirection;
  loading?: "eager" | "lazy";
  onLoad?: () => void;
}) {
  if (media.assetId) {
    const contentPath = mediaImageUrl(media, preview)!;
    return (
      <img
        className={`media ${className}`}
        src={contentPath}
        alt={media.alt}
        data-reveal={revealDirection}
        decoding="async"
        onLoad={onLoad}
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
