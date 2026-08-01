import { z } from "zod";

const colorSchema = z.string().regex(/^#[0-9a-f]{6}$/i);
const textSchema = z.string().trim().min(1).max(2_000);
const optionalUrlSchema = z.union([z.string().url(), z.literal("")]).default("");

const contactSideSchema = z.enum(["partnerOne", "partnerTwo"]);
const contactRelationshipSchema = z.enum(["partner", "father", "mother", "other"]);

function inferContactSide(role: string) {
  return /신부|bride|partner\s*two/i.test(role) ? "partnerTwo" : "partnerOne";
}

function inferContactRelationship(role: string) {
  if (/아버지|부친|father/i.test(role)) return "father";
  if (/어머니|모친|mother/i.test(role)) return "mother";
  if (/신랑|신부|bride|groom|partner/i.test(role)) return "partner";
  return "other";
}

const contactSchema = z.object({
  id: z.string().min(1).max(80),
  role: z.string().min(1).max(40),
  name: z.string().min(1).max(80),
  phone: z.string().min(1).max(30),
  side: contactSideSchema.optional(),
  relationship: contactRelationshipSchema.optional(),
}).transform((contact) => ({
  ...contact,
  side: contact.side ?? inferContactSide(contact.role),
  relationship: contact.relationship ?? inferContactRelationship(contact.role),
}));

const mediaReferenceSchema = z.object({
  assetId: z.string().uuid().nullable().default(null),
  alt: z.string().max(200).default(""),
  placeholder: z.string().max(120).default(""),
});

const sectionIdSchema = z.enum([
  "hero",
  "invitation",
  "profile",
  "interview",
  "calendar",
  "timeline",
  "rsvp",
  "location",
  "gallery",
  "guestbook",
  "middleImage",
  "accounts",
  "guestUploads",
  "closing",
]);

const defaultSectionCopy = {
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
};

const sectionHeadingSchema = z.object({
  eyebrow: z.string().max(100).default(""),
  title: z.string().max(160).default(""),
  description: z.string().max(500).default(""),
});

const sectionCopySchema = z.object({
  interview: sectionHeadingSchema.default(defaultSectionCopy.interview),
  calendar: sectionHeadingSchema.default(defaultSectionCopy.calendar),
  timeline: sectionHeadingSchema.default(defaultSectionCopy.timeline),
  location: sectionHeadingSchema.default(defaultSectionCopy.location),
  gallery: sectionHeadingSchema.default(defaultSectionCopy.gallery),
  accounts: sectionHeadingSchema.default(defaultSectionCopy.accounts),
}).default(defaultSectionCopy);

const defaultProfiles = {
  eyebrow: "PROFILE",
  title: "두 사람을 소개합니다.",
  items: [
    {
      id: "partner-one",
      side: "partnerOne" as const,
      birthDate: "",
      location: "",
      tags: "",
      message: "",
      image: { assetId: null, alt: "신랑 프로필 사진", placeholder: "profile-partner-one" },
    },
    {
      id: "partner-two",
      side: "partnerTwo" as const,
      birthDate: "",
      location: "",
      tags: "",
      message: "",
      image: { assetId: null, alt: "신부 프로필 사진", placeholder: "profile-partner-two" },
    },
  ],
};

const profileSchema = z.object({
  id: z.string().min(1).max(80),
  side: contactSideSchema,
  birthDate: z.string().max(100).default(""),
  location: z.string().max(160).default(""),
  tags: z.string().max(240).default(""),
  message: z.string().max(500).default(""),
  image: mediaReferenceSchema.default({ assetId: null, alt: "", placeholder: "profile" }),
});

export const invitationContentSchema = z.object({
  locale: z.enum(["ko-KR", "en-US"]).default("ko-KR"),
  couple: z.object({
    partnerOne: z.object({
      name: z.string().min(1).max(80),
      label: z.string().min(1).max(30),
      familyRelation: z.string().min(1).max(30).default("아들"),
    }),
    partnerTwo: z.object({
      name: z.string().min(1).max(80),
      label: z.string().min(1).max(30),
      familyRelation: z.string().min(1).max(30).default("딸"),
    }),
  }),
  hero: z.object({
    eyebrow: z.string().max(100),
    title: z.string().min(1).max(160),
    subtitle: z.string().max(240),
    image: mediaReferenceSchema.default({
      assetId: null,
      alt: "첫 화면 웨딩 사진",
      placeholder: "hero-photo",
    }),
    nameOrder: z.array(z.enum(["partnerOne", "partnerTwo"]))
      .length(2)
      .refine((order) => new Set(order).size === 2, "Each partner must appear once in the hero.")
      .default(["partnerTwo", "partnerOne"]),
  }),
  greeting: z.object({
    title: textSchema,
    body: z.string().trim().min(1).max(4_000),
    image: mediaReferenceSchema,
  }),
  profiles: z.object({
    eyebrow: z.string().max(100).default(defaultProfiles.eyebrow),
    title: z.string().min(1).max(160).default(defaultProfiles.title),
    items: z.array(profileSchema).min(2).max(2).superRefine((items, context) => {
      if (new Set(items.map((item) => item.side)).size !== 2) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: "Each partner must have one profile." });
      }
    }).default(defaultProfiles.items),
  }).default(defaultProfiles),
  contacts: z.array(contactSchema).max(12),
  event: z.object({
    startsAt: z.string().datetime({ offset: true }),
    timezone: z.string().min(1).max(80),
    venueName: z.string().min(1).max(160),
    hall: z.string().max(160),
    address: z.string().min(1).max(300),
    telephone: z.string().max(30),
    latitude: z.number().min(-90).max(90).nullable(),
    longitude: z.number().min(-180).max(180).nullable(),
    sketchMap: mediaReferenceSchema.default({
      assetId: null,
      alt: "예식장 약도",
      placeholder: "venue-sketch-map",
    }),
    map: z.object({
      naverMapClientId: z.string().trim().max(200).default(""),
      zoom: z.number().int().min(6).max(21).default(16),
      navigation: z.object({
        naverUrl: optionalUrlSchema,
        tmapUrl: optionalUrlSchema,
        kakaoNaviUrl: optionalUrlSchema,
      }).default({ naverUrl: "", tmapUrl: "", kakaoNaviUrl: "" }),
    }).default({
      naverMapClientId: "",
      zoom: 16,
      navigation: { naverUrl: "", tmapUrl: "", kakaoNaviUrl: "" },
    }),
    transport: z.array(z.object({
      title: z.string().min(1).max(100),
      body: z.string().min(1).max(1_000),
    })).max(12),
  }),
  interview: z.array(z.object({
    id: z.string().min(1).max(80),
    question: z.string().min(1).max(300),
    answer: z.string().min(1).max(2_000),
    image: mediaReferenceSchema.default({
      assetId: null,
      alt: "",
      placeholder: "interview",
    }),
  })).max(12),
  timeline: z.array(z.object({
    id: z.string().min(1).max(80),
    date: z.string().max(40),
    title: z.string().min(1).max(160),
    body: z.string().max(1_000),
    image: mediaReferenceSchema,
  })).min(1).max(20),
  gallery: z.object({
    layout: z.enum(["grid", "carousel", "both"]).default("grid"),
    initialCount: z.number().int().min(2).max(30).default(6),
    items: z.array(mediaReferenceSchema.extend({
      id: z.string().min(1).max(80),
    })).max(100),
  }),
  guestbook: z.object({
    title: z.string().min(1).max(160),
    description: z.string().max(500),
    enabled: z.boolean(),
    actions: z.object({
      writeLabel: z.string().min(1).max(80),
      viewLabel: z.string().min(1).max(80),
    }).default({
      writeLabel: "방명록 작성하기",
      viewLabel: "방명록 전체보기",
    }),
  }),
  rsvp: z.object({
    title: z.string().min(1).max(160),
    description: z.string().max(500),
    enabled: z.boolean(),
    collectMeal: z.boolean(),
    collectShuttle: z.boolean(),
    actions: z.object({
      eyebrow: z.string().max(80).default("R.S.V.P."),
      triggerLabel: z.string().min(1).max(80).default("참석 의사 전달하기"),
    }).default({
      eyebrow: "R.S.V.P.",
      triggerLabel: "참석 의사 전달하기",
    }),
  }),
  celebration: z.object({
    enabled: z.boolean().default(false),
    triggerLabel: z.string().min(1).max(80).default("축하 화환 보내기"),
    message: z.string().max(1_000).default("신랑, 신부의 결혼을 축하해주세요!\n예식일에 맞춰 웨딩홀로 배송됩니다."),
    linkLabel: z.string().min(1).max(80).default("축하 화환 보내기"),
    linkUrl: optionalUrlSchema,
  }).default({
    enabled: false,
    triggerLabel: "축하 화환 보내기",
    message: "신랑, 신부의 결혼을 축하해주세요!\n예식일에 맞춰 웨딩홀로 배송됩니다.",
    linkLabel: "축하 화환 보내기",
    linkUrl: "",
  }),
  accounts: z.array(z.object({
    id: z.string().min(1).max(80),
    label: z.string().min(1).max(40),
    items: z.array(z.object({
      id: z.string().min(1).max(80),
      holder: z.string().min(1).max(80),
      bank: z.string().min(1).max(80),
      accountNumber: z.string().min(1).max(80),
      paymentUrl: optionalUrlSchema,
    })).min(1).max(8),
  })).max(4),
  guestUploads: z.object({
    enabled: z.boolean(),
    opensAt: z.string().datetime({ offset: true }),
    title: z.string().min(1).max(160),
    description: z.string().max(1_000),
    fallbackItems: z.array(mediaReferenceSchema).max(3).default([]),
  }),
  music: z.object({
    enabled: z.boolean(),
    assetId: z.string().uuid().nullable().default(null),
    title: z.string().max(160),
  }),
  sharing: z.object({
    kakaoJavaScriptKey: z.string().trim().max(160).default(""),
    kakaoShareImage: z.object({
      assetId: z.string().uuid().nullable().default(null),
    }).default({ assetId: null }),
    channelTalk: z.object({
      enabled: z.boolean().default(false),
      pluginKey: z.string().trim().max(200).default(""),
    }).default({ enabled: false, pluginKey: "" }),
  }).default({
    kakaoJavaScriptKey: "",
    kakaoShareImage: { assetId: null },
    channelTalk: { enabled: false, pluginKey: "" },
  }),
  sectionCopy: sectionCopySchema,
  middleImage: mediaReferenceSchema.default({
    assetId: null,
    alt: "",
    placeholder: "middle",
  }),
  closing: z.object({
    title: z.string().max(160),
    body: z.string().max(1_000),
    image: mediaReferenceSchema,
  }),
  sections: z.array(z.object({
    id: sectionIdSchema,
    enabled: z.boolean(),
  })).min(1).superRefine((sections, context) => {
    const ids = new Set<string>();
    sections.forEach((section, index) => {
      if (ids.has(section.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate section: ${section.id}`,
          path: [index, "id"],
        });
      }
      ids.add(section.id);
    });
  }).transform((sections) => (
    sections.some((section) => section.id === "profile")
      ? sections
      : [...sections, { id: "profile", enabled: false }]
  )),
});

const invitationThemeIdSchema = z
  .enum(["garden-editorial", "botanic-garden", "sicilian-noir", "photo-editorial"])
  .default("botanic-garden")
  .transform((themeId) => (
    themeId === "garden-editorial" ? "botanic-garden" as const : themeId
  ));

const sicilianNoirVisualTokens = {
  colors: {
    paper: "#ffffff",
    ink: "#0a0a0a",
    muted: "#6f6f6f",
    line: "#dedede",
    accent: "#0a0a0a",
    surface: "#f4f4f4",
  },
  typography: {
    display: "\"Avenir Next\", \"Helvetica Neue\", Arial, Pretendard, \"Noto Sans KR\", sans-serif",
    body: "\"Avenir Next\", \"Helvetica Neue\", Arial, Pretendard, \"Noto Sans KR\", sans-serif",
  },
} as const;

export const invitationDesignSchema = z.object({
  themeId: invitationThemeIdSchema,
  colors: z.object({
    paper: colorSchema,
    ink: colorSchema,
    muted: colorSchema,
    line: colorSchema,
    accent: colorSchema,
    surface: colorSchema,
  }),
  typography: z.object({
    display: z.string().min(1).max(200),
    body: z.string().min(1).max(200),
  }),
  radius: z.number().int().min(0).max(40),
  spacing: z.object({
    section: z.number().int().min(48).max(240),
    content: z.number().int().min(12).max(48),
  }),
  motion: z.object({
    reveal: z.enum(["fade", "fade-up", "slide"]),
    durationMs: z.number().int().min(0).max(2_000),
  }),
  customProfiles: z.array(z.object({
    id: z.string().min(1).max(80),
    name: z.string().trim().min(1).max(80),
    baseThemeId: z.enum(["botanic-garden", "sicilian-noir", "photo-editorial"]),
    tokens: z.object({
      colors: z.object({
        paper: colorSchema,
        ink: colorSchema,
        muted: colorSchema,
        line: colorSchema,
        accent: colorSchema,
        surface: colorSchema,
      }),
      typography: z.object({
        display: z.string().min(1).max(200),
        body: z.string().min(1).max(200),
      }),
      radius: z.number().int().min(0).max(40),
      spacing: z.object({
        section: z.number().int().min(48).max(240),
        content: z.number().int().min(12).max(48),
      }),
      motion: z.object({
        reveal: z.enum(["fade", "fade-up", "slide"]),
        durationMs: z.number().int().min(0).max(2_000),
      }),
    }),
  })).max(8).default([]),
  activeCustomProfileId: z.string().min(1).max(80).nullable().default(null),
}).transform((design) => {
  const activeCustomProfileId = design.customProfiles.some(
    (profile) => profile.id === design.activeCustomProfileId,
  ) ? design.activeCustomProfileId : null;

  return {
    ...design,
    ...(design.themeId === "photo-editorial" && activeCustomProfileId === null
      ? sicilianNoirVisualTokens
      : {}),
    activeCustomProfileId,
  };
});

export type InvitationContent = z.infer<typeof invitationContentSchema>;
export type InvitationDesign = z.infer<typeof invitationDesignSchema>;

export function collectInvitationMediaAssetIds(
  content: InvitationContent,
): string[] {
  const ids = new Set<string>();
  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!value || typeof value !== "object") {
      return;
    }
    Object.entries(value).forEach(([key, nested]) => {
      if (key === "assetId" && typeof nested === "string") {
        ids.add(nested);
        return;
      }
      visit(nested);
    });
  };
  visit(content);
  return [...ids].sort();
}

export function createMediaPublicationPlan(
  content: InvitationContent,
  assets: Array<{
    id: string;
    state: "draft" | "published" | "archived";
  }>,
) {
  const referencedIds = collectInvitationMediaAssetIds(content);
  const availableIds = new Set(
    assets
      .filter((asset) => asset.state !== "archived")
      .map((asset) => asset.id),
  );
  const referencedSet = new Set(referencedIds);
  return {
    referencedIds,
    publishedIds: [...availableIds].filter((id) => referencedSet.has(id)).sort(),
    draftIds: [...availableIds].filter((id) => !referencedSet.has(id)).sort(),
    missingIds: referencedIds.filter((id) => !availableIds.has(id)),
  };
}

export function createInvitationPreview(input: {
  id: string;
  slug: string;
  revision: number;
  draftContent: unknown;
  draftDesign: unknown;
}) {
  return {
    id: z.string().uuid().parse(input.id),
    slug: z.string().regex(/^[a-z0-9-]+$/).parse(input.slug),
    revision: z.number().int().nonnegative().parse(input.revision),
    publishedAt: null,
    preview: true as const,
    content: invitationContentSchema.parse(input.draftContent),
    design: invitationDesignSchema.parse(input.draftDesign),
  };
}

export const sampleInvitationContent: InvitationContent = {
  locale: "ko-KR",
  couple: {
    partnerOne: { name: "신랑 이름", label: "신랑", familyRelation: "아들" },
    partnerTwo: { name: "신부 이름", label: "신부", familyRelation: "딸" },
  },
  hero: {
    eyebrow: "",
    title: "CELEBRATE L’AMORE",
    subtitle: "",
    image: { assetId: null, alt: "첫 화면 웨딩 사진", placeholder: "hero-photo" },
    nameOrder: ["partnerTwo", "partnerOne"],
  },
  greeting: {
    title: "소중한 분들을 초대합니다",
    body: "두 사람이 같은 방향을 바라보며 새로운 시작을 합니다.\n귀한 걸음으로 축복해 주시면 감사하겠습니다.",
    image: { assetId: null, alt: "두 사람의 사진", placeholder: "portrait" },
  },
  profiles: defaultProfiles,
  contacts: [
    { id: "partner-one", side: "partnerOne", relationship: "partner", role: "신랑", name: "신랑 이름", phone: "010-0000-0000" },
    { id: "partner-one-father", side: "partnerOne", relationship: "father", role: "아버지", name: "신랑 아버지", phone: "010-0000-0000" },
    { id: "partner-one-mother", side: "partnerOne", relationship: "mother", role: "어머니", name: "신랑 어머니", phone: "010-0000-0000" },
    { id: "partner-two", side: "partnerTwo", relationship: "partner", role: "신부", name: "신부 이름", phone: "010-0000-0000" },
    { id: "partner-two-father", side: "partnerTwo", relationship: "father", role: "아버지", name: "신부 아버지", phone: "010-0000-0000" },
    { id: "partner-two-mother", side: "partnerTwo", relationship: "mother", role: "어머니", name: "신부 어머니", phone: "010-0000-0000" },
  ],
  event: {
    startsAt: "2027-05-22T14:00:00+09:00",
    timezone: "Asia/Seoul",
    venueName: "예식장 이름",
    hall: "홀 이름",
    address: "서울시 예식장 주소",
    telephone: "02-000-0000",
    latitude: 37.5665,
    longitude: 126.978,
    sketchMap: {
      assetId: null,
      alt: "예식장 약도",
      placeholder: "venue-sketch-map",
    },
    map: {
      naverMapClientId: "",
      zoom: 16,
      navigation: { naverUrl: "", tmapUrl: "", kakaoNaviUrl: "" },
    },
    transport: [
      { title: "지하철", body: "가까운 역과 출구 정보를 입력해 주세요." },
      { title: "버스", body: "정류장과 버스 노선 정보를 입력해 주세요." },
      { title: "주차", body: "주차장과 이용 시간을 입력해 주세요." },
    ],
  },
  interview: [
    {
      id: "first-impression",
      question: "서로의 첫인상은 어땠나요?",
      answer: "두 사람만의 답변을 입력해 주세요.",
      image: { assetId: null, alt: "신랑 인터뷰 사진", placeholder: "partner-one" },
    },
    {
      id: "promise",
      question: "어떤 부부가 되고 싶나요?",
      answer: "두 사람만의 약속을 입력해 주세요.",
      image: { assetId: null, alt: "신부 인터뷰 사진", placeholder: "partner-two" },
    },
  ],
  timeline: [
    { id: "met", date: "2024. 04", title: "처음 만난 날", body: "우리의 이야기를 입력해 주세요.", image: { assetId: null, alt: "", placeholder: "story-1" } },
    { id: "journey", date: "2025. 03", title: "함께한 여행", body: "우리의 이야기를 입력해 주세요.", image: { assetId: null, alt: "", placeholder: "story-2" } },
    { id: "promise", date: "2026. 12", title: "평생을 약속한 날", body: "우리의 이야기를 입력해 주세요.", image: { assetId: null, alt: "", placeholder: "story-3" } },
  ],
  gallery: {
    layout: "grid",
    initialCount: 6,
    items: Array.from({ length: 8 }, (_, index) => ({
      id: `gallery-${index + 1}`,
      assetId: null,
      alt: `웨딩 갤러리 사진 ${index + 1}`,
      placeholder: `gallery-${index + 1}`,
    })),
  },
  guestbook: {
    title: "방명록",
    description: "축하하는 마음을 글로 남겨 주세요.",
    enabled: true,
    actions: {
      writeLabel: "방명록 작성하기",
      viewLabel: "방명록 전체보기",
    },
  },
  rsvp: {
    title: "참석 의사 전달",
    description: "준비에 도움이 되도록 참석 여부를 알려 주세요.",
    enabled: true,
    collectMeal: true,
    collectShuttle: true,
    actions: {
      eyebrow: "R.S.V.P.",
      triggerLabel: "참석 의사 전달하기",
    },
  },
  celebration: {
    enabled: false,
    triggerLabel: "축하 화환 보내기",
    message: "신랑, 신부의 결혼을 축하해주세요!\n예식일에 맞춰 웨딩홀로 배송됩니다.",
    linkLabel: "축하 화환 보내기",
    linkUrl: "",
  },
  accounts: [
    {
      id: "partner-one",
      label: "신랑 측",
      items: [{ id: "account-one", holder: "예금주", bank: "은행", accountNumber: "000-0000-0000", paymentUrl: "" }],
    },
    {
      id: "partner-two",
      label: "신부 측",
      items: [{ id: "account-two", holder: "예금주", bank: "은행", accountNumber: "000-0000-0000", paymentUrl: "" }],
    },
  ],
  guestUploads: {
    enabled: true,
    opensAt: "2027-05-22T10:00:00+09:00",
    title: "축하 사진 공유",
    description: "예식 당일, 두 사람의 행복한 순간을 담아 올려 주세요.",
    fallbackItems: [],
  },
  music: { enabled: false, assetId: null, title: "" },
  sharing: {
    kakaoJavaScriptKey: "",
    kakaoShareImage: { assetId: null },
    channelTalk: { enabled: false, pluginKey: "" },
  },
  sectionCopy: defaultSectionCopy,
  middleImage: {
    assetId: null,
    alt: "함께 걷는 두 사람",
    placeholder: "middle",
  },
  closing: {
    title: "THANK YOU",
    body: "귀한 시간 내어 함께해 주셔서 진심으로 감사합니다.",
    image: { assetId: null, alt: "함께 걷는 두 사람", placeholder: "closing" },
  },
  sections: [
    { id: "hero", enabled: true },
    { id: "invitation", enabled: true },
    { id: "profile", enabled: true },
    { id: "interview", enabled: true },
    { id: "calendar", enabled: true },
    { id: "timeline", enabled: true },
    { id: "rsvp", enabled: true },
    { id: "location", enabled: true },
    { id: "gallery", enabled: true },
    { id: "guestbook", enabled: true },
    { id: "middleImage", enabled: true },
    { id: "accounts", enabled: true },
    { id: "guestUploads", enabled: true },
    { id: "closing", enabled: true },
  ],
};

export const sampleInvitationDesign: InvitationDesign = {
  themeId: "botanic-garden",
  colors: {
    paper: "#fbfaf7",
    ink: "#171717",
    muted: "#8b8178",
    line: "#e8e3dd",
    accent: "#d9a6a0",
    surface: "#f4f1ec",
  },
  typography: {
    display: "\"Bodoni Moda\", \"Times New Roman\", serif",
    body: "\"Pretendard\", \"Noto Sans KR\", sans-serif",
  },
  radius: 10,
  spacing: { section: 104, content: 24 },
  motion: { reveal: "fade-up", durationMs: 650 },
  customProfiles: [],
  activeCustomProfileId: null,
};
