export type PhotoUploadState = 'pending' | 'uploading' | 'success' | 'error';
export const MAX_PHOTO_SELECTION = 20;
const types: Record<string,string> = {jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',heic:'image/heic',heif:'image/heif'};
export function guestPhotoType(file: File) {
  return file.type || types[file.name.split('.').at(-1)?.toLowerCase() ?? ''] || '';
}
export function validateGuestPhoto(file: File) {
  if (!Object.values(types).includes(guestPhotoType(file))) return '지원하지 않는 형식이에요.';
  if (file.size === 0) return '파일이 비어 있어요.';
  if (file.size > 15 * 1024 * 1024) return '사진 한 장은 15MB 이하여야 해요.';
  return '';
}
/** One request per file: preserve existing storage, size and moderation contracts. */
export async function sendPhotoBatch(
  entries: Array<{file: File; index: number}>, name: string, note: string,
  send: (form: FormData) => Promise<void>,
  update: (index: number, state: PhotoUploadState, message?: string) => void,
) {
  for (const {file,index} of entries) {
    const validation = validateGuestPhoto(file);
    if (validation) { update(index,'error',validation); continue; }
    update(index,'uploading');
    const form = new FormData();
    form.append('uploaderName',name); form.append('note',note);
    form.append('file',file.type ? file : new File([file],file.name,{type:guestPhotoType(file)}));
    try { await send(form); update(index,'success'); }
    catch (error) {update(index,'error',error instanceof Error ? error.message : '전송하지 못했어요. 다시 시도해 주세요.');}
  }
}
