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
    description: "화이트 갤러리와 블랙 타이포 사이에 시칠리아 건축 사진을 배치한 테마",
    signature: "산세리프 흑백 편집 디자인과 한 장의 시칠리아 전환 배경",
    tokens: {
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
