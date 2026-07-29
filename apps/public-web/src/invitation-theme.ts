import type { InvitationDesign } from "./types";

const sicilianNoirDesign: InvitationDesign = {
  themeId: "sicilian-noir",
  colors: {
    paper: "#f7f1e7",
    ink: "#171412",
    muted: "#766f65",
    line: "#d7c9b5",
    accent: "#b94125",
    surface: "#efe3d2",
  },
  typography: {
    display: "\"Avenir Next\", \"Helvetica Neue\", Arial, Pretendard, \"Noto Sans KR\", sans-serif",
    body: "\"Avenir Next\", \"Helvetica Neue\", Arial, Pretendard, \"Noto Sans KR\", sans-serif",
  },
  radius: 2,
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
