import { z } from "zod";

const booleanFromString = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

const configSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  COOKIE_SECURE: booleanFromString,
  ADMIN_ORIGIN: z.string().url().optional(),
  PUBLIC_ORIGIN: z.string().url().optional(),
  SESSION_DAYS: z.coerce.number().int().min(1).max(90).default(14),
  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().default("us-east-1"),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_BUCKET: z.string().min(3),
  S3_FORCE_PATH_STYLE: booleanFromString.default("true"),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(15_728_640),
});

export type AppConfig = z.infer<typeof configSchema>;

let cachedConfig: AppConfig | undefined;

export function getConfig(): AppConfig {
  cachedConfig ??= configSchema.parse(process.env);
  return cachedConfig;
}

export function parseConfig(environment: NodeJS.ProcessEnv): AppConfig {
  return configSchema.parse(environment);
}
