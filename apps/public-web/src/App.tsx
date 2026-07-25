import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";

import {
  createGuestbookEntry,
  deleteGuestbookEntry,
  loadGuestbook,
  loadInvitation,
  submitRsvp,
  uploadGuestPhoto,
} from "./api";
import { Dialog } from "./components/Dialog";
import { Media } from "./components/Media";
import type {
  GuestbookEntry,
  InvitationContent,
  InvitationDesign,
  MediaReference,
} from "./types";

type DialogName = "contact" | "interview" | "rsvp" | "guestbook" | "guestbook-write" | "guestbook-delete" | "upload" | null;

const defaultSlug = import.meta.env.VITE_INVITATION_SLUG ?? "our-wedding";

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

function openStreetMapEmbedUrl(latitude: number, longitude: number) {
  const delta = 0.006;
  const bbox = [
    longitude - delta,
    latitude - delta,
    longitude + delta,
    latitude + delta,
  ].join(",");
  const params = new URLSearchParams({
    bbox,
    layer: "mapnik",
    marker: `${latitude},${longitude}`,
  });
  return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
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
}: {
  label: string;
  media?: MediaReference;
}) {
  return media ? <Media media={media} className="placeholder-band" /> : (
    <div className="placeholder-band media--placeholder" role="img" aria-label={label}>
      <span>{label}</span>
    </div>
  );
}

