import type { InvitationDesign } from "./types";

export interface ThemePreset {
  id: InvitationDesign["themeId"];
  name: string;
  description: string;
  signature: string;
  tokens: Omit<InvitationDesign, "themeId">;
}

export const themePresets: ThemePreset[] = [
  {
    id: "botanic-garden",
    name: "Botanic Garden",
    description: "햇빛이 드는 식물원의 아이보리 종이와 부드러운 꽃잎 색을 담은 테마",
    signature: "여백이 넓고 차분한 보태니컬 청첩장",
    tokens: {
      colors: {
        paper: "#fbfaf7",
        ink: "#171717",
        muted: "#8b8178",
        line: "#e8e3dd",
        accent: "#d9a6a0",
        surface: "#f4f1ec",
      },
      typography: {
        display: "\"Bodoni Moda\", \"Times New Roman\", serif",
        body: "\"Pretendard\", \"Noto Sans KR\", sans-serif",
      },
      radius: 10,
      spacing: { section: 104, content: 24 },
      motion: { reveal: "fade-up", durationMs: 650 },
    },
  },
  {
    id: "sicilian-noir",
    name: "Sicilian Noir",
    description: "검정 패션 카탈로그에 시칠리아 석회벽과 마욜리카 색을 더한 테마",
    signature: "노아르 마스트헤드, 밝은 본문, 컬러 타일 리본과 포토 그리드",
    tokens: {
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
    },
  },
];

export function applyThemePreset(
  current: InvitationDesign,
  themeId: InvitationDesign["themeId"],
): InvitationDesign {
  const preset = themePresets.find((theme) => theme.id === themeId);
  if (!preset) return current;
  return structuredClone({
    themeId: preset.id,
    ...preset.tokens,
  });
}
