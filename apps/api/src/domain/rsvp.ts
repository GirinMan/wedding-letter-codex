import { z } from "zod";

const rsvpSubmissionSchema = z.object({
  attending: z.boolean(),
  name: z.string().trim().min(1).max(80),
  party: z.enum(["partnerOne", "partnerTwo"]),
  phone: z.string().trim().max(30).default(""),
  additionalGuests: z.number().int().min(0).max(20).default(0),
  meal: z.enum(["yes", "no", "undecided"]).nullable().default(null),
  shuttle: z.enum(["yes", "no", "undecided"]).nullable().default(null),
  guestbookMessage: z.string().trim().max(500).optional(),
  note: z.string().trim().max(500).optional(),
  privacyConsent: z.literal(true),
});

export function parseRsvpSubmission(
  input: unknown,
  options: { collectMeal: boolean },
) {
  const parsed = rsvpSubmissionSchema.parse(input);
  if (options.collectMeal && parsed.meal === null) {
    throw new z.ZodError([{
      code: "custom",
      path: ["meal"],
      message: "식사 여부를 선택해 주세요.",
    }]);
  }
  if (parsed.guestbookMessage && parsed.note) {
    throw new z.ZodError([{
      code: "custom",
      path: ["note"],
      message: "레거시 메모와 공개 축하 메시지를 동시에 입력할 수 없습니다.",
    }]);
  }
  const { note, ...submission } = parsed;
  return {
    ...submission,
    guestbookMessage: parsed.guestbookMessage ?? "",
    privateNote: note ?? "",
  };
}

export const rsvpPromotionBodySchema = z.object({
  rsvpIds: z.array(z.string().uuid()).min(1).max(100)
    .transform((ids) => [...new Set(ids)]),
});