export function App() {
  const [content, setContent] = useState<InvitationContent | null>(null);
  const [design, setDesign] = useState<InvitationDesign | null>(null);
  const [slug, setSlug] = useState(defaultSlug);
  const [dialog, setDialog] = useState<DialogName>(null);
  const [guestbook, setGuestbook] = useState<GuestbookEntry[]>([]);
  const [guestbookDeleteTarget, setGuestbookDeleteTarget] = useState<GuestbookEntry | null>(null);
  const [timelineIndex, setTimelineIndex] = useState(0);
  const [accountIndex, setAccountIndex] = useState(0);
  const [galleryExpanded, setGalleryExpanded] = useState(false);
  const [notice, setNotice] = useState("");
  const [loadingError, setLoadingError] = useState("");
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const pathSlug = window.location.pathname.split("/").filter(Boolean)[0];
    if (pathSlug && pathSlug !== "index.html") {
      setSlug(pathSlug);
    }
  }, []);

  useEffect(() => {
    void loadInvitation(slug)
      .then((result) => {
        setContent(result.content);
        setDesign(result.design);
        document.title = `${result.content.couple.partnerOne.name} · ${result.content.couple.partnerTwo.name} 결혼합니다`;
      })
      .catch(() => setLoadingError("초대장을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."));
  }, [slug]);

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
    if (dialog === "guestbook") {
      void loadGuestbook(slug).then(setGuestbook).catch(() => setNotice("방명록을 불러오지 못했습니다."));
    }
  }, [dialog, slug]);

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

  const style = {
    "--paper": design.colors.paper,
    "--ink": design.colors.ink,
    "--muted": design.colors.muted,
    "--line": design.colors.line,
    "--accent": design.colors.accent,
    "--surface": design.colors.surface,
    "--radius": `${design.radius}px`,
    "--section-space": `${design.spacing.section}px`,
    "--content-space": `${design.spacing.content}px`,
    "--display-font": design.typography.display,
    "--body-font": design.typography.body,
    "--motion-duration": `${design.motion.durationMs}ms`,
  } as CSSProperties;

  const eventDate = new Date(content.event.startsAt);
  const timeline = content.timeline[timelineIndex] ?? content.timeline[0]!;
  const accountGroup = content.accounts[accountIndex] ?? content.accounts[0];
  const visibleGallery = galleryExpanded
    ? content.gallery.items
    : content.gallery.items.slice(0, content.gallery.initialCount);

  const share = async () => {
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
    <div className="page-shell" style={style}>
      <main className="invitation">
        {enabledSections.has("hero") ? (
          <section className="hero" data-reveal>
            <p className="hero__eyebrow">{content.hero.eyebrow}</p>
            <h1>{content.hero.title}</h1>
            <p className="hero__subtitle">{content.hero.subtitle}</p>
            <div className="hero__names">
              <span>{content.couple.partnerOne.name}</span>
              <span aria-hidden="true">·</span>
              <span>{content.couple.partnerTwo.name}</span>
            </div>
            <div className="hero__date">
              <time dateTime={content.event.startsAt}>
                {formatEventDate(content.event.startsAt)}
              </time>
              <span>{content.event.venueName} {content.event.hall}</span>
            </div>
            <span className="hero__line" aria-hidden="true" />
            <span className="scroll-label">SCROLL</span>
          </section>
        ) : null}

        {enabledSections.has("invitation") ? (
          <section className="section invitation-section" data-reveal>
            <SectionHeading eyebrow="INVITATION" title={content.greeting.title} />
            <p className="multiline">{content.greeting.body}</p>
            <Media media={content.greeting.image} className="greeting-photo" />
            <div className="couple-line">
              <span>{content.couple.partnerOne.label}</span>
              <strong>{content.couple.partnerOne.name}</strong>
              <i aria-hidden="true" />
              <span>{content.couple.partnerTwo.label}</span>
              <strong>{content.couple.partnerTwo.name}</strong>
            </div>
            <button className="text-button" type="button" onClick={() => setDialog("contact")}>
              연락하기 <span aria-hidden="true">↗</span>
            </button>
          </section>
        ) : null}

        {enabledSections.has("interview") ? (
          <section className="section section--surface" data-reveal>
            <SectionHeading
              eyebrow="INTERVIEW"
              title="우리 두 사람의 이야기"
              description="결혼을 앞둔 두 사람의 작은 이야기를 담았습니다."
            />
            <div className="interview-grid">
              {content.interview.slice(0, 2).map((entry) => (
                <article className="interview-card" key={entry.id}>
                  <Media media={entry.image} className="portrait-placeholder" />
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
          <section className="section" data-reveal>
            <SectionHeading
              eyebrow="THE WEDDING DAY"
              title={`${eventDate.getFullYear()}. ${String(eventDate.getMonth() + 1).padStart(2, "0")}. ${String(eventDate.getDate()).padStart(2, "0")}`}
              description={formatEventDate(content.event.startsAt)}
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
          <section className="section section--timeline" data-reveal>
            <SectionHeading eyebrow="SINCE THE FIRST DAY" title="Our story" />
            <div className="timeline-card">
              <Media media={timeline.image} className="timeline-card__image" />
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
          <section className="section cta-section" data-reveal>
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
          <section className="section location-section" data-reveal>
            <SectionHeading eyebrow="LOCATION" title="오시는 길" />
            <div className="venue">
              <h3>{content.event.venueName} {content.event.hall}</h3>
              <p>{content.event.address}</p>
              <a href={`tel:${content.event.telephone}`}>{content.event.telephone}</a>
            </div>
            {content.event.latitude !== null && content.event.longitude !== null ? (
              <iframe
                className="map-embed"
                title={`${content.event.venueName} 지도`}
                src={openStreetMapEmbedUrl(content.event.latitude, content.event.longitude)}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="map-placeholder">
                <span className="map-placeholder__pin" aria-hidden="true">●</span>
                <strong>{content.event.venueName}</strong>
                <span>{content.event.address}</span>
              </div>
            )}
            <div className="navigation-links">
              <a
                href={`https://map.naver.com/p/search/${encodeURIComponent(content.event.address)}`}
                target="_blank"
                rel="noreferrer"
              >
                네이버 지도
              </a>
              <a
                href={`https://map.kakao.com/link/search/${encodeURIComponent(content.event.address)}`}
                target="_blank"
                rel="noreferrer"
              >
                카카오맵
              </a>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(content.event.address)}`}
                target="_blank"
                rel="noreferrer"
              >
                길찾기
              </a>
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
          <section className="section gallery-section" data-reveal>
            <SectionHeading eyebrow="GALLERY" title="웨딩 갤러리" />
            <div className="gallery-grid">
              {visibleGallery.map((item) => <Media media={item} key={item.id} />)}
            </div>
            {content.gallery.items.length > content.gallery.initialCount ? (
              <button className="text-button" type="button" onClick={() => setGalleryExpanded((value) => !value)}>
                {galleryExpanded ? "접기" : "더보기"} <span aria-hidden="true">{galleryExpanded ? "↑" : "↓"}</span>
              </button>
            ) : null}
          </section>
        ) : null}

        {enabledSections.has("guestbook") && content.guestbook.enabled ? (
          <section className="section section--surface guestbook-section" data-reveal>
            <SectionHeading
              eyebrow="GUESTBOOK"
              title={content.guestbook.title}
              description={content.guestbook.description}
            />
            <div className="button-row">
              <button className="secondary-button" type="button" onClick={() => setDialog("guestbook")}>
                축하 글 보기
              </button>
              <button className="primary-button" type="button" onClick={() => setDialog("guestbook-write")}>
                축하 글 남기기
              </button>
            </div>
          </section>
        ) : null}

        {enabledSections.has("middleImage") ? (
          <section className="middle-image" data-reveal>
            <PlaceholderBand label="WEDDING CEREMONY" media={content.middleImage} />
            <div>
              <p>WEDDING CEREMONY</p>
              <strong>D − {countdown.days}</strong>
            </div>
          </section>
        ) : null}

        {enabledSections.has("accounts") && accountGroup ? (
          <section className="section account-section" data-reveal>
            <SectionHeading eyebrow="ACCOUNT" title="마음 전하실 곳" />
            <div className="tabs" role="tablist" aria-label="계좌 그룹">
              {content.accounts.map((group, index) => (
                <button
                  className={index === accountIndex ? "is-active" : ""}
                  type="button"
                  role="tab"
                  aria-selected={index === accountIndex}
                  key={group.id}
                  onClick={() => setAccountIndex(index)}
                >
                  {group.label}
                </button>
              ))}
            </div>
            <div className="account-list">
              {accountGroup.items.map((account) => (
                <article className="account-card" key={account.id}>
                  <div>
                    <span>{account.holder}</span>
                    <strong>{account.bank} {account.accountNumber}</strong>
                  </div>
                  <button
                    className="small-button"
                    type="button"
                    onClick={() => void navigator.clipboard.writeText(account.accountNumber).then(() => setNotice("계좌번호를 복사했습니다."))}
                  >
                    복사
                  </button>
                  {account.paymentUrl ? (
                    <a className="small-button" href={account.paymentUrl} target="_blank" rel="noreferrer">
                      송금
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {enabledSections.has("guestUploads") && content.guestUploads.enabled ? (
          <section className="section upload-section" data-reveal>
            <SectionHeading
              eyebrow="CAPTURE OUR MOMENTS"
              title={content.guestUploads.title}
              description={content.guestUploads.description}
            />
            <div className="polaroid-stack" aria-hidden="true">
              <span>01</span><span>02</span><span>03</span>
            </div>
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
          <section className="closing" data-reveal>
            <Media media={content.closing.image} className="closing__image" />
            <div className="closing__copy">
              <p className="eyebrow">{content.closing.title}</p>
              <p className="multiline">{content.closing.body}</p>
            </div>
            <button className="share-button" type="button" onClick={() => void share()}>
              초대장 공유하기 <span aria-hidden="true">↗</span>
            </button>
          </section>
        ) : null}
      </main>

      {content.music.enabled && content.music.assetId ? (
        <>
          <audio
            ref={audioRef}
            src={`/api/media/${content.music.assetId}/content`}
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

      <button className="floating-share" type="button" aria-label="초대장 공유" onClick={() => void share()}>
        ↗
      </button>

      <Dialog open={dialog === "contact"} title="연락하기" onClose={() => setDialog(null)}>
        <div className="contact-list">
          {content.contacts.map((contact) => (
            <article key={contact.id}>
              <div><span>{contact.role}</span><strong>{contact.name}</strong></div>
              <div>
                <a className="icon-button" href={`tel:${contact.phone}`} aria-label={`${contact.name}에게 전화`}>☎</a>
                <a className="icon-button" href={`sms:${contact.phone}`} aria-label={`${contact.name}에게 문자`}>✉</a>
              </div>
            </article>
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
            축하 글 남기기
          </button>
        </div>
      </Dialog>

      <Dialog open={dialog === "guestbook-write"} title="축하 글 남기기" onClose={() => setDialog(null)}>
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
