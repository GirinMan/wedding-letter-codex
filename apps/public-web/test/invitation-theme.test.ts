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
  assert.deepEqual(themeModule.invitationThemeAttributes("photo-editorial"), {
    "data-theme": "photo-editorial",
  });
});

test("legacy Sicilian Noir drafts render with the current black and white token set", async () => {
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
    customProfiles: [],
    activeCustomProfileId: null,
  };

  assert.ok(themeModule, "public invitation theme module should exist");
  assert.deepEqual(themeModule.resolveInvitationThemeDesign(legacyDesign), {
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
  });
});

test("Photo Editorial drafts retain their photo layout while resolving to Sicilian Noir tokens", async () => {
  const themeModule = await import("../src/invitation-theme.ts").catch(() => null);
  const legacyPhotoEditorial = {
    themeId: "photo-editorial" as const,
    colors: { paper: "#ffffff", ink: "#161412", muted: "#746d67", line: "#e1ddd8", accent: "#c3a88d", surface: "#f5f3f0" },
    typography: {
      display: "\"Cormorant Garamond\", \"Times New Roman\", Pretendard, \"Noto Sans KR\", serif",
      body: "\"Pretendard\", \"Noto Sans KR\", sans-serif",
    },
    radius: 0,
    spacing: { section: 96, content: 24 },
    motion: { reveal: "fade" as const, durationMs: 700 },
    customProfiles: [],
    activeCustomProfileId: null,
  };

  assert.ok(themeModule, "public invitation theme module should exist");
  const resolved = themeModule.resolveInvitationThemeDesign(legacyPhotoEditorial);
  assert.equal(resolved.themeId, "photo-editorial");
  assert.deepEqual(resolved.colors, {
    paper: "#ffffff",
    ink: "#0a0a0a",
    muted: "#6f6f6f",
    line: "#dedede",
    accent: "#0a0a0a",
    surface: "#f4f4f4",
  });
  assert.match(resolved.typography.display, /Avenir Next/);
  assert.match(resolved.typography.body, /Avenir Next/);
});

test("an active custom profile preserves its tokens while retaining its base theme layout", async () => {
  const themeModule = await import("../src/invitation-theme.ts");
  const customDesign = {
    themeId: "sicilian-noir" as const,
    colors: { paper: "#ffffff", ink: "#0a0a0a", muted: "#6f6f6f", line: "#dedede", accent: "#0a0a0a", surface: "#f4f4f4" },
    typography: { display: "sans-serif", body: "sans-serif" },
    radius: 0,
    spacing: { section: 96, content: 24 },
    motion: { reveal: "fade" as const, durationMs: 700 },
    customProfiles: [{
      id: "custom-noir",
      name: "Noir with rose",
      baseThemeId: "sicilian-noir" as const,
      tokens: {
        colors: { paper: "#fff8f5", ink: "#21120f", muted: "#806c65", line: "#e4d3cd", accent: "#b76e79", surface: "#f9eeea" },
        typography: { display: "Georgia, serif", body: "Arial, sans-serif" },
        radius: 12,
        spacing: { section: 112, content: 28 },
        motion: { reveal: "fade-up" as const, durationMs: 500 },
      },
    }],
    activeCustomProfileId: "custom-noir",
  };

  assert.ok(themeModule, "public invitation theme module should exist");
  const resolved = themeModule.resolveInvitationThemeDesign(customDesign);
  assert.equal(resolved.themeId, "sicilian-noir");
  assert.equal(resolved.colors.accent, "#b76e79");
  assert.equal(resolved.typography.display, "Georgia, serif");
  assert.equal(resolved.radius, 12);
});

test("Sicilian Noir uses generated Sicilian architecture only as the middle background", async () => {
  const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  const artwork = await readFile(
    new URL("../public/assets/sicilian-courtyard-transition.webp", import.meta.url),
  ).catch(() => null);

  assert.ok(artwork && artwork.byteLength > 100_000, "generated artwork should be bundled");
  assert.match(
    styles,
    /--sicilian-transition-art:\s*url\("\/assets\/sicilian-courtyard-transition\.webp"\)/,
  );
  assert.match(
    styles,
    /\.middle-image \.media--placeholder\s*\{[^}]*var\(--sicilian-transition-art\)/s,
  );
  assert.doesNotMatch(styles, /--sicilian-editorial-art/);
  assert.doesNotMatch(styles, /sicilian-wedding-paper-festa\.jpg/);
});

