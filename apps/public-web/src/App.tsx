import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type PointerEvent,
} from "react";

import {
  createGuestbookEntry,
  deleteGuestbookEntry,
  loadGuestbook,
  loadGuestUploadPhotos,
  loadInvitation,
  loadInvitationPreview,
  submitRsvp,
  uploadGuestPhoto,
} from "./api";
import {
  chooseAmbientGuestbookEntry,
  shouldRevealAmbientGuestbook,
} from "./ambient-guestbook";
import { Dialog } from "./components/Dialog";
import { Media, type RevealDirection } from "./components/Media";
import {
  QuickMenu,
  sectionAnchorId,
  type QuickMenuSection,
} from "./components/QuickMenu";
import { createCalendarFile, downloadCalendarFile } from "./event-calendar";
import { formatHeroDate } from "./hero-date";
import {
  invitationThemeAttributes,
  resolveInvitationThemeDesign,
} from "./invitation-theme";
import {
  createKakaoSharePayload,
  getClosingSharePresentations,
  isKakaoShareAvailable,
  sendKakaoShare,
} from "./kakao-share";
import { moveCarouselIndex } from "./carousel";
import {
  selectGuestUploadGallery,
  type GuestUploadGallery,
  type GuestUploadPhoto,
} from "./guest-upload-gallery";
import { bootChannelTalk } from "./channel-talk";
import {
  buildOpenStreetMapEmbedUrl,
  getKakaoMapLevel,
  getMapProvider,
} from "./map-provider";
import {
  dismissRsvpWelcomePromptForToday,
  rsvpPromptStorageKey,
  shouldShowRsvpWelcomePrompt,
} from "./rsvp-welcome-prompt";
import type {
  ContactRelationship,
  ContactSide,
  GuestbookEntry,
  InvitationContent,
  InvitationDesign,
  MediaReference,
} from "./types";

type DialogName = "quick-menu" | "contact" | "interview" | "rsvp" | "celebration" | "sketch-map" | "guestbook" | "guestbook-write" | "guestbook-delete" | "upload" | null;

const defaultSlug = import.meta.env.VITE_INVITATION_SLUG ?? "our-wedding";
const quickMenuSectionLabels: Record<string, string> = {
  hero: "첫 화면",
  invitation: "인사말",
  profile: "프로필",
  interview: "인터뷰",
  calendar: "달력·디데이",
  timeline: "우리 이야기",
  rsvp: "참석 의사",
  location: "오시는 길",
  gallery: "갤러리",
  guestbook: "방명록",
  middleImage: "중간 사진",
  accounts: "마음 전하실 곳",
  guestUploads: "축하 사진 공유",
  closing: "마무리",
};
const contactRelationshipOrder: Record<ContactRelationship, number> = {
  partner: 0,
  father: 1,
  mother: 2,
  other: 3,
};

function PhoneIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M7.4 3.5 9.8 8l-2 1.8a13.5 13.5 0 0 0 6.4 6.4l1.8-2 4.5 2.4-.8 3.2a2 2 0 0 1-2 1.5C9.4 20.6 3.4 14.6 2.7 6.3a2 2 0 0 1 1.5-2Z" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 5.5h16v11H8l-4 3v-14Z" />
      <path d="m7 9 5 3.5L17 9" />
    </svg>
  );
}

function CelebrationIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 20.5c-2.2-3.6-6.6-4.3-7.8-7.2-1-2.5.8-4.8 3-4.5 1.5.2 2.5 1.5 2.7 3.2.1-3 1.9-5.2 4.2-5.2 2.1 0 3.6 2 2.9 4.3-.7 2.1-2.9 3.2-4.1 4.7-.9 1.1-1.1 2.9-.9 4.7Z" />
      <path d="M9.8 12.2c.2 1.7.8 3.4 2.2 4.5" />
    </svg>
  );
}

type NavigationProvider = "naver" | "tmap" | "kakao";

function NavigationServiceIcon({ provider }: { provider: NavigationProvider }) {
  if (provider === "naver") {
    return (
      <svg className="navigation-service-icon" aria-hidden="true" viewBox="0 0 24 24">
        <path fill="#03c75a" d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
        <path fill="#fff" d="M7 6.5h2.35l5.1 6.9V6.5H17V17.5h-2.2L9.55 10.4v7.1H7V6.5Z" />
      </svg>
    );
  }
  if (provider === "tmap") {
    return (
      <svg className="navigation-service-icon" aria-hidden="true" viewBox="0 0 24 24">
        <defs><linearGradient id="tmap-icon-gradient" x1="4" x2="20" y1="4" y2="20"><stop stopColor="#00b5ef" /><stop offset="1" stopColor="#8b55e8" /></linearGradient></defs>
        <path fill="url(#tmap-icon-gradient)" d="M4 4h16v16H4z" rx="5" />
        <path fill="#fff" d="M7 7h10v2.2h-3.8v7.8h-2.4V9.2H7V7Z" />
      </svg>
    );
  }
  return (
    <svg className="navigation-service-icon" aria-hidden="true" viewBox="0 0 24 24">
      <path fill="#fee500" d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path fill="#1c1c1c" d="M12 5.6c-3.45 0-6.25 2.28-6.25 5.1 0 1.82 1.18 3.42 2.96 4.33l-.54 2.02a.42.42 0 0 0 .65.45l2.42-1.62c.25.02.5.03.76.03 3.45 0 6.25-2.28 6.25-5.1s-2.8-5.17-6.25-5.17Zm2.65 5.38-3.62 2.62a.42.42 0 0 1-.67-.34v-1.88H8.92a.42.42 0 0 1-.25-.76l3.62-2.62a.42.42 0 0 1 .67.34v1.88h1.44a.42.42 0 0 1 .25.76Z" />
    </svg>
  );
}

function FamilyRelationshipLine({ content }: { content: InvitationContent }) {
  const sides = [
    { key: "partnerOne", partner: content.couple.partnerOne },
    { key: "partnerTwo", partner: content.couple.partnerTwo },
  ] as const;
  const hasParentContacts = content.contacts.some(
    (contact) => contact.relationship === "father" || contact.relationship === "mother",
  );

  if (!hasParentContacts) {
    return (
      <div className="couple-line">
        <span>{content.couple.partnerOne.label}</span>
        <em>·</em>
        <span>{content.couple.partnerOne.familyRelation}</span>
        <strong>{content.couple.partnerOne.name}</strong>
        <i aria-hidden="true" />
        <span>{content.couple.partnerTwo.label}</span>
        <em>·</em>
        <span>{content.couple.partnerTwo.familyRelation}</span>
        <strong>{content.couple.partnerTwo.name}</strong>
      </div>
    );
  }

  return (
    <div className="family-relations">
      {sides.map(({ key, partner }) => {
        const parents = content.contacts
          .filter((contact) => (
            contact.side === key
            && (contact.relationship === "father" || contact.relationship === "mother")
          ))
          .sort((left, right) => (
            contactRelationshipOrder[left.relationship]
            - contactRelationshipOrder[right.relationship]
          ));
        if (parents.length === 0) {
          return (
            <div className="family-relation family-relation--simple" key={key}>
              <span>{partner.label}</span>
              <strong>{partner.name}</strong>
            </div>
          );
        }
        return (
          <div className="family-relation" key={key}>
            <span className="family-relation__label">{partner.label}</span>
            <em>·</em>
            <span>{parents.map((contact) => contact.name).join(" · ")}</span>
            <em>의</em>
            <span>{partner.familyRelation}</span>
            <strong>{partner.name}</strong>
          </div>
        );
      })}
    </div>
  );
}

function GuestUploadShowcase({
  gallery,
  preview,
}: {
  gallery: GuestUploadGallery;
  preview: boolean;
}) {
  if (gallery.items.length === 0) return null;

  return (
    <section className="guest-upload-showcase" aria-label="축하 사진">
      <p>{gallery.source === "guest" ? "함께 나눈 축하 사진" : "두 사람의 미리 보기"}</p>
      <div className="guest-upload-showcase__grid">
        {gallery.source === "guest"
          ? gallery.items.map((photo) => <img key={photo.id} src={photo.url} alt={photo.alt} />)
          : gallery.items.map((item, index) => <Media key={`${item.assetId}-${index}`} media={item} preview={preview} />)}
      </div>
    </section>
  );
}

