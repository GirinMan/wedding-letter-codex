import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";

import {
  SESSION_COOKIE,
  requireAdmin,
  sessionCookieOptions,
} from "../auth.js";
import { getConfig } from "../config.js";
import { getDatabase } from "../db.js";
import {
  collectInvitationMediaAssetIds,
  createInvitationPreview,
  createMediaPublicationPlan,
  invitationContentSchema,
  invitationDesignSchema,
} from "../domain/invitation.js";
import { createRsvpCsv, type RsvpCsvRow } from "../export/rsvp-csv.js";
import {
  createPasswordVerifier,
  createSessionToken,
  digestSessionToken,
  verifyPassword,
} from "../security/credentials.js";
import {
  deleteObject,
  getObject,
  putObject,
} from "../storage.js";

const invitationParams = z.object({ id: z.string().uuid() });
const assetParams = invitationParams.extend({ assetId: z.string().uuid() });
const entryParams = invitationParams.extend({ entryId: z.string().uuid() });
const uploadParams = invitationParams.extend({ uploadId: z.string().uuid() });

const mediaPurposeSchema = z.enum([
  "hero",
  "greeting",
  "interview",
  "timeline",
  "gallery",
  "middle",
  "closing",
  "music",
]);

const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

async function recordAudit(
  request: FastifyRequest,
  invitationId: string | null,
  action: string,
  details: Record<string, string | number | boolean | null | undefined> = {},
): Promise<void> {
  if (!request.admin) {
    return;
  }
  const sql = getDatabase();
  await sql`
    INSERT INTO audit_events (invitation_id, admin_user_id, action, details)
    VALUES (
      ${invitationId},
      ${request.admin.id},
      ${action},
      ${sql.json(Object.fromEntries(
        Object.entries(details).filter((entry) => entry[1] !== undefined),
      ) as Record<string, string | number | boolean | null>)}
    )
  `;
}

async function invitationExists(id: string): Promise<boolean> {
  const sql = getDatabase();
  const [row] = await sql`SELECT id FROM invitations WHERE id = ${id} LIMIT 1`;
  return Boolean(row);
}

