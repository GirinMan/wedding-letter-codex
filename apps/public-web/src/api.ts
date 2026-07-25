import type { GuestbookEntry, InvitationResponse } from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export function loadInvitation(slug: string): Promise<InvitationResponse> {
  return request(`/api/public/invitations/${slug}`);
}

export async function loadGuestbook(slug: string): Promise<GuestbookEntry[]> {
  const response = await request<{ entries: GuestbookEntry[] }>(
    `/api/public/invitations/${slug}/guestbook?limit=20`,
  );
  return response.entries;
}

export function createGuestbookEntry(
  slug: string,
  body: { name: string; message: string; password: string },
): Promise<GuestbookEntry> {
  return request(`/api/public/invitations/${slug}/guestbook`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function submitRsvp(slug: string, body: Record<string, unknown>): Promise<void> {
  return request(`/api/public/invitations/${slug}/rsvps`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function uploadGuestPhoto(slug: string, form: FormData): Promise<void> {
  const response = await fetch(`/api/public/invitations/${slug}/guest-uploads`, {
    method: "POST",
    body: form,
  });
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }
}
