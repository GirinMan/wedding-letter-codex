export type UploadableMedia = Pick<File, "name" | "type">;

export type MediaUploadPlan = {
  name: string;
  purpose: "gallery" | "music";
};

const supportedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export function planMediaUploads(files: readonly UploadableMedia[]): MediaUploadPlan[] {
  const uploads: MediaUploadPlan[] = [];
  for (const file of files) {
    if (supportedImageTypes.has(file.type)) uploads.push({ name: file.name, purpose: "gallery" });
    if (file.type === "audio/mpeg") uploads.push({ name: file.name, purpose: "music" });
  }
  return uploads;
}

export function createMediaUploadForms(files: readonly File[]): FormData[] {
  return files.flatMap((file) => {
    const plan = planMediaUploads([file])[0];
    if (!plan) return [];
    const form = new FormData();
    form.append("file", file);
    form.append("purpose", plan.purpose);
    return [form];
  });
}
