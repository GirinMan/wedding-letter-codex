import { useEffect, useRef, useState, type FormEvent } from 'react';
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
  const stopRequested = useRef(false);
  const [stopping,setStopping] = useState(false);
  const [metadataLocked,setMetadataLocked] = useState(false);
  useEffect(() => {
    if (!busy) return;
    const warn = (event: BeforeUnloadEvent) => {event.preventDefault();event.returnValue='';};
    window.addEventListener('beforeunload',warn);
    return () => window.removeEventListener('beforeunload',warn);
  },[busy]);
  const [message,setMessage] = useState('');
  const successful = entries.filter(entry=>entry.state==='success').length;
  const candidates = entries.flatMap((entry,index)=>entry.state!=='success' && !validateGuestPhoto(entry.file) ? [{file:entry.file,index}] : []);
  async function submit(event:FormEvent) {
    event.preventDefault();
    if (running.current) return;
    if (preview) {setMessage('초안 미리보기에서는 사진을 업로드하지 않습니다.'); return;}
    if (!enabled || Date.now()<Date.parse(opensAt)) {setMessage('아직 사진을 올릴 수 없어요. 업로드 시작 시각을 확인해 주세요.');return;}
    if (!candidates.length) return;
    running.current=true;stopRequested.current=false;setStopping(false);setBusy(true);setMetadataLocked(true);setMessage('');
    let sent=0;
    try {
      await sendPhotoBatch(candidates,name,note,form=>uploadGuestPhoto(slug,form),(index,state,error='')=>{
        if(state==='success') sent++;
        setEntries(current=>current.map((entry,i)=>i===index ? {...entry,state,message:error} : entry));
      },()=>!stopRequested.current);
      const completed = successful + sent;
      setMessage(completed===entries.length ? `${completed}장을 모두 올렸어요. 앨범에 바로 공개됩니다.` : `${completed}장 업로드 완료. 전송을 멈췄거나 실패한 사진이 있어요. 아래 결과를 확인하고 남은 사진을 이어서 올려 주세요.`);
      if(sent) onComplete?.(sent);
    } finally {running.current=false;setBusy(false);setStopping(false);}
  }
  return <Dialog open={open} title="사진 올리기" onClose={onClose} className="guest-photo-upload">
    <p className="form-help">사진을 여러 장 선택해 한 번에 올려 주세요. 업로드한 사진은 앨범에 바로 공개됩니다.</p>
    <form className="form-stack" onSubmit={event=>void submit(event)}>
      <label>사진 선택 (최대 {MAX_PHOTO_SELECTION}장)
        <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" disabled={busy} onChange={event=>{
          const files=Array.from(event.currentTarget.files ?? []);
          if(files.length>MAX_PHOTO_SELECTION){setMessage(`한 번에 ${MAX_PHOTO_SELECTION}장까지 선택해 주세요.`);event.currentTarget.value='';setEntries([]);setMetadataLocked(false);return;}
          setEntries(files.map(file=>{const error=validateGuestPhoto(file);return {file,state:error?'error':'pending',message:error};}));setMetadataLocked(false);setMessage('');
        }}/>
      </label>
      <p className="form-help">JPG, PNG, WebP, HEIC, HEIF · 사진 한 장당 최대 15MB · 많은 사진은 Wi-Fi에서 올리는 것을 권장해요.</p>
      {entries.length ? <div className="guest-photo-upload__results">
        <p>선택 {entries.length}장 · 완료 {successful}장 · 총 {(entries.reduce((sum,entry)=>sum+entry.file.size,0)/1024/1024).toFixed(1)}MB</p>
        {busy ? <><progress aria-label="사진 업로드 진행" max={entries.length} value={entries.filter(e=>e.state==='success'||e.state==='error').length}/><p className="form-help">사진을 한 장씩 전송하고 있어요. 이 모달은 닫아도 되지만 브라우저를 닫거나 화면을 잠그면 전송이 중단될 수 있어요.</p></> : null}
        <ul aria-label="사진별 업로드 결과">{entries.map((entry,index)=><li key={`${index}-${entry.file.name}`} data-state={entry.state}><span>{entry.file.name}</span><small>{entry.state==='success'?'완료':entry.state==='uploading'?'전송 중…':entry.state==='error'?entry.message:'대기'}</small></li>)}</ul>
      </div> : null}
      <label>이름 (선택)<input maxLength={80} value={name} disabled={busy || metadataLocked} onChange={event=>setName(event.target.value)}/></label>
      <label>이번 업로드 메모 (선택)<textarea maxLength={300} rows={2} value={note} disabled={busy || metadataLocked} onChange={event=>setNote(event.target.value)}/></label>
      <p className="form-help">메모는 이번에 선택한 사진 묶음에 한 번만 적으면 돼요. 재시도할 때도 같은 이름과 메모가 유지됩니다.</p>
      <p role="status" aria-live="polite" className="form-help">{message || (busy ? `${successful} / ${entries.length}장 업로드 완료` : '')}</p>
      {busy ? <button className="secondary-button" type="button" disabled={stopping} onClick={()=>{stopRequested.current=true;setStopping(true);}}>{stopping?'현재 사진 전송 후 멈춥니다…':'남은 사진 전송 멈추기'}</button> : null}
      {entries.length > 0 && successful === entries.length && !busy
        ? <button className="primary-button" type="button" onClick={onClose}>완료</button>
        : <button className="primary-button" type="submit" disabled={busy || !candidates.length || !enabled}>{busy?'업로드 중…':!candidates.length?'사진을 선택해 주세요':metadataLocked?`남은 ${candidates.length}장 이어서 업로드`:`${candidates.length}장 업로드`}</button>}
    </form>
  </Dialog>;
}
