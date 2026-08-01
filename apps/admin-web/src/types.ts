export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
}

export interface InvitationSummary {
  id: string;
  slug: string;
  status: "draft" | "published" | "archived";
  revision: number;
  publishedRevision: number | null;
  updatedAt: string;
  publishedAt: string | null;
}

export interface MediaReference {
  assetId: string | null;
  alt: string;
  placeholder: string;
}

export type ContactSide = "partnerOne" | "partnerTwo";
export type ContactRelationship = "partner" | "father" | "mother" | "other";

export interface InvitationContact {
  id: string;
  side: ContactSide;
  relationship: ContactRelationship;
  role: string;
  name: string;
  phone: string;
}

export interface InvitationContent {
  locale: "ko-KR" | "en-US";
  couple: {
    partnerOne: { name: string; label: string; familyRelation: string };
    partnerTwo: { name: string; label: string; familyRelation: string };
  };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    image: MediaReference;
    nameOrder: Array<"partnerOne" | "partnerTwo">;
  };
  greeting: { title: string; body: string; image: MediaReference };
  profiles: {
    eyebrow: string;
    title: string;
    items: Array<{
      id: string;
      side: ContactSide;
      birthDate: string;
      location: string;
      tags: string;
      message: string;
      image: MediaReference;
    }>;
  };
  contacts: InvitationContact[];
  event: {
    startsAt: string;
    timezone: string;
    venueName: string;
    hall: string;
    address: string;
    telephone: string;
    latitude: number | null;
    longitude: number | null;
    sketchMap: MediaReference;
    map: {
      naverMapClientId: string;
      zoom: number;
      navigation: { naverUrl: string; tmapUrl: string; kakaoNaviUrl: string };
    };
    transport: Array<{ title: string; body: string }>;
  };
  interview: Array<{
    id: string;
    question: string;
    answer: string;
    image: MediaReference;
  }>;
  timeline: Array<{
    id: string;
    date: string;
    title: string;
    body: string;
    image: MediaReference;
  }>;
  gallery: {
    layout: "grid" | "carousel" | "both";
    initialCount: number;
    items: Array<MediaReference & { id: string }>;
  };
  guestbook: {
    title: string;
    description: string;
    enabled: boolean;
    actions: { writeLabel: string; viewLabel: string };
  };
  rsvp: {
    title: string;
    description: string;
    enabled: boolean;
    collectMeal: boolean;
    collectShuttle: boolean;
    actions: { eyebrow: string; triggerLabel: string };
  };
  celebration: {
    enabled: boolean;
    triggerLabel: string;
    message: string;
    linkLabel: string;
    linkUrl: string;
  };
  accounts: Array<{
    id: string;
    label: string;
    items: Array<{
      id: string;
      holder: string;
      bank: string;
      accountNumber: string;
      paymentUrl: string;
    }>;
  }>;
  guestUploads: {
    enabled: boolean;
    opensAt: string;
    title: string;
    description: string;
  };
  music: { enabled: boolean; assetId: string | null; title: string };
  sharing: {
    kakaoJavaScriptKey: string;
    kakaoShareImage: { assetId: string | null };
    channelTalk: { enabled: boolean; pluginKey: string };
  };
  sectionCopy: {
    interview: SectionHeadingCopy;
    calendar: SectionHeadingCopy;
    timeline: SectionHeadingCopy;
    location: SectionHeadingCopy;
    gallery: SectionHeadingCopy;
    accounts: SectionHeadingCopy;
  };
  middleImage: MediaReference;
  closing: { title: string; body: string; image: MediaReference };
  sections: Array<{ id: string; enabled: boolean }>;
}

export interface SectionHeadingCopy {
  eyebrow: string;
  title: string;
  description: string;
}

export interface InvitationDesign {
  themeId: "botanic-garden" | "sicilian-noir" | "photo-editorial";
  colors: Record<"paper" | "ink" | "muted" | "line" | "accent" | "surface", string>;
  typography: { display: string; body: string };
  radius: number;
  spacing: { section: number; content: number };
  motion: { reveal: "fade" | "fade-up" | "slide"; durationMs: number };
  customProfiles: CustomDesignProfile[];
  activeCustomProfileId: string | null;
}

export interface CustomDesignProfile {
  id: string;
  name: string;
  baseThemeId: InvitationDesign["themeId"];
  tokens: Omit<InvitationDesign, "themeId" | "customProfiles" | "activeCustomProfileId">;
}

export interface InvitationDetail extends InvitationSummary {
  timezone: string;
  draftContent: InvitationContent;
  draftDesign: InvitationDesign;
}

export interface MediaAsset {
  id: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  purpose: string;
  altText: string;
  position: number;
  state: string;
  previewUrl: string;
  connectedToDraft: boolean;
  connectedToPublished: boolean;
}

export interface Rsvp {
  id: string;
  attending: boolean;
  name: string;
  party: string;
  phone: string;
  additionalGuests: number;
  meal: string | null;
  shuttle: string | null;
  note: string;
  createdAt: string;
}

export interface GuestbookEntry {
  id: string;
  name: string;
  message: string;
  state: "visible" | "hidden" | "deleted";
  createdAt: string;
}

export interface GuestUpload {
  id: string;
  originalName: string;
  uploaderName: string;
  note: string;
  state: "pending" | "approved" | "rejected";
  createdAt: string;
  downloadUrl: string;
}
