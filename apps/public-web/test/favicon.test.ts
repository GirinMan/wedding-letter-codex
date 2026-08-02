import assert from "node:assert/strict";
import test from "node:test";

test("emoji favicon renders as an encoded SVG data URL", async () => {
  const favicon = await import("../src/favicon.ts").catch(() => null);

  assert.ok(favicon, "favicon helper should exist");
  const descriptor = favicon.resolveInvitationFavicon(
    { mode: "emoji", emoji: "🌿", assetId: null },
    false,
    12,
  );

  assert.equal(descriptor?.type, "image/svg+xml");
  assert.match(descriptor?.href ?? "", /^data:image\/svg\+xml,/);
  assert.match(decodeURIComponent(descriptor?.href ?? ""), />🌿<\/text>/);
});

test("image favicon uses revisioned public and preview media URLs", async () => {
  const favicon = await import("../src/favicon.ts").catch(() => null);
  const assetId = "11111111-1111-4111-8111-111111111111";

  assert.ok(favicon, "favicon helper should exist");
  assert.deepEqual(
    favicon.resolveInvitationFavicon(
      { mode: "image", emoji: "💍", assetId },
      false,
      7,
    ),
    { href: `/api/media/${assetId}/content?v=7` },
  );
  assert.deepEqual(
    favicon.resolveInvitationFavicon(
      { mode: "image", emoji: "💍", assetId },
      true,
      8,
    ),
    { href: `/api/admin/media/${assetId}/content?v=8` },
  );
});

test("disabled or unassigned image favicon returns no descriptor", async () => {
  const favicon = await import("../src/favicon.ts").catch(() => null);

  assert.ok(favicon, "favicon helper should exist");
  assert.equal(favicon.resolveInvitationFavicon(
    { mode: "none", emoji: "💍", assetId: null },
    false,
    1,
  ), null);
  assert.equal(favicon.resolveInvitationFavicon(
    { mode: "image", emoji: "💍", assetId: null },
    false,
    1,
  ), null);
});
