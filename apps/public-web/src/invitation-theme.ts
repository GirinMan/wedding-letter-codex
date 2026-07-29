import type { InvitationDesign } from "./types";

const sicilianNoirDesign: InvitationDesign = {
  themeId: "sicilian-noir",
  colors: {
    paper: "#000000",
    ink: "#ffffff",
    muted: "#a3a3a3",
    line: "#3a3a3a",
    accent: "#ffffff",
    surface: "#0a0a0a",
  },
  typography: {
    display: "\"Avenir Next\", \"Helvetica Neue\", Arial, Pretendard, \"Noto Sans KR\", sans-serif",
    body: "\"Avenir Next\", \"Helvetica Neue\", Arial, Pretendard, \"Noto Sans KR\", sans-serif",
  },
  radius: 0,
  spacing: { section: 88, content: 20 },
  motion: { reveal: "fade", durationMs: 900 },
};

export function invitationThemeAttributes(
  themeId: InvitationDesign["themeId"],
): { "data-theme": InvitationDesign["themeId"] } {
  return { "data-theme": themeId };
}

export function resolveInvitationThemeDesign(
  design: InvitationDesign,
): InvitationDesign {
  return design.themeId === "sicilian-noir"
    ? structuredClone(sicilianNoirDesign)
    : design;
}
