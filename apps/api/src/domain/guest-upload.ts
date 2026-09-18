import { z } from "zod";

export const guestUploadIdBatchSchema = z.object({
  uploadIds: z.array(z.string().uuid()).min(1).max(100).transform((ids) => [...new Set(ids)]),
});

export const guestUploadPageSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(30),
});
