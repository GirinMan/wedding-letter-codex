/** Reserved album route; preview must keep the invitation renderer. */
export function resolvePhotoSlug(pathname: string, defaultSlug: string): string | null {
  const path = pathname.replace(/\/$/, '');
  if (path === '/photos') return defaultSlug;
  const match = /^\/([a-z0-9-]+)\/photos$/.exec(path);
  return match && match[1] !== 'preview' ? match[1] : null;
}

export function albumUploadState(content: {
  guestUploads: { enabled: boolean; opensAt: string };
  sections: { id: string; enabled: boolean }[];
}, now: number): 'disabled' | 'scheduled' | 'open' {
  if (!content.guestUploads.enabled || !content.sections.some((section) => section.id === 'guestUploads' && section.enabled)) return 'disabled';
  return now >= Date.parse(content.guestUploads.opensAt) ? 'open' : 'scheduled';
}

export function groupPhotosByHour(photos: readonly import('./guest-upload-gallery').GuestUploadPhoto[], timezone: string) {
  const formatter = new Intl.DateTimeFormat('sv-SE', {timeZone: timezone, year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'});
  const groups = new Map<string, {key:string; label:string; photos: import('./guest-upload-gallery').GuestUploadPhoto[]}>();
  for (const photo of photos) {
    const date = photo.createdAt ? new Date(photo.createdAt) : null;
    const parts = date && Number.isFinite(date.getTime()) ? formatter.formatToParts(date) : [];
    const part = (type: string) => parts.find(p=>p.type===type)?.value ?? '';
    const key = parts.length ? `${part('year')}-${part('month')}-${part('day')}T${part('hour')}` : 'unknown';
    const label = parts.length ? `${part('month')}월 ${part('day')}일 · ${part('hour')}:00–${part('hour')}:59` : '업로드 시각 미확인';
    if (!groups.has(key)) groups.set(key,{key,label,photos:[]});
    groups.get(key)!.photos.push(photo);
  }
  return [...groups.values()];
}

/** Consecutive matching captions form a group without changing chronological order. */
export function groupPhotosByDetails(photos: readonly import('./guest-upload-gallery').GuestUploadPhoto[]) {
  const groups: Array<{key: string; name: string; note: string; photos: import('./guest-upload-gallery').GuestUploadPhoto[]}> = [];
  for (const photo of photos) {
    const name = photo.uploaderName?.trim() ?? '';
    const note = photo.note?.trim() ?? '';
    const previous = groups.at(-1);
    if (previous && previous.name === name && previous.note === note) previous.photos.push(photo);
    else groups.push({key: photo.id, name, note, photos: [photo]});
  }
  return groups;
}
