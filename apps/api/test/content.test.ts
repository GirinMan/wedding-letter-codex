import assert from "node:assert/strict";
import test from "node:test";

import {
  createInvitationPreview,
  createMediaPublicationPlan,
  invitationContentSchema,
  invitationDesignSchema,
  sampleInvitationContent,
  sampleInvitationDesign,
} from "../src/domain/invitation.js";

test("sample invitation content satisfies the public contract", () => {
  const parsed = invitationContentSchema.parse(sampleInvitationContent);

  assert.equal(parsed.locale, "ko-KR");
  assert.equal(parsed.hero.title, "INVITATION");
  assert.ok(parsed.sections.length >= 10);
  assert.ok(parsed.timeline.length >= 3);
  assert.equal(parsed.middleImage.assetId, null);
  assert.equal(parsed.interview[0]?.image.assetId, null);
  assert.equal(new Set(parsed.sections.map((section) => section.id)).size, parsed.sections.length);
});

test("legacy invitation documents receive defaults for new media slots", () => {
  const legacy = structuredClone(sampleInvitationContent) as unknown as Record<string, unknown>;
  delete legacy.middleImage;
  const hero = legacy.hero as Record<string, unknown>;
  delete hero.nameOrder;
  const guestbook = legacy.guestbook as Record<string, unknown>;
  delete guestbook.actions;
  const event = legacy.event as Record<string, unknown>;
  delete event.sketchMap;
  delete event.map;
  const gallery = legacy.gallery as Record<string, unknown>;
  delete gallery.layout;
  const interview = legacy.interview as Array<Record<string, unknown>>;
  interview.forEach((entry) => delete entry.image);
  delete legacy.sectionCopy;
  delete legacy.profiles;
  delete legacy.celebration;
  const sections = legacy.sections as Array<{ id: string }>;
  legacy.sections = sections.filter((section) => section.id !== "profile");

  const parsed = invitationContentSchema.parse(legacy);

  assert.equal(parsed.middleImage.placeholder, "middle");
  assert.deepEqual(parsed.hero.nameOrder, ["partnerTwo", "partnerOne"]);
  assert.deepEqual(parsed.guestbook.actions, {
    writeLabel: "방명록 작성하기",
    viewLabel: "방명록 전체보기",
  });
  assert.equal(parsed.event.sketchMap.assetId, null);
  assert.equal(parsed.event.sketchMap.placeholder, "venue-sketch-map");
  assert.equal(parsed.event.map.naverMapClientId, "");
  assert.equal(parsed.event.map.zoom, 16);
  assert.equal(parsed.gallery.layout, "grid");
  assert.ok(parsed.interview.every((entry) => entry.image.assetId === null));
  assert.deepEqual(parsed.sharing, {
    kakaoJavaScriptKey: "",
    kakaoShareImage: { assetId: null },
    channelTalk: { enabled: false, pluginKey: "" },
  });
  assert.equal(parsed.profiles.items.length, 2);
  assert.equal(parsed.profiles.items[0]?.side, "partnerOne");
  assert.equal(parsed.profiles.items[1]?.side, "partnerTwo");
  assert.equal(parsed.celebration.enabled, false);
  assert.equal(parsed.celebration.linkUrl, "");
  assert.deepEqual(parsed.sections.find((section) => section.id === "profile"), {
    id: "profile",
    enabled: false,
  });
  assert.deepEqual(parsed.sectionCopy, {
    interview: {
      eyebrow: "INTERVIEW",
      title: "우리 두 사람의 이야기",
      description: "결혼을 앞둔 두 사람의 작은 이야기를 담았습니다.",
    },
    calendar: { eyebrow: "THE WEDDING DAY", title: "", description: "" },
    timeline: { eyebrow: "SINCE THE FIRST DAY", title: "Our story", description: "" },
    location: { eyebrow: "LOCATION", title: "오시는 길", description: "" },
    gallery: { eyebrow: "GALLERY", title: "웨딩 갤러리", description: "" },
    accounts: { eyebrow: "ACCOUNT", title: "마음 전하실 곳", description: "" },
  });
});

test("legacy family contacts receive structured group metadata", () => {
  const legacy = structuredClone(sampleInvitationContent) as unknown as {
    couple: {
      partnerOne: Record<string, unknown>;
      partnerTwo: Record<string, unknown>;
    };
    contacts: Array<Record<string, unknown>>;
  };
  delete legacy.couple.partnerOne.familyRelation;
  delete legacy.couple.partnerTwo.familyRelation;
  legacy.contacts = [
    { id: "legacy-one", role: "신랑", name: "이름", phone: "010-0000-0000" },
    { id: "legacy-two", role: "신부 어머니", name: "이름", phone: "010-0000-0000" },
  ];

  const parsed = invitationContentSchema.parse(legacy);

  assert.equal(parsed.couple.partnerOne.familyRelation, "아들");
  assert.equal(parsed.couple.partnerTwo.familyRelation, "딸");
  assert.deepEqual(
    parsed.contacts.map(({ side, relationship }) => ({ side, relationship })),
    [
      { side: "partnerOne", relationship: "partner" },
      { side: "partnerTwo", relationship: "mother" },
    ],
  );
});

