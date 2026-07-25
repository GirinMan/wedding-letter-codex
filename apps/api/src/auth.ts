import type { FastifyReply, FastifyRequest } from "fastify";

import { getConfig } from "./config.js";
import { getDatabase } from "./db.js";
import { digestSessionToken } from "./security/credentials.js";

export const SESSION_COOKIE = "wedding_admin_session";

export interface AdminIdentity {
  id: string;
  email: string;
  displayName: string;
}

declare module "fastify" {
  interface FastifyRequest {
    admin: AdminIdentity | null;
  }
}

export async function loadAdmin(request: FastifyRequest): Promise<AdminIdentity | null> {
  const token = request.cookies[SESSION_COOKIE];
  if (!token) {
    return null;
  }

  const sql = getDatabase();
  const [row] = await sql<AdminIdentity[]>`
    SELECT u.id, u.email, u.display_name
    FROM admin_sessions s
    JOIN admin_users u ON u.id = s.admin_user_id
    WHERE s.token_digest = ${digestSessionToken(token)}
      AND s.expires_at > now()
      AND u.active = true
    LIMIT 1
  `;
  return row ?? null;
}

export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  request.admin = await loadAdmin(request);
  if (!request.admin) {
    await reply.code(401).send({ error: "authentication_required" });
  }
}

export function sessionCookieOptions() {
  const config = getConfig();
  return {
    path: "/",
    httpOnly: true,
    secure: config.COOKIE_SECURE,
    sameSite: "strict" as const,
    maxAge: config.SESSION_DAYS * 24 * 60 * 60,
  };
}
