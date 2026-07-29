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
