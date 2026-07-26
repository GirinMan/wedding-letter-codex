import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";

import { api } from "./api";
import type {
  AdminUser,
  GuestbookEntry,
  GuestUpload,
  InvitationContent,
  InvitationDetail,
  InvitationSummary,
  MediaAsset,
  MediaReference,
  Rsvp,
} from "./types";

type View = "overview" | "content" | "stories" | "settings" | "design" | "media" | "rsvps" | "guestbook" | "uploads" | "publish";

const navigation: Array<{ id: View; label: string; icon: string }> = [
  { id: "overview", label: "대시보드", icon: "⌂" },
  { id: "content", label: "콘텐츠 편집", icon: "▤" },
  { id: "stories", label: "인터뷰·연혁", icon: "✦" },
  { id: "settings", label: "기능·계좌", icon: "⚙" },
  { id: "design", label: "디자인 토큰", icon: "◐" },
  { id: "media", label: "갤러리·미디어", icon: "▧" },
  { id: "rsvps", label: "RSVP 관리", icon: "✓" },
  { id: "guestbook", label: "방명록 관리", icon: "◌" },
  { id: "uploads", label: "사진 업로드", icon: "⇧" },
  { id: "publish", label: "설정·발행", icon: "→" },
];

const previewBase = import.meta.env.VITE_PUBLIC_PREVIEW_URL ?? "http://localhost:5173";
const contactRelationshipLabels: Record<
  InvitationContent["contacts"][number]["relationship"],
  string
> = {
  partner: "본인",
  father: "아버지",
  mother: "어머니",
  other: "기타",
};
const mealLabels: Record<string, string> = {
  yes: "식사함",
  no: "식사 안 함",
  undecided: "미정",
};
const shuttleLabels: Record<string, string> = {
  yes: "이용함",
  no: "이용 안 함",
  undecided: "미정",
};

const sectionLabels: Record<InvitationContent["sections"][number]["id"], string> = {
  hero: "첫 화면",
  invitation: "초대 인사",
  interview: "인터뷰",
  calendar: "달력·카운트다운",
  timeline: "우리의 연혁",
  rsvp: "참석 의사",
  location: "오시는 길",
  gallery: "갤러리",
  guestbook: "방명록",
  middleImage: "중간 이미지",
  accounts: "마음 전하실 곳",
  guestUploads: "축하 사진 공유",
  closing: "마무리",
};

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function connectMedia(current: MediaReference, asset: MediaAsset | null): MediaReference {
  return {
    ...current,
    assetId: asset?.id ?? null,
    alt: asset?.altText || current.alt,
  };
}

function collectConnectedAssetIds(content: InvitationContent): Set<string> {
  const ids = new Set<string>();
  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!value || typeof value !== "object") return;
    Object.entries(value).forEach(([key, nested]) => {
      if (key === "assetId" && typeof nested === "string") ids.add(nested);
      else visit(nested);
    });
  };
  visit(content);
  return ids;
}

function Login({ onLogin }: { onLogin: (user: AdminUser) => void }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await api.login(String(form.get("email")), String(form.get("password")));
      onLogin(result.user);
    } catch {
      setError("이메일 또는 비밀번호를 확인해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="login-shell">
      <section className="login-card">
        <p className="brand-mark">W</p>
        <p className="overline">PRIVATE WORKSPACE</p>
        <h1>청첩장 관리자</h1>
        <p className="login-copy">콘텐츠와 디자인, 방문객의 응답을 한곳에서 관리합니다.</p>
        <form onSubmit={(event) => void submit(event)}>
          <label>이메일<input name="email" type="email" autoComplete="username" required /></label>
          <label>비밀번호<input name="password" type="password" autoComplete="current-password" required /></label>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="button button--primary" disabled={busy}>{busy ? "확인 중…" : "로그인"}</button>
        </form>
        <p className="security-note">이 화면은 프로덕션에서 Tailscale 네트워크 안에서만 접근할 수 있습니다.</p>
      </section>
    </main>
  );
}

