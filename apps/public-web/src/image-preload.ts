import type { MediaReference } from './types';

export function displayImageUrl(url: string) {
  return `${url}${url.includes('?') ? '&' : '?'}size=display`;
}

export function mediaImageUrl(media: MediaReference, preview = false): string | null {
  if (!media.assetId) return null;
  return preview ? `/api/admin/media/${media.assetId}/content`
    : displayImageUrl(`/api/media/${media.assetId}/content`);
}

/** Start immediately, but don't let background images monopolize the connection. */
export function createImagePreloader(load: (url: string) => Promise<void>, concurrency = 3) {
  const pending = new Map<string, Promise<boolean>>();
  const complete = new Set<string>();
  const queue: Array<() => void> = [];
  let active = 0;
  const drain = () => {
    while (active < concurrency && queue.length) { active++; queue.shift()!(); }
  };
  return (urls: readonly string[]): Promise<string[]> => Promise.all([...new Set(urls)].map(url => {
    if (complete.has(url)) return Promise.resolve(url);
    let task = pending.get(url);
    if (!task) {
      task = new Promise<boolean>(resolve => {
        queue.push(() => {
          void load(url).then(() => {
            complete.add(url);
            if (complete.size > 300) complete.delete(complete.values().next().value!);
            resolve(true);
          }, () => resolve(false)).finally(() => {
            pending.delete(url); active--; drain();
          });
        });
      });
      pending.set(url, task);
      drain();
    }
    return task.then(ok => ok ? url : null);
  })).then(urls => urls.filter((url): url is string => url !== null));
}

export const preloadImages = createImagePreloader(async url => {
  const image = new Image();
  image.decoding = 'async';
  image.fetchPriority = 'low';
  image.src = url;
  await image.decode();
});
