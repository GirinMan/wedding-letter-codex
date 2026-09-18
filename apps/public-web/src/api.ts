import type { GuestbookEntry, InvitationResponse } from "./types";
import type { GuestUploadPhoto } from "./guest-upload-gallery";

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

export function loadInvitationPreview(invitationId: string): Promise<InvitationResponse> {
  return request(`/api/admin/invitations/${invitationId}/preview`, {
    credentials: "include",
  });
}

export async function loadGuestbook(slug: string): Promise<GuestbookEntry[]> {
  const response = await request<{ entries: GuestbookEntry[] }>(
    `/api/public/invitations/${slug}/guestbook?limit=20`,
  );
  return response.entries;
}

export async function loadGuestUploadPhotos(slug: string): Promise<GuestUploadPhoto[]> {
  const response = await request<{ photos: GuestUploadPhoto[] }>(
    `/api/public/invitations/${slug}/guest-uploads`,
  );
  return response.photos;
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

export function deleteGuestbookEntry(
  slug: string,
  entryId: string,
  password: string,
): Promise<void> {
  return request(`/api/public/invitations/${slug}/guestbook/${entryId}`, {
    method: "DELETE",
    body: JSON.stringify({ password }),
  });
}

export function submitRsvp(
  slug: string,
  body: Record<string, unknown>,
): Promise<{ id: string; createdAt: string; guestbookEntry: GuestbookEntry | null }> {
  return request(`/api/public/invitations/${slug}/rsvps`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function uploadGuestPhoto(slug: string, form: FormData): Promise<void> {
  const response = await fetch(`/api/public/invitations/${slug}/guest-uploads`, {
    method: "POST",
    body: form,
  }).catch(() => { throw new Error("연결이 끊겼어요. 네트워크를 확인하고 다시 시도해 주세요."); });
  if (!response.ok) {
    const retrySeconds = Number(response.headers.get("retry-after"));
    throw new Error(response.status === 413 ? "사진 한 장은 15MB 이하여야 해요."
      : response.status === 415 ? "지원하지 않는 사진 형식이에요."
      : response.status === 429 ? (Number.isFinite(retrySeconds) && retrySeconds > 0
        ? `업로드 요청이 많아요. 약 ${Math.ceil(retrySeconds / 60)}분 뒤 다시 시도해 주세요.`
        : "업로드 요청이 많아요. 잠시 후 다시 시도해 주세요.")
      : response.status === 403 ? "지금은 사진을 올릴 수 없어요. 업로드 시작 시각을 확인해 주세요."
      : "사진을 전송하지 못했어요. 다시 시도해 주세요.");
  }
}

export function loadGuestUploadPage(slug: string, cursor?: string): Promise<{
  photos: GuestUploadPhoto[];
  nextCursor: string | null;
}> {
  const query = new URLSearchParams(cursor ? { cursor } : {});
  return request(`/api/public/invitations/${slug}/guest-uploads?${query}`);
}
