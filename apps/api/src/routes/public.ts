import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { getConfig } from "../config.js";
import { getDatabase } from "../db.js";
import { invitationContentSchema, invitationDesignSchema } from "../domain/invitation.js";
import { createPasswordVerifier, verifyPassword } from "../security/credentials.js";
import { getObject, putObject } from "../storage.js";

const slugParams = z.object({ slug: z.string().regex(/^[a-z0-9-]+$/) });
const idParams = slugParams.extend({ entryId: z.string().uuid() });

const guestbookBody = z.object({
  name: z.string().trim().min(1).max(40),
  message: z.string().trim().min(1).max(500),
  password: z.string().min(4).max(100),
});

const deleteGuestbookBody = z.object({ password: z.string().min(4).max(100) });

const rsvpBody = z.object({
  attending: z.boolean(),
  name: z.string().trim().min(1).max(80),
  party: z.enum(["partnerOne", "partnerTwo"]),
  phone: z.string().trim().min(7).max(30),
  additionalGuests: z.number().int().min(0).max(20).default(0),
  meal: z.enum(["yes", "no", "undecided"]).nullable().default(null),
  shuttle: z.enum(["yes", "no", "undecided"]).nullable().default(null),
  note: z.string().trim().max(300).default(""),
  privacyConsent: z.literal(true),
});

const allowedGuestUploadTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

interface InvitationRow {
  id: string;
  slug: string;
  publishedContent: unknown;
  publishedDesign: unknown;
  publishedRevision: number;
  publishedAt: Date;
}

async function findPublishedInvitation(slug: string): Promise<InvitationRow | undefined> {
  const sql = getDatabase();
  const [row] = await sql<InvitationRow[]>`
    SELECT id, slug, published_content, published_design, published_revision, published_at
    FROM invitations
    WHERE slug = ${slug}
      AND status = 'published'
      AND published_content IS NOT NULL
      AND published_design IS NOT NULL
    LIMIT 1
  `;
  return row;
}

