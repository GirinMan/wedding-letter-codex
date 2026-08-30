import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("RSVP-origin guestbook entries have a unique source and no public deletion secret", async () => {
  const migration = await readFile(
    new URL("../migrations/004_link_rsvps_to_guestbook.sql", import.meta.url),
    "utf8",
  ).catch(() => "");

  assert.match(migration, /password_verifier\s+DROP NOT NULL/i);
  assert.match(migration, /source_rsvp_id\s+uuid/i);
  assert.match(migration, /UNIQUE\s*\(source_rsvp_id\)/i);
  assert.match(migration, /UNIQUE\s*\(id, invitation_id\)/i);
  assert.match(
    migration,
    /FOREIGN KEY\s*\(source_rsvp_id, invitation_id\)\s+REFERENCES\s+rsvps\s*\(id, invitation_id\)\s+ON DELETE CASCADE/is,
  );
  assert.match(
    migration,
    /password_verifier IS NOT NULL AND source_rsvp_id IS NULL[\s\S]*password_verifier IS NULL AND source_rsvp_id IS NOT NULL/i,
  );
});

test("RSVP CSV qualifies joined fields and reads the guestbook SSOT", async () => {
  const adminRoutes = await readFile(
    new URL("../src/routes/admin.ts", import.meta.url),
    "utf8",
  );

  assert.match(adminRoutes, /SELECT\s+r\.created_at,\s+r\.attending,\s+r\.party,\s+r\.name,/s);
  assert.match(adminRoutes, /COALESCE\(g\.message, r\.note\) AS note/);
  assert.doesNotMatch(adminRoutes, /no_rsvp_notes_promoted/);
});

test("new RSVP guestbook entries copy the database timestamp without a Date round trip", async () => {
  const publicRoutes = await readFile(
    new URL("../src/routes/public.ts", import.meta.url),
    "utf8",
  );

  assert.match(
    publicRoutes,
    /SELECT[\s\S]*r\.id,[\s\S]*r\.created_at[\s\S]*FROM rsvps r[\s\S]*WHERE r\.id = \$\{rsvp\.id\}/,
  );
});

test("RSVP-origin entries are excluded from public password deletion", async () => {
  const publicRoutes = await readFile(
    new URL("../src/routes/public.ts", import.meta.url),
    "utf8",
  );

  assert.match(
    publicRoutes,
    /SELECT password_verifier[\s\S]*state = 'visible'[\s\S]*source_rsvp_id IS NULL[\s\S]*LIMIT 1/,
  );
});

test("selective promotion records its audit event inside the transaction", async () => {
  const adminRoutes = await readFile(
    new URL("../src/routes/admin.ts", import.meta.url),
    "utf8",
  );

  const promotionStart = adminRoutes.indexOf('app.post("/api/admin/invitations/:id/rsvps/promote-notes"');
  const promotionEnd = adminRoutes.indexOf('app.get("/api/admin/invitations/:id/guestbook"', promotionStart);
  const promotionRoute = adminRoutes.slice(promotionStart, promotionEnd);
  const transactionStart = promotionRoute.indexOf("sql.begin");
  const transactionEnd = promotionRoute.indexOf("return { promotedIds }");
  const transactionBody = promotionRoute.slice(transactionStart, transactionEnd);

  assert.match(transactionBody, /recordAudit\([\s\S]*transaction/);
  assert.doesNotMatch(promotionRoute.slice(transactionEnd), /recordAudit/);
});
