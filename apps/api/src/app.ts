import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyInstance } from "fastify";
import { ZodError } from "zod";

import { checkStorage } from "./storage.js";
import { getConfig } from "./config.js";
import { getDatabase } from "./db.js";
import { registerAdminRoutes } from "./routes/admin.js";
import { registerPublicRoutes } from "./routes/public.js";

export async function createApp(): Promise<FastifyInstance> {
  const config = getConfig();
  const app = Fastify({
    logger: config.NODE_ENV !== "test",
    trustProxy: true,
    bodyLimit: 1_048_576,
  });

  app.decorateRequest("admin", null);
  await app.register(cookie);
  await app.register(cors, {
    credentials: true,
    origin(origin, callback) {
      if (
        !origin
        || origin === config.ADMIN_ORIGIN
        || origin === config.PUBLIC_ORIGIN
      ) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin not allowed"), false);
    },
  });
  await app.register(rateLimit, {
    global: false,
    hook: "preHandler",
  });
  await app.register(multipart, {
    limits: {
      files: 1,
      fileSize: config.MAX_UPLOAD_BYTES,
      fields: 8,
    },
  });

  app.get("/api/health/live", async () => ({ status: "ok" }));
  app.get("/api/health/ready", async (_request, reply) => {
    try {
      const sql = getDatabase();
      await sql`SELECT 1`;
      await checkStorage();
      return { status: "ready" };
    } catch (error) {
      app.log.error(error);
      return reply.code(503).send({ status: "not_ready" });
    }
  });

  await registerPublicRoutes(app);
  await registerAdminRoutes(app);

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: "validation_error",
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    if ((error as { code?: string }).code === "FST_REQ_FILE_TOO_LARGE") {
      return reply.code(413).send({ error: "file_too_large" });
    }

    app.log.error(error);
    return reply.code(500).send({ error: "internal_error" });
  });

  return app;
}
