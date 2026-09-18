import type { CSSProperties } from "react";
import type { InvitationDesign } from "./types";

const sicilianNoirDesign: InvitationDesign = {
  themeId: "sicilian-noir",
  colors: {
    paper: "#ffffff",
    ink: "#0a0a0a",
    muted: "#6f6f6f",
    line: "#dedede",
    accent: "#0a0a0a",
    surface: "#f4f4f4",
  },
  typography: {
    display: "\"Avenir Next\", \"Helvetica Neue\", Arial, Pretendard, \"Noto Sans KR\", sans-serif",
    body: "\"Avenir Next\", \"Helvetica Neue\", Arial, Pretendard, \"Noto Sans KR\", sans-serif",
  },
  radius: 0,
  spacing: { section: 96, content: 24 },
  motion: { reveal: "fade", durationMs: 700 },
  customProfiles: [],
  activeCustomProfileId: null,
};

const photoEditorialDesign: InvitationDesign = {
  ...sicilianNoirDesign,
  themeId: "photo-editorial",
};

export function invitationThemeAttributes(
  themeId: InvitationDesign["themeId"],
): { "data-theme": InvitationDesign["themeId"] } {
  return { "data-theme": themeId };
}

export function resolveInvitationThemeDesign(
  design: InvitationDesign,
): InvitationDesign {
  const activeCustomProfile = design.customProfiles.find(
    (profile) => profile.id === design.activeCustomProfileId,
  );
  if (activeCustomProfile) {
    return {
      ...design,
      themeId: activeCustomProfile.baseThemeId,
      ...structuredClone(activeCustomProfile.tokens),
    };
  }

  if (design.themeId === "sicilian-noir") return structuredClone(sicilianNoirDesign);
  if (design.themeId === "photo-editorial") return structuredClone(photoEditorialDesign);
  return design;
}

export function invitationThemeStyle(design: InvitationDesign): CSSProperties {
  return {
    "--paper": design.colors.paper,
    "--ink": design.colors.ink,
    "--muted": design.colors.muted,
    "--line": design.colors.line,
    "--accent": design.colors.accent,
    "--surface": design.colors.surface,
    "--radius": `${design.radius}px`,
    "--section-space": `${design.spacing.section}px`,
    "--content-space": `${design.spacing.content}px`,
    "--display-font": design.typography.display,
    "--body-font": design.typography.body,
    "--motion-duration": `${design.motion.durationMs}ms`,
  } as CSSProperties;
}
