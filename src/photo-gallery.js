import {photoRefsForPart,photoCoverageForPart} from './photo-library.js';

const DB_NAME='transfer-station-user-photo-cache';
const STORE='original-images';
let dbPromise=null;
const urlCache=new Map();
function db(){
 if(!('indexedDB' in window))return Promise.resolve(null);
 if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{
  const req=indexedDB.open(DB_NAME,1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))
    req.result.createObjectStore(STORE)};
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error);
 });
 return dbPromise;
}
export async function cachedPhotoUrl(photoId){
 if(urlCache.has(photoId))return urlCache.get(photoId);
 try{
  const database=await db();if(!database)return null;
  const blob=await new Promise((resolve,reject)=>{
   const req=database.transaction(STORE,'readonly').objectStore(STORE).get(photoId);
   req.onsuccess=()=>resolve(req.result??null);
   req.onerror=()=>reject(req.error);
  });
  if(!blob)return null;
  const url=URL.createObjectURL(blob);urlCache.set(photoId,url);return url;
 }catch{return null}
}
async function saveLocalPhoto(id,file){
 if(!file?.type.startsWith('image/'))throw new Error('只能导入图像');
 if(file.size>25*1024*1024)throw new Error('单张照片上限 25 MB');
 const database=await db();if(!database)throw new Error('浏览器不支持本地照片缓存');
 await new Promise((resolve,reject)=>{
  const tx=database.transaction(STORE,'readwrite');
  tx.objectStore(STORE).put(file,id);
  tx.oncomplete=()=>resolve();
  tx.onerror=()=>reject(tx.error);
 });
 const old=urlCache.get(id);if(old)URL.revokeObjectURL(old);
 urlCache.set(id,URL.createObjectURL(file));
 return urlCache.get(id);
}
function el(name,className,text){
 const node=document.createElement(name);
 if(className)node.className=className;
 if(text!==undefined)node.textContent=text;
 return node;
}
function showLargePhoto(src,title,note){
 let dialog=document.getElementById('source-photo-lightbox');
 if(!dialog){
  dialog=el('dialog','source-photo-lightbox');
  dialog.id='source-photo-lightbox';
  const close=el('button','photo-lightbox-close','关闭');
  close.type='button';close.onclick=()=>dialog.close();
  dialog.append(close);
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
  document.body.append(dialog);
 }
 dialog.querySelectorAll('img,figcaption').forEach(n=>n.remove());
 const img=el('img');img.src=src;img.alt=title;img.loading='eager';
 const caption=el('figcaption','photo-lightbox-caption',title+' · '+note);
 dialog.append(img,caption);
 dialog.showModal();
}
function attachPhotoToTile({tile,ref,compact=false}){
 const image=el('img','evidence-photo-image');
 image.alt=ref.title;image.loading='lazy';
 const source=ref.src||null;
 const fill=(src)=>{
  if(!src)return false;
  image.src=src;
  tile.classList.add('has-photo');
  tile.classList.remove('photo-unavailable');
  if(!image.isConnected)tile.prepend(image);
  tile.title=ref.title+' · 点击放大真实照片';
  tile.onclick=()=>showLargePhoto(src,ref.title,ref.description||'实物照片');
  return true;
 };
 if(!fill(source)){
  tile.classList.add('photo-unavailable');
  const marker=el('span','photo-not-bundled',compact?'未入库':'原图未入库');
  tile.append(marker);
  cachedPhotoUrl(ref.id).then(url=>{
   if(!url||!tile.isConnected)return;
   marker.remove();fill(url);
  });
 }
 return {fill};
}
// Photo evidence is never substituted with a factory stock picture or an
// unrelated photograph. Missing evidence stays visibly unbundled.
export function mountPhotoEvidence(container,platform,partId){
 const refs=photoRefsForPart(platform,partId);
 const section=el('section','field photo-evidence-field');
 section.id='photo-evidence-gallery';
 section.dataset.partId=partId;
 const head=el('b','', '实物照片证据');
 section.append(head);
 if(!refs.length){
  section.append(el('p','photo-no-evidence','未关联可追溯的实物照片编号。'));
  container.append(section);return section;
 }
 const coverage=photoCoverageForPart(platform,partId);
 section.append(el('p','small',
  refs.length+' 个关联编号 · 仓库内置 '+coverage.embeddedCount+
  ' 张；其余原图尚未取得可发布的文件，不会以代用图冒充。'));
 const grid=el('div','evidence-photo-grid');
 for(const ref of refs){
  const card=el('figure','evidence-photo-card');
  card.dataset.photoId=ref.id;card.dataset.photoSource=ref.src?'repository':'pending';
  const tile=el('button','evidence-photo-tile');tile.type='button';
  tile.setAttribute('aria-label','查看照片 '+ref.id+'：'+ref.title);
  const attached=attachPhotoToTile({tile,ref});
  const caption=el('figcaption','photo-caption');
  caption.append(el('strong','', '照片 '+ref.id),el('span','',ref.title));
  const foot=el('p','photo-caption-desc',ref.description||'按原始照片编号核查零件位置和装配关系。');
  card.append(tile,caption,foot);
  if(!ref.src){
   const upload=el('button','photo-local-import','在本机补充此编号原图');
   upload.type='button';
   const file=el('input');file.type='file';file.accept='image/*';file.hidden=true;
   upload.onclick=()=>file.click();
   file.onchange=async()=>{
    try{
     const url=await saveLocalPhoto(ref.id,file.files?.[0]);
     if(url){
      tile.replaceChildren();attached.fill(url);
      card.dataset.photoSource='local';
      upload.textContent='已存于本机浏览器，可点击放大';
      upload.disabled=true;
     }
    }catch(e){upload.textContent='导入失败：'+String(e.message||e)}
   };
   card.append(upload,file);
  }
  grid.append(card);
 }
 section.append(grid);
 section.append(el('p','small','照片与模型部件按编号关联；本机补充的原图仅保存于当前浏览器，不会自动上传到 GitHub。'));
 container.append(section);
 return section;
}
export function mountPhotoBOMCell(td,platform,partId){
 const refs=photoRefsForPart(platform,partId);
 td.classList.add('bom-photo-cell');
 if(!refs.length){td.append(el('span','photo-no-evidence','无照片编号'));return}
 const first=refs.find(r=>r.src)||refs[0];
 const tile=el('button','bom-photo-tile');tile.type='button';
 tile.dataset.photoId=first.id;
 tile.setAttribute('aria-label','照片 '+first.id);
 const attached=attachPhotoToTile({tile,ref:first,compact:true});
 const count=el('span','bom-photo-ids',refs.map(p=>p.id).join(' / '));
 td.append(tile,count);
 tile.addEventListener('click',event=>event.stopPropagation());
 td.dataset.photoEmbeddedCount=String(refs.filter(r=>r.src).length);
 return {first,attached};
}
export function photoEvidenceProbe(platform,partId){
 const refs=photoRefsForPart(platform,partId);
 return {platform,partId,ids:refs.map(p=>p.id),
   embedded:refs.filter(p=>p.src).map(p=>p.id),
   unresolved:refs.filter(p=>!p.src).map(p=>p.id),
   imageSources:refs.filter(p=>p.src).map(p=>p.src)};
}
