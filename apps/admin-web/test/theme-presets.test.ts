import assert from "node:assert/strict";
import test from "node:test";

import type { InvitationDesign } from "../src/types.ts";

const gardenDesign = {
  themeId: "botanic-garden",
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
} satisfies InvitationDesign;

test("theme catalog offers Botanic Garden and Sicilian Noir", async () => {
  const themeModule = await import("../src/theme-presets.ts").catch(() => null);

  assert.ok(themeModule, "theme preset module should exist");
  assert.deepEqual(
    themeModule.themePresets.map((theme) => theme.id),
    ["botanic-garden", "sicilian-noir"],
  );
  assert.equal(themeModule.themePresets[0]?.name, "Botanic Garden");
});

test("applying Sicilian Noir replaces the complete design token set without mutating the draft", async () => {
  const themeModule = await import("../src/theme-presets.ts").catch(() => null);

  assert.ok(themeModule, "theme preset module should exist");
  const themed = themeModule.applyThemePreset(gardenDesign, "sicilian-noir");

  assert.equal(themed.themeId, "sicilian-noir");
  assert.deepEqual(themed.colors, {
    paper: "#ffffff",
    ink: "#0a0a0a",
    muted: "#6f6f6f",
    line: "#dedede",
    accent: "#0a0a0a",
    surface: "#f4f4f4",
  });
  assert.match(themed.typography.display, /Avenir Next/);
  assert.match(themed.typography.body, /Avenir Next/);
  assert.doesNotMatch(themed.typography.display, /Bodoni|Didot|Noto Serif/i);
  assert.doesNotMatch(themed.typography.body, /Bodoni|Didot|Noto Serif/i);
  assert.equal(themed.radius, 0);
  assert.equal(themed.motion.reveal, "fade");
  assert.equal(gardenDesign.themeId, "botanic-garden");
  assert.equal(gardenDesign.colors.paper, "#fbfaf7");
});
