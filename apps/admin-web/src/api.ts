import type {
  AdminUser,
  GuestbookEntry,
  GuestUpload,
  InvitationContent,
  InvitationDesign,
  InvitationDetail,
  InvitationSummary,
  MediaAsset,
  Rsvp,
} from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const isForm = init?.body instanceof FormData;
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers: isForm
      ? init?.headers
      : { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const error = new Error(`Request failed: ${response.status}`);
    Object.assign(error, { status: response.status });
    throw error;
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  session: () => request<{ user: AdminUser }>("/api/admin/session"),
  login: (email: string, password: string) => request<{ user: AdminUser }>("/api/admin/session", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  }),
  logout: () => request<void>("/api/admin/session", { method: "DELETE" }),
  invitations: () => request<{ invitations: InvitationSummary[] }>("/api/admin/invitations"),
  invitation: (id: string) => request<InvitationDetail>(`/api/admin/invitations/${id}`),
  saveContent: (id: string, content: InvitationContent) => request(`/api/admin/invitations/${id}/content`, {
    method: "PUT",
    body: JSON.stringify(content),
  }),
  saveDesign: (id: string, design: InvitationDesign) => request(`/api/admin/invitations/${id}/design`, {
    method: "PUT",
    body: JSON.stringify(design),
  }),
  publish: (id: string) => request(`/api/admin/invitations/${id}/publish`, { method: "POST" }),
  media: (id: string) => request<{ assets: MediaAsset[] }>(`/api/admin/invitations/${id}/media`),
  uploadMedia: (id: string, form: FormData) => request<MediaAsset>(`/api/admin/invitations/${id}/media`, {
    method: "POST",
    body: form,
  }),
  removeMedia: (id: string, assetId: string) => request<void>(`/api/admin/invitations/${id}/media/${assetId}`, {
    method: "DELETE",
  }),
  rsvps: (id: string) => request<{ rsvps: Rsvp[] }>(`/api/admin/invitations/${id}/rsvps`),
  guestbook: (id: string) => request<{ entries: GuestbookEntry[] }>(`/api/admin/invitations/${id}/guestbook`),
  moderateGuestbook: (id: string, entryId: string, state: GuestbookEntry["state"]) => request(
    `/api/admin/invitations/${id}/guestbook/${entryId}`,
    { method: "PATCH", body: JSON.stringify({ state }) },
  ),
  guestUploads: (id: string) => request<{ uploads: GuestUpload[] }>(`/api/admin/invitations/${id}/guest-uploads`),
  reviewGuestUpload: (id: string, uploadId: string, state: GuestUpload["state"]) => request(
    `/api/admin/invitations/${id}/guest-uploads/${uploadId}`,
    { method: "PATCH", body: JSON.stringify({ state }) },
  ),
};
