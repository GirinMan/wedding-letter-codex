import { access, readFile } from "node:fs/promises";
import path from "node:path";

import { invitation } from "../app/data/invitation.js";
import { formatWeddingDate } from "../app/scripts/lib/date.js";
import { hasPlaceholder, isNonEmptyString } from "../app/scripts/lib/content.js";

const REQUIRED_TOKENS = [
  "--font-display",
  "--font-body",
  "--font-ui",
  "--color-canvas",
  "--color-surface",
  "--color-text",
  "--color-muted",
  "--color-border",
  "--color-accent",
  "--color-accent-contrast",
  "--color-focus",
  "--space-section",
  "--space-gutter",
  "--content-width",
  "--radius-control",
  "--radius-media",
  "--shadow-elevated",
  "--duration-fast",
  "--duration-base",
  "--ease-standard",
];

const errors = [];
const warnings = [];

function requireString(value, field) {
  if (!isNonEmptyString(value)) errors.push(`${field} must be a non-empty string`);
}

function validateUrl(value, field, required) {
  if (!isNonEmptyString(value)) {
    if (required) errors.push(`${field} must be set when its feature is enabled`);
    return;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== "https:") warnings.push(`${field} should use https`);
  } catch {
    errors.push(`${field} must be an absolute URL`);
  }
}

async function validateLocalAsset(src, field) {
  if (!isNonEmptyString(src) || /^(https?:)?\/\//.test(src)) return;
  const relative = src.replace(/^\.\//, "");
  try {
    await access(path.resolve("app", relative));
  } catch {
    errors.push(`${field} points to a missing local file: ${src}`);
  }
}

function collectPlaceholders(value, field = "invitation") {
  if (typeof value === "string" && hasPlaceholder(value)) {
    warnings.push(`${field} still contains a placeholder: ${value}`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectPlaceholders(item, `${field}[${index}]`));
    return;
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => collectPlaceholders(item, `${field}.${key}`));
  }
}

async function validateDesignSystem() {
  const html = await readFile("app/index.html", "utf8");
  const match = html.match(
    /<link\s+rel="stylesheet"\s+href="\.\/(design-systems\/[^"]+\.css)"\s*\/?>/,
  );
  if (!match) {
    errors.push("app/index.html must load exactly one design-system stylesheet");
    return;
  }

  const css = await readFile(path.resolve("app", match[1]), "utf8");
  for (const token of REQUIRED_TOKENS) {
    if (!css.includes(`${token}:`)) errors.push(`active design system is missing ${token}`);
  }
}

requireString(invitation.meta.title, "meta.title");
requireString(invitation.meta.description, "meta.description");
requireString(invitation.couple.partner1.name, "couple.partner1.name");
requireString(invitation.couple.partner2.name, "couple.partner2.name");
requireString(invitation.event.venueName, "event.venueName");
requireString(invitation.event.address, "event.address");
requireString(invitation.copy.greeting, "copy.greeting");

try {
  formatWeddingDate(invitation.event.date, invitation.event.time);
} catch (error) {
  errors.push(error.message);
}

try {
  new Intl.DateTimeFormat("ko-KR", { timeZone: invitation.event.timezone }).format();
} catch {
  errors.push(`event.timezone is invalid: ${invitation.event.timezone}`);
}

validateUrl(invitation.event.mapUrl, "event.mapUrl", false);
validateUrl(
  invitation.rsvp.url,
  "rsvp.url",
  invitation.features.rsvp && invitation.rsvp.enabled,
);
validateUrl(invitation.meta.canonicalUrl, "meta.canonicalUrl", false);

if (invitation.features.music && !invitation.music.enabled) {
  errors.push("features.music requires music.enabled");
}
if (invitation.music.enabled && !isNonEmptyString(invitation.music.src)) {
  errors.push("music.src must be set when music is enabled");
}
if (invitation.features.gallery && invitation.gallery.length === 0) {
  errors.push("features.gallery requires at least one gallery item");
}
if (invitation.features.accounts && invitation.accounts.length === 0) {
  errors.push("features.accounts requires at least one account");
}

await Promise.all(
  invitation.gallery.map(async (image, index) => {
    requireString(image.alt, `gallery[${index}].alt`);
    if (!Number.isInteger(image.width) || image.width <= 0) {
      errors.push(`gallery[${index}].width must be a positive integer`);
    }
    if (!Number.isInteger(image.height) || image.height <= 0) {
      errors.push(`gallery[${index}].height must be a positive integer`);
    }
    await validateLocalAsset(image.src, `gallery[${index}].src`);
  }),
);

if (invitation.music.enabled) {
  await validateLocalAsset(invitation.music.src, "music.src");
}

await validateDesignSystem();
collectPlaceholders(invitation);

for (const warning of warnings) console.warn(`WARN  ${warning}`);
for (const error of errors) console.error(`ERROR ${error}`);

if (errors.length > 0) {
  console.error(`\nValidation failed with ${errors.length} error(s).`);
  process.exitCode = 1;
} else {
  console.log(`\nInvitation is valid (${warnings.length} placeholder warning(s)).`);
}
