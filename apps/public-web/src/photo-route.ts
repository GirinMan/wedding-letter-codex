/** Reserved album route; preview must keep the invitation renderer. */
export function resolvePhotoSlug(pathname: string, defaultSlug: string): string | null {
  const path = pathname.replace(/\/$/, '');
  if (path === '/photos') return defaultSlug;
  const match = /^\/([a-z0-9-]+)\/photos$/.exec(path);
  return match && match[1] !== 'preview' ? match[1] : null;
}