test("Sicilian Noir distributes generated ceramic details through decorative layers", async () => {
  const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  const [frieze, medallion, calendarRail] = await Promise.all([
    readFile(new URL("../public/assets/sicilian-ornamental-frieze.webp", import.meta.url)),
    readFile(new URL("../public/assets/sicilian-star-medallion.png", import.meta.url)),
    readFile(new URL("../public/assets/sicilian-calendar-ornament.webp", import.meta.url)),
  ]);

  assert.ok(frieze.byteLength > 100_000, "the horizontal ceramic frieze should be bundled");
  assert.ok(medallion.byteLength > 4_000, "the section medallion should be bundled");
  assert.deepEqual(
    [...medallion.subarray(1, 4)],
    [0x50, 0x4e, 0x47],
    "the section medallion should be a PNG",
  );
  assert.equal(
    medallion[25],
    6,
    "the section medallion should use RGBA pixels so dark sections do not show a white tile",
  );
  assert.ok(calendarRail.byteLength > 20_000, "the modern calendar rail should be bundled");
  assert.match(
    styles,
    /--sicilian-frieze-art:\s*url\("\/assets\/sicilian-ornamental-frieze\.webp"\)/,
  );
  assert.match(
    styles,
    /--sicilian-medallion-art:\s*url\("\/assets\/sicilian-star-medallion\.png"\)/,
  );
  assert.match(
    styles,
    /--sicilian-calendar-rail-art:\s*url\("\/assets\/sicilian-calendar-ornament\.webp"\)/,
  );
  assert.match(
    styles,
    /\.catalog-hero__tile-ribbon\s*\{[^}]*var\(--sicilian-frieze-art\)/s,
  );
  assert.match(
    styles,
    /\.section-heading \.eyebrow::before\s*\{[^}]*width:\s*22px;[^}]*height:\s*22px;[^}]*var\(--sicilian-medallion-art\)/s,
  );
  assert.match(
    styles,
    /\.page-shell--catalog \.calendar::after\s*\{[^}]*top:\s*0;[^}]*right:\s*0;[^}]*bottom:\s*0;[^}]*width:\s*42px;[^}]*var\(--sicilian-calendar-rail-art\) center top\s*\/\s*100% auto repeat-y;/s,
  );
  assert.doesNotMatch(
    styles,
    /var\(--sicilian-calendar-rail-art\)[^;]*100% 100%/,
  );
  assert.doesNotMatch(styles, /#invitation-section-accounts::after/);
  assert.doesNotMatch(styles, /sicilian-margin-inlay\.webp/);
  assert.match(styles, /--sicilian-frieze-height:\s*44px;/);
  assert.match(
    styles,
    /\.catalog-hero__tile-ribbon\s*\{[^}]*height:\s*var\(--sicilian-frieze-height\);/s,
  );
  assert.match(
    styles,
    /\.closing::before\s*\{[^}]*height:\s*var\(--sicilian-frieze-height\);[^}]*var\(--sicilian-frieze-art\)/s,
  );
});

test("Sicilian Noir keeps only the star medallion in the RSVP welcome dialog", async () => {
  const [app, styles] = await Promise.all([
    readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/styles.css", import.meta.url), "utf8"),
  ]);

  assert.match(
    styles,
    /\.page-shell--catalog \.dialog--rsvp-welcome\s*\{[^}]*border-radius:\s*0;[^}]*background:\s*var\(--paper\);[^}]*font-family:\s*var\(--body-font\);/s,
  );
  assert.match(
    styles,
    /\.page-shell--catalog \.dialog--rsvp-welcome \.dialog__header\s*\{[^}]*background:\s*var\(--ink\);[^}]*color:\s*var\(--paper\);/s,
  );
  assert.doesNotMatch(
    styles,
    /\.page-shell--catalog \.dialog--rsvp-welcome \.dialog__header::after/,
  );
  assert.match(app, /className="rsvp-welcome__icon"/);
  assert.match(
    styles,
    /\.page-shell--catalog \.rsvp-welcome__icon\s*\{[^}]*var\(--sicilian-medallion-art\)/s,
  );
});

test("Sicilian Noir keeps the secondary closing share action visible on black", async () => {
  const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

  assert.match(
    styles,
    /\.page-shell--catalog \.closing \.share-button--secondary\s*\{[^}]*border-color:\s*#fff;[^}]*color:\s*#fff;/s,
  );
});

