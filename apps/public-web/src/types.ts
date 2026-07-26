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
  hero: { eyebrow: string; title: string; subtitle: string };
  greeting: { title: string; body: string; image: MediaReference };
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
    initialCount: number;
    items: Array<MediaReference & { id: string }>;
  };
  guestbook: { title: string; description: string; enabled: boolean };
  rsvp: {
    title: string;
    description: string;
    enabled: boolean;
    collectMeal: boolean;
    collectShuttle: boolean;
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
  sharing: { kakaoJavaScriptKey: string };
  middleImage: MediaReference;
  closing: { title: string; body: string; image: MediaReference };
  sections: Array<{ id: string; enabled: boolean }>;
}

export interface InvitationDesign {
  colors: {
    paper: string;
    ink: string;
    muted: string;
    line: string;
    accent: string;
    surface: string;
  };
  typography: { display: string; body: string };
  radius: number;
  spacing: { section: number; content: number };
  motion: { reveal: "fade" | "fade-up" | "slide"; durationMs: number };
}

export interface InvitationResponse {
  id?: string;
  slug: string;
  revision: number;
  publishedAt: string | null;
  preview?: boolean;
  content: InvitationContent;
  design: InvitationDesign;
}

export interface GuestbookEntry {
  id: string;
  name: string;
  message: string;
  createdAt: string;
}
