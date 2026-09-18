import { useRef, useState, type FormEvent } from 'react';
import { Dialog } from './Dialog';
import { uploadGuestPhoto } from '../api';
import { MAX_PHOTO_SELECTION, sendPhotoBatch, validateGuestPhoto, type PhotoUploadState } from '../guest-photo-upload';

type Entry = {file:File; state:PhotoUploadState; message:string};
export function GuestPhotoUploadDialog({open,onClose,slug,enabled,opensAt,preview=false,onComplete}: {
  open:boolean; onClose:()=>void; slug:string; enabled:boolean; opensAt:string; preview?:boolean; onComplete?:(count:number)=>void;
}) {
  const [entries,setEntries] = useState<Entry[]>([]);
  const [name,setName] = useState('');
  const [note,setNote] = useState('');
  const [busy,setBusy] = useState(false);
  const running = useRef(false);
  const [message,setMessage] = useState('');
  const successful = entries.filter(entry=>entry.state==='success').length;
  const candidates = entries.flatMap((entry,index)=>entry.state!=='success' && !validateGuestPhoto(entry.file) ? [{file:entry.file,index}] : []);
  async function submit(event:FormEvent) {
    event.preventDefault();
    if (running.current) return;
    if (preview) {setMessage('초안 미리보기에서는 사진을 업로드하지 않습니다.'); return;}
    if (!enabled || Date.now()<Date.parse(opensAt)) {setMessage('아직 사진을 올릴 수 없어요. 업로드 시작 시각을 확인해 주세요.');return;}
    if (!candidates.length) return;
    running.current=true;setBusy(true);setMessage('');
    let sent=0;
    try {
      await sendPhotoBatch(candidates,name,note,form=>uploadGuestPhoto(slug,form),(index,state,error='')=>{
        if(state==='success') sent++;
        setEntries(current=>current.map((entry,i)=>i===index ? {...entry,state,message:error} : entry));
      });
      setMessage(sent===candidates.length ? `${sent}장을 올렸어요. 확인 후 앨범에 공개됩니다.` : `${sent}장 업로드 완료. 실패한 사진은 아래에서 확인하고 다시 시도해 주세요.`);
      if(sent) onComplete?.(sent);
    } finally {running.current=false;setBusy(false);}
  }
  return <Dialog open={open} title="사진 올리기" onClose={onClose} className="guest-photo-upload">
    <p className="form-help">사진을 여러 장 선택해 한 번에 올려 주세요. 확인 후 공개 앨범에 표시됩니다.</p>
    <form className="form-stack" onSubmit={event=>void submit(event)}>
      <label>사진 선택 (최대 {MAX_PHOTO_SELECTION}장)
        <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" disabled={busy} onChange={event=>{
          const files=Array.from(event.currentTarget.files ?? []);
          if(files.length>MAX_PHOTO_SELECTION){setMessage(`한 번에 ${MAX_PHOTO_SELECTION}장까지 선택해 주세요.`);event.currentTarget.value='';setEntries([]);return;}
          setEntries(files.map(file=>{const error=validateGuestPhoto(file);return {file,state:error?'error':'pending',message:error};}));setMessage('');
        }}/>
      </label>
      <p className="form-help">JPG, PNG, WebP, HEIC, HEIF · 사진 한 장당 최대 15MB</p>
      {entries.length ? <div className="guest-photo-upload__results">
        <p>선택 {entries.length}장 · 완료 {successful}장</p>
        {busy ? <><progress aria-label="사진 업로드 진행" max={entries.length} value={entries.filter(e=>e.state==='success'||e.state==='error').length}/><p className="form-help">사진을 한 장씩 전송하고 있어요. 창을 닫아도 업로드는 계속됩니다.</p></> : null}
        <ul aria-label="사진별 업로드 결과">{entries.map((entry,index)=><li key={`${index}-${entry.file.name}`} data-state={entry.state}><span>{entry.file.name}</span><small>{entry.state==='success'?'완료':entry.state==='uploading'?'전송 중…':entry.state==='error'?entry.message:'대기'}</small></li>)}</ul>
      </div> : null}
      <label>이름 (선택)<input maxLength={80} value={name} disabled={busy} onChange={event=>setName(event.target.value)}/></label>
      <label>메모 (선택)<textarea maxLength={300} rows={2} value={note} disabled={busy} onChange={event=>setNote(event.target.value)}/></label>
      <p className="form-help">이름과 메모는 선택한 사진 모두에 함께 저장됩니다.</p>
      <p role="status" aria-live="polite" className="form-help">{message || (busy ? `${successful} / ${entries.length}장 업로드 완료` : '')}</p>
      {entries.length > 0 && successful === entries.length && !busy
        ? <button className="primary-button" type="button" onClick={onClose}>완료</button>
        : <button className="primary-button" type="submit" disabled={busy || !candidates.length || !enabled}>{busy?'업로드 중…':!candidates.length?'사진을 선택해 주세요':entries.some(e=>e.state==='error')?`남은 ${candidates.length}장 다시 시도`:`${candidates.length}장 업로드`}</button>}
    </form>
  </Dialog>;
}