test("sample invitation contains complete structured family contact groups", () => {
  const parsed = invitationContentSchema.parse(sampleInvitationContent);
  const relationshipsBySide = parsed.contacts.reduce<Record<string, string[]>>((groups, contact) => {
    groups[contact.side] ??= [];
    groups[contact.side]!.push(contact.relationship);
    return groups;
  }, {});

  assert.deepEqual(relationshipsBySide, {
    partnerOne: ["partner", "father", "mother"],
    partnerTwo: ["partner", "father", "mother"],
  });
});

test("sample design satisfies the replaceable token contract", () => {
  const parsed = invitationDesignSchema.parse(sampleInvitationDesign);

  assert.equal(parsed.themeId, "botanic-garden");
  assert.match(parsed.colors.paper, /^#[0-9a-f]{6}$/i);
  assert.match(parsed.colors.ink, /^#[0-9a-f]{6}$/i);
  assert.ok(parsed.spacing.section >= 48);
});

test("legacy designs default to the Botanic Garden theme", () => {
  const legacy = structuredClone(sampleInvitationDesign) as unknown as Record<string, unknown>;
  delete legacy.themeId;

  const parsed = invitationDesignSchema.parse(legacy);

  assert.equal(parsed.themeId, "botanic-garden");
});

test("stored Garden Editorial designs migrate to Botanic Garden", () => {
  const legacy = structuredClone(sampleInvitationDesign) as unknown as Record<string, unknown>;
  legacy.themeId = "garden-editorial";

  const parsed = invitationDesignSchema.parse(legacy);

  assert.equal(parsed.themeId, "botanic-garden");
});

test("an invalid public account is rejected", () => {
  const invalid = structuredClone(sampleInvitationContent);
  invalid.accounts[0]!.items[0]!.accountNumber = "";

  assert.throws(() => invitationContentSchema.parse(invalid));
});

test("an authenticated draft preview uses validated draft content and design", () => {
  const preview = createInvitationPreview({
    id: "dacbf468-f690-4265-9d43-341aa428024e",
    slug: "our-wedding",
    revision: 7,
    draftContent: sampleInvitationContent,
    draftDesign: sampleInvitationDesign,
  });

  assert.equal(preview.id, "dacbf468-f690-4265-9d43-341aa428024e");
  assert.equal(preview.slug, "our-wedding");
  assert.equal(preview.revision, 7);
  assert.equal(preview.content.hero.title, sampleInvitationContent.hero.title);
  assert.equal(preview.design.colors.paper, sampleInvitationDesign.colors.paper);
});

test("publishing exposes only media referenced by the validated invitation", () => {
  const content = structuredClone(sampleInvitationContent);
  const greetingId = "11111111-1111-4111-8111-111111111111";
  const galleryId = "22222222-2222-4222-8222-222222222222";
  const stalePublishedId = "33333333-3333-4333-8333-333333333333";
  const archivedId = "44444444-4444-4444-8444-444444444444";
  const profileId = "55555555-5555-4555-8555-555555555555";
  const sketchMapId = "66666666-6666-4666-8666-666666666666";
  const kakaoShareImageId = "77777777-7777-4777-8777-777777777777";
  content.greeting.image.assetId = greetingId;
  content.gallery.items[0]!.assetId = galleryId;
  content.event.sketchMap.assetId = sketchMapId;
  content.profiles.items[0]!.image.assetId = profileId;
  content.sharing.kakaoShareImage.assetId = kakaoShareImageId;
  content.music.assetId = greetingId;

  const plan = createMediaPublicationPlan(content, [
    { id: greetingId, state: "draft" },
    { id: galleryId, state: "published" },
    { id: sketchMapId, state: "draft" },
    { id: profileId, state: "draft" },
    { id: kakaoShareImageId, state: "draft" },
    { id: stalePublishedId, state: "published" },
    { id: archivedId, state: "archived" },
  ]);

  assert.deepEqual(plan.referencedIds, [
    greetingId,
    galleryId,
    profileId,
    sketchMapId,
    kakaoShareImageId,
  ]);
  assert.deepEqual(plan.publishedIds, [
    greetingId,
    galleryId,
    profileId,
    sketchMapId,
    kakaoShareImageId,
  ]);
  assert.deepEqual(plan.draftIds, [stalePublishedId]);
  assert.deepEqual(plan.missingIds, []);
});

test("publishing reports references to unavailable media", () => {
  const content = structuredClone(sampleInvitationContent);
  const missingId = "55555555-5555-4555-8555-555555555555";
  content.closing.image.assetId = missingId;

  const plan = createMediaPublicationPlan(content, []);

  assert.deepEqual(plan.missingIds, [missingId]);
  assert.deepEqual(plan.publishedIds, []);
});