export async function registerPublicRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/public/invitations/:slug", async (request, reply) => {
    const { slug } = slugParams.parse(request.params);
    const invitation = await findPublishedInvitation(slug);
    if (!invitation) {
      return reply.code(404).send({ error: "invitation_not_found" });
    }

    const content = invitationContentSchema.parse(invitation.publishedContent);
    const design = invitationDesignSchema.parse(invitation.publishedDesign);
    return {
      slug: invitation.slug,
      revision: invitation.publishedRevision,
      publishedAt: invitation.publishedAt,
      content,
      design,
    };
  });

  app.get("/api/public/invitations/:slug/guestbook", async (request, reply) => {
    const { slug } = slugParams.parse(request.params);
    const query = z.object({
      cursor: z.string().datetime({ offset: true }).optional(),
      limit: z.coerce.number().int().min(1).max(50).default(20),
    }).parse(request.query);
    const invitation = await findPublishedInvitation(slug);
    if (!invitation) {
      return reply.code(404).send({ error: "invitation_not_found" });
    }

    const sql = getDatabase();
    const rows = query.cursor
      ? await sql`
          SELECT id, name, message, created_at
          FROM guestbook_entries
          WHERE invitation_id = ${invitation.id}
            AND state = 'visible'
            AND created_at < ${query.cursor}
          ORDER BY created_at DESC
          LIMIT ${query.limit}
        `
      : await sql`
          SELECT id, name, message, created_at
          FROM guestbook_entries
          WHERE invitation_id = ${invitation.id}
            AND state = 'visible'
          ORDER BY created_at DESC
          LIMIT ${query.limit}
        `;

    const last = rows.at(-1);
    return {
      entries: rows,
      nextCursor: last?.createdAt instanceof Date ? last.createdAt.toISOString() : null,
    };
  });

  app.post("/api/public/invitations/:slug/guestbook", {
    config: { rateLimit: { max: 5, timeWindow: "10 minutes" } },
  }, async (request, reply) => {
    const { slug } = slugParams.parse(request.params);
    const body = guestbookBody.parse(request.body);
    const invitation = await findPublishedInvitation(slug);
    if (!invitation) {
      return reply.code(404).send({ error: "invitation_not_found" });
    }

    const content = invitationContentSchema.parse(invitation.publishedContent);
    if (!content.guestbook.enabled) {
      return reply.code(403).send({ error: "guestbook_disabled" });
    }

    const sql = getDatabase();
    const [entry] = await sql`
      INSERT INTO guestbook_entries (
        invitation_id,
        name,
        message,
        password_verifier
      )
      VALUES (
        ${invitation.id},
        ${body.name},
        ${body.message},
        ${await createPasswordVerifier(body.password)}
      )
      RETURNING id, name, message, created_at
    `;
    return reply.code(201).send(entry);
  });

  app.delete("/api/public/invitations/:slug/guestbook/:entryId", {
    config: { rateLimit: { max: 10, timeWindow: "10 minutes" } },
  }, async (request, reply) => {
    const { slug, entryId } = idParams.parse(request.params);
    const body = deleteGuestbookBody.parse(request.body);
    const invitation = await findPublishedInvitation(slug);
    if (!invitation) {
      return reply.code(404).send({ error: "invitation_not_found" });
    }

    const sql = getDatabase();
    const [entry] = await sql<{ passwordVerifier: string }[]>`
      SELECT password_verifier
      FROM guestbook_entries
      WHERE id = ${entryId}
        AND invitation_id = ${invitation.id}
        AND state = 'visible'
      LIMIT 1
    `;
    if (!entry || !(await verifyPassword(body.password, entry.passwordVerifier))) {
      return reply.code(403).send({ error: "invalid_password" });
    }

    await sql`
      UPDATE guestbook_entries
      SET state = 'deleted', updated_at = now()
      WHERE id = ${entryId}
    `;
    return reply.code(204).send();
  });

  app.post("/api/public/invitations/:slug/rsvps", {
    config: { rateLimit: { max: 5, timeWindow: "10 minutes" } },
  }, async (request, reply) => {
    const { slug } = slugParams.parse(request.params);
    const body = rsvpBody.parse(request.body);
    const invitation = await findPublishedInvitation(slug);
    if (!invitation) {
      return reply.code(404).send({ error: "invitation_not_found" });
    }

    const content = invitationContentSchema.parse(invitation.publishedContent);
    if (!content.rsvp.enabled) {
      return reply.code(403).send({ error: "rsvp_disabled" });
    }

    const sql = getDatabase();
    const [rsvp] = await sql`
      INSERT INTO rsvps (
        invitation_id,
        attending,
        name,
        party,
        phone,
        additional_guests,
        meal,
        shuttle,
        note
      )
      VALUES (
        ${invitation.id},
        ${body.attending},
        ${body.name},
        ${body.party},
        ${body.phone},
        ${body.additionalGuests},
        ${body.meal},
        ${body.shuttle},
        ${body.note}
      )
      RETURNING id, created_at
    `;
    return reply.code(201).send(rsvp);
  });

  app.post("/api/public/invitations/:slug/guest-uploads", {
    config: { rateLimit: { max: 10, timeWindow: "1 hour" } },
  }, async (request, reply) => {
    const { slug } = slugParams.parse(request.params);
    const invitation = await findPublishedInvitation(slug);
    if (!invitation) {
      return reply.code(404).send({ error: "invitation_not_found" });
    }

    const content = invitationContentSchema.parse(invitation.publishedContent);
    if (!content.guestUploads.enabled || Date.now() < Date.parse(content.guestUploads.opensAt)) {
      return reply.code(403).send({ error: "guest_uploads_not_open" });
    }

    const file = await request.file({
      limits: { files: 1, fileSize: getConfig().MAX_UPLOAD_BYTES },
    });
    if (!file || !allowedGuestUploadTypes.has(file.mimetype)) {
      return reply.code(415).send({ error: "unsupported_media_type" });
    }

    const buffer = await file.toBuffer();
    const extension = file.mimetype.split("/")[1]?.replace("jpeg", "jpg") ?? "bin";
    const objectKey = `guest-uploads/${invitation.id}/${randomUUID()}.${extension}`;
    await putObject({ key: objectKey, body: buffer, contentType: file.mimetype });

    const fields = file.fields as Record<string, { value?: unknown }>;
    const uploaderName = String(fields.uploaderName?.value ?? "").trim().slice(0, 80);
    const note = String(fields.note?.value ?? "").trim().slice(0, 300);
    const sql = getDatabase();
    const [upload] = await sql`
      INSERT INTO guest_uploads (
        invitation_id,
        object_key,
        original_name,
        content_type,
        size_bytes,
        uploader_name,
        note
      )
      VALUES (
        ${invitation.id},
        ${objectKey},
        ${file.filename},
        ${file.mimetype},
        ${buffer.byteLength},
        ${uploaderName},
        ${note}
      )
      RETURNING id, state, created_at
    `;
    return reply.code(201).send(upload);
  });

  app.get("/api/media/:assetId/content", async (request, reply) => {
    const { assetId } = z.object({ assetId: z.string().uuid() }).parse(request.params);
    const sql = getDatabase();
    const [asset] = await sql<{ objectKey: string; contentType: string; sizeBytes: number }[]>`
      SELECT object_key, content_type, size_bytes
      FROM media_assets
      WHERE id = ${assetId}
        AND state = 'published'
      LIMIT 1
    `;
    if (!asset) {
      return reply.code(404).send({ error: "media_not_found" });
    }

    const object = await getObject(asset.objectKey);
    reply.header("Content-Type", object.contentType);
    reply.header("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    reply.header("Content-Length", String(object.contentLength ?? asset.sizeBytes));
    return reply.send(object.body);
  });
}
