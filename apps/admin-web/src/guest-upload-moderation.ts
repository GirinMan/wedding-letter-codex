export interface DeletableGuestUpload {
  id: string;
  deletedAt: string | null;
}

export function partitionGuestUploads<T extends DeletableGuestUpload>(uploads: T[]): {
  active: T[];
  deleted: T[];
} {
  return uploads.reduce<{ active: T[]; deleted: T[] }>((groups, upload) => {
    groups[upload.deletedAt ? "deleted" : "active"].push(upload);
    return groups;
  }, { active: [], deleted: [] });
}

export function toggleGuestUploadSelection(selected: Set<string>, uploadId: string): Set<string> {
  const next = new Set(selected);
  if (next.has(uploadId)) next.delete(uploadId);
  else next.add(uploadId);
  return next;
}
