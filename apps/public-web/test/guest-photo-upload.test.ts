import assert from 'node:assert/strict';
import test from 'node:test';
import * as upload from '../src/guest-photo-upload.ts';

test('multiple uploads preserve metadata, process separately, and retain per-file failures', async () => {
  assert.equal(typeof upload.sendPhotoBatch, 'function');
  const files = [new File(['a'],'a.jpg',{type:'image/jpeg'}),new File(['b'],'b.png',{type:'image/png'}),new File(['c'],'c.webp',{type:'image/webp'})];
  const calls:string[]=[];const updates:string[]=[];
  await upload.sendPhotoBatch(files.map((file,index)=>({file,index})), '하객', '축하해요', async form => {
    assert.equal(form.get('uploaderName'),'하객'); assert.equal(form.get('note'),'축하해요');
    const file=form.get('file') as File;calls.push(file.name);if(file.name==='b.png') throw new Error('잠시 후 다시 시도');
  },(index,state)=>updates.push(`${index}:${state}`));
  assert.deepEqual(calls,['a.jpg','b.png','c.webp']);
  assert.deepEqual(updates,['0:uploading','0:success','1:uploading','1:error','2:uploading','2:success']);
});
test('selection validates per-file size/type and supports HEIC with missing MIME',()=>{
  assert.equal(typeof upload.validateGuestPhoto,'function');
  assert.equal(upload.validateGuestPhoto(new File(['x'],'phone.HEIC')),'');
  assert.match(upload.validateGuestPhoto(new File(['x'],'bad.svg',{type:'image/svg+xml'})),/형식/);
  assert.match(upload.validateGuestPhoto(new File([],'empty.jpg',{type:'image/jpeg'})),/비어/);
  assert.match(upload.validateGuestPhoto(new File([new Uint8Array(15*1024*1024+1)],'large.jpg',{type:'image/jpeg'})),/15MB/);
});

test('retrying only failed entries does not resend already successful photos',async()=>{
  const files=[new File(['a'],'a.jpg',{type:'image/jpeg'}),new File(['b'],'b.jpg',{type:'image/jpeg'})];
  const states=new Map<number,string>(); const calls:string[]=[];
  let fail=true;
  const send=async(form:FormData)=>{const name=(form.get('file') as File).name;calls.push(name);if(name==='b.jpg'&&fail)throw new Error('network');};
  const update=(index:number,state:string)=>{states.set(index,state);};
  await upload.sendPhotoBatch(files.map((file,index)=>({file,index})), '', '',send,update);
  fail=false;
  await upload.sendPhotoBatch(files.flatMap((file,index)=>states.get(index)==='error'?[{file,index}]:[]),'','',send,update);
  assert.deepEqual(calls,['a.jpg','b.jpg','b.jpg']);
  assert.deepEqual([...states.values()],['success','success']);
});