export async function registerAdminRoutes(app: FastifyInstance): Promise<void> {
  app.post("/api/admin/session", {
    config: { rateLimit: { max: 8, timeWindow: "15 minutes" } },
  }, async (request, reply) => {
    const body = z.object({
      email: z.string().email(),
      password: z.string().min(1).max(200),
    }).parse(request.body);
    const sql = getDatabase();
    const [user] = await sql<{
      id: string;
      email: string;
      displayName: string;
      passwordVerifier: string;
    }[]>`
      SELECT id, email, display_name, password_verifier
      FROM admin_users
      WHERE email = ${body.email.toLowerCase()}
        AND active = true
      LIMIT 1
    `;

    if (!user || !(await verifyPassword(body.password, user.passwordVerifier))) {
      return reply.code(401).send({ error: "invalid_credentials" });
    }

    const token = createSessionToken();
    const expiresAt = new Date(
      Date.now() + getConfig().SESSION_DAYS * 24 * 60 * 60 * 1_000,
    );
    await sql`
      INSERT INTO admin_sessions (admin_user_id, token_digest, expires_at)
      VALUES (${user.id}, ${digestSessionToken(token)}, ${expiresAt})
    `;
    reply.setCookie(SESSION_COOKIE, token, sessionCookieOptions());
    return {
      user: { id: user.id, email: user.email, displayName: user.displayName },
      expiresAt,
    };
  });

  app.get("/api/admin/session", async (request, reply) => {
    await requireAdmin(request, reply);
    if (!request.admin) {
      return;
    }
    return { user: request.admin };
  });

  app.delete("/api/admin/session", async (request, reply) => {
    const token = request.cookies[SESSION_COOKIE];
    if (token) {
      const sql = getDatabase();
      await sql`
        DELETE FROM admin_sessions
        WHERE token_digest = ${digestSessionToken(token)}
      `;
    }
    reply.clearCookie(SESSION_COOKIE, { path: "/" });
    return reply.code(204).send();
  });

  app.addHook("preHandler", async (request, reply) => {
    if (
      request.routeOptions.url?.startsWith("/api/admin/")
      && request.routeOptions.url !== "/api/admin/session"
    ) {
      await requireAdmin(request, reply);
    }
  });

  app.get("/api/admin/invitations", async (request) => {
    const sql = getDatabase();
    return {
      invitations: await sql`
        SELECT id, slug, status, revision, published_revision, updated_at, published_at
        FROM invitations
        ORDER BY updated_at DESC
      `,
    };
  });

  app.get("/api/admin/invitations/:id", async (request, reply) => {
    const { id } = invitationParams.parse(request.params);
    const sql = getDatabase();
    const [invitation] = await sql`
      SELECT
        id,
        slug,
        status,
        timezone,
        draft_content,
        draft_design,
        revision,
        published_revision,
        updated_at,
        published_at
      FROM invitations
      WHERE id = ${id}
      LIMIT 1
    `;
    if (!invitation) {
      return reply.code(404).send({ error: "invitation_not_found" });
    }
    return {
      ...invitation,
      draftContent: invitationContentSchema.parse(invitation.draftContent),
      draftDesign: invitationDesignSchema.parse(invitation.draftDesign),
    };
  });

  app.get("/api/admin/invitations/:id/preview", async (request, reply) => {
    const { id } = invitationParams.parse(request.params);
    const sql = getDatabase();
    const [invitation] = await sql<{
      id: string;
      slug: string;
      revision: number;
      draftContent: unknown;
      draftDesign: unknown;
    }[]>`
      SELECT id, slug, revision, draft_content, draft_design
      FROM invitations
      WHERE id = ${id}
      LIMIT 1
    `;
    if (!invitation) {
      return reply.code(404).send({ error: "invitation_not_found" });
    }
    return createInvitationPreview(invitation);
  });

  app.put("/api/admin/invitations/:id/content", async (request, reply) => {
    const { id } = invitationParams.parse(request.params);
    const content = invitationContentSchema.parse(request.body);
    const sql = getDatabase();
    const [invitation] = await sql`
      UPDATE invitations
      SET draft_content = ${sql.json(content)},
          timezone = ${content.event.timezone},
          revision = revision + 1,
          updated_at = now()
      WHERE id = ${id}
      RETURNING id, revision, updated_at
    `;
    if (!invitation) {
      return reply.code(404).send({ error: "invitation_not_found" });
    }
    await recordAudit(request, id, "invitation.content.updated", {
      revision: invitation.revision,
    });
    return invitation;
  });

  app.put("/api/admin/invitations/:id/design", async (request, reply) => {
    const { id } = invitationParams.parse(request.params);
    const design = invitationDesignSchema.parse(request.body);
    const sql = getDatabase();
    const [invitation] = await sql`
      UPDATE invitations
      SET draft_design = ${sql.json(design)},
          revision = revision + 1,
          updated_at = now()
      WHERE id = ${id}
      RETURNING id, revision, updated_at
    `;
    if (!invitation) {
      return reply.code(404).send({ error: "invitation_not_found" });
    }
    await recordAudit(request, id, "invitation.design.updated", {
      revision: invitation.revision,
    });
    return invitation;
  });

  app.post("/api/admin/invitations/:id/publish", async (request, reply) => {
    const { id } = invitationParams.parse(request.params);
    const sql = getDatabase();
    const result = await sql.begin(async (transaction) => {
      const [current] = await transaction<{
        draftContent: unknown;
        draftDesign: unknown;
        revision: number;
      }[]>`
        SELECT draft_content, draft_design, revision
        FROM invitations
        WHERE id = ${id}
        LIMIT 1
        FOR UPDATE
      `;
      if (!current) {
        return { kind: "not_found" } as const;
      }

      const draftContent = invitationContentSchema.parse(current.draftContent);
      invitationDesignSchema.parse(current.draftDesign);
      const mediaAssets = await transaction<Array<{
        id: string;
        state: "draft" | "published" | "archived";
      }>>`
        SELECT id, state
        FROM media_assets
        WHERE invitation_id = ${id}
        FOR UPDATE
      `;
      const mediaPlan = createMediaPublicationPlan(draftContent, mediaAssets);
      if (mediaPlan.missingIds.length > 0) {
        return {
          kind: "invalid_media",
          assetIds: mediaPlan.missingIds,
        } as const;
      }

      const invitationRows = await transaction`
        UPDATE invitations
        SET status = 'published',
            published_content = draft_content,
            published_design = draft_design,
            published_revision = revision,
            published_at = now(),
            updated_at = now()
        WHERE id = ${id}
        RETURNING id, status, published_revision, published_at
      `;

      if (mediaPlan.draftIds.length > 0) {
        await transaction`
          UPDATE media_assets
          SET state = 'draft', updated_at = now()
          WHERE invitation_id = ${id}
            AND id = ANY(${transaction.array(mediaPlan.draftIds, 2950)})
        `;
      }
      if (mediaPlan.publishedIds.length > 0) {
        await transaction`
          UPDATE media_assets
          SET state = 'published', updated_at = now()
          WHERE invitation_id = ${id}
            AND id = ANY(${transaction.array(mediaPlan.publishedIds, 2950)})
        `;
      }
      return {
        kind: "published",
        invitation: invitationRows[0],
        revision: current.revision,
      } as const;
    });

    if (result.kind === "not_found") {
      return reply.code(404).send({ error: "invitation_not_found" });
    }
    if (result.kind === "invalid_media") {
      return reply.code(409).send({
        error: "media_reference_invalid",
        assetIds: result.assetIds,
      });
    }
    await recordAudit(request, id, "invitation.published", {
      revision: result.revision,
    });
    return result.invitation;
  });

  app.get("/api/admin/invitations/:id/media", async (request, reply) => {
    const { id } = invitationParams.parse(request.params);
    const sql = getDatabase();
    const [invitation] = await sql<{
      draftContent: unknown;
      publishedContent: unknown | null;
    }[]>`
      SELECT draft_content, published_content
      FROM invitations
      WHERE id = ${id}
      LIMIT 1
    `;
    if (!invitation) {
      return reply.code(404).send({ error: "invitation_not_found" });
    }
    const draftAssetIds = new Set(collectInvitationMediaAssetIds(
      invitationContentSchema.parse(invitation.draftContent),
    ));
    const publishedAssetIds = new Set(
      invitation.publishedContent
        ? collectInvitationMediaAssetIds(
            invitationContentSchema.parse(invitation.publishedContent),
          )
        : [],
    );
    const assets = await sql`
      SELECT
        id,
        original_name,
        content_type,
        size_bytes,
        purpose,
        alt_text,
        position,
        state,
        created_at
      FROM media_assets
      WHERE invitation_id = ${id}
        AND state <> 'archived'
      ORDER BY purpose, position, created_at
    `;
    return {
      assets: assets.map((asset) => ({
        ...asset,
        previewUrl: `/api/admin/media/${asset.id}/content`,
        connectedToDraft: draftAssetIds.has(asset.id),
        connectedToPublished: publishedAssetIds.has(asset.id),
      })),
    };
  });

  app.post("/api/admin/invitations/:id/media", async (request, reply) => {
    const { id } = invitationParams.parse(request.params);
    if (!(await invitationExists(id))) {
      return reply.code(404).send({ error: "invitation_not_found" });
    }

    const file = await request.file({
      limits: { files: 1, fileSize: getConfig().MAX_UPLOAD_BYTES },
    });
    if (!file) {
      return reply.code(400).send({ error: "file_required" });
    }

    const fields = file.fields as Record<string, { value?: unknown }>;
    const purpose = mediaPurposeSchema.parse(fields.purpose?.value);
    const allowed = purpose === "music"
      ? file.mimetype === "audio/mpeg"
      : allowedImageTypes.has(file.mimetype);
    if (!allowed) {
      return reply.code(415).send({ error: "unsupported_media_type" });
    }

    const buffer = await file.toBuffer();
    const extension = file.mimetype === "audio/mpeg"
      ? "mp3"
      : file.mimetype.split("/")[1]?.replace("jpeg", "jpg") ?? "bin";
    const objectKey = `media/${id}/${purpose}/${randomUUID()}.${extension}`;
    await putObject({ key: objectKey, body: buffer, contentType: file.mimetype });

    const altText = String(fields.altText?.value ?? "").trim().slice(0, 200);
    const sql = getDatabase();
    const [asset] = await sql`
      INSERT INTO media_assets (
        invitation_id,
        object_key,
        original_name,
        content_type,
        size_bytes,
        purpose,
        alt_text,
        position
      )
      VALUES (
        ${id},
        ${objectKey},
        ${file.filename},
        ${file.mimetype},
        ${buffer.byteLength},
        ${purpose},
        ${altText},
        COALESCE((
          SELECT max(position) + 1
          FROM media_assets
          WHERE invitation_id = ${id} AND purpose = ${purpose}
        ), 0)
      )
      RETURNING id, original_name, content_type, size_bytes, purpose, alt_text, position, state
    `;
    await recordAudit(request, id, "media.created", { assetId: asset?.id, purpose });
    return reply.code(201).send(asset);
  });

  app.patch("/api/admin/invitations/:id/media/:assetId", async (request, reply) => {
    const { id, assetId } = assetParams.parse(request.params);
    const body = z.object({
      altText: z.string().trim().max(200).optional(),
      position: z.number().int().min(0).max(10_000).optional(),
    }).refine((value) => Object.keys(value).length > 0).parse(request.body);
    const sql = getDatabase();
    const [asset] = await sql`
      UPDATE media_assets
      SET alt_text = COALESCE(${body.altText ?? null}, alt_text),
          position = COALESCE(${body.position ?? null}, position),
          updated_at = now()
      WHERE id = ${assetId}
        AND invitation_id = ${id}
      RETURNING id, alt_text, position, state, updated_at
    `;
    if (!asset) {
      return reply.code(404).send({ error: "media_not_found" });
    }
    await recordAudit(request, id, "media.updated", { assetId });
    return asset;
  });

  app.delete("/api/admin/invitations/:id/media/:assetId", async (request, reply) => {
    const { id, assetId } = assetParams.parse(request.params);
    const sql = getDatabase();
    const result = await sql.begin(async (transaction) => {
      const [asset] = await transaction<{
        objectKey: string;
        draftContent: unknown;
        publishedContent: unknown | null;
      }[]>`
        SELECT
          media.object_key,
          invitation.draft_content,
          invitation.published_content
        FROM media_assets AS media
        JOIN invitations AS invitation ON invitation.id = media.invitation_id
        WHERE media.id = ${assetId}
          AND media.invitation_id = ${id}
        LIMIT 1
        FOR UPDATE OF media, invitation
      `;
      if (!asset) {
        return { kind: "not_found" } as const;
      }
      const referencedByDraft = collectInvitationMediaAssetIds(
        invitationContentSchema.parse(asset.draftContent),
      ).includes(assetId);
      const referencedByPublished = asset.publishedContent
        ? collectInvitationMediaAssetIds(
            invitationContentSchema.parse(asset.publishedContent),
          ).includes(assetId)
        : false;
      if (referencedByDraft || referencedByPublished) {
        return {
          kind: "in_use",
          referencedBy: [
            ...(referencedByDraft ? ["draft"] : []),
            ...(referencedByPublished ? ["published"] : []),
          ],
        } as const;
      }

      await deleteObject(asset.objectKey);
      await transaction`DELETE FROM media_assets WHERE id = ${assetId}`;
      return { kind: "deleted" } as const;
    });
    if (result.kind === "not_found") {
      return reply.code(404).send({ error: "media_not_found" });
    }
    if (result.kind === "in_use") {
      return reply.code(409).send({
        error: "media_in_use",
        referencedBy: result.referencedBy,
      });
    }
    await recordAudit(request, id, "media.deleted", { assetId });
    return reply.code(204).send();
  });

  app.get("/api/admin/media/:assetId/content", async (request, reply) => {
    const { assetId } = z.object({ assetId: z.string().uuid() }).parse(request.params);
    const sql = getDatabase();
    const [asset] = await sql<{ objectKey: string }[]>`
      SELECT object_key FROM media_assets WHERE id = ${assetId} LIMIT 1
    `;
    if (!asset) {
      return reply.code(404).send({ error: "media_not_found" });
    }
    const object = await getObject(asset.objectKey);
    reply.type(object.contentType);
    reply.header("Cache-Control", "private, max-age=300");
    if (object.contentLength !== undefined) {
      reply.header("Content-Length", String(object.contentLength));
    }
    return reply.send(object.body);
  });

  app.get("/api/admin/invitations/:id/rsvps", async (request, reply) => {
    const { id } = invitationParams.parse(request.params);
    if (!(await invitationExists(id))) {
      return reply.code(404).send({ error: "invitation_not_found" });
    }
    const sql = getDatabase();
    return {
      rsvps: await sql`
        SELECT *
        FROM rsvps
        WHERE invitation_id = ${id}
        ORDER BY created_at DESC
      `,
    };
  });

  app.get("/api/admin/invitations/:id/rsvps.csv", async (request, reply) => {
    const { id } = invitationParams.parse(request.params);
    const sql = getDatabase();
    const [invitation] = await sql<{ slug: string }[]>`
      SELECT slug
      FROM invitations
      WHERE id = ${id}
      LIMIT 1
    `;
    if (!invitation) {
      return reply.code(404).send({ error: "invitation_not_found" });
    }
    const rows = await sql<RsvpCsvRow[]>`
      SELECT
        created_at,
        attending,
        party,
        name,
        phone,
        additional_guests,
        meal,
        shuttle,
        note
      FROM rsvps
      WHERE invitation_id = ${id}
      ORDER BY created_at DESC
    `;

    reply.header("Content-Type", "text/csv; charset=utf-8");
    reply.header(
      "Content-Disposition",
      `attachment; filename="${invitation.slug}-rsvps.csv"`,
    );
    reply.header("Cache-Control", "private, no-store");
    return reply.send(createRsvpCsv(rows));
  });

  app.get("/api/admin/invitations/:id/guestbook", async (request, reply) => {
    const { id } = invitationParams.parse(request.params);
    if (!(await invitationExists(id))) {
      return reply.code(404).send({ error: "invitation_not_found" });
    }
    const sql = getDatabase();
    return {
      entries: await sql`
        SELECT id, name, message, state, created_at, updated_at
        FROM guestbook_entries
        WHERE invitation_id = ${id}
        ORDER BY created_at DESC
      `,
    };
  });

  app.patch("/api/admin/invitations/:id/guestbook/:entryId", async (request, reply) => {
    const { id, entryId } = entryParams.parse(request.params);
    const { state } = z.object({
      state: z.enum(["visible", "hidden", "deleted"]),
    }).parse(request.body);
    const sql = getDatabase();
    const [entry] = await sql`
      UPDATE guestbook_entries
      SET state = ${state}, updated_at = now()
      WHERE id = ${entryId} AND invitation_id = ${id}
      RETURNING id, state, updated_at
    `;
    if (!entry) {
      return reply.code(404).send({ error: "guestbook_entry_not_found" });
    }
    await recordAudit(request, id, "guestbook.moderated", { entryId, state });
    return entry;
  });

  app.get("/api/admin/invitations/:id/guest-uploads", async (request, reply) => {
    const { id } = invitationParams.parse(request.params);
    if (!(await invitationExists(id))) {
      return reply.code(404).send({ error: "invitation_not_found" });
    }
    const sql = getDatabase();
    const uploads = await sql`
      SELECT
        id,
        original_name,
        content_type,
        size_bytes,
        uploader_name,
        note,
        state,
        created_at,
        reviewed_at
      FROM guest_uploads
      WHERE invitation_id = ${id}
      ORDER BY created_at DESC
    `;
    return {
      uploads: await Promise.all(uploads.map(async (upload) => ({
        ...upload,
        downloadUrl: `/api/admin/guest-uploads/${upload.id}/content`,
      }))),
    };
  });

  app.patch("/api/admin/invitations/:id/guest-uploads/:uploadId", async (request, reply) => {
    const { id, uploadId } = uploadParams.parse(request.params);
    const { state } = z.object({
      state: z.enum(["pending", "approved", "rejected"]),
    }).parse(request.body);
    const sql = getDatabase();
    const [upload] = await sql`
      UPDATE guest_uploads
      SET state = ${state}, reviewed_at = now()
      WHERE id = ${uploadId} AND invitation_id = ${id}
      RETURNING id, state, reviewed_at
    `;
    if (!upload) {
      return reply.code(404).send({ error: "guest_upload_not_found" });
    }
    await recordAudit(request, id, "guest_upload.reviewed", { uploadId, state });
    return upload;
  });

  app.get("/api/admin/guest-uploads/:uploadId/content", async (request, reply) => {
    const { uploadId } = z.object({ uploadId: z.string().uuid() }).parse(request.params);
    const sql = getDatabase();
    const [upload] = await sql<{ objectKey: string }[]>`
      SELECT object_key FROM guest_uploads WHERE id = ${uploadId} LIMIT 1
    `;
    if (!upload) {
      return reply.code(404).send({ error: "guest_upload_not_found" });
    }
    const object = await getObject(upload.objectKey);
    reply.type(object.contentType);
    reply.header("Cache-Control", "private, max-age=300");
    if (object.contentLength !== undefined) {
      reply.header("Content-Length", String(object.contentLength));
    }
    return reply.send(object.body);
  });

  app.post("/api/admin/users/password", async (request, reply) => {
    if (!request.admin) {
      return reply.code(401).send({ error: "authentication_required" });
    }
    const body = z.object({
      currentPassword: z.string().min(1).max(200),
      newPassword: z.string().min(12).max(200),
    }).parse(request.body);
    const sql = getDatabase();
    const [user] = await sql<{ passwordVerifier: string }[]>`
      SELECT password_verifier
      FROM admin_users
      WHERE id = ${request.admin.id}
      LIMIT 1
    `;
    if (!user || !(await verifyPassword(body.currentPassword, user.passwordVerifier))) {
      return reply.code(403).send({ error: "invalid_password" });
    }
    await sql`
      UPDATE admin_users
      SET password_verifier = ${await createPasswordVerifier(body.newPassword)},
          updated_at = now()
      WHERE id = ${request.admin.id}
    `;
    await sql`DELETE FROM admin_sessions WHERE admin_user_id = ${request.admin.id}`;
    reply.clearCookie(SESSION_COOKIE, { path: "/" });
    return reply.code(204).send();
  });
}
