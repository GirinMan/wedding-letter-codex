import { useEffect, useMemo, useRef, useState } from "react";
import { loadGuestUploadPage, loadInvitation } from "./api";
import { Media } from "./components/Media";
import { displayImageUrl, preloadImages } from "./image-preload";
import { albumUploadState, groupPhotosByHour } from "./photo-route";
import { sectionAnchorId } from "./components/QuickMenu";
import { Dialog } from "./components/Dialog";
import type { GuestUploadPhoto } from "./guest-upload-gallery";
import { invitationThemeStyle, resolveInvitationThemeDesign } from "./invitation-theme";
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
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    void Promise.all([loadInvitation(slug), loadGuestUploadPage(slug)]).then(([data, page]) => {
      if (cancelled) return;
      setInvitation(data);
      void preloadImages(page.photos.map(photo => displayImageUrl(photo.url)));
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
      void preloadImages(page.photos.map(photo => displayImageUrl(photo.url)));
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
  const style = design ? invitationThemeStyle(design) : undefined;
  const content = invitation?.content;
  const uploadState = content ? albumUploadState(content, now) : 'disabled';
  const dateFormat = content ? new Intl.DateTimeFormat('ko-KR', {
    timeZone: content.event.timezone, year: 'numeric', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  }) : null;
  const opening = content ? dateFormat!.format(new Date(content.guestUploads.opensAt)) : '';
  const cover = content?.guestUploads.fallbackItems.find((item) => item.assetId)
    ?? (content?.hero.image.assetId ? content.hero.image : null);
  const groups = useMemo(() => groupPhotosByHour(photos, content?.event.timezone ?? 'Asia/Seoul'), [photos, content?.event.timezone]);
  const selectedIndex = selected ? photos.findIndex((photo) => photo.id === selected.id) : -1;
  const movePhoto = (delta: number) => {
    const next = photos[selectedIndex + delta];
    if (next) setSelected(next);
  };

  return (
    <div className="page-shell photo-album" style={style} data-theme={design?.themeId}>
      <main className="photo-album__main">
        <nav className="photo-album__nav" aria-label="앨범 메뉴">
          <a href={`/${slug}`}>← 청첩장</a><span>OUR WEDDING ALBUM</span>
        </nav>
        <header className="photo-album__header">
          <div className="photo-album__intro">
            <p className="eyebrow">OUR WEDDING, YOUR MEMORIES</p>
            {content ? <p className="photo-album__couple">{content.couple.partnerOne.name} <span>&</span> {content.couple.partnerTwo.name}</p> : null}
            <h1>함께한 사진</h1>
            <p className="photo-album__description">{content?.guestUploads.description || '여러분의 시선으로 남긴, 우리의 하루.'}</p>
            {content ? <time dateTime={content.event.startsAt}>{dateFormat!.format(new Date(content.event.startsAt))}</time> : null}
          </div>
          {cover ? <figure className="photo-album__cover"><Media media={cover} loading="eager" /><figcaption>청첩장 속 두 사람, 함께 남길 다음 장면.</figcaption></figure> : null}
        </header>
        {content ? <section className="photo-album__guide" aria-labelledby="album-guide-title">
          <div className="photo-album__guide-copy">
            <h2 id="album-guide-title">{uploadState === 'scheduled' ? `${opening}부터 사진을 올릴 수 있어요` : uploadState === 'open' ? '우리의 하루를 함께 기록해 주세요' : '함께한 순간을 모았어요'}</h2>
            <details className="photo-album__help"><summary>사진 업로드·공개 안내</summary>
              <p>{content.guestUploads.description}</p>
              <p>올려 주신 사진은 확인 후 앨범에 공개됩니다. 앨범에 방문한 누구나 볼 수 있으니, 함께 찍힌 분들도 공개에 동의한 사진을 골라 주세요.</p>
              <p>사진은 촬영 시각이 아닌 업로드 시각을 기준으로 1시간씩 모아 보여드려요.</p>
            </details>
          </div>
          {uploadState !== 'disabled' ? <a className="primary-button photo-album__upload" href={`/${slug}#${sectionAnchorId("guestUploads")}`}>{uploadState === 'open' ? '사진 올리러 가기' : '청첩장에서 업로드 안내 보기'} <span aria-hidden="true">↗</span></a> : null}
        </section> : null}
        <div role="status" aria-live="polite">
          {loading ? <p className="photo-album__status">사진을 불러오고 있어요…</p> : null}
          {error ? <div className="photo-album__status"><p>{error}</p>{!invitation ? <button className="primary-button" onClick={() => setAttempt((value) => value + 1)}>다시 시도</button> : null}</div> : null}
          {!loading && !error && photos.length === 0 ? <div className="photo-album__empty"><span aria-hidden="true">♡</span><h2>{uploadState === 'scheduled' ? '함께 채워 갈 앨범이에요' : '아직 공개된 사진이 없어요'}</h2><p>{uploadState === 'scheduled' ? '예식 날의 웃음과 축하를 이곳에 담아 둘게요.' : '사진을 이미 올리셨다면 잠시 기다려 주세요. 확인이 끝나면 이곳에서 볼 수 있어요.'}</p></div> : null}
        </div>
        {photos.length > 0 ? <><p className="photo-album__count">불러온 사진 {photos.length}장 · 업로드 시간순 · {content?.event.timezone === 'Asia/Seoul' ? '한국 시간' : content?.event.timezone}</p>
          {groups.map(group => <section className="photo-album__hour" key={group.key} aria-label={group.label}>
            <h2>{group.label} <span>{group.photos.length}장</span></h2>
            <div className="photo-album__grid">
              {group.photos.map(photo => <button key={photo.id} type="button" className="photo-album__tile" onClick={() => setSelected(photo)} aria-label={`사진 크게 보기: ${photo.alt}`}>
                <AlbumImage photo={photo} /><span>{photo.createdAt ? new Intl.DateTimeFormat('ko-KR',{timeZone:content?.event.timezone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(photo.createdAt)) : ''} <span aria-hidden="true">↗</span></span>
              </button>)}
            </div>
          </section>)}
        </> : null}
        {cursor ? <button className="primary-button photo-album__more" disabled={loading} onClick={() => void loadMore()}>사진 더 보기</button> : null}
        <footer className="photo-album__footer"><p>소중한 순간을 함께해 주셔서 감사합니다.</p><a href={`/${slug}`}>두 사람의 청첩장으로 돌아가기</a></footer>
      </main>
      <Dialog open={selected !== null} title="함께한 순간" onClose={() => setSelected(null)} className="photo-album__viewer">
        {selected ? <div onKeyDown={(event) => {
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault(); movePhoto(event.key === 'ArrowLeft' ? -1 : 1);
          }
        }}>
          <AlbumImage key={selected.id} photo={selected} />
          <div className="photo-album__viewer-nav"><button type="button" disabled={selectedIndex <= 0} onClick={() => movePhoto(-1)}>← 이전 사진</button><span aria-live="polite">{selectedIndex + 1} / {photos.length}</span><button type="button" disabled={selectedIndex >= photos.length - 1} onClick={() => movePhoto(1)}>다음 사진 →</button></div>
          <a className="album-link" href={selected.url} target="_blank" rel="noreferrer">원본 사진 열기 ↗</a><p className="photo-album__note">원본은 새 탭에서 열립니다. 기기의 저장 기능으로 내려받을 수 있어요.</p>
        </div> : null}
      </Dialog>
    </div>
  );
}

function AlbumImage({ photo }: { photo: GuestUploadPhoto }) {
  const [failed, setFailed] = useState(false);
  return failed ? <span className="photo-album__unavailable">미리보기를 표시할 수 없어요.<br />사진을 눌러 원본을 열어 주세요.</span> : <img src={displayImageUrl(photo.url)} alt={photo.alt} loading="lazy" decoding="async" onError={() => setFailed(true)} />;
}
