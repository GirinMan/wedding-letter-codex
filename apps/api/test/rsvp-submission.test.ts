import assert from "node:assert/strict";
import test from "node:test";

interface RsvpDomainModule {
  parseRsvpSubmission?: (
    input: unknown,
    options: { collectMeal: boolean },
  ) => {
    phone: string;
    meal: "yes" | "no" | "undecided" | null;
    guestbookMessage: string;
    privateNote: string;
  };
  rsvpPromotionBodySchema?: {
    parse(input: unknown): { rsvpIds: string[] };
  };
}

async function loadRsvpDomain(): Promise<RsvpDomainModule> {
  return import("../src/domain/rsvp.js")
    .catch(() => ({})) as Promise<RsvpDomainModule>;
}

const completeSubmission = {
  attending: true,
  name: "김하객",
  party: "partnerOne",
  phone: "",
  additionalGuests: 0,
  meal: "yes",
  shuttle: null,
  guestbookMessage: "  두 분의 결혼을 축하합니다!  ",
  privacyConsent: true,
};

test("RSVP accepts an empty optional phone and normalizes a public guestbook message", async () => {
  const { parseRsvpSubmission } = await loadRsvpDomain();
  assert.equal(typeof parseRsvpSubmission, "function");

  const parsed = parseRsvpSubmission!(completeSubmission, { collectMeal: true });

  assert.equal(parsed.phone, "");
  assert.equal(parsed.meal, "yes");
  assert.equal(parsed.guestbookMessage, "두 분의 결혼을 축하합니다!");
});

test("RSVP requires a meal choice only when meal collection is enabled", async () => {
  const { parseRsvpSubmission } = await loadRsvpDomain();
  assert.equal(typeof parseRsvpSubmission, "function");

  assert.throws(() => parseRsvpSubmission!(
    { ...completeSubmission, meal: null },
    { collectMeal: true },
  ));
  assert.equal(
    parseRsvpSubmission!(
      { ...completeSubmission, meal: null },
      { collectMeal: false },
    ).meal,
    null,
  );
});

test("legacy private notes are never treated as explicit public guestbook messages", async () => {
  const { parseRsvpSubmission } = await loadRsvpDomain();
  assert.equal(typeof parseRsvpSubmission, "function");

  const parsed = parseRsvpSubmission!(
    {
      ...completeSubmission,
      guestbookMessage: undefined,
      note: "구버전 폼에서 남긴 비공개 메모",
    },
    { collectMeal: true },
  );

  assert.equal(parsed.guestbookMessage, "");
  assert.equal(parsed.privateNote, "구버전 폼에서 남긴 비공개 메모");
});

test("RSVP rejects simultaneous private and public messages to preserve one message source", async () => {
  const { parseRsvpSubmission } = await loadRsvpDomain();
  assert.equal(typeof parseRsvpSubmission, "function");

  assert.throws(() => parseRsvpSubmission!(
    {
      ...completeSubmission,
      note: "비공개 메모",
      guestbookMessage: "공개 축하 메시지",
    },
    { collectMeal: true },
  ));
});

test("legacy RSVP promotion accepts a bounded unique selection", async () => {
  const { rsvpPromotionBodySchema } = await loadRsvpDomain();
  assert.ok(rsvpPromotionBodySchema);
  const first = "11111111-1111-4111-8111-111111111111";
  const second = "22222222-2222-4222-8222-222222222222";

  assert.deepEqual(
    rsvpPromotionBodySchema!.parse({ rsvpIds: [first, second, first] }),
    { rsvpIds: [first, second] },
  );
  assert.throws(() => rsvpPromotionBodySchema!.parse({ rsvpIds: [] }));
});
