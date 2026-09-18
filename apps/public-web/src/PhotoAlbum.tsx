import { useEffect, useRef, useState, type CSSProperties } from "react";
import { loadGuestUploadPage, loadInvitation } from "./api";
import { sectionAnchorId } from "./components/QuickMenu";
import { Dialog } from "./components/Dialog";
import type { GuestUploadPhoto } from "./guest-upload-gallery";
import { resolveInvitationThemeDesign } from "./invitation-theme";
import type { InvitationResponse } from "./types";

export function PhotoAlbum({ slug }: { slug: string }) {
  const [invitation, setInvitation] = useState<InvitationResponse | null>(null);
  const [photos, setPhotos] = useState<GuestUploadPhoto[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState<GuestUploadPhoto | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    void Promise.all([loadInvitation(slug), loadGuestUploadPage(slug)]).then(([data, page]) => {
      if (cancelled) return;
      setInvitation(data);
      setPhotos(page.photos);
      setCursor(page.nextCursor);
      document.title = `함께한 사진 · ${data.content.couple.partnerOne.name} & ${data.content.couple.partnerTwo.name}`;
    }).catch(() => {
      if (!cancelled) setError("사진을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug, attempt]);

  async function loadMore() {
    if (!cursor || busy.current) return;
    busy.current = true;
    setLoading(true);
    setError("");
    try {
      const page = await loadGuestUploadPage(slug, cursor);
      setPhotos((current) => [...current, ...page.photos.filter((photo) => !current.some((item) => item.id === photo.id))]);
      setCursor(page.nextCursor);
    } catch {
      setError("다음 사진을 불러오지 못했습니다. 더 보기를 눌러 다시 시도해 주세요.");
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }

  const design = invitation ? resolveInvitationThemeDesign(invitation.design) : null;
  const style = design ? {
    "--paper": design.colors.paper, "--ink": design.colors.ink,
    "--muted": design.colors.muted, "--line": design.colors.line,
    "--accent": design.colors.accent, "--surface": design.colors.surface,
    "--display-font": design.typography.display, "--body-font": design.typography.body,
    "--radius": `${design.radius}px`,
  } as CSSProperties : undefined;

  return (
    <div className="page-shell photo-album" style={style}>
      <main className="photo-album__main">
        <nav className="photo-album__nav" aria-label="앨범 메뉴">
          <a href={`/${slug}`}>← 청첩장</a><span>OUR WEDDING ALBUM</span>
        </nav>
        <header className="photo-album__header">
          <p className="eyebrow">MOMENTS WE SHARE</p>
          <h1>함께한 사진</h1>
          <p>여러분의 시선으로 남긴, 우리의 하루.</p>
          <p className="photo-album__note">공개 승인된 사진을 최신순으로 모았어요.</p>
          {invitation?.content.guestUploads.enabled && invitation.content.sections.some((section) => section.id === "guestUploads" && section.enabled) ? <a className="album-link" href={`/${slug}#${sectionAnchorId("guestUploads")}`}>사진 올리러 가기 →</a> : null}
        </header>
        <div role="status" aria-live="polite">
          {loading ? <p className="photo-album__status">사진을 불러오고 있어요…</p> : null}
          {error ? <div className="photo-album__status"><p>{error}</p>{!invitation ? <button className="primary-button" onClick={() => setAttempt((value) => value + 1)}>다시 시도</button> : null}</div> : null}
          {!loading && !error && photos.length === 0 ? <div className="photo-album__empty"><span aria-hidden="true">♡</span><h2>사진을 기다리고 있어요</h2><p>함께한 순간들이 공개되면 이곳에 차곡차곡 담길 거예요.</p></div> : null}
        </div>
        {photos.length > 0 ? <><p className="photo-album__count">함께 나눈 순간 {photos.length}장</p><div className="photo-album__grid">
          {photos.map((photo, index) => <button key={photo.id} type="button" className="photo-album__tile" onClick={() => setSelected(photo)} aria-label={`${index + 1}번째 사진 크게 보기: ${photo.alt}`}>
            <AlbumImage photo={photo} /><span>{String(index + 1).padStart(2, "0")} <span aria-hidden="true">↗</span></span>
          </button>)}
        </div></> : null}
        {cursor ? <button className="primary-button photo-album__more" disabled={loading} onClick={() => void loadMore()}>사진 더 보기</button> : null}
        <footer className="photo-album__footer">소중한 순간을 함께해 주셔서 감사합니다.</footer>
      </main>
      <Dialog open={selected !== null} title="함께한 순간" onClose={() => setSelected(null)} className="photo-album__viewer">
        {selected ? <><AlbumImage key={selected.id} photo={selected} /><a className="album-link" href={selected.url} target="_blank" rel="noreferrer">원본 사진 열기 ↗</a></> : null}
      </Dialog>
    </div>
  );
}

function AlbumImage({ photo }: { photo: GuestUploadPhoto }) {
  const [failed, setFailed] = useState(false);
  return failed ? <span className="photo-album__unavailable">미리보기를 표시할 수 없어요.<br />사진을 눌러 원본을 열어 주세요.</span> : <img src={photo.url} alt={photo.alt} loading="lazy" decoding="async" onError={() => setFailed(true)} />;
}
