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
 if(!refs.length)return null;
 const section=el('section','field photo-evidence-field');
 section.id='photo-evidence-gallery';
 section.dataset.partId=partId;
 section.append(el('b','','实物照片'));
 const grid=el('div','evidence-photo-grid');
 for(const ref of refs){
  if(!ref.src)continue;
  const card=el('figure','evidence-photo-card');
  card.dataset.photoId=ref.id;card.dataset.photoSource='repository';
  const tile=el('button','evidence-photo-tile');tile.type='button';
  tile.setAttribute('aria-label','查看照片 '+ref.id);
  attachPhotoToTile({tile,ref});
  const caption=el('figcaption','photo-caption');
  caption.append(el('strong','','照片 '+ref.id));
  card.append(tile,caption);
  if(platform==='A'&&/^(191|192|193|194|195|196)$/.test(ref.id)){
   const link=el('a','photo-comparison-link','对照模型');
   link.href='./photo-review.html#photo'+ref.id;card.append(link);
  }
  grid.append(card);
 }
 if(!grid.children.length)return null;
 section.append(grid);container.append(section);return section;
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
 if(platform==='A'&&/^(191|192|193|194|195|196)$/.test(first.id)){
  const link=el('a','photo-comparison-link','实拍↔模型');
  link.href='./photo-review.html#photo'+first.id;
  link.addEventListener('click',event=>event.stopPropagation());
  td.append(link);
 }
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