function GuestUploadPolaroid({
  gallery,
  preview,
}: {
  gallery: GuestUploadGallery;
  preview: boolean;
}) {
  const cards = gallery.source === "guest"
    ? gallery.items.slice(0, 3).map((photo) => <span key={photo.id}><img src={photo.url} alt={photo.alt} /></span>)
    : gallery.items.slice(0, 3).map((item, index) => <span key={`${item.assetId}-${index}`}><Media media={item} preview={preview} /></span>);
  return (
    <div className="polaroid-stack" aria-label="축하 사진">
      {cards.length > 0
        ? cards
        : <><span aria-hidden="true">01</span><span aria-hidden="true">02</span><span aria-hidden="true">03</span></>}
    </div>
  );
}

function useCountdown(startsAt: string) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const distance = Math.max(0, Date.parse(startsAt) - now);
  return {
    days: Math.floor(distance / 86_400_000),
    hours: Math.floor(distance / 3_600_000) % 24,
    minutes: Math.floor(distance / 60_000) % 60,
    seconds: Math.floor(distance / 1_000) % 60,
  };
}

function formatEventDate(startsAt: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(startsAt));
}

interface KakaoMaps {
  LatLng: new (latitude: number, longitude: number) => unknown;
  Map: new (container: HTMLElement, options: { center: unknown; level: number }) => unknown;
  Marker: new (options: { map: unknown; position: unknown }) => unknown;
  load: (callback: () => void) => void;
}

declare global {
  interface Window {
    kakao?: { maps?: KakaoMaps };
  }
}

let kakaoMapsPromise: Promise<KakaoMaps> | undefined;

function loadKakaoMaps(javascriptKey: string): Promise<KakaoMaps> {
  if (kakaoMapsPromise) return kakaoMapsPromise;

  kakaoMapsPromise = new Promise((resolve, reject) => {
    const load = () => {
      const maps = window.kakao?.maps;
      if (!maps) {
        reject(new Error("Kakao Map SDK is unavailable."));
        return;
      }
      maps.load(() => resolve(maps));
    };
    const existing = document.querySelector<HTMLScriptElement>("script[data-wedding-kakao-map]");
    if (existing) {
      if (window.kakao?.maps) load();
      else {
        existing.addEventListener("load", load, { once: true });
        existing.addEventListener("error", () => reject(new Error("Kakao Map SDK failed to load.")), { once: true });
      }
      return;
    }
    const script = document.createElement("script");
    script.dataset.weddingKakaoMap = "true";
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=${encodeURIComponent(javascriptKey)}`;
    script.addEventListener("load", load, { once: true });
    script.addEventListener("error", () => reject(new Error("Kakao Map SDK failed to load.")), { once: true });
    document.head.append(script);
  });

  return kakaoMapsPromise;
}

function OpenStreetMap({ event }: { event: InvitationContent["event"] }) {
  const { latitude, longitude } = event;
  if (latitude === null || longitude === null) {
    return <a className="map-embed map-embed--fallback" href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(event.address)}`} rel="noreferrer" target="_blank">OpenStreetMap에서 위치 보기</a>;
  }
  return <iframe className="map-embed" loading="lazy" src={buildOpenStreetMapEmbedUrl(latitude, longitude)} title={`${event.venueName} OpenStreetMap`} />;
}

