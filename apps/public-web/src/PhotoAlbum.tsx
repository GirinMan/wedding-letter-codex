import { GuestPhotoUploadDialog } from "./components/GuestPhotoUploadDialog";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { loadGuestUploadPage, loadInvitation } from "./api";
import { Media } from "./components/Media";
import { displayImageUrl, thumbnailImageUrl, preloadImages } from "./image-preload";
import { albumUploadState, groupPhotosByHour, groupPhotosByDetails } from "./photo-route";
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
  const epoch = useRef(0);
  const nextPage = useRef<{key: string; promise: Promise<Awaited<ReturnType<typeof loadGuestUploadPage>> | null>} | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    setNow(Date.now());
    const opening = Date.parse(invitation?.content.guestUploads.opensAt ?? '');
    if (!Number.isFinite(opening) || opening <= Date.now()) return;
    const timer = window.setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= opening) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [invitation]);

  useEffect(() => {
    let cancelled = false;
    epoch.current++;
    busy.current = false;
    nextPage.current = null;
    setLoading(true);
    setError("");
    void Promise.all([loadInvitation(slug), loadGuestUploadPage(slug)]).then(([data, page]) => {
      if (cancelled) return;
      setInvitation(data);
      void preloadImages(page.photos.slice(0, 9).map(photo => thumbnailImageUrl(photo.url)));
      setPhotos(page.photos);
      setCursor(page.nextCursor);
      document.title = `함께한 사진 · ${data.content.couple.partnerOne.name} & ${data.content.couple.partnerTwo.name}`;
    }).catch(() => {
      if (!cancelled) setError("사진을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug, attempt]);

  // Fetch only the next metadata page, never the entire album or its images.
  useEffect(() => {
    if (!cursor || loading) return;
    const key = `${slug}:${attempt}:${cursor}`;
    if (nextPage.current?.key !== key) {
      nextPage.current = {key, promise: loadGuestUploadPage(slug, cursor).catch(() => null)};
    }
  }, [slug, attempt, cursor, loading]);

  async function loadMore() {
    if (!cursor || busy.current) return;
    busy.current = true;
    const requestEpoch = epoch.current;
    setLoading(true);
    setError("");
    try {
      const key = `${slug}:${attempt}:${cursor}`;
      const prefetched = nextPage.current?.key === key ? await nextPage.current.promise : null;
      const page = prefetched ?? await loadGuestUploadPage(slug, cursor);
      if (requestEpoch !== epoch.current) return;
      setPhotos((current) => [...current, ...page.photos.filter((photo) => !current.some((item) => item.id === photo.id))]);
      setCursor(page.nextCursor);
    } catch {
      if (requestEpoch !== epoch.current) return;
      setError("다음 사진을 불러오지 못했습니다. 더 보기를 눌러 다시 시도해 주세요.");
    } finally {
      if (requestEpoch === epoch.current) {
        busy.current = false;
        setLoading(false);
      }
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
  const groups = useMemo(() => groupPhotosByHour(photos, content?.event.timezone ?? 'Asia/Seoul').map(group => ({...group, details: groupPhotosByDetails(group.photos)})), [photos, content?.event.timezone]);
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
              <p>올려 주신 사진은 앨범에 바로 공개되며, 관리자가 추후 비공개로 변경할 수 있습니다. 앨범에 방문한 누구나 볼 수 있으니, 함께 찍힌 분들도 공개에 동의한 사진을 골라 주세요.</p>
              <p>사진은 촬영 시각이 아닌 업로드 시각을 기준으로 1시간씩 모아 보여드려요.</p>
            </details>
          </div>
          {uploadState !== 'disabled' ? <button type="button" className="primary-button photo-album__upload" disabled={uploadState !== 'open'} onClick={() => setUploadOpen(true)}>{uploadState === 'open' ? '사진 올리기' : '업로드 시작 전'} <span aria-hidden="true">＋</span></button> : null}
        </section> : null}
        <div role="status" aria-live="polite">
          {loading ? <p className="photo-album__status">사진을 불러오고 있어요…</p> : null}
          {error ? <div className="photo-album__status"><p>{error}</p>{!invitation ? <button className="primary-button" onClick={() => setAttempt((value) => value + 1)}>다시 시도</button> : null}</div> : null}
          {!loading && !error && photos.length === 0 ? <div className="photo-album__empty"><span aria-hidden="true">♡</span><h2>{uploadState === 'scheduled' ? '함께 채워 갈 앨범이에요' : '아직 공개된 사진이 없어요'}</h2><p>{uploadState === 'scheduled' ? '예식 날의 웃음과 축하를 이곳에 담아 둘게요.' : '첫 사진을 올려 함께한 순간을 나눠 주세요.'}</p></div> : null}
        </div>
        {photos.length > 0 ? <><p className="photo-album__count">불러온 사진 {photos.length}장 · 업로드 시간순 · {content?.event.timezone === 'Asia/Seoul' ? '한국 시간' : content?.event.timezone}</p>
          {groups.map(group => <section className="photo-album__hour" key={group.key} aria-label={group.label}>
            <h2>{group.label} <span>{group.photos.length}장</span></h2>
            {group.details.map(detail => <div className="photo-album__detail" key={detail.key}>
              {detail.name || detail.note ? <div className="photo-album__caption">
                {detail.name ? <h3>{detail.name}</h3> : null}
                {detail.note ? <p>{detail.note}</p> : null}
              </div> : null}
              <div className="photo-album__grid">
                {detail.photos.map(photo => <AlbumTile key={photo.id} photo={photo} timezone={content?.event.timezone} onSelect={setSelected} />)}
              </div>
            </div>)}
          </section>)}
        </> : null}
        {cursor ? <button className="primary-button photo-album__more" disabled={loading} onClick={() => void loadMore()}>사진 더 보기</button> : null}
        <footer className="photo-album__footer"><p>소중한 순간을 함께해 주셔서 감사합니다.</p><a href={`/${slug}`}>두 사람의 청첩장으로 돌아가기</a></footer>
      </main>
      {content ? <GuestPhotoUploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} slug={slug}
        enabled={uploadState !== 'disabled'} opensAt={content.guestUploads.opensAt}
        onComplete={() => setAttempt(value => value + 1)} /> : null}
      <Dialog open={selected !== null} title="함께한 순간" onClose={() => setSelected(null)} className="photo-album__viewer">
        {selected ? <div onKeyDown={(event) => {
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault(); movePhoto(event.key === 'ArrowLeft' ? -1 : 1);
          }
        }}>
          <AlbumImage key={selected.id} photo={selected} expanded />
          {selected.uploaderName || selected.note ? <div className="photo-album__caption">{selected.uploaderName ? <h3>{selected.uploaderName}</h3> : null}{selected.note ? <p>{selected.note}</p> : null}</div> : null}
          <div className="photo-album__viewer-nav"><button type="button" disabled={selectedIndex <= 0} onClick={() => movePhoto(-1)}>← 이전 사진</button><span aria-live="polite">{selectedIndex + 1} / {photos.length}</span><button type="button" disabled={selectedIndex >= photos.length - 1} onClick={() => movePhoto(1)}>다음 사진 →</button></div>
          <a className="album-link" href={selected.url} target="_blank" rel="noreferrer">원본 사진 열기 ↗</a><p className="photo-album__note">원본은 새 탭에서 열립니다. 기기의 저장 기능으로 내려받을 수 있어요.</p>
        </div> : null}
      </Dialog>
    </div>
  );
}

const AlbumTile = memo(function AlbumTile({photo, timezone, onSelect}: {photo: GuestUploadPhoto; timezone?: string; onSelect: (photo: GuestUploadPhoto) => void}) {
  return <button type="button" className="photo-album__tile" onClick={() => onSelect(photo)} aria-label={`사진 크게 보기: ${photo.alt}`}>
    <AlbumImage photo={photo} /><span>{photo.createdAt ? new Intl.DateTimeFormat('ko-KR',{timeZone:timezone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(photo.createdAt)) : ''} <span aria-hidden="true">↗</span></span>
  </button>;
});

function AlbumImage({ photo, expanded = false }: { photo: GuestUploadPhoto; expanded?: boolean }) {
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const element = useRef<HTMLImageElement>(null);
  const src = expanded ? displayImageUrl(photo.url) : thumbnailImageUrl(photo.url);
  useEffect(() => {
    let cancelled = false;
    setReady(false); setFailed(false);
    const load = () => { void preloadImages([src]).then(loaded => {
      if (!cancelled) {setReady(loaded.length > 0); setFailed(loaded.length === 0);}
    }); };
    if (expanded || !('IntersectionObserver' in window)) load();
    const observer = !expanded && 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {observer?.disconnect(); load();}
    }, {rootMargin: '800px'}) : null;
    if (element.current) observer?.observe(element.current);
    return () => {cancelled = true; observer?.disconnect();};
  }, [src, expanded]);
  return failed ? <span className="photo-album__unavailable">미리보기를 표시할 수 없어요.<br />사진을 눌러 원본을 열어 주세요.</span> : <img ref={element} src={ready ? src : undefined} alt={photo.alt} aria-busy={!ready} decoding="async" onError={() => setFailed(true)} />;
}
