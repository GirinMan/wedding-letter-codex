import { z } from "zod";

export const guestUploadIdBatchSchema = z.object({
  uploadIds: z.array(z.string().uuid()).min(1).max(100).transform((ids) => [...new Set(ids)]),
});