function VenueMap({
  event,
  kakaoJavaScriptKey,
}: {
  event: InvitationContent["event"];
  kakaoJavaScriptKey: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const { latitude, longitude } = event;
  const provider = getMapProvider(kakaoJavaScriptKey);

  useEffect(() => {
    if (provider !== "kakao" || latitude === null || longitude === null || !mapRef.current) return;
    let cancelled = false;
    setFailed(false);
    void loadKakaoMaps(kakaoJavaScriptKey).then((maps) => {
      if (cancelled || !mapRef.current) return;
      const position = new maps.LatLng(latitude, longitude);
      const instance = new maps.Map(mapRef.current, {
        center: position,
        level: getKakaoMapLevel(event.map.zoom),
      });
      new maps.Marker({ map: instance, position });
    }).catch(() => {
      if (!cancelled) setFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [event.map.zoom, kakaoJavaScriptKey, latitude, longitude, provider]);

  if (provider !== "kakao" || latitude === null || longitude === null || failed) {
    return <OpenStreetMap event={event} />;
  }
  return <div className="map-embed" ref={mapRef} role="img" aria-label={`${event.venueName} 카카오맵`} />;
}

function mapNavigationLinks(event: InvitationContent["event"]) {
  const destination = encodeURIComponent(event.venueName || event.address);
  const { latitude, longitude, map } = event;
  const coordinatesAvailable = latitude !== null && longitude !== null;
  return [
    { provider: "naver" as const, label: "네이버지도", href: map.navigation.naverUrl || `https://map.naver.com/p/search/${encodeURIComponent(event.address)}` },
    { provider: "tmap" as const, label: "티맵", href: map.navigation.tmapUrl || (coordinatesAvailable ? `tmap://route?goalx=${longitude}&goaly=${latitude}&goalname=${destination}` : "") },
    { provider: "kakao" as const, label: "카카오내비", href: map.navigation.kakaoNaviUrl || (coordinatesAvailable ? `kakaonavi://navigate?name=${destination}&x=${longitude}&y=${latitude}&coord_type=wgs84` : "") },
  ].filter((link) => link.href);
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </header>
  );
}

function SicilianCatalogHero({
  content,
  heroDate,
  preview,
}: {
  content: InvitationContent;
  heroDate: ReturnType<typeof formatHeroDate>;
  preview: boolean;
}) {
  const partnersByKey = {
    partnerOne: content.couple.partnerOne,
    partnerTwo: content.couple.partnerTwo,
  };
  const uploadedGallery = content.gallery.items.filter((item) => item.assetId);
  const visuals = uploadedGallery.length > 0
    ? uploadedGallery.slice(0, 3)
    : [content.greeting.image, ...content.gallery.items.slice(0, 2)];
  const eventYear = new Date(content.event.startsAt).getFullYear();
  const mastheadTitle = ["INVITÉ", "INVITATION"].includes(content.hero.title)
    ? "CELEBRATE L’AMORE"
    : content.hero.title;

  return (
    <section className="catalog-hero" id={sectionAnchorId("hero")} data-reveal>
      <header className="catalog-hero__masthead">
        <span>WEDDING</span>
        <h1>{mastheadTitle}</h1>
        <span>{eventYear}</span>
      </header>
      <div className="catalog-hero__tile-ribbon" aria-hidden="true" />
      <div className="catalog-hero__canvas">
        <div className="catalog-hero__visual">
          {visuals.map((visual, index) => (
            <Media
              media={visual}
              className="catalog-hero__image"
              preview={preview}
              key={`${visual.assetId ?? visual.placeholder ?? "visual"}-${index}`}
            />
          ))}
        </div>
        <div className="catalog-hero__details">
          <p className="catalog-hero__eyebrow">
            {content.hero.eyebrow || "THE WEDDING"}
          </p>
          <div className="catalog-hero__names">
            {content.hero.nameOrder.map((partnerKey) => (
              <strong key={partnerKey}>{partnersByKey[partnerKey].name}</strong>
            ))}
          </div>
          <div className="catalog-hero__event">
            <p>
              {heroDate.weekday}, {heroDate.month} {heroDate.day}
              <sup>{heroDate.ordinal}</sup>
            </p>
            <time dateTime={content.event.startsAt}>{heroDate.time}</time>
          </div>
          <p className="catalog-hero__venue">
            {content.event.venueName} {content.event.hall}
          </p>
          {content.hero.subtitle ? (
            <p className="catalog-hero__subtitle">{content.hero.subtitle}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function formatPhotoHeroDate(startsAt: string, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(startsAt));
  const value = (type: Intl.DateTimeFormatPartTypes) => (
    parts.find((part) => part.type === type)?.value ?? ""
  );
  return `${value("year")}.${value("month")}.${value("day")}`;
}

function PhotoEditorialHero({
  content,
  heroDate: _heroDate,
  preview,
}: {
  content: InvitationContent;
  heroDate: ReturnType<typeof formatHeroDate>;
  preview: boolean;
}) {
  const partnersByKey = {
    partnerOne: content.couple.partnerOne,
    partnerTwo: content.couple.partnerTwo,
  };

  return (
    <section className="photo-hero" id={sectionAnchorId("hero")} data-reveal>
      <Media
        media={content.hero.image}
        className="photo-hero__image"
        preview={preview}
        loading="eager"
      />
      <div className="photo-hero__scrim" aria-hidden="true" />
      <div className="photo-hero__copy">
        <p>{content.hero.eyebrow || "OUR WEDDING"}</p>
        <h1>{content.hero.title}</h1>
        <div className="photo-hero__names">
          {content.hero.nameOrder.map((partnerKey) => (
            <strong key={partnerKey}>{partnersByKey[partnerKey].name}</strong>
          ))}
        </div>
        <time dateTime={content.event.startsAt}>
          {formatPhotoHeroDate(content.event.startsAt, content.event.timezone)}
        </time>
        {content.hero.subtitle ? <p className="photo-hero__subtitle">{content.hero.subtitle}</p> : null}
      </div>
      <span className="photo-hero__scroll" aria-hidden="true" />
    </section>
  );
}

function Calendar({ startsAt }: { startsAt: string }) {
  const date = new Date(startsAt);
  const year = date.getFullYear();
  const month = date.getMonth();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const cells = Array.from({ length: firstDay + lastDate }, (_, index) => {
    const day = index - firstDay + 1;
    return day > 0 ? day : null;
  });

  return (
    <div className="calendar" aria-label={`${year}년 ${month + 1}월 달력`}>
      <p className="calendar__month">
        {year}. {String(month + 1).padStart(2, "0")}
      </p>
      <div className="calendar__grid calendar__weekdays" aria-hidden="true">
        {"일월화수목금토".split("").map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="calendar__grid">
        {cells.map((day, index) => (
          <span
            className={day === date.getDate() ? "calendar__selected" : ""}
            key={`${index}-${day ?? "empty"}`}
          >
            {day}
          </span>
        ))}
      </div>
    </div>
  );
}

function PlaceholderBand({
  label,
  media,
  preview,
  revealDirection,
}: {
  label: string;
  media?: MediaReference;
  preview: boolean;
  revealDirection?: RevealDirection;
}) {
  return media ? <Media media={media} className="placeholder-band" preview={preview} revealDirection={revealDirection} /> : (
    <div className="placeholder-band media--placeholder" role="img" aria-label={label} data-reveal={revealDirection}>
      <span>{label}</span>
    </div>
  );
}

function AccountCardCarousel({
  accounts,
  activeIndex,
  onActiveIndexChange,
  onCopy,
}: {
  accounts: InvitationContent["accounts"][number]["items"];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onCopy: (accountNumber: string) => void | Promise<void>;
}) {
  const dragStartX = useRef<number | null>(null);
  const activeAccount = accounts[activeIndex] ?? accounts[0];
  if (!activeAccount) return null;

  const move = (direction: -1 | 1) => {
    onActiveIndexChange(moveCarouselIndex(activeIndex, direction, accounts.length));
  };

  const beginDrag = (event: PointerEvent<HTMLDivElement>) => {
    dragStartX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStartX.current === null) return;
    const delta = event.clientX - dragStartX.current;
    dragStartX.current = null;
    if (Math.abs(delta) < 48) return;
    move(delta > 0 ? -1 : 1);
  };

  return (
    <div className="account-carousel" aria-label="계좌 카드" onPointerDown={beginDrag} onPointerUp={finishDrag} onPointerCancel={() => { dragStartX.current = null; }}>
      <div className="account-carousel__viewport">
        <div
          className="account-carousel__track"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {accounts.map((account, index) => {
            const isActive = index === activeIndex;
            return (
              <article
                aria-hidden={!isActive}
                className="account-card account-card--slide"
                key={account.id}
              >
                <div>
                  <span>{account.holder}</span>
                  <strong>{account.bank} {account.accountNumber}</strong>
                </div>
                <button
                  className="small-button"
                  tabIndex={isActive ? 0 : -1}
                  type="button"
                  onClick={() => void onCopy(account.accountNumber)}
                >
                  복사
                </button>
                {account.paymentUrl ? (
                  <a className="small-button" href={account.paymentUrl} rel="noreferrer" tabIndex={isActive ? 0 : -1} target="_blank">
                    송금
                  </a>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
      {accounts.length > 1 ? (
        <div className="carousel-controls account-carousel__controls">
          <button className="icon-button" type="button" aria-label="이전 계좌" onClick={() => move(-1)}>←</button>
          <span aria-live="polite">{activeIndex + 1} / {accounts.length}</span>
          <button className="icon-button" type="button" aria-label="다음 계좌" onClick={() => move(1)}>→</button>
        </div>
      ) : null}
    </div>
  );
}

function AmbientGuestbook({
  entry,
  count,
  docked,
  onLetterClick,
  onDockClick,
}: {
  entry: GuestbookEntry | null;
  count: number;
  docked: boolean;
  onLetterClick: () => void;
  onDockClick: () => void;
}) {
  return (
    <>
      {entry ? (
        <button
          className="ambient-guestbook-letter"
          type="button"
          aria-label={`${entry.name}님의 축하 편지 보기`}
          onClick={onLetterClick}
        >
          <span className="ambient-guestbook-letter__postmark" aria-hidden="true">POSTA</span>
          <strong>{entry.message}</strong>
          <span>
            {entry.name}
            <time dateTime={entry.createdAt}>
              {new Date(entry.createdAt).toLocaleDateString("ko-KR", {
                month: "2-digit",
                day: "2-digit",
              })}
            </time>
          </span>
        </button>
      ) : null}
      {docked ? (
        <button
          className="ambient-guestbook-dock"
          type="button"
          aria-label={`축하 편지 ${count}개 보기`}
          onClick={onDockClick}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M3.5 6.5h17v11h-17z" />
            <path d="m4 7 8 6 8-6" />
          </svg>
          <strong>{count}</strong>
        </button>
      ) : null}
    </>
  );
}

export function App() {
  const previewInvitationId = new URLSearchParams(window.location.search).get("invitationId");
  const isPreview = window.location.pathname.startsWith("/preview/")
    && Boolean(previewInvitationId);
  const [content, setContent] = useState<InvitationContent | null>(null);
  const [design, setDesign] = useState<InvitationDesign | null>(null);
  const [slug, setSlug] = useState(defaultSlug);
  const [dialog, setDialog] = useState<DialogName>(null);
  const [rsvpWelcomeOpen, setRsvpWelcomeOpen] = useState(false);
  const [guestbook, setGuestbook] = useState<GuestbookEntry[]>([]);
  const [guestUploadPhotos, setGuestUploadPhotos] = useState<GuestUploadPhoto[]>([]);
  const [guestbookDeleteTarget, setGuestbookDeleteTarget] = useState<GuestbookEntry | null>(null);
  const [ambientGuestbookEntry, setAmbientGuestbookEntry] = useState<GuestbookEntry | null>(null);
  const [ambientGuestbookDocked, setAmbientGuestbookDocked] = useState(false);
  const [ambientGuestbookShownIds, setAmbientGuestbookShownIds] = useState<string[]>([]);
  const [timelineIndex, setTimelineIndex] = useState(0);
  const [accountIndex, setAccountIndex] = useState(0);
  const [accountItemIndex, setAccountItemIndex] = useState(0);
  const [galleryExpanded, setGalleryExpanded] = useState(false);
  const [notice, setNotice] = useState("");
  const [loadingError, setLoadingError] = useState("");
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const previewPositionedRef = useRef(false);
  const rsvpWelcomeCheckedRef = useRef(false);
  const ambientGuestbookLastRevealYRef = useRef<number | null>(null);
  const ambientGuestbookIdleTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPreview) return;
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = "auto";
    };
  }, [isPreview]);

  useEffect(() => {
    if (!isPreview || !content || previewPositionedRef.current) return;
    const firstFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "auto" });
        previewPositionedRef.current = true;
      });
    });
    return () => window.cancelAnimationFrame(firstFrame);
  }, [content, isPreview]);

  useEffect(() => {
    if (isPreview) return;
    const pathSlug = window.location.pathname.split("/").filter(Boolean)[0];
    if (pathSlug && pathSlug !== "index.html") {
      setSlug(pathSlug);
    }
  }, [isPreview]);

  useEffect(() => {
    const invitationRequest = isPreview && previewInvitationId
      ? loadInvitationPreview(previewInvitationId)
      : loadInvitation(slug);
    void invitationRequest
      .then((result) => {
        setContent(result.content);
        setDesign(result.design);
        document.title = `${result.content.couple.partnerOne.name} · ${result.content.couple.partnerTwo.name} 결혼합니다`;
      })
      .catch(() => setLoadingError("초대장을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."));
  }, [isPreview, previewInvitationId, slug]);

  useEffect(() => {
    if (!isPreview || !previewInvitationId) return;
    const receivePreview = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const message = event.data as {
        type?: string;
        invitationId?: string;
        content?: InvitationContent;
        design?: InvitationDesign;
      };
      if (
        message.type !== "wedding-draft-preview"
        || message.invitationId !== previewInvitationId
        || !message.content
        || !message.design
      ) {
        return;
      }
      setContent(message.content);
      setDesign(message.design);
    };
    window.addEventListener("message", receivePreview);
    window.parent.postMessage({
      type: "wedding-draft-preview-ready",
      invitationId: previewInvitationId,
    }, window.location.origin);
    return () => window.removeEventListener("message", receivePreview);
  }, [isPreview, previewInvitationId]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }),
      { threshold: 0.12 },
    );
    document.querySelectorAll("[data-reveal]").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [content]);

  useEffect(() => {
    if (!content || isPreview || !content.guestbook.enabled) return;
    let cancelled = false;
    void loadGuestbook(slug).then((entries) => {
      if (!cancelled) setGuestbook(entries);
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [content, isPreview, slug]);

  useEffect(() => {
    if (!content || isPreview || !content.guestUploads.enabled) return;
    let cancelled = false;
    void loadGuestUploadPhotos(slug).then((photos) => {
      if (!cancelled) setGuestUploadPhotos(photos);
    }).catch(() => {
      if (!cancelled) setGuestUploadPhotos([]);
    });
    return () => {
      cancelled = true;
    };
  }, [content, isPreview, slug]);

  useEffect(() => {
    if (dialog === "guestbook" && !isPreview) {
      void loadGuestbook(slug).then(setGuestbook).catch(() => setNotice("방명록을 불러오지 못했습니다."));
    }
  }, [dialog, isPreview, slug]);

  useEffect(() => {
    if (
      !content
      || isPreview
      || !content.guestbook.enabled
      || guestbook.length === 0
      || ambientGuestbookEntry
    ) {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scheduleLetter = () => {
      if (ambientGuestbookIdleTimerRef.current !== null) {
        window.clearTimeout(ambientGuestbookIdleTimerRef.current);
      }
      ambientGuestbookIdleTimerRef.current = window.setTimeout(() => {
        ambientGuestbookIdleTimerRef.current = null;
        const shownIds = new Set(ambientGuestbookShownIds);
        if (!shouldRevealAmbientGuestbook({
          entryCount: guestbook.length,
          shownCount: shownIds.size,
          scrollY: window.scrollY,
          viewportHeight: window.innerHeight,
          lastRevealY: ambientGuestbookLastRevealYRef.current,
          blocked: dialog !== null || rsvpWelcomeOpen,
          reducedMotion,
        })) {
          return;
        }

        const nextEntry = chooseAmbientGuestbookEntry(guestbook, shownIds);
        if (!nextEntry) return;
        ambientGuestbookLastRevealYRef.current = window.scrollY;
        setAmbientGuestbookShownIds((ids) => [...ids, nextEntry.id]);
        setAmbientGuestbookDocked(false);
        setAmbientGuestbookEntry(nextEntry);
      }, 650);
    };

    window.addEventListener("scroll", scheduleLetter, { passive: true });
    scheduleLetter();
    return () => {
      window.removeEventListener("scroll", scheduleLetter);
      if (ambientGuestbookIdleTimerRef.current !== null) {
        window.clearTimeout(ambientGuestbookIdleTimerRef.current);
        ambientGuestbookIdleTimerRef.current = null;
      }
    };
  }, [
    ambientGuestbookEntry,
    ambientGuestbookShownIds,
    content,
    dialog,
    guestbook,
    isPreview,
    rsvpWelcomeOpen,
  ]);

  useEffect(() => {
    if (!ambientGuestbookEntry) return;
    const timer = window.setTimeout(() => {
      setAmbientGuestbookEntry(null);
      setAmbientGuestbookDocked(true);
    }, 6_500);
    return () => window.clearTimeout(timer);
  }, [ambientGuestbookEntry]);

  useEffect(() => {
    if (!content || isPreview || !content.rsvp.enabled || rsvpWelcomeCheckedRef.current) return;
    rsvpWelcomeCheckedRef.current = true;
    try {
      setRsvpWelcomeOpen(shouldShowRsvpWelcomePrompt(
        window.localStorage.getItem(rsvpPromptStorageKey(slug)),
      ));
    } catch {
      setRsvpWelcomeOpen(true);
    }
  }, [content, isPreview, slug]);

  useEffect(() => {
    if (!content || isPreview) return;
    bootChannelTalk(content.sharing.channelTalk);
  }, [content, isPreview]);

  const countdown = useCountdown(content?.event.startsAt ?? new Date().toISOString());
  const enabledSections = useMemo(
    () => new Set(content?.sections.filter((section) => section.enabled).map((section) => section.id)),
    [content],
  );

  if (loadingError) {
    return <main className="load-state"><p>{loadingError}</p></main>;
  }
  if (!content || !design) {
    return <main className="load-state"><p>초대장을 준비하고 있습니다…</p></main>;
  }

  const resolvedDesign = resolveInvitationThemeDesign(design);
  const channelTalkEnabled = !isPreview
    && content.sharing.channelTalk.enabled
    && Boolean(content.sharing.channelTalk.pluginKey.trim());
  const style = {
    "--paper": resolvedDesign.colors.paper,
    "--ink": resolvedDesign.colors.ink,
    "--muted": resolvedDesign.colors.muted,
    "--line": resolvedDesign.colors.line,
    "--accent": resolvedDesign.colors.accent,
    "--surface": resolvedDesign.colors.surface,
    "--radius": `${resolvedDesign.radius}px`,
    "--section-space": `${resolvedDesign.spacing.section}px`,
    "--content-space": `${resolvedDesign.spacing.content}px`,
    "--display-font": resolvedDesign.typography.display,
    "--body-font": resolvedDesign.typography.body,
    "--motion-duration": `${resolvedDesign.motion.durationMs}ms`,
  } as CSSProperties;
  const heroDate = formatHeroDate(content.event.startsAt, content.event.timezone);
  const partnersByKey = {
    partnerOne: content.couple.partnerOne,
    partnerTwo: content.couple.partnerTwo,
  };

  const eventDate = new Date(content.event.startsAt);
  const timeline = content.timeline[timelineIndex] ?? content.timeline[0]!;
  const accountGroup = content.accounts[accountIndex] ?? content.accounts[0];
  const guestUploadsAvailable = Date.now() >= Date.parse(content.guestUploads.opensAt);
  const guestUploadGallery = selectGuestUploadGallery(
    guestUploadPhotos,
    content.guestUploads.fallbackItems,
  );
  const visibleGallery = galleryExpanded
    ? content.gallery.items
    : content.gallery.items.slice(0, content.gallery.initialCount);
  const quickMenuSections = content.sections.flatMap<QuickMenuSection>((section) => {
    if (!section.enabled) return [];
    if (section.id === "rsvp" && !content.rsvp.enabled) return [];
    if (section.id === "guestbook" && !content.guestbook.enabled) return [];
    if (section.id === "guestUploads" && !content.guestUploads.enabled) return [];
    if (section.id === "accounts" && !accountGroup) return [];
    const label = quickMenuSectionLabels[section.id];
    return label ? [{ id: section.id, label }] : [];
  });
  const kakaoShareImageAssetId = content.sharing.kakaoShareImage?.assetId ?? null;
  const kakaoShareEnabled = isKakaoShareAvailable(content.sharing.kakaoJavaScriptKey);
  const closingSharePresentations = getClosingSharePresentations(
    content.sharing.kakaoJavaScriptKey,
  );
  const contactGroups = ([
    { side: "partnerOne", label: `${content.couple.partnerOne.label}측` },
    { side: "partnerTwo", label: `${content.couple.partnerTwo.label}측` },
  ] satisfies Array<{ side: ContactSide; label: string }>)
    .map((group) => ({
      ...group,
      contacts: content.contacts
        .filter((contact) => contact.side === group.side)
        .sort((left, right) => (
          contactRelationshipOrder[left.relationship]
          - contactRelationshipOrder[right.relationship]
        )),
    }))
    .filter((group) => group.contacts.length > 0);

  const openAmbientGuestbook = () => {
    setAmbientGuestbookEntry(null);
    setAmbientGuestbookDocked(true);
    setDialog("guestbook");
  };

  const openAmbientGuestbookDock = () => {
    const nextEntry = chooseAmbientGuestbookEntry(
      guestbook,
      new Set(ambientGuestbookShownIds),
    );
    if (!nextEntry) {
      setDialog("guestbook");
      return;
    }
    setAmbientGuestbookShownIds((ids) => [...ids, nextEntry.id]);
    setAmbientGuestbookDocked(false);
    setAmbientGuestbookEntry(nextEntry);
  };

  const share = async () => {
    if (isPreview) {
      setNotice("초안 미리보기에서는 공유하지 않습니다.");
      return;
    }
    const shareData = {
      title: document.title,
      text: content.hero.subtitle,
      url: window.location.href,
    };
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setNotice("초대장 주소를 복사했습니다.");
    }
  };

  const copyInvitationLink = async () => {
    if (isPreview) {
      setNotice("초안 미리보기에서는 링크를 복사하지 않습니다.");
      return;
    }
    const link = window.location.href;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const fallback = document.createElement("textarea");
      fallback.value = link;
      fallback.setAttribute("readonly", "");
      fallback.style.position = "fixed";
      fallback.style.opacity = "0";
      document.body.append(fallback);
      fallback.select();
      const copied = document.execCommand("copy");
      fallback.remove();
      if (!copied) {
        setNotice("링크를 복사하지 못했습니다. 주소창에서 직접 복사해 주세요.");
        return;
      }
    }
    setNotice("초대장 주소를 복사했습니다.");
  };

  const dismissRsvpWelcomeForToday = () => {
    try {
      window.localStorage.setItem(
        rsvpPromptStorageKey(slug),
        dismissRsvpWelcomePromptForToday(),
      );
    } catch {
      // The prompt can still close when browser storage is unavailable.
    }
    setRsvpWelcomeOpen(false);
  };

  const openRsvpFromWelcome = () => {
    dismissRsvpWelcomeForToday();
    setDialog("rsvp");
  };

  const saveEventToCalendar = () => {
    if (isPreview) {
      setNotice("초안 미리보기에서는 일정을 저장하지 않습니다.");
      return;
    }
    const coupleNames = `${content.couple.partnerOne.name} · ${content.couple.partnerTwo.name}`;
    const location = [content.event.venueName, content.event.hall, content.event.address]
      .filter(Boolean)
      .join(", ");
    const calendarFile = createCalendarFile({
      startsAt: content.event.startsAt,
      title: `${coupleNames} 결혼식`,
      location,
      description: [content.hero.subtitle, content.event.address].filter(Boolean).join("\n"),
      uid: `${slug}-${Date.parse(content.event.startsAt)}@wedding-letter-codex`,
    });
    downloadCalendarFile(calendarFile, `${slug}-wedding.ics`);
    setNotice("캘린더에 저장할 수 있는 일정 파일을 받았습니다.");
  };

  const shareWithKakao = async () => {
    if (isPreview) {
      setNotice("초안 미리보기에서는 카카오 공유를 열지 않습니다.");
      return;
    }
    try {
      await sendKakaoShare({
        javascriptKey: content.sharing.kakaoJavaScriptKey,
        payload: createKakaoSharePayload({
          title: document.title,
          description: content.hero.subtitle,
          imageUrl: kakaoShareImageAssetId
            ? new URL(`/api/media/${kakaoShareImageAssetId}/content`, window.location.origin).toString()
            : "",
          pageUrl: window.location.href,
        }),
      });
    } catch {
      setNotice("카카오 공유를 열지 못했습니다. 일반 공유를 이용해 주세요.");
    }
  };

  const openQuickAction = (nextDialog: "rsvp" | "upload") => {
    setDialog(null);
    window.requestAnimationFrame(() => setDialog(nextDialog));
  };

  const toggleMusic = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      await audio.play();
      setMusicPlaying(true);
    } else {
      audio.pause();
      setMusicPlaying(false);
    }
  };

  const handleRsvp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPreview) {
      setNotice("초안 미리보기에서는 참석 의사를 제출하지 않습니다.");
      return;
    }
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await submitRsvp(slug, {
        attending: form.get("attending") === "true",
        name: form.get("name"),
        party: form.get("party"),
        phone: form.get("phone"),
        additionalGuests: Number(form.get("additionalGuests") ?? 0),
        meal: form.get("meal") || null,
        shuttle: form.get("shuttle") || null,
        note: form.get("note") ?? "",
        privacyConsent: form.get("privacyConsent") === "on",
      });
      setDialog(null);
      setNotice("참석 의사를 전달했습니다. 고맙습니다.");
      formElement.reset();
    } catch {
      setNotice("전송하지 못했습니다. 입력 내용을 확인해 주세요.");
    }
  };

  const handleGuestbook = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPreview) {
      setNotice("초안 미리보기에서는 방명록을 등록하지 않습니다.");
      return;
    }
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const entry = await createGuestbookEntry(slug, {
        name: String(form.get("name") ?? ""),
        message: String(form.get("message") ?? ""),
        password: String(form.get("password") ?? ""),
      });
      setGuestbook((entries) => [entry, ...entries]);
      setDialog("guestbook");
      setNotice("축하 글을 남겼습니다.");
      formElement.reset();
    } catch {
      setNotice("글을 남기지 못했습니다. 입력 내용을 확인해 주세요.");
    }
  };

  const handleGuestbookDelete = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPreview) {
      setNotice("초안 미리보기에서는 방명록을 삭제하지 않습니다.");
      return;
    }
    if (!guestbookDeleteTarget) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await deleteGuestbookEntry(
        slug,
        guestbookDeleteTarget.id,
        String(form.get("password") ?? ""),
      );
      setGuestbook((entries) => entries.filter((entry) => entry.id !== guestbookDeleteTarget.id));
      setGuestbookDeleteTarget(null);
      setDialog("guestbook");
      setNotice("방명록 글을 삭제했습니다.");
      formElement.reset();
    } catch {
      setNotice("삭제 비밀번호가 일치하지 않습니다.");
    }
  };

  const handleGuestUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPreview) {
      setNotice("초안 미리보기에서는 사진을 업로드하지 않습니다.");
      return;
    }
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await uploadGuestPhoto(slug, form);
      setDialog(null);
      setNotice("사진을 올렸습니다. 확인 후 신랑·신부에게 전달됩니다.");
      formElement.reset();
    } catch {
      setNotice("사진을 올리지 못했습니다. 파일 형식과 크기를 확인해 주세요.");
    }
  };

  return (
    <div
      className={`page-shell ${resolvedDesign.themeId === "sicilian-noir" || resolvedDesign.themeId === "photo-editorial" ? "page-shell--catalog" : ""}`}
      data-channel-talk={channelTalkEnabled ? "enabled" : "disabled"}
      style={style}
      {...invitationThemeAttributes(resolvedDesign.themeId)}
    >
      <main className="invitation">
        {enabledSections.has("hero") ? (
          resolvedDesign.themeId === "sicilian-noir" ? (
            <SicilianCatalogHero content={content} heroDate={heroDate} preview={isPreview} />
          ) : resolvedDesign.themeId === "photo-editorial" ? (
            <PhotoEditorialHero content={content} heroDate={heroDate} preview={isPreview} />
          ) : (
            <section className="hero" id={sectionAnchorId("hero")} data-reveal>
              {content.hero.eyebrow ? <p className="hero__eyebrow">{content.hero.eyebrow}</p> : null}
              <h1 className="hero__mark">{content.hero.title}</h1>
              <div className="hero__date-stack">
                <p>{heroDate.weekday}</p>
                <p>{heroDate.month} <strong>{heroDate.day}<sup>{heroDate.ordinal}</sup></strong></p>
                <time dateTime={content.event.startsAt}>{heroDate.time}</time>
              </div>
              <span className="hero__divider" aria-hidden="true" />
              <div className="hero__names">
                {content.hero.nameOrder.map((partnerKey) => (
                  <span key={partnerKey}>{partnersByKey[partnerKey].name}</span>
                ))}
              </div>
              <p className="hero__venue">{content.event.venueName} {content.event.hall}</p>
              {content.hero.subtitle ? <p className="hero__subtitle">{content.hero.subtitle}</p> : null}
              <span className="hero__line" aria-hidden="true" />
            </section>
          )
        ) : null}

        {enabledSections.has("invitation") ? (
          <section className="section invitation-section" id={sectionAnchorId("invitation")} data-reveal>
            <SectionHeading eyebrow="INVITATION" title={content.greeting.title} />
            <p className="multiline">{content.greeting.body}</p>
            <Media media={content.greeting.image} className="greeting-photo" preview={isPreview} revealDirection="from-left" />
            <FamilyRelationshipLine content={content} />
            <button className="contact-button" type="button" onClick={() => setDialog("contact")}>
              <PhoneIcon />
              연락하기
            </button>
          </section>
        ) : null}

        {enabledSections.has("profile") ? (
          <section className="section profile-section" id={sectionAnchorId("profile")} data-reveal>
            <SectionHeading eyebrow={content.profiles.eyebrow} title={content.profiles.title} />
            <div className="profile-grid">
              {content.profiles.items.map((profile, index) => {
                const partner = partnersByKey[profile.side];
                return (
                  <article className="profile-card" key={profile.id}>
                    <Media
                      media={profile.image}
                      className="profile-card__image"
                      preview={isPreview}
                      revealDirection={index === 0 ? "from-left" : "from-right"}
                    />
                    <div className="profile-card__body">
                      <p className="profile-card__name"><span>{partner.label}</span><strong>{partner.name}</strong></p>
                      {profile.birthDate ? <p>{profile.birthDate}</p> : null}
                      {profile.location ? <p>{profile.location}</p> : null}
                      {profile.tags ? <p>{profile.tags}</p> : null}
                      {profile.message ? <p className="profile-card__message">{profile.message}</p> : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        {enabledSections.has("interview") ? (
          <section className="section section--surface" id={sectionAnchorId("interview")} data-reveal>
            <SectionHeading
              eyebrow={content.sectionCopy.interview.eyebrow}
              title={content.sectionCopy.interview.title}
              description={content.sectionCopy.interview.description}
            />
            <div className="interview-grid">
              {content.interview.slice(0, 2).map((entry, index) => (
                <article className="interview-card" key={entry.id}>
                  <Media media={entry.image} className="portrait-placeholder" preview={isPreview} revealDirection={index % 2 === 0 ? "from-right" : "from-left"} />
                  <h3>{entry.question}</h3>
                  <p>{entry.answer}</p>
                </article>
              ))}
            </div>
            <button className="text-button" type="button" onClick={() => setDialog("interview")}>
              인터뷰 전체 보기 <span aria-hidden="true">→</span>
            </button>
          </section>
        ) : null}

        {enabledSections.has("calendar") ? (
          <section className="section" id={sectionAnchorId("calendar")} data-reveal>
            <SectionHeading
              eyebrow={content.sectionCopy.calendar.eyebrow}
              title={content.sectionCopy.calendar.title || `${eventDate.getFullYear()}. ${String(eventDate.getMonth() + 1).padStart(2, "0")}. ${String(eventDate.getDate()).padStart(2, "0")}`}
              description={content.sectionCopy.calendar.description || formatEventDate(content.event.startsAt)}
            />
            <Calendar startsAt={content.event.startsAt} />
            <div className="countdown" aria-label="예식까지 남은 시간">
              {Object.entries(countdown).map(([label, value]) => (
                <div key={label}>
                  <strong>{String(value).padStart(2, "0")}</strong>
                  <span>{label.toUpperCase()}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {enabledSections.has("timeline") ? (
          <section className="section section--timeline" id={sectionAnchorId("timeline")} data-reveal>
            <SectionHeading
              eyebrow={content.sectionCopy.timeline.eyebrow}
              title={content.sectionCopy.timeline.title}
              description={content.sectionCopy.timeline.description}
            />
            <div className="timeline-card">
              <Media media={timeline.image} className="timeline-card__image" preview={isPreview} revealDirection="from-right" />
              <p className="timeline-card__date">{timeline.date}</p>
              <h3>{timeline.title}</h3>
              <p>{timeline.body}</p>
            </div>
            <div className="carousel-controls">
              <button
                className="icon-button"
                type="button"
                aria-label="이전 이야기"
                onClick={() => setTimelineIndex((timelineIndex - 1 + content.timeline.length) % content.timeline.length)}
              >
                ←
              </button>
              <span>{timelineIndex + 1} / {content.timeline.length}</span>
              <button
                className="icon-button"
                type="button"
                aria-label="다음 이야기"
                onClick={() => setTimelineIndex((timelineIndex + 1) % content.timeline.length)}
              >
                →
              </button>
            </div>
          </section>
        ) : null}

        {enabledSections.has("rsvp") && content.rsvp.enabled ? (
          <section className="section cta-section" id={sectionAnchorId("rsvp")} data-reveal>
            <SectionHeading
              eyebrow="R.S.V.P."
              title={content.rsvp.title}
              description={content.rsvp.description}
            />
            <button className="primary-button" type="button" onClick={() => setDialog("rsvp")}>
              참석 의사 전달하기
            </button>
          </section>
        ) : null}

        {enabledSections.has("location") ? (
          <section className="section location-section" id={sectionAnchorId("location")} data-reveal>
            <SectionHeading
              eyebrow={content.sectionCopy.location.eyebrow}
              title={content.sectionCopy.location.title}
              description={content.sectionCopy.location.description}
            />
            <div className="venue">
              <h3>{content.event.venueName} {content.event.hall}</h3>
              <p>{content.event.address}</p>
              <a href={`tel:${content.event.telephone}`}>{content.event.telephone}</a>
            </div>
            <VenueMap event={content.event} kakaoJavaScriptKey={content.sharing.kakaoJavaScriptKey} />
            {content.event.sketchMap.assetId ? (
              <button
                className="map-sketch-button"
                type="button"
                onClick={() => setDialog("sketch-map")}
              >
                약도 이미지 보기
              </button>
            ) : null}
            <div className="navigation-block">
              <h3>내비게이션</h3>
              <p>원하시는 앱을 선택하시면 길안내가 시작됩니다.</p>
              <div className="navigation-links">
                {mapNavigationLinks(content.event).map((link) => <a href={link.href} key={link.label} rel="noreferrer" target="_blank"><NavigationServiceIcon provider={link.provider} /><span>{link.label}</span></a>)}
              </div>
            </div>
            <div className="transport-list">
              {content.event.transport.map((item) => (
                <article key={item.title}>
                  <h3>{item.title}</h3>
                  <p className="multiline">{item.body}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {enabledSections.has("gallery") ? (
          <section className="section gallery-section" id={sectionAnchorId("gallery")} data-reveal>
            <SectionHeading
              eyebrow={content.sectionCopy.gallery.eyebrow}
              title={content.sectionCopy.gallery.title}
              description={content.sectionCopy.gallery.description}
            />
            {content.gallery.layout === "carousel" || content.gallery.layout === "both" ? (
              <div className="gallery-carousel" aria-label="웨딩 사진을 좌우로 밀어 볼 수 있습니다.">
                {content.gallery.items.map((item) => <Media media={item} key={item.id} preview={isPreview} />)}
              </div>
            ) : null}
            {content.gallery.layout === "grid" || content.gallery.layout === "both" ? (
              <div className="gallery-grid">
                {visibleGallery.map((item) => <Media media={item} key={item.id} preview={isPreview} />)}
              </div>
            ) : null}
            {(content.gallery.layout === "grid" || content.gallery.layout === "both") && content.gallery.items.length > content.gallery.initialCount ? (
              <button className="text-button" type="button" onClick={() => setGalleryExpanded((value) => !value)}>
                {galleryExpanded ? "접기" : "더보기"} <span aria-hidden="true">{galleryExpanded ? "↑" : "↓"}</span>
              </button>
            ) : null}
          </section>
        ) : null}

        {enabledSections.has("guestbook") && content.guestbook.enabled ? (
          <section className="section section--surface guestbook-section" id={sectionAnchorId("guestbook")} data-reveal>
            <SectionHeading
              eyebrow="GUESTBOOK"
              title={content.guestbook.title}
              description={content.guestbook.description}
            />
            <div className="button-row">
              <button className="primary-button" type="button" onClick={() => setDialog("guestbook-write")}>
                {content.guestbook.actions.writeLabel}
              </button>
              <button className="secondary-button" type="button" onClick={() => setDialog("guestbook")}>
                {content.guestbook.actions.viewLabel}
              </button>
            </div>
          </section>
        ) : null}

        {enabledSections.has("middleImage") ? (
          <section className="middle-image" id={sectionAnchorId("middleImage")} data-reveal>
            <PlaceholderBand label="WEDDING CEREMONY" media={content.middleImage} preview={isPreview} revealDirection="from-left" />
            <div>
              <p>WEDDING CEREMONY</p>
              <strong>D − {countdown.days}</strong>
            </div>
          </section>
        ) : null}

        {enabledSections.has("accounts") && accountGroup ? (
          <section className="section account-section" id={sectionAnchorId("accounts")} data-reveal>
            <SectionHeading
              eyebrow={content.sectionCopy.accounts.eyebrow}
              title={content.sectionCopy.accounts.title}
              description={content.sectionCopy.accounts.description}
            />
            <div className="tabs" role="tablist" aria-label="계좌 그룹">
              {content.accounts.map((group, index) => (
                <button
                  className={index === accountIndex ? "is-active" : ""}
                  type="button"
                  role="tab"
                  aria-selected={index === accountIndex}
                  key={group.id}
                  onClick={() => {
                    setAccountIndex(index);
                    setAccountItemIndex(0);
                  }}
                >
                  {group.label}
                </button>
              ))}
            </div>
            <AccountCardCarousel
              accounts={accountGroup.items}
              activeIndex={Math.min(accountItemIndex, Math.max(accountGroup.items.length - 1, 0))}
              onActiveIndexChange={setAccountItemIndex}
              onCopy={async (accountNumber) => {
                try {
                  await navigator.clipboard.writeText(accountNumber);
                  setNotice("계좌번호를 복사했습니다.");
                } catch {
                  setNotice("계좌번호를 복사하지 못했습니다.");
                }
              }}
            />
          </section>
        ) : null}

        {enabledSections.has("guestUploads") && content.guestUploads.enabled ? (
          <section className="section upload-section" id={sectionAnchorId("guestUploads")} data-reveal>
            <SectionHeading
              eyebrow="CAPTURE OUR MOMENTS"
              title={content.guestUploads.title}
              description={content.guestUploads.description}
            />
            <GuestUploadPolaroid gallery={guestUploadGallery} preview={isPreview} />
            <p className="upload-date">
              업로드 시작 · {formatEventDate(content.guestUploads.opensAt)}
            </p>
            <button
              className="primary-button"
              type="button"
              disabled={Date.now() < Date.parse(content.guestUploads.opensAt)}
              onClick={() => setDialog("upload")}
            >
              사진 올리기
            </button>
          </section>
        ) : null}

        {enabledSections.has("closing") ? (
          <section className="closing" id={sectionAnchorId("closing")} data-reveal>
            <Media media={content.closing.image} className="closing__image" preview={isPreview} revealDirection="from-right" />
            <div className="closing__copy">
              <p className="eyebrow">{content.closing.title}</p>
              <p className="multiline">{content.closing.body}</p>
            </div>
            <div className="share-actions">
              {closingSharePresentations.map((presentation) => (
                <button
                  className={[
                    "share-button",
                    presentation.provider === "kakao" ? "share-button--kakao" : "",
                    presentation.provider === "generic" && closingSharePresentations.length > 1
                      ? "share-button--secondary"
                      : "",
                  ].filter(Boolean).join(" ")}
                  type="button"
                  key={presentation.provider}
                  onClick={() => void (
                    presentation.provider === "kakao"
                      ? shareWithKakao()
                      : share()
                  )}
                >
                  {presentation.provider === "kakao" ? (
                    <svg
                      className="share-button__kakao-icon"
                      viewBox="0 0 28 28"
                      aria-hidden="true"
                    >
                      <path d="M14 3.5c-6.1 0-11 3.9-11 8.75 0 3.1 2 5.82 5.04 7.38l-1.1 4.02c-.1.38.31.67.63.45l4.73-3.12c.55.06 1.12.1 1.7.1 6.1 0 11-3.92 11-8.83C25 7.4 20.1 3.5 14 3.5Z" />
                      <text
                        className="share-button__kakao-word"
                        x="14"
                        y="14.3"
                        textAnchor="middle"
                      >
                        TALK
                      </text>
                    </svg>
                  ) : null}
                  <span>{presentation.label}</span>
                  {presentation.provider === "generic" ? (
                    <span aria-hidden="true">↗</span>
                  ) : null}
                </button>
              ))}
            </div>
          </section>
        ) : null}
      </main>

      {!isPreview && content.guestbook.enabled && dialog === null && !rsvpWelcomeOpen ? (
        <AmbientGuestbook
          entry={ambientGuestbookEntry}
          count={guestbook.length}
          docked={ambientGuestbookDocked}
          onLetterClick={openAmbientGuestbook}
          onDockClick={openAmbientGuestbookDock}
        />
      ) : null}

      {content.music.enabled && content.music.assetId ? (
        <>
          <audio
            ref={audioRef}
            src={isPreview
              ? `/api/admin/media/${content.music.assetId}/content`
              : `/api/media/${content.music.assetId}/content`}
            onEnded={() => setMusicPlaying(false)}
          />
          <button
            className={`music-button ${musicPlaying ? "is-playing" : ""}`}
            type="button"
            aria-label={musicPlaying ? "음악 끄기" : "음악 재생"}
            onClick={() => void toggleMusic()}
          >
            <span /><span /><span />
          </button>
        </>
      ) : null}

      {content.celebration.enabled ? (
        <button
          className="celebration-button"
          type="button"
          aria-label={content.celebration.triggerLabel}
          onClick={() => setDialog("celebration")}
        >
          <CelebrationIcon />
        </button>
      ) : null}

      <QuickMenu
        open={dialog === "quick-menu"}
        sections={quickMenuSections}
        rsvpEnabled={enabledSections.has("rsvp") && content.rsvp.enabled}
        guestUploadsEnabled={enabledSections.has("guestUploads") && content.guestUploads.enabled}
        guestUploadsAvailable={guestUploadsAvailable}
        onOpen={() => setDialog("quick-menu")}
        onClose={() => setDialog(null)}
        onRsvp={() => openQuickAction("rsvp")}
        onGuestUpload={() => openQuickAction("upload")}
        onCalendar={saveEventToCalendar}
        onCopyLink={() => void copyInvitationLink()}
        kakaoShareEnabled={kakaoShareEnabled}
        onKakaoShare={() => void shareWithKakao()}
        onShare={() => void share()}
      />

      <Dialog
        className="dialog--rsvp-welcome"
        open={rsvpWelcomeOpen && content.rsvp.enabled}
        title={content.rsvp.title}
        onClose={() => setRsvpWelcomeOpen(false)}
      >
        <div className="rsvp-welcome">
          <span className="rsvp-welcome__icon" aria-hidden="true">♧</span>
          <p className="rsvp-welcome__lead">{content.rsvp.description}</p>
          <dl className="rsvp-welcome__details">
            <div><dt>예식 일시</dt><dd>{formatEventDate(content.event.startsAt)}</dd></div>
            <div><dt>예식 장소</dt><dd>{[content.event.venueName, content.event.hall].filter(Boolean).join(" · ")}</dd></div>
            <div><dt>주소</dt><dd>{content.event.address}</dd></div>
          </dl>
          <div className="rsvp-welcome__actions">
            <button className="text-button" type="button" onClick={dismissRsvpWelcomeForToday}>오늘 하루 보지 않기</button>
            <button className="primary-button" type="button" onClick={openRsvpFromWelcome}>참석 의사 전달하기</button>
          </div>
        </div>
      </Dialog>

      <Dialog
        className="dialog--celebration"
        open={dialog === "celebration"}
        title={content.celebration.triggerLabel}
        onClose={() => setDialog(null)}
      >
        <div className="celebration-sheet">
          <p className="celebration-sheet__names">
            <span>{content.couple.partnerOne.label} <strong>{content.couple.partnerOne.name}</strong></span>
            <i aria-hidden="true">♡</i>
            <span>{content.couple.partnerTwo.label} <strong>{content.couple.partnerTwo.name}</strong></span>
          </p>
          <p className="celebration-sheet__message multiline">{content.celebration.message}</p>
          <dl className="celebration-sheet__details">
            <div><dt>예식 일시</dt><dd>{formatEventDate(content.event.startsAt)}</dd></div>
            <div><dt>예식 장소</dt><dd>{[content.event.venueName, content.event.hall].filter(Boolean).join(" · ")}</dd></div>
            <div><dt>주소</dt><dd>{content.event.address}</dd></div>
          </dl>
          {content.celebration.linkUrl ? (
            <a className="celebration-sheet__link" href={content.celebration.linkUrl} rel="noreferrer" target="_blank">
              {content.celebration.linkLabel}
            </a>
          ) : null}
        </div>
      </Dialog>

      <Dialog open={dialog === "sketch-map"} title="예식장 약도" onClose={() => setDialog(null)}>
        <Media
          media={content.event.sketchMap}
          className="sketch-map-image"
          preview={isPreview}
        />
      </Dialog>

      <Dialog open={dialog === "contact"} title="연락하기" onClose={() => setDialog(null)}>
        <div className="contact-groups">
          {contactGroups.map((group) => (
            <section aria-labelledby={`contact-group-${group.side}`} key={group.side}>
              <h3 id={`contact-group-${group.side}`}>{group.label}</h3>
              <div className="contact-list">
                {group.contacts.map((contact) => (
                  <article key={contact.id}>
                    <div><span>{contact.role}</span><strong>{contact.name}</strong></div>
                    <div>
                      <a className="icon-button" href={`tel:${contact.phone}`} aria-label={`${contact.name}에게 전화`}>
                        <PhoneIcon />
                      </a>
                      <a className="icon-button" href={`sms:${contact.phone}`} aria-label={`${contact.name}에게 문자`}>
                        <MessageIcon />
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Dialog>

      <Dialog open={dialog === "interview"} title="우리 두 사람의 이야기" onClose={() => setDialog(null)}>
        <div className="qa-list">
          {content.interview.map((entry, index) => (
            <article key={entry.id}>
              <span>Q{String(index + 1).padStart(2, "0")}</span>
              <h3>{entry.question}</h3>
              <p>{entry.answer}</p>
            </article>
          ))}
        </div>
      </Dialog>

      <Dialog open={dialog === "rsvp"} title={content.rsvp.title} onClose={() => setDialog(null)}>
        <form className="form-stack" onSubmit={(event) => void handleRsvp(event)}>
          <fieldset className="choice-grid">
            <legend>참석 여부</legend>
            <label><input type="radio" name="attending" value="true" required /> 참석합니다</label>
            <label><input type="radio" name="attending" value="false" required /> 참석이 어렵습니다</label>
          </fieldset>
          <label>이름<input name="name" required maxLength={80} /></label>
          <label>구분<select name="party" required><option value="partnerOne">신랑 측</option><option value="partnerTwo">신부 측</option></select></label>
          <label>연락처<input name="phone" type="tel" required maxLength={30} /></label>
          <label>추가 인원<input name="additionalGuests" type="number" min="0" max="20" defaultValue="0" /></label>
          {content.rsvp.collectMeal ? (
            <label>식사 여부<select name="meal"><option value="undecided">미정</option><option value="yes">식사함</option><option value="no">식사 안 함</option></select></label>
          ) : null}
          {content.rsvp.collectShuttle ? (
            <label>셔틀버스<select name="shuttle"><option value="undecided">미정</option><option value="yes">이용함</option><option value="no">이용 안 함</option></select></label>
          ) : null}
          <label>전할 말<textarea name="note" maxLength={300} rows={3} /></label>
          <label className="check-line"><input name="privacyConsent" type="checkbox" required /> 참석 확인을 위한 개인정보 수집에 동의합니다.</label>
          <button className="primary-button" type="submit">전달하기</button>
        </form>
      </Dialog>

      <Dialog open={dialog === "guestbook"} title="방명록" onClose={() => setDialog(null)}>
        <div className="guestbook-list">
          {guestbook.length ? guestbook.map((entry) => (
            <article key={entry.id}>
              <div>
                <strong>{entry.name}</strong>
                <span className="guestbook-list__meta">
                  <time>{new Date(entry.createdAt).toLocaleDateString("ko-KR")}</time>
                  <button
                    type="button"
                    onClick={() => {
                      setGuestbookDeleteTarget(entry);
                      setDialog("guestbook-delete");
                    }}
                  >
                    삭제
                  </button>
                </span>
              </div>
              <p>{entry.message}</p>
            </article>
          )) : <p className="empty-state">아직 작성된 방명록이 없습니다.</p>}
          <button className="primary-button" type="button" onClick={() => setDialog("guestbook-write")}>
            {content.guestbook.actions.writeLabel}
          </button>
        </div>
      </Dialog>

      <Dialog open={dialog === "guestbook-write"} title={content.guestbook.actions.writeLabel} onClose={() => setDialog(null)}>
        <form className="form-stack" onSubmit={(event) => void handleGuestbook(event)}>
          <label>이름<input name="name" required maxLength={40} /></label>
          <label>내용<textarea name="message" required maxLength={500} rows={6} /></label>
          <label>삭제 비밀번호<input name="password" type="password" required minLength={4} maxLength={100} /></label>
          <p className="form-help">작성한 글을 직접 삭제할 때 사용합니다.</p>
          <button className="primary-button" type="submit">등록하기</button>
        </form>
      </Dialog>

      <Dialog
        open={dialog === "guestbook-delete"}
        title="축하 글 삭제"
        onClose={() => {
          setGuestbookDeleteTarget(null);
          setDialog("guestbook");
        }}
      >
        <form className="form-stack" onSubmit={(event) => void handleGuestbookDelete(event)}>
          <p className="form-help">
            {guestbookDeleteTarget?.name}님이 작성할 때 입력한 삭제 비밀번호를 확인합니다.
          </p>
          <label>삭제 비밀번호<input name="password" type="password" required minLength={4} maxLength={100} /></label>
          <button className="primary-button" type="submit">삭제하기</button>
        </form>
      </Dialog>

      <Dialog open={dialog === "upload"} title="사진 올리기" onClose={() => setDialog(null)}>
        <GuestUploadShowcase gallery={guestUploadGallery} preview={isPreview} />
        <form className="form-stack" onSubmit={(event) => void handleGuestUpload(event)}>
          <label>사진<input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/heic" required /></label>
          <label>이름<input name="uploaderName" maxLength={80} /></label>
          <label>메모<textarea name="note" maxLength={300} rows={3} /></label>
          <p className="form-help">JPG, PNG, WebP, HEIC · 최대 15MB</p>
          <button className="primary-button" type="submit">업로드</button>
        </form>
      </Dialog>

      <div className={`toast ${notice ? "is-visible" : ""}`} role="status" aria-live="polite">
        {notice}
        {notice ? <button type="button" onClick={() => setNotice("")} aria-label="알림 닫기">×</button> : null}
      </div>
    </div>
  );
}
