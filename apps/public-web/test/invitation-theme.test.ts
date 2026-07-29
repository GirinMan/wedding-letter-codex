import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("public invitation exposes the selected theme as a stable DOM attribute", async () => {
  const themeModule = await import("../src/invitation-theme.ts").catch(() => null);

  assert.ok(themeModule, "public invitation theme module should exist");
  assert.deepEqual(themeModule.invitationThemeAttributes("sicilian-noir"), {
    "data-theme": "sicilian-noir",
  });
  assert.deepEqual(themeModule.invitationThemeAttributes("botanic-garden"), {
    "data-theme": "botanic-garden",
  });
});

test("legacy Sicilian Noir drafts render with the current monochrome sans-serif token set", async () => {
  const themeModule = await import("../src/invitation-theme.ts").catch(() => null);
  const legacyDesign = {
    themeId: "sicilian-noir" as const,
    colors: {
      paper: "#070707",
      ink: "#f5f0e8",
      muted: "#aaa19a",
      line: "#2f2b28",
      accent: "#a6262f",
      surface: "#11100f",
    },
    typography: {
      display: "\"Bodoni Moda\", Didot, serif",
      body: "\"Avenir Next\", sans-serif",
    },
    radius: 0,
    spacing: { section: 136, content: 28 },
    motion: { reveal: "fade" as const, durationMs: 900 },
  };

  assert.ok(themeModule, "public invitation theme module should exist");
  assert.deepEqual(themeModule.resolveInvitationThemeDesign(legacyDesign), {
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
  });
});

test("Sicilian Noir does not depend on generated ornamental artwork", async () => {
  const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

  assert.doesNotMatch(styles, /sicilian-noir-ornament/);
});

test("Sicilian Noir uses a monochrome catalog hero instead of the old arch composition", async () => {
  const [app, styles] = await Promise.all([
    readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/styles.css", import.meta.url), "utf8"),
  ]);

  assert.match(app, /resolvedDesign\.themeId === "sicilian-noir"/);
  assert.match(app, /className="catalog-hero"/);
  assert.match(app, /className="catalog-hero__masthead"/);
  assert.match(app, /className="catalog-hero__visual"/);
  assert.match(styles, /\.catalog-hero__masthead/);
  assert.match(styles, /\.catalog-hero__visual/);
  assert.doesNotMatch(styles, /#a6262f/i);
  assert.doesNotMatch(styles, /\.page-shell\[data-theme="sicilian-noir"\] \.hero::after/);
  assert.doesNotMatch(styles, /border-radius:\s*140px 140px 0 0/);
});