function Panel({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="panel">
      <header className="panel__header">
        <div><h2>{title}</h2>{description ? <p>{description}</p> : null}</div>
        {actions}
      </header>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return <label className={wide ? "field field--wide" : "field"}><span>{label}</span>{children}</label>;
}

function MediaSlotField({
  label,
  value,
  assets,
  kind = "image",
  onChange,
}: {
  label: string;
  value: string | null;
  assets: MediaAsset[];
  kind?: "image" | "audio";
  onChange: (asset: MediaAsset | null) => void;
}) {
  const options = assets.filter((asset) => (
    kind === "audio"
      ? asset.contentType.startsWith("audio/")
      : asset.contentType.startsWith("image/")
  ));

  return (
    <label className="media-slot">
      <span>{label}</span>
      <select
        value={value ?? ""}
        onChange={(event) => {
          onChange(options.find((asset) => asset.id === event.target.value) ?? null);
        }}
      >
        <option value="">연결 안 함</option>
        {options.map((asset) => (
          <option key={asset.id} value={asset.id}>{asset.originalName}</option>
        ))}
      </select>
    </label>
  );
}

export function App() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [summaries, setSummaries] = useState<InvitationSummary[]>([]);
  const [invitation, setInvitation] = useState<InvitationDetail | null>(null);
  const [view, setView] = useState<View>("overview");
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [guestbook, setGuestbook] = useState<GuestbookEntry[]>([]);
  const [uploads, setUploads] = useState<GuestUpload[]>([]);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [previewSession] = useState(() => crypto.randomUUID());
  const previewFrameRef = useRef<HTMLIFrameElement>(null);

  const loadWorkspace = useCallback(async () => {
    const { invitations } = await api.invitations();
    setSummaries(invitations);
    if (invitations[0]) {
      setInvitation(await api.invitation(invitations[0].id));
    }
  }, []);

  useEffect(() => {
    void api.session()
      .then(async ({ user: sessionUser }) => {
        setUser(sessionUser);
        await loadWorkspace();
      })
      .catch(() => setUser(null))
      .finally(() => setCheckingSession(false));
  }, [loadWorkspace]);

  useEffect(() => {
    if (!invitation) return;
    if (view === "media") void api.media(invitation.id).then(({ assets }) => setMedia(assets));
    if (view === "rsvps" || view === "overview") void api.rsvps(invitation.id).then(({ rsvps }) => setRsvps(rsvps));
    if (view === "guestbook" || view === "overview") void api.guestbook(invitation.id).then(({ entries }) => setGuestbook(entries));
    if (view === "uploads" || view === "overview") void api.guestUploads(invitation.id).then(({ uploads }) => setUploads(uploads));
  }, [invitation?.id, view]);

  const syncDraftPreview = useCallback(() => {
    if (!invitation) return;
    previewFrameRef.current?.contentWindow?.postMessage({
      type: "wedding-draft-preview",
      invitationId: invitation.id,
      content: invitation.draftContent,
      design: invitation.draftDesign,
    }, window.location.origin);
  }, [invitation]);

  useEffect(() => {
    syncDraftPreview();
  }, [syncDraftPreview]);

  useEffect(() => {
    const receivePreviewReady = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const message = event.data as { type?: string; invitationId?: string };
      if (
        message.type === "wedding-draft-preview-ready"
        && message.invitationId === invitation?.id
      ) {
        syncDraftPreview();
      }
    };
    window.addEventListener("message", receivePreviewReady);
    return () => window.removeEventListener("message", receivePreviewReady);
  }, [invitation?.id, syncDraftPreview]);

  if (checkingSession) return <main className="loading">관리자 환경을 확인하고 있습니다…</main>;
  if (!user) return <Login onLogin={(loggedInUser) => { setUser(loggedInUser); void loadWorkspace(); }} />;

  const updateContent = (mutate: (draft: InvitationDetail["draftContent"]) => void) => {
    setInvitation((current) => {
      if (!current) return current;
      const draftContent = structuredClone(current.draftContent);
      mutate(draftContent);
      return { ...current, draftContent };
    });
  };

  const updateDesign = (mutate: (draft: InvitationDetail["draftDesign"]) => void) => {
    setInvitation((current) => {
      if (!current) return current;
      const draftDesign = structuredClone(current.draftDesign);
      mutate(draftDesign);
      return { ...current, draftDesign };
    });
  };

  const saveContent = async () => {
    if (!invitation) return;
    setSaving(true);
    try {
      await api.saveContent(invitation.id, invitation.draftContent);
      setNotice("콘텐츠를 저장했습니다.");
      setInvitation(await api.invitation(invitation.id));
    } catch {
      setNotice("저장하지 못했습니다. 필수 항목과 형식을 확인해 주세요.");
    } finally {
      setSaving(false);
    }
  };

  const saveDesign = async () => {
    if (!invitation) return;
    setSaving(true);
    try {
      await api.saveDesign(invitation.id, invitation.draftDesign);
      setNotice("디자인 토큰을 저장했습니다.");
      setInvitation(await api.invitation(invitation.id));
    } catch {
      setNotice("디자인 토큰을 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (!invitation) {
    return <main className="loading">관리할 초대장이 없습니다. 먼저 seed를 실행해 주세요.</main>;
  }

  const publicPreviewUrl = `${previewBase.replace(/\/$/, "")}/${invitation.slug}`;
  const draftPreviewUrl = `/preview/?invitationId=${encodeURIComponent(invitation.id)}&session=${previewSession}`;
  const pendingUploads = uploads.filter((upload) => upload.state === "pending").length;
  const attending = rsvps.filter((rsvp) => rsvp.attending).length;
  const connectedAssetIds = collectConnectedAssetIds(invitation.draftContent);

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="sidebar__brand"><span>W</span><div><strong>Wedding</strong><small>Invitation admin</small></div></div>
        <nav aria-label="관리 메뉴">
          {navigation.map((item) => (
            <button
              className={view === item.id ? "is-active" : ""}
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
            >
              <span aria-hidden="true">{item.icon}</span>{item.label}
              {item.id === "uploads" && pendingUploads ? <i>{pendingUploads}</i> : null}
            </button>
          ))}
        </nav>
        <div className="sidebar__footer">
          <span className="status-dot" /> Tailscale private
          <strong>{user.displayName}</strong>
          <button type="button" onClick={() => void api.logout().then(() => setUser(null))}>로그아웃</button>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="overline">{invitation.status.toUpperCase()}</p>
            <h1>{navigation.find((item) => item.id === view)?.label}</h1>
          </div>
          <div className="topbar__actions">
            <a className="button button--ghost" href={publicPreviewUrl} target="_blank" rel="noreferrer">공개본 새 창 ↗</a>
            <button className="button button--primary" type="button" onClick={() => setView("publish")}>발행하기</button>
          </div>
        </header>

        <div className="workspace__body">
          <div className="editor-column">
            {view === "overview" ? (
              <>
                <div className="metric-grid">
                  <article><span>전체 RSVP</span><strong>{rsvps.length}</strong><small>참석 {attending}명</small></article>
                  <article><span>방명록</span><strong>{guestbook.length}</strong><small>공개 {guestbook.filter((entry) => entry.state === "visible").length}개</small></article>
                  <article><span>사진 업로드</span><strong>{uploads.length}</strong><small>검토 대기 {pendingUploads}개</small></article>
                  <article><span>현재 리비전</span><strong>v{invitation.revision}</strong><small>발행 v{invitation.publishedRevision ?? "—"}</small></article>
                </div>
                <Panel title="빠른 편집" description="가장 자주 바꾸는 제목과 예식 정보를 바로 수정합니다." actions={<button className="button button--primary" onClick={() => void saveContent()}>{saving ? "저장 중…" : "저장"}</button>}>
                  <div className="field-grid">
                    <Field label="메인 제목" wide><input value={invitation.draftContent.hero.title} onChange={(event) => updateContent((draft) => { draft.hero.title = event.target.value; })} /></Field>
                    <Field label="예식 일시"><input type="datetime-local" value={invitation.draftContent.event.startsAt.slice(0, 16)} onChange={(event) => updateContent((draft) => { draft.event.startsAt = `${event.target.value}:00+09:00`; })} /></Field>
                    <Field label="예식장"><input value={invitation.draftContent.event.venueName} onChange={(event) => updateContent((draft) => { draft.event.venueName = event.target.value; })} /></Field>
                  </div>
                </Panel>
                <Panel title="발행 상태" description="수정본과 공개본의 차이를 확인하세요.">
                  <div className="revision-row">
                    <div><span>수정본</span><strong>Revision {invitation.revision}</strong></div>
                    <span className="revision-line" />
                    <div><span>공개본</span><strong>Revision {invitation.publishedRevision ?? "—"}</strong></div>
                    <button className="button button--ghost" onClick={() => setView("publish")}>발행 설정</button>
                  </div>
                </Panel>
              </>
            ) : null}

            {view === "content" ? (
              <Panel title="기본 콘텐츠" description="이름, 인사말, 일정과 장소를 관리합니다." actions={<button className="button button--primary" onClick={() => void saveContent()}>{saving ? "저장 중…" : "변경사항 저장"}</button>}>
                <div className="field-grid">
                  <Field label="신랑 이름"><input value={invitation.draftContent.couple.partnerOne.name} onChange={(event) => updateContent((draft) => { draft.couple.partnerOne.name = event.target.value; })} /></Field>
                  <Field label="신부 이름"><input value={invitation.draftContent.couple.partnerTwo.name} onChange={(event) => updateContent((draft) => { draft.couple.partnerTwo.name = event.target.value; })} /></Field>
                  <Field label="신랑 호칭"><input value={invitation.draftContent.couple.partnerOne.label} onChange={(event) => updateContent((draft) => { draft.couple.partnerOne.label = event.target.value; })} /></Field>
                  <Field label="신부 호칭"><input value={invitation.draftContent.couple.partnerTwo.label} onChange={(event) => updateContent((draft) => { draft.couple.partnerTwo.label = event.target.value; })} /></Field>
                  <Field label="신랑 가족관계"><input value={invitation.draftContent.couple.partnerOne.familyRelation} onChange={(event) => updateContent((draft) => { draft.couple.partnerOne.familyRelation = event.target.value; })} /></Field>
                  <Field label="신부 가족관계"><input value={invitation.draftContent.couple.partnerTwo.familyRelation} onChange={(event) => updateContent((draft) => { draft.couple.partnerTwo.familyRelation = event.target.value; })} /></Field>
                  <Field label="영문 상단 문구"><input value={invitation.draftContent.hero.eyebrow} onChange={(event) => updateContent((draft) => { draft.hero.eyebrow = event.target.value; })} /></Field>
                  <Field label="메인 제목"><input value={invitation.draftContent.hero.title} onChange={(event) => updateContent((draft) => { draft.hero.title = event.target.value; })} /></Field>
                  <Field label="소개 한 줄" wide><input value={invitation.draftContent.hero.subtitle} onChange={(event) => updateContent((draft) => { draft.hero.subtitle = event.target.value; })} /></Field>
                  <Field label="인사말 제목" wide><input value={invitation.draftContent.greeting.title} onChange={(event) => updateContent((draft) => { draft.greeting.title = event.target.value; })} /></Field>
                  <Field label="인사말" wide><textarea rows={6} value={invitation.draftContent.greeting.body} onChange={(event) => updateContent((draft) => { draft.greeting.body = event.target.value; })} /></Field>
                </div>
                <h3 className="subheading">예식 정보</h3>
                <div className="field-grid">
                  <Field label="예식 일시"><input type="datetime-local" value={invitation.draftContent.event.startsAt.slice(0, 16)} onChange={(event) => updateContent((draft) => { draft.event.startsAt = `${event.target.value}:00+09:00`; })} /></Field>
                  <Field label="시간대"><input value={invitation.draftContent.event.timezone} onChange={(event) => updateContent((draft) => { draft.event.timezone = event.target.value; })} /></Field>
                  <Field label="예식장"><input value={invitation.draftContent.event.venueName} onChange={(event) => updateContent((draft) => { draft.event.venueName = event.target.value; })} /></Field>
                  <Field label="홀"><input value={invitation.draftContent.event.hall} onChange={(event) => updateContent((draft) => { draft.event.hall = event.target.value; })} /></Field>
                  <Field label="주소" wide><input value={invitation.draftContent.event.address} onChange={(event) => updateContent((draft) => { draft.event.address = event.target.value; })} /></Field>
                  <Field label="전화번호"><input value={invitation.draftContent.event.telephone} onChange={(event) => updateContent((draft) => { draft.event.telephone = event.target.value; })} /></Field>
                  <Field label="위도"><input type="number" step="any" value={invitation.draftContent.event.latitude ?? ""} onChange={(event) => updateContent((draft) => { draft.event.latitude = event.target.value ? Number(event.target.value) : null; })} /></Field>
                  <Field label="경도"><input type="number" step="any" value={invitation.draftContent.event.longitude ?? ""} onChange={(event) => updateContent((draft) => { draft.event.longitude = event.target.value ? Number(event.target.value) : null; })} /></Field>
                  <Field label="사진 업로드 시작"><input type="datetime-local" value={invitation.draftContent.guestUploads.opensAt.slice(0, 16)} onChange={(event) => updateContent((draft) => { draft.guestUploads.opensAt = `${event.target.value}:00+09:00`; })} /></Field>
                </div>
                <h3 className="subheading">연락처</h3>
                <div className="repeat-list">
                  {invitation.draftContent.contacts.map((contact, index) => (
                    <div className="repeat-row repeat-row--contact" key={contact.id}>
                      <select aria-label="가족 구분" value={contact.side} onChange={(event) => updateContent((draft) => {
                        const side = event.target.value as InvitationContent["contacts"][number]["side"];
                        draft.contacts[index]!.side = side;
                        if (draft.contacts[index]!.relationship === "partner") {
                          draft.contacts[index]!.role = side === "partnerOne"
                            ? draft.couple.partnerOne.label
                            : draft.couple.partnerTwo.label;
                        }
                      })}>
                        <option value="partnerOne">{invitation.draftContent.couple.partnerOne.label}측</option>
                        <option value="partnerTwo">{invitation.draftContent.couple.partnerTwo.label}측</option>
                      </select>
                      <select aria-label="관계" value={contact.relationship} onChange={(event) => updateContent((draft) => {
                        const relationship = event.target.value as InvitationContent["contacts"][number]["relationship"];
                        draft.contacts[index]!.relationship = relationship;
                        if (relationship !== "other") {
                          draft.contacts[index]!.role = relationship === "partner"
                            ? draft.contacts[index]!.side === "partnerOne"
                              ? draft.couple.partnerOne.label
                              : draft.couple.partnerTwo.label
                            : contactRelationshipLabels[relationship];
                        }
                      })}>
                        {Object.entries(contactRelationshipLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                      <input aria-label="표시 역할" value={contact.role} onChange={(event) => updateContent((draft) => { draft.contacts[index]!.role = event.target.value; })} />
                      <input aria-label="이름" value={contact.name} onChange={(event) => updateContent((draft) => { draft.contacts[index]!.name = event.target.value; })} />
                      <input aria-label="전화번호" value={contact.phone} onChange={(event) => updateContent((draft) => { draft.contacts[index]!.phone = event.target.value; })} />
                      <button className="remove-button" type="button" aria-label={`${contact.name} 연락처 삭제`} onClick={() => updateContent((draft) => { draft.contacts.splice(index, 1); })}>삭제</button>
                    </div>
                  ))}
                  <button className="add-button" type="button" disabled={invitation.draftContent.contacts.length >= 12} onClick={() => updateContent((draft) => {
                    draft.contacts.push({
                      id: createId("contact"),
                      side: "partnerOne",
                      relationship: "other",
                      role: "가족",
                      name: "이름",
                      phone: "010-0000-0000",
                    });
                  })}>+ 연락처 추가</button>
                </div>
                <h3 className="subheading">교통 안내</h3>
                <div className="repeat-list">
                  {invitation.draftContent.event.transport.map((item, index) => (
                    <article className="transport-editor" key={`transport-${index}`}>
                      <input aria-label="교통 안내 제목" value={item.title} onChange={(event) => updateContent((draft) => { draft.event.transport[index]!.title = event.target.value; })} />
                      <textarea aria-label="교통 안내 내용" rows={3} value={item.body} onChange={(event) => updateContent((draft) => { draft.event.transport[index]!.body = event.target.value; })} />
                      <button className="remove-button" type="button" onClick={() => updateContent((draft) => { draft.event.transport.splice(index, 1); })}>삭제</button>
                    </article>
                  ))}
                  <button className="add-button" type="button" onClick={() => updateContent((draft) => {
                    draft.event.transport.push({ title: "교통 안내", body: "이용 방법을 입력해 주세요." });
                  })}>+ 교통 안내 추가</button>
                </div>
              </Panel>
            ) : null}

            {view === "stories" ? (
              <>
                <Panel title="인터뷰" description="질문과 답변은 공개 페이지의 모달에 노출됩니다." actions={<button className="button button--primary" onClick={() => void saveContent()}>저장</button>}>
                  <div className="repeat-list">
                    {invitation.draftContent.interview.map((entry, index) => (
                      <article className="story-editor" key={entry.id}>
                        <span>Q{String(index + 1).padStart(2, "0")}</span>
                        <input value={entry.question} onChange={(event) => updateContent((draft) => { draft.interview[index]!.question = event.target.value; })} />
                        <textarea rows={4} value={entry.answer} onChange={(event) => updateContent((draft) => { draft.interview[index]!.answer = event.target.value; })} />
                        <button className="remove-button" type="button" onClick={() => updateContent((draft) => { draft.interview.splice(index, 1); })}>삭제</button>
                      </article>
                    ))}
                    <button className="add-button" type="button" onClick={() => updateContent((draft) => {
                      draft.interview.push({
                        id: createId("interview"),
                        question: "새 질문",
                        answer: "답변을 입력해 주세요.",
                        image: { assetId: null, alt: "", placeholder: "interview" },
                      });
                    })}>+ 인터뷰 추가</button>
                  </div>
                </Panel>
                <Panel title="우리의 연혁" description="공개 페이지의 가로 캐러셀 순서입니다." actions={<button className="button button--primary" onClick={() => void saveContent()}>저장</button>}>
                  <div className="repeat-list">
                    {invitation.draftContent.timeline.map((entry, index) => (
                      <article className="timeline-editor" key={entry.id}>
                        <strong>{index + 1}</strong>
                        <input aria-label="날짜" value={entry.date} onChange={(event) => updateContent((draft) => { draft.timeline[index]!.date = event.target.value; })} />
                        <input aria-label="제목" value={entry.title} onChange={(event) => updateContent((draft) => { draft.timeline[index]!.title = event.target.value; })} />
                        <textarea aria-label="내용" rows={2} value={entry.body} onChange={(event) => updateContent((draft) => { draft.timeline[index]!.body = event.target.value; })} />
                        <button className="remove-button" type="button" disabled={invitation.draftContent.timeline.length === 1} onClick={() => updateContent((draft) => { draft.timeline.splice(index, 1); })}>삭제</button>
                      </article>
                    ))}
                    <button className="add-button" type="button" onClick={() => updateContent((draft) => {
                      draft.timeline.push({
                        id: createId("timeline"),
                        date: "",
                        title: "새로운 이야기",
                        body: "",
                        image: { assetId: null, alt: "", placeholder: "story" },
                      });
                    })}>+ 연혁 추가</button>
                  </div>
                </Panel>
              </>
            ) : null}

            {view === "settings" ? (
              <>
                <Panel title="섹션 노출" description="공개 페이지의 기본 순서는 유지하고 필요한 섹션만 켜거나 끕니다." actions={<button className="button button--primary" onClick={() => void saveContent()}>저장</button>}>
                  <div className="section-toggle-grid">
                    {invitation.draftContent.sections.map((section, index) => (
                      <label className="toggle-row" key={section.id}>
                        <span>{sectionLabels[section.id]}</span>
                        <input type="checkbox" checked={section.enabled} onChange={(event) => updateContent((draft) => { draft.sections[index]!.enabled = event.target.checked; })} />
                      </label>
                    ))}
                  </div>
                </Panel>

                <Panel title="방문객 기능" description="RSVP, 방명록, 현장 사진 업로드와 음악 동작을 관리합니다." actions={<button className="button button--primary" onClick={() => void saveContent()}>저장</button>}>
                  <div className="feature-block">
                    <div className="feature-block__header">
                      <h3>참석 의사 전달</h3>
                      <label className="toggle-row"><span>사용</span><input type="checkbox" checked={invitation.draftContent.rsvp.enabled} onChange={(event) => updateContent((draft) => { draft.rsvp.enabled = event.target.checked; })} /></label>
                    </div>
                    <div className="field-grid">
                      <Field label="제목"><input value={invitation.draftContent.rsvp.title} onChange={(event) => updateContent((draft) => { draft.rsvp.title = event.target.value; })} /></Field>
                      <Field label="설명" wide><input value={invitation.draftContent.rsvp.description} onChange={(event) => updateContent((draft) => { draft.rsvp.description = event.target.value; })} /></Field>
                    </div>
                    <div className="inline-toggles">
                      <label><input type="checkbox" checked={invitation.draftContent.rsvp.collectMeal} onChange={(event) => updateContent((draft) => { draft.rsvp.collectMeal = event.target.checked; })} /> 식사 여부 수집</label>
                      <label><input type="checkbox" checked={invitation.draftContent.rsvp.collectShuttle} onChange={(event) => updateContent((draft) => { draft.rsvp.collectShuttle = event.target.checked; })} /> 셔틀 여부 수집</label>
                    </div>
                  </div>

                  <div className="feature-block">
                    <div className="feature-block__header">
                      <h3>방명록</h3>
                      <label className="toggle-row"><span>사용</span><input type="checkbox" checked={invitation.draftContent.guestbook.enabled} onChange={(event) => updateContent((draft) => { draft.guestbook.enabled = event.target.checked; })} /></label>
                    </div>
                    <div className="field-grid">
                      <Field label="제목"><input value={invitation.draftContent.guestbook.title} onChange={(event) => updateContent((draft) => { draft.guestbook.title = event.target.value; })} /></Field>
                      <Field label="설명" wide><input value={invitation.draftContent.guestbook.description} onChange={(event) => updateContent((draft) => { draft.guestbook.description = event.target.value; })} /></Field>
                    </div>
                  </div>

                  <div className="feature-block">
                    <div className="feature-block__header">
                      <h3>축하 사진 공유</h3>
                      <label className="toggle-row"><span>사용</span><input type="checkbox" checked={invitation.draftContent.guestUploads.enabled} onChange={(event) => updateContent((draft) => { draft.guestUploads.enabled = event.target.checked; })} /></label>
                    </div>
                    <div className="field-grid">
                      <Field label="제목"><input value={invitation.draftContent.guestUploads.title} onChange={(event) => updateContent((draft) => { draft.guestUploads.title = event.target.value; })} /></Field>
                      <Field label="업로드 시작"><input type="datetime-local" value={invitation.draftContent.guestUploads.opensAt.slice(0, 16)} onChange={(event) => updateContent((draft) => { draft.guestUploads.opensAt = `${event.target.value}:00+09:00`; })} /></Field>
                      <Field label="설명" wide><textarea rows={3} value={invitation.draftContent.guestUploads.description} onChange={(event) => updateContent((draft) => { draft.guestUploads.description = event.target.value; })} /></Field>
                    </div>
                  </div>

                  <div className="feature-block">
                    <div className="feature-block__header">
                      <h3>배경 음악</h3>
                      <label className="toggle-row"><span>사용</span><input type="checkbox" checked={invitation.draftContent.music.enabled} onChange={(event) => updateContent((draft) => { draft.music.enabled = event.target.checked; })} /></label>
                    </div>
                    <div className="field-grid">
                      <Field label="곡 제목"><input value={invitation.draftContent.music.title} onChange={(event) => updateContent((draft) => { draft.music.title = event.target.value; })} /></Field>
                      <Field label="현재 미디어"><input readOnly value={invitation.draftContent.music.assetId ?? "미디어 화면에서 연결"} /></Field>
                    </div>
                    <p className="panel-note">브라우저 정책에 따라 방문객이 음악 버튼을 눌러야 재생됩니다.</p>
                  </div>
                </Panel>

                <Panel title="계좌 정보" description="신랑·신부 측 그룹과 계좌를 추가하거나 삭제할 수 있습니다." actions={<button className="button button--primary" onClick={() => void saveContent()}>저장</button>}>
                  <div className="account-editor-list">
                    {invitation.draftContent.accounts.map((group, groupIndex) => (
                      <article className="account-editor" key={group.id}>
                        <header>
                          <input aria-label="계좌 그룹 이름" value={group.label} onChange={(event) => updateContent((draft) => { draft.accounts[groupIndex]!.label = event.target.value; })} />
                          <button className="remove-button" type="button" onClick={() => updateContent((draft) => { draft.accounts.splice(groupIndex, 1); })}>그룹 삭제</button>
                        </header>
                        {group.items.map((account, accountIndex) => (
                          <div className="account-editor__row" key={account.id}>
                            <input aria-label="예금주" placeholder="예금주" value={account.holder} onChange={(event) => updateContent((draft) => { draft.accounts[groupIndex]!.items[accountIndex]!.holder = event.target.value; })} />
                            <input aria-label="은행" placeholder="은행" value={account.bank} onChange={(event) => updateContent((draft) => { draft.accounts[groupIndex]!.items[accountIndex]!.bank = event.target.value; })} />
                            <input aria-label="계좌번호" placeholder="계좌번호" value={account.accountNumber} onChange={(event) => updateContent((draft) => { draft.accounts[groupIndex]!.items[accountIndex]!.accountNumber = event.target.value; })} />
                            <input aria-label="송금 링크" placeholder="송금 링크(선택)" value={account.paymentUrl} onChange={(event) => updateContent((draft) => { draft.accounts[groupIndex]!.items[accountIndex]!.paymentUrl = event.target.value; })} />
                            <button className="remove-button" type="button" disabled={group.items.length === 1} onClick={() => updateContent((draft) => { draft.accounts[groupIndex]!.items.splice(accountIndex, 1); })}>삭제</button>
                          </div>
                        ))}
                        <button className="add-button" type="button" disabled={group.items.length >= 8} onClick={() => updateContent((draft) => {
                          draft.accounts[groupIndex]!.items.push({ id: createId("account"), holder: "예금주", bank: "은행", accountNumber: "000-0000-0000", paymentUrl: "" });
                        })}>+ 계좌 추가</button>
                      </article>
                    ))}
                    <button className="add-button" type="button" disabled={invitation.draftContent.accounts.length >= 4} onClick={() => updateContent((draft) => {
                      draft.accounts.push({
                        id: createId("account-group"),
                        label: "새 그룹",
                        items: [{ id: createId("account"), holder: "예금주", bank: "은행", accountNumber: "000-0000-0000", paymentUrl: "" }],
                      });
                    })}>+ 계좌 그룹 추가</button>
                  </div>
                </Panel>

                <Panel title="마무리 문구" description="초대장 마지막 이미지 아래에 표시되는 문구입니다." actions={<button className="button button--primary" onClick={() => void saveContent()}>저장</button>}>
                  <div className="field-grid">
                    <Field label="제목"><input value={invitation.draftContent.closing.title} onChange={(event) => updateContent((draft) => { draft.closing.title = event.target.value; })} /></Field>
                    <Field label="본문" wide><textarea rows={4} value={invitation.draftContent.closing.body} onChange={(event) => updateContent((draft) => { draft.closing.body = event.target.value; })} /></Field>
                  </div>
                </Panel>
              </>
            ) : null}

            {view === "design" ? (
              <Panel title="디자인 토큰" description="색과 간격을 바꿔도 모든 핵심 컴포넌트가 같은 계약을 사용합니다." actions={<button className="button button--primary" onClick={() => void saveDesign()}>토큰 저장</button>}>
                <div className="token-grid">
                  {Object.entries(invitation.draftDesign.colors).map(([name, value]) => (
                    <label className="color-token" key={name}>
                      <input type="color" value={value} onChange={(event) => updateDesign((draft) => { draft.colors[name as keyof typeof draft.colors] = event.target.value; })} />
                      <span>{name}<code>{value}</code></span>
                    </label>
                  ))}
                </div>
                <h3 className="subheading">타이포그래피와 간격</h3>
                <div className="field-grid">
                  <Field label="제목 글꼴"><input value={invitation.draftDesign.typography.display} onChange={(event) => updateDesign((draft) => { draft.typography.display = event.target.value; })} /></Field>
                  <Field label="본문 글꼴"><input value={invitation.draftDesign.typography.body} onChange={(event) => updateDesign((draft) => { draft.typography.body = event.target.value; })} /></Field>
                  <Field label={`모서리 ${invitation.draftDesign.radius}px`}><input type="range" min="0" max="40" value={invitation.draftDesign.radius} onChange={(event) => updateDesign((draft) => { draft.radius = Number(event.target.value); })} /></Field>
                  <Field label={`섹션 간격 ${invitation.draftDesign.spacing.section}px`}><input type="range" min="48" max="180" value={invitation.draftDesign.spacing.section} onChange={(event) => updateDesign((draft) => { draft.spacing.section = Number(event.target.value); })} /></Field>
                </div>
              </Panel>
            ) : null}

            {view === "media" ? (
              <>
                <Panel title="미디어 업로드" description="이미지는 MinIO에 비공개 객체로 저장되고 발행할 때 공개됩니다.">
                  <form className="upload-form" onSubmit={(event) => {
                    event.preventDefault();
                    const formElement = event.currentTarget;
                    const form = new FormData(formElement);
                    void api.uploadMedia(invitation.id, form).then(async () => {
                      setMedia((await api.media(invitation.id)).assets);
                      setNotice("미디어를 업로드했습니다.");
                      formElement.reset();
                    }).catch(() => setNotice("업로드하지 못했습니다."));
                  }}>
                    <select name="purpose" required defaultValue="gallery">
                      <option value="hero">히어로</option><option value="greeting">인사말</option><option value="interview">인터뷰</option><option value="timeline">연혁</option><option value="gallery">갤러리</option><option value="middle">중간 이미지</option><option value="closing">마무리</option><option value="music">음악</option>
                    </select>
                    <input name="altText" placeholder="대체 텍스트" />
                    <input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif,audio/mpeg" required />
                    <button className="button button--primary">업로드</button>
                  </form>
                </Panel>
                <Panel title="미디어 슬롯 연결" description="업로드한 파일을 공개 페이지의 실제 이미지·음악 슬롯에 연결합니다." actions={<button className="button button--primary" onClick={() => void saveContent()}>{saving ? "저장 중…" : "연결 저장"}</button>}>
                  <div className="media-slot-grid">
                    <MediaSlotField label="초대 인사 사진" value={invitation.draftContent.greeting.image.assetId} assets={media} onChange={(asset) => updateContent((draft) => { draft.greeting.image = connectMedia(draft.greeting.image, asset); })} />
                    <MediaSlotField label="중간 이미지" value={invitation.draftContent.middleImage.assetId} assets={media} onChange={(asset) => updateContent((draft) => { draft.middleImage = connectMedia(draft.middleImage, asset); })} />
                    <MediaSlotField label="마무리 이미지" value={invitation.draftContent.closing.image.assetId} assets={media} onChange={(asset) => updateContent((draft) => { draft.closing.image = connectMedia(draft.closing.image, asset); })} />
                    <MediaSlotField label="배경 음악" value={invitation.draftContent.music.assetId} assets={media} kind="audio" onChange={(asset) => updateContent((draft) => {
                      draft.music.assetId = asset?.id ?? null;
                      if (asset) {
                        draft.music.enabled = true;
                        draft.music.title = asset.originalName;
                      }
                    })} />
                  </div>

                  <h3 className="subheading">인터뷰 사진</h3>
                  <div className="media-slot-grid">
                    {invitation.draftContent.interview.map((entry, index) => (
                      <MediaSlotField key={entry.id} label={`Q${index + 1} · ${entry.question}`} value={entry.image.assetId} assets={media} onChange={(asset) => updateContent((draft) => { draft.interview[index]!.image = connectMedia(draft.interview[index]!.image, asset); })} />
                    ))}
                  </div>

                  <h3 className="subheading">연혁 사진</h3>
                  <div className="media-slot-grid">
                    {invitation.draftContent.timeline.map((entry, index) => (
                      <MediaSlotField key={entry.id} label={`${index + 1} · ${entry.title}`} value={entry.image.assetId} assets={media} onChange={(asset) => updateContent((draft) => { draft.timeline[index]!.image = connectMedia(draft.timeline[index]!.image, asset); })} />
                    ))}
                  </div>

                  <div className="subheading-row">
                    <h3 className="subheading">갤러리</h3>
                    <label>처음 표시 <input type="number" min="2" max="30" value={invitation.draftContent.gallery.initialCount} onChange={(event) => updateContent((draft) => { draft.gallery.initialCount = Number(event.target.value); })} /></label>
                  </div>
                  <div className="gallery-slot-list">
                    {invitation.draftContent.gallery.items.map((item, index) => (
                      <div key={item.id}>
                        <MediaSlotField label={`갤러리 ${index + 1}`} value={item.assetId} assets={media} onChange={(asset) => updateContent((draft) => { draft.gallery.items[index] = { ...connectMedia(draft.gallery.items[index]!, asset), id: draft.gallery.items[index]!.id }; })} />
                        <button className="remove-button" type="button" onClick={() => updateContent((draft) => { draft.gallery.items.splice(index, 1); })}>삭제</button>
                      </div>
                    ))}
                    <button className="add-button" type="button" disabled={invitation.draftContent.gallery.items.length >= 100} onClick={() => updateContent((draft) => {
                      draft.gallery.items.push({ id: createId("gallery"), assetId: null, alt: "웨딩 갤러리 사진", placeholder: "gallery" });
                    })}>+ 갤러리 슬롯 추가</button>
                  </div>
                </Panel>
                <Panel
                  title={`미디어 ${media.length}개`}
                  description="초안 또는 현재 공개본이 사용하는 파일은 연결을 해제하고 새 버전을 발행한 뒤 삭제할 수 있습니다."
                >
                  <div className="media-grid">
                    {media.map((asset) => {
                      const connectedToDraft = connectedAssetIds.has(asset.id);
                      const deletionBlocked = connectedToDraft || asset.connectedToPublished;
                      const connectionLabel = asset.connectedToPublished
                        ? "공개본 사용 중"
                        : connectedToDraft
                          ? "초안 연결됨"
                          : asset.state;
                      const deletionTitle = asset.connectedToPublished
                        ? "현재 공개본이 사용 중입니다. 새 버전을 발행한 뒤 삭제할 수 있습니다."
                        : connectedToDraft
                          ? "초안 슬롯 연결을 먼저 해제해 주세요."
                          : "미디어 삭제";
                      return (
                        <article key={asset.id}>
                          {asset.contentType.startsWith("image/") ? <img src={asset.previewUrl} alt={asset.altText} /> : <div className="audio-tile">♪</div>}
                          <div><strong>{asset.originalName}</strong><span>{asset.purpose} · {Math.round(asset.sizeBytes / 1024)}KB</span><small>{connectionLabel}</small></div>
                          <button
                            type="button"
                            aria-label="미디어 삭제"
                            disabled={deletionBlocked}
                            title={deletionTitle}
                            onClick={() => void api.removeMedia(invitation.id, asset.id)
                              .then(async () => setMedia((await api.media(invitation.id)).assets))
                              .catch(() => setNotice("미디어를 삭제하지 못했습니다. 연결 상태를 확인해 주세요."))}
                          >
                            ×
                          </button>
                        </article>
                      );
                    })}
                  </div>
                </Panel>
              </>
            ) : null}

            {view === "rsvps" ? (
              <Panel
                title={`RSVP ${rsvps.length}건`}
                description="방문객이 제출한 참석 의사와 준비 항목입니다."
                actions={(
                  <a
                    className="button button--ghost"
                    href={`/api/admin/invitations/${invitation.id}/rsvps.csv`}
                    download
                  >
                    CSV 내보내기
                  </a>
                )}
              >
                <div className="table-wrap"><table><thead><tr><th>이름</th><th>참석</th><th>구분</th><th>인원</th><th>식사</th><th>셔틀</th><th>연락처</th><th>메모</th><th>접수일</th></tr></thead><tbody>
                  {rsvps.map((rsvp) => <tr key={rsvp.id}><td>{rsvp.name}</td><td><span className={`pill ${rsvp.attending ? "pill--ok" : ""}`}>{rsvp.attending ? "참석" : "불참"}</span></td><td>{rsvp.party === "partnerOne" ? "신랑" : "신부"}</td><td>{rsvp.additionalGuests + 1}</td><td>{rsvp.meal ? mealLabels[rsvp.meal] : "—"}</td><td>{rsvp.shuttle ? shuttleLabels[rsvp.shuttle] : "—"}</td><td>{rsvp.phone}</td><td>{rsvp.note || "—"}</td><td>{new Date(rsvp.createdAt).toLocaleDateString("ko-KR")}</td></tr>)}
                </tbody></table></div>
              </Panel>
            ) : null}

            {view === "guestbook" ? (
              <Panel title={`방명록 ${guestbook.length}건`} description="부적절한 글은 숨기거나 삭제 상태로 전환할 수 있습니다.">
                <div className="moderation-list">
                  {guestbook.map((entry) => <article key={entry.id}><div className="avatar">{entry.name.slice(0, 1)}</div><div><strong>{entry.name}</strong><p>{entry.message}</p><time>{new Date(entry.createdAt).toLocaleString("ko-KR")}</time></div><select value={entry.state} onChange={(event) => void api.moderateGuestbook(invitation.id, entry.id, event.target.value as GuestbookEntry["state"]).then(async () => setGuestbook((await api.guestbook(invitation.id)).entries))}><option value="visible">공개</option><option value="hidden">숨김</option><option value="deleted">삭제</option></select></article>)}
                </div>
              </Panel>
            ) : null}

            {view === "uploads" ? (
              <Panel title={`방문객 사진 ${uploads.length}개`} description={`검토 대기 ${pendingUploads}개 · 승인 전에는 외부에 노출되지 않습니다.`}>
                <div className="upload-review-grid">
                  {uploads.map((upload) => <article key={upload.id}><a href={upload.downloadUrl} target="_blank" rel="noreferrer"><div className="upload-preview">사진 보기 ↗</div></a><div><strong>{upload.originalName}</strong><span>{upload.uploaderName || "이름 없음"}</span><p>{upload.note}</p></div><div className="review-actions"><button onClick={() => void api.reviewGuestUpload(invitation.id, upload.id, "approved").then(async () => setUploads((await api.guestUploads(invitation.id)).uploads))}>승인</button><button onClick={() => void api.reviewGuestUpload(invitation.id, upload.id, "rejected").then(async () => setUploads((await api.guestUploads(invitation.id)).uploads))}>거절</button></div></article>)}
                </div>
              </Panel>
            ) : null}

            {view === "publish" ? (
              <Panel title="발행 설정" description="현재 수정본 전체를 검증한 뒤 한 번에 공개본으로 전환합니다.">
                <div className="publish-card">
                  <span className={`publish-status publish-status--${invitation.status}`}>{invitation.status}</span>
                  <h3>{invitation.slug}</h3>
                  <p>수정본 Revision {invitation.revision}</p>
                  <p>현재 공개본 Revision {invitation.publishedRevision ?? "없음"}</p>
                  <div className="publish-checks">
                    <span>✓ PostgreSQL 콘텐츠</span><span>✓ MinIO 미디어 참조</span><span>✓ 공개본 원자적 교체</span>
                  </div>
                  <button className="button button--publish" onClick={() => void api.publish(invitation.id).then(async () => { setInvitation(await api.invitation(invitation.id)); setNotice("새 버전을 발행했습니다."); })}>Revision {invitation.revision} 발행하기</button>
                </div>
                <div className="route-note"><strong>공개</strong><code>wedding.giraffe.ai.kr → wedding-invitation:80</code><strong>관리자</strong><code>wedding-admin.giraffe.ai.kr → Tailscale DNS → wedding-admin:80</code></div>
              </Panel>
            ) : null}
          </div>

          <aside className="preview-column">
            <div className="preview-header"><div><span className="status-dot" />초안 실시간 미리보기</div><span>390 × 844</span></div>
            <div className="phone-frame">
              <iframe
                ref={previewFrameRef}
                title="청첩장 초안 미리보기"
                src={draftPreviewUrl}
                onLoad={syncDraftPreview}
              />
            </div>
          </aside>
        </div>
      </main>

      <div className={`toast ${notice ? "is-visible" : ""}`} role="status">{notice}<button onClick={() => setNotice("")}>×</button></div>
    </div>
  );
}
