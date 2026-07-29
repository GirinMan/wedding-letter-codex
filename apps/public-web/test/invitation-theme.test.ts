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

test("legacy Sicilian Noir drafts render with the current limestone and noir token set", async () => {
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
  });
});

test("Sicilian Noir uses bundled generated artwork only for empty media", async () => {
  const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  const artwork = await readFile(
    new URL("../public/assets/sicilian-editorial-terrace.jpg", import.meta.url),
  ).catch(() => null);

  assert.ok(artwork && artwork.byteLength > 100_000, "generated artwork should be bundled");
  assert.match(
    styles,
    /--sicilian-editorial-art:\s*url\("\/assets\/sicilian-editorial-terrace\.jpg"\)/,
  );
  assert.match(
    styles,
    /\.catalog-hero__visual \.media--placeholder:nth-child\(3\)/,
  );
  assert.match(
    styles,
    /\.middle-image \.media--placeholder/,
  );
  assert.match(
    styles,
    /\.closing__image\.media--placeholder/,
  );
});

test("Sicilian Noir balances a noir catalog hero with a Sicilian tile signature", async () => {
  const [app, styles] = await Promise.all([
    readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/styles.css", import.meta.url), "utf8"),
  ]);

  assert.match(app, /resolvedDesign\.themeId === "sicilian-noir"/);
  assert.match(app, /className="catalog-hero"/);
  assert.match(app, /className="catalog-hero__masthead"/);
  assert.match(app, /className="catalog-hero__visual"/);
  assert.match(app, /className="catalog-hero__tile-ribbon"/);
  assert.match(styles, /\.catalog-hero__masthead/);
  assert.match(styles, /\.catalog-hero__visual/);
  assert.match(styles, /\.catalog-hero__tile-ribbon/);
  assert.match(styles, /--sicilian-cobalt:\s*#21558a/i);
  assert.match(styles, /--sicilian-lemon:\s*#e5b927/i);
  assert.match(styles, /--sicilian-terracotta:\s*#b94125/i);
  assert.match(styles, /--sicilian-bougainvillea:\s*#963c61/i);
  assert.doesNotMatch(styles, /\.page-shell\[data-theme="sicilian-noir"\] \.hero::after/);
  assert.doesNotMatch(styles, /border-radius:\s*140px 140px 0 0/);
});

test("Sicilian Noir removes wireframe rules from sections and hero placeholders", async () => {
  const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

  assert.match(
    styles,
    /\.page-shell\[data-theme="sicilian-noir"\] \.section\s*\{[^}]*border-bottom:\s*0;/s,
  );
  assert.match(
    styles,
    /\.catalog-hero__visual \.media--placeholder\s*\{[^}]*border:\s*0;/s,
  );
});