test("Sicilian Noir keeps the interface monochrome and sans serif", async () => {
  const [app, styles] = await Promise.all([
    readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/styles.css", import.meta.url), "utf8"),
  ]);

  assert.match(app, /resolvedDesign\.themeId === "sicilian-noir"/);
  assert.match(app, /className="catalog-hero"/);
  assert.match(app, /className="catalog-hero__masthead"/);
  assert.match(
    app,
    /\["INVITÉ", "INVITATION"\]\.includes\(content\.hero\.title\)\s*\?\s*"CELEBRATE L’AMORE"\s*:\s*content\.hero\.title/,
  );
  assert.match(app, /className="catalog-hero__visual"/);
  assert.match(app, /className="catalog-hero__tile-ribbon"/);
  assert.match(styles, /\.catalog-hero__masthead/);
  assert.match(styles, /\.catalog-hero__visual/);
  assert.match(
    styles,
    /\.catalog-hero__tile-ribbon\s*\{[^}]*height:\s*var\(--sicilian-frieze-height\);/s,
  );
  assert.match(
    styles,
    /\.contact-button\s*\{[^}]*display:\s*flex;[^}]*margin:\s*8px auto 0;/s,
  );
  assert.match(styles, /--paper:\s*#fff(?:fff)?;/i);
  assert.match(styles, /--ink:\s*#0a0a0a;/i);
  assert.match(styles, /--surface:\s*#f4f4f4;/i);
  assert.doesNotMatch(styles, /--sicilian-(?:cobalt|lemon|terracotta|bougainvillea):/);
  assert.doesNotMatch(styles, /\.page-shell\[data-theme="sicilian-noir"\] \.hero::after/);
  assert.doesNotMatch(styles, /border-radius:\s*140px 140px 0 0/);
});

test("Sicilian Noir removes wireframe rules from sections and hero placeholders", async () => {
  const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

  assert.match(
    styles,
    /\.page-shell--catalog \.section\s*\{[^}]*border-bottom:\s*0;/s,
  );
  assert.match(
    styles,
    /\.catalog-hero__visual \.media--placeholder\s*\{[^}]*border:\s*0;/s,
  );
});

test("Sicilian Noir photo slots stay neutral and never reuse the transition artwork", async () => {
  const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

  assert.match(
    styles,
    /\.page-shell--catalog \.media--placeholder,\s*[\s\S]*?\.portrait-placeholder\s*\{[^}]*background:\s*#f4f4f4;/s,
    "empty photo slots should use a neutral grayscale surface",
  );
  for (const selector of [
    "catalog-hero__visual",
    "greeting-photo",
    "profile-card__image",
    "interview-card",
    "timeline-card__image",
    "gallery-grid",
    "closing__image",
  ]) {
    const block = styles.match(
      new RegExp(String.raw`[^}]*\.${selector.replaceAll("-", "\\-")}[^{}]*\{[^}]*\}`, "g"),
    )?.join("\n") ?? "";
    assert.doesNotMatch(
      block,
      /var\(--sicilian-(?:transition|frieze|medallion|inlay)-art\)/,
      `${selector} must not use Sicilian decorative artwork as a photo`,
    );
  }
});

test("Photo Editorial uses an uploaded hero image and retains the catalog layout without Sicilian graphics", async () => {
  const [app, styles] = await Promise.all([
    readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/styles.css", import.meta.url), "utf8"),
  ]);

  assert.match(app, /function PhotoEditorialHero/);
  assert.match(app, /media=\{content\.hero\.image\}/);
  assert.match(app, /loading="eager"/);
  assert.match(app, /resolvedDesign\.themeId === "photo-editorial"/);
  assert.match(styles, /\.photo-hero\s*\{[^}]*min-height:\s*100svh;/s);
  assert.match(styles, /\.photo-hero__image\s*\{[^}]*object-fit:\s*cover;/s);
  assert.match(styles, /\.page-shell\[data-theme="photo-editorial"\] \.section-heading \.eyebrow::before[\s\S]*?content:\s*none;/);
  assert.match(styles, /\.page-shell\[data-theme="photo-editorial"\] \.closing::before[\s\S]*?background:\s*none;/);
});

test("Photo Editorial centers the invitation heading and greeting copy", async () => {
  const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

  assert.match(
    styles,
    /\.page-shell\[data-theme="photo-editorial"\] \.invitation-section\s*\{[^}]*text-align:\s*center;/s,
  );
  assert.match(
    styles,
    /\.page-shell\[data-theme="photo-editorial"\] \.invitation-section \.section-heading\s*\{[^}]*text-align:\s*center;/s,
  );
  assert.match(
    styles,
    /\.page-shell\[data-theme="photo-editorial"\] \.invitation-section > \.multiline\s*\{[^}]*text-align:\s*center;/s,
  );
});
