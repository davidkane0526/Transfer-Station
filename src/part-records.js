import {displayPrice,formatRmb,priceEvidence} from './quote-display.js';
import {identifyPart,identificationLabels} from './part-identification.js';
import {adminToken,cloudApiRoot,rejectAdminToken} from './admin-session.js';
import {photoRefsForPart} from './photo-library.js';
const fields=[
  ['name','名称'],['maker','厂家'],['model','型号'],['dims','尺寸'],
  ['qty','数量'],['unit','单位'],['material','材料'],['connection','装配接口'],
  ['price','参考单价（人民币）'],['currency','原币币种'],['note','备注'],
  ['drawing','图纸链接'],['datasheet','规格链接'],['priceSource','价格来源'],
];
const labels=Object.fromEntries([...fields,['manualConfirmed','人工确认']]);
const dateFormat=new Intl.DateTimeFormat('zh-CN',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Singapore'});
const localHost=['localhost','127.0.0.1'].includes(window.location.hostname);
const api=localHost?'./api/parts':cloudApiRoot+'/api/parts';
const localStorageKey='transfer-station-part-records-v1';
const localBackupKey='transfer-station-part-records-backup-v1';
function original(part,field){
  if(field==='price')return String(part.quote?.value??'');
  if(field==='currency')return part.quote?.currency??'CNY';
  if(field==='priceSource')return part.quote?.source??'';
  if(field==='manualConfirmed')return String(Boolean(part.manualConfirmed));
  return String(part[field]??'');
}
function localSnapshot(){
  try{const data=JSON.parse(window.localStorage.getItem(localStorageKey)||'{}');return data&&typeof data==='object'&&!Array.isArray(data)?data:{};}
  catch{return {};}
}
function localPartIds(snapshot){
  return [...new Set([...Object.keys(snapshot.parts||{}),...Object.keys(snapshot.confirmations||{}),...Object.keys(snapshot.history||{})])];
}
export function createPartRecords(){
  const snapshot=localSnapshot();
  const heads=new Map(Object.entries(snapshot.parts||{}));
  const confirmations=new Map(Object.entries(snapshot.confirmations||{}));
  const localRevisions=new Map(Object.entries(snapshot.history||{}));
  const state={ready:false,offline:false,apiConnected:false,cloudAvailable:false,pendingLocal:false,localPendingCount:0,remoteCount:0,usingCloud:!localHost};
  function persist(id){
    const pending=localSnapshot();
    pending.parts={...pending.parts,[id]:heads.get(id)};
    pending.history={...pending.history,[id]:localRevisions.get(id)};
    if(confirmations.has(id))pending.confirmations={...pending.confirmations,[id]:confirmations.get(id)};
    try{window.localStorage.setItem(localStorageKey,JSON.stringify(pending));}
    catch{throw new Error('浏览器无法保存本机修改，请检查网站数据或存储权限。');}
  }
  function markPending(){const data=localSnapshot();state.localPendingCount=localPartIds(data).length;state.pendingLocal=state.localPendingCount>0;}
  const canEdit=()=>!state.usingCloud||Boolean(adminToken());
  function requireEditor(){if(!canEdit())throw new Error('请先登录管理员账号。');}
  async function send(url,options={}){
    const headers=new Headers(options.headers||{});
    const token=state.usingCloud&&options.method==='POST'?adminToken():null;
    if(token)headers.set('Authorization','Bearer '+token);
    const response=await fetch(url,{cache:'no-store',...options,headers});
    const data=await response.json().catch(()=>null);
    if(!response.ok||!data){
      if(response.status===401)rejectAdminToken(token);
      const error=new Error(data?.error||'数据库暂不可用。');
      Object.assign(error,{status:response.status,part:data?.part,conflicts:data?.conflicts});
      throw error;
    }
    return data;
  }
  const refresh=async()=>{
    const local=localSnapshot(),pendingIds=localPartIds(local);
    state.localPendingCount=pendingIds.length;state.pendingLocal=pendingIds.length>0;
    try{
      const {parts}=await send(api);
      if(!parts||typeof parts!=='object')throw new Error('数据库返回的数据格式无效。');
      state.apiConnected=true;state.cloudAvailable=state.usingCloud;state.remoteCount=Object.keys(parts).length;
      if(!state.pendingLocal){
        heads.clear();confirmations.clear();localRevisions.clear();
        for(const [id,head] of Object.entries(parts)){
          heads.set(id,head);
          if(Object.hasOwn(head.values||{},'manualConfirmed'))confirmations.set(id,{checked:head.values.manualConfirmed==='true',changed_at:head.changed_at||''});
        }
        state.offline=false;
      }else state.offline=true;
    }catch{state.apiConnected=false;state.cloudAvailable=false;state.offline=true;}
    state.ready=true;
  };
  const revision=id=>heads.get(id)?.revision??0;
  const value=(part,field)=>heads.get(part.id)?.values?.[field]??original(part,field);
  const apply=part=>{
    const edited=heads.get(part.id)?.values;if(!edited)return part;
    const {price,currency,priceSource,...ordinary}=edited;
    const result={...part,...ordinary};
    if(Object.hasOwn(ordinary,'drawing'))delete result.drawingLabel;
    if(Object.hasOwn(ordinary,'datasheet'))delete result.datasheetLabel;
    if(typeof result.qty==='string')result.qty=result.qty===''?'':Number(result.qty);
    const changed=field=>value(part,field)!==original(part,field);
    const makerEdited=changed('maker'),modelEdited=changed('model'),modelChanged=makerEdited||modelEdited;
    const amountChanged=changed('price')||changed('currency');
    if(modelChanged){result.traceability='厂家 / 型号已编辑，待复核';result.identification=identifyPart(part,{makerEdited,modelEdited});}
    if(amountChanged||changed('priceSource')){
      const amount=value(part,'price'),unit=value(part,'currency');
      result.quote=amount!==''&&unit?{...part.quote,value:Number(amount),currency:unit,source:edited.priceSource??(amountChanged?'':part.quote?.source??''),date:'',type:'用户录入'}:null;
      result.quoteStatus=result.quote?'用户录入':result.qty===0?'随所属件核对':'单价或币种待填写';
    }else if(modelChanged&&part.quote){result.quote=null;result.quoteStatus='型号已编辑 · 待核价';}
    return result;
  };
  const history=async id=>state.offline?(localRevisions.get(id)||[]):(await send(api+'/'+id+'/history')).history;
  const manualConfirmed=id=>confirmations.has(id)?Boolean(confirmations.get(id)?.checked):heads.get(id)?.values?.manualConfirmed==='true';
  const exportLocal=()=>localSnapshot();
  const importLocal=async()=>{
    requireEditor();
    if(!state.usingCloud||!state.cloudAvailable)throw new Error('云端数据库尚未连接，暂时不能迁移。');
    const data=localSnapshot(),count=localPartIds(data).length;
    if(!count)throw new Error('当前浏览器没有待迁移的本机记录。');
    const result=await send(cloudApiRoot+'/api/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({snapshot:data})});
    window.localStorage.setItem(localBackupKey,JSON.stringify(data));
    window.localStorage.setItem(localStorageKey,JSON.stringify({parts:{},confirmations:{},history:{}}));
    heads.clear();confirmations.clear();localRevisions.clear();
    state.pendingLocal=false;state.localPendingCount=0;state.offline=false;
    await refresh();return result;
  };
  const setManualConfirmed=async(part,checked)=>{
    requireEditor();
    const id=typeof part==='string'?part:part.id,next=String(Boolean(checked)),previous=manualConfirmed(id);
    if(previous===Boolean(checked))return;
    if(state.offline){
      if(typeof part==='string')throw new Error('本机模式下需要完整零件记录才能修改确认状态。');
      const previousHead=heads.get(id)||{revision:0,values:{}},previousConfirmation=confirmations.get(id),oldHistory=localRevisions.get(id)||[];
      const nextRevision=(previousHead.revision||0)+1,now=new Date().toISOString();
      heads.set(id,{revision:nextRevision,values:{...previousHead.values,manualConfirmed:next}});
      confirmations.set(id,{checked:Boolean(checked),changed_at:now});
      localRevisions.set(id,[{revision:nextRevision,field:'manualConfirmed',previous:String(previous),value:next,changed_at:now},...oldHistory].slice(0,100));
      try{persist(id);markPending();}catch(error){
        heads.set(id,previousHead);
        if(previousConfirmation===undefined)confirmations.delete(id);else confirmations.set(id,previousConfirmation);
        localRevisions.set(id,oldHistory);throw error;
      }
      return;
    }
    if(typeof part==='string')throw new Error('云端模式下需要完整零件记录才能修改确认状态。');
    await save(part,'manualConfirmed',next,revision(id));
    confirmations.set(id,{checked:Boolean(checked),changed_at:new Date().toISOString()});
  };
  const save=async(part,field,next,baseRevision)=>{
    requireEditor();
    if(!Object.hasOwn(labels,field))throw new Error('未知的编辑字段。');
    const entry=String(next??'');
    if(entry.length>4000)throw new Error('字段内容不能超过 4000 个字符。');
    if(field==='qty'&&(entry.trim()===''||!Number.isInteger(Number(entry))||Number(entry)<0))throw new Error('数量必须为非负整数。');
    if(field==='price'&&entry.trim()!==''&&(!Number.isFinite(Number(entry))||Number(entry)<0))throw new Error('价格必须为有效的非负数字。');
    if(field==='manualConfirmed'&&!['true','false'].includes(entry))throw new Error('人工确认状态无效。');
    if(['drawing','datasheet'].includes(field)&&entry.trim()&&!/^https:\/\//i.test(entry.trim()))throw new Error('图纸和规格链接需要完整的 HTTPS 地址。');
    if(state.offline){
      const previous=heads.get(part.id)||{revision:0,values:{}},oldValue=previous.values?.[field]??original(part,field);
      if(oldValue===entry)return;
      const nextRevision=(previous.revision||0)+1,oldHistory=localRevisions.get(part.id)||[],previousConfirmation=confirmations.get(part.id);
      heads.set(part.id,{revision:nextRevision,values:{...previous.values,[field]:entry}});
      if(field==='manualConfirmed')confirmations.set(part.id,{checked:entry==='true',changed_at:new Date().toISOString()});
      localRevisions.set(part.id,[{revision:nextRevision,field,previous:oldValue,value:entry,changed_at:new Date().toISOString()},...oldHistory].slice(0,100));
      try{persist(part.id);markPending();}catch(error){
        if(!previous.revision&&!Object.keys(previous.values||{}).length)heads.delete(part.id);else heads.set(part.id,previous);
        if(field==='manualConfirmed'){if(previousConfirmation===undefined)confirmations.delete(part.id);else confirmations.set(part.id,previousConfirmation);}
        localRevisions.set(part.id,oldHistory);throw error;
      }
      return;
    }
    try{
      const {part:head}=await send(api+'/'+part.id,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({field,value:entry,original:original(part,field),baseRevision})});
      heads.set(part.id,head);
      if(field==='manualConfirmed')confirmations.set(part.id,{checked:entry==='true',changed_at:new Date().toISOString()});
    }catch(error){
      if(error.part)heads.set(part.id,error.part);
      if(!error.status||[404,405,502,503].includes(error.status)){
        state.offline=true;state.apiConnected=false;state.cloudAvailable=false;return save(part,field,entry,baseRevision);
      }
      throw error;
    }
  };
  return {state,refresh,revision,value,apply,history,save,manualConfirmed,setManualConfirmed,canEdit,exportLocal,importLocal};
}

function element(tag,cls,content){
  const node=document.createElement(tag);
  if(cls)node.className=cls;
  if(content!==undefined)node.textContent=content;
  return node;
}

export function mountPartRecord(host,part,records,{hasMesh,onSave}){
  let editing=null;
  host.replaceChildren();
  host.className='';
  const header=element('div','inspection-detail-heading');
  const historyButton=element('button','','修改历史');
  historyButton.type='button';
  historyButton.setAttribute('aria-expanded','false');
  const confirmedInput=element('input');
  confirmedInput.type='checkbox';
  confirmedInput.checked=records.manualConfirmed(part.id);
  confirmedInput.setAttribute('aria-label','人工确认此零件');
  const confirmedLabel=element('label','inspection-manual-check');
  confirmedLabel.append(confirmedInput,element('span','','人工确认'));
  const headingActions=element('div','inspection-heading-actions');
  headingActions.append(confirmedLabel,historyButton);
  header.append(element('span','part-id',part.id),headingActions);
  const title=element('h2','',records.value(part,'name')||part.id);
  const hint=element('p','inspection-status',records.state.offline?
    '本机编辑模式 · 自动保存在当前浏览器，不同步 GitHub':
    records.state.ready?'点击编辑可修改；文字可选中复制':'正在连接数据库…');
  const status=element('p','inspection-status');
  status.setAttribute('role','status');
  status.hidden=true;
  const historyView=element('div');
  historyView.hidden=true;
  const fieldList=element('div','inspection-field-list');
  const identificationNote=element('p','inspection-status');
  const links=element('details','inspection-info');
  links.append(element('summary','','资料与备注'));
  const refs=element('div','inspection-sources');
  const quoteDetails=element('p','small');
  function drawLinks(quote,price){
    refs.replaceChildren();
    for(const [label,url] of [
      ['该零件的实物照片',photoRefsForPart(part.id[0],part.id).length?'./media.html?part='+encodeURIComponent(part.id):''],
      [records.value(part,'drawing')===part.drawing?(part.drawingLabel||'图纸'):'图纸',records.value(part,'drawing')],['CAD',part.cad],
      [records.value(part,'datasheet')===part.datasheet?(part.datasheetLabel||'技术资料'):'技术资料',records.value(part,'datasheet')],['价格来源',quote?.source],
      ['折算汇率',price?.exchange?.source]
    ]){
      if(typeof url!=='string'||!(url.startsWith('https://')||url.startsWith('./media.html?part=')))continue;
      const link=element('a','',label);
      link.href=url;
      if(url.startsWith('https://')){link.target='_blank';link.rel='noopener noreferrer';}
      refs.append(link);
    }
    for(const [maker,description,url] of part.alternatives||[]){
      if(!url.startsWith('https://'))continue;
      const link=element('a','','参考 · '+maker+' '+description);
      link.href=url;link.target='_blank';link.rel='noopener noreferrer';refs.append(link);
    }
  }
  if(part.evidence)links.append(element('p','small',part.evidence));
  const sourceFields=element('div');
  links.append(refs,quoteDetails,sourceFields);
  const cloudPanel=element('details','inspection-cloud-settings');
  cloudPanel.append(element('summary','','云端数据库与同步'));
  const cloudStatus=element('p','inspection-cloud-status');
  const cloudActions=element('div','inspection-cloud-actions');
  const importButton=element('button','','迁移本机修改到云端');
  const backupButton=element('button','','导出本机备份');
  for(const button of [importButton,backupButton])button.type='button';
  cloudActions.append(importButton,backupButton);
  cloudPanel.append(cloudStatus,cloudActions);
    host.append(header,title,hint,cloudPanel,status,historyView,fieldList,identificationNote,links);
  if(!hasMesh){
    const notice=element('p','inspection-status','该零件已列入 BOM，但尚未建立独立 3D 模型。');
    host.insertBefore(notice,fieldList);
  }
  function message(text,error=false){
    status.textContent=text;status.hidden=!text;status.classList.toggle('error',error);
  }
  function updateCloudPanel(){
    const s=records.state;
    if(!s.usingCloud)cloudStatus.textContent=s.apiConnected?'本地 SQLite 数据库已连接。':'本地预览 API 未连接，修改将暂存在当前浏览器。';
    else if(!s.apiConnected)cloudStatus.textContent='云端 API 尚未连接，修改暂存在当前浏览器；部署完成后可迁移。';
    else if(s.pendingLocal)cloudStatus.textContent='云端已连接，但当前浏览器有 '+s.localPendingCount+' 个零件记录尚未同步。迁移前不会覆盖本机数据。';
    else cloudStatus.textContent='云端数据库已连接；服务器已有 '+s.remoteCount+' 个零件记录。';
    const editable=records.canEdit();
    confirmedInput.disabled=!editable;
    importButton.hidden=!s.usingCloud||!editable;
    importButton.disabled=!s.usingCloud||!s.apiConnected||!s.pendingLocal;
    backupButton.disabled=!s.pendingLocal;
    hint.textContent=!editable?'游客只读 · 管理员登录后可修改':
      s.pendingLocal?'本机有未同步修改 · 请在“云端数据库与同步”中迁移':
      s.offline?'本机暂存模式 · 修改尚未同步到云端':
      s.cloudAvailable?'云端数据库已连接 · 修改将同步到云端':
      s.apiConnected?'本地 SQLite 数据库已连接':'正在连接数据库…';
  }

  importButton.onclick=async()=>{
    if(!window.confirm('将当前浏览器的未同步零件修改和修改历史迁移到云端数据库？本机数据会先备份，只有服务器确认接收后才清空待同步区。'))return;
    importButton.disabled=true;
    try{
      const result=await records.importLocal();
      message('迁移成功：'+result.imported+' 个零件记录已写入云端。');
      title.textContent=records.value(part,'name')||part.id;drawFields();onSave();
    }catch(error){message(error.message,true);}
    updateCloudPanel();
  };
  backupButton.onclick=()=>{
    const blob=new Blob([JSON.stringify(records.exportLocal(),null,2)],{type:'application/json;charset=utf-8'});
    const url=URL.createObjectURL(blob),link=element('a');
    link.href=url;link.download='transfer-station-local-records-backup.json';
    link.click();URL.revokeObjectURL(url);
  };
  async function commit(field,next,baseRevision){
    try{
      await records.save(part,field,next,baseRevision);
      if(!host.contains(header))return true;
      message((records.state.offline?'已暂存到本机（尚未同步）':records.state.cloudAvailable?'已保存到云端数据库':'已保存到本地 SQLite 数据库')+' · #'+records.revision(part.id));
      updateCloudPanel();
      title.textContent=records.value(part,'name')||part.id;
      drawFields();
      onSave();
      if(!historyView.hidden)await drawHistory();
      return true;
    }catch(error){
      if(!host.contains(header))return false;
      message(error.message,true);
      if(error.status===409){
        title.textContent=records.value(part,'name')||part.id;
        drawFields();
        onSave();
      }
      return false;
    }
  }
  function drawFields(){
    editing=null;
    const record=records.apply(part);
    const identification=record.identification;
    identificationNote.textContent=identification.note;
    identificationNote.hidden=!identification.note;
    const quote=record.quote;
    const price=displayPrice(quote,record.qty);
    fieldList.replaceChildren();sourceFields.replaceChildren();drawLinks(quote,price);
    quoteDetails.textContent=priceEvidence(quote,record.unit);
    quoteDetails.hidden=!quote;
    for(const [field,label] of fields){
      const row=element('div','inspection-field');
      row.dataset.recordField=field;
      const value=field==='price'?
        price?formatRmb(price.unit):quote?'汇率待补':record.qty===0?'—':'待询价':
        records.value(part,field);
      const empty=field==='price'?!price:!value;
      const displayValue=String(value||'待填');
      const valueNode=element('span','inspection-value'+(empty?' empty':''),displayValue);
      valueNode.dataset.field=field;
      valueNode.tabIndex=0;
      valueNode.title='可以选择和复制文字';
      const valueWrap=element('div','inspection-value-row');
      const actions=element('div','inspection-field-actions');
      if(records.canEdit()){
        valueNode.title+='，双击进入编辑';
        valueNode.ondblclick=()=>edit(row,valueNode,field,label);
        valueNode.onkeydown=event=>{
          if(event.key==='Enter'||event.key==='F2'){
            event.preventDefault();edit(row,valueNode,field,label);
          }
        };
        const editButton=element('button','','编辑');
        editButton.type='button';
        editButton.title='编辑'+label;
        editButton.onclick=()=>edit(row,valueNode,field,label);
        actions.append(editButton);
      }
      const copyButton=element('button','','复制');
      copyButton.type='button';
      copyButton.title='复制'+label;
      copyButton.onclick=async()=>{
        try{
          await navigator.clipboard.writeText(
            String(field==='price'?records.value(part,field):value||'')
          );
          message('已复制：'+label);
        }catch{
          message('复制失败，请选中文字后按 Ctrl+C。',true);
        }
      };
      actions.append(copyButton);
      const raw=String(records.value(part,field)||'').trim();
      if(/^https:\/\/\S+$/i.test(raw)){
        valueNode.textContent='';
        const directLink=element('a','inspection-direct-link',raw);
        directLink.href=raw;
        directLink.target='_blank';
        directLink.rel='noopener noreferrer';
        valueNode.append(directLink);
        const openLink=element('a','inspection-open-link','打开');
        openLink.href=raw;
        openLink.target='_blank';
        openLink.rel='noopener noreferrer';
        actions.append(openLink);
      }
      valueWrap.append(valueNode,actions);
      row.append(element('span','',label),valueWrap);
      if(field==='maker'||field==='model'){
        const supported=identification[field];
        const text=identification.status==='interface'?identificationLabels.interface:
          label+(supported?'已确认':'待确认');
        const badge=element('span','part-evidence-badge',text);
        badge.dataset.confirmed=String(supported);
        row.append(badge);
      }
      if(field==='price'&&quote?.candidate)row.append(element('span','part-evidence-badge','备选型号报价'));
      (['currency','note','drawing','datasheet','priceSource'].includes(field)?sourceFields:fieldList).append(row);
    }
  }
  function edit(row,button,field,label){
    if(editing||!records.canEdit())return;
    message('');
    const baseRevision=records.revision(part.id);
    const form=element('form','inspection-edit');
    const input=element(['connection','note','dims'].includes(field)?'textarea':'input');
    input.value=records.value(part,field);
    input.maxLength=4000;
    const record=records.apply(part);
    const rawPriceLabel='录入报价（'+(records.value(part,'currency')||'待填写原币')+' / '+
      (record.quote?.packSize??part.quote?.packSize??1)+record.unit+'）';
    input.setAttribute('aria-label',field==='price'?rawPriceLabel:label);
    if(field==='qty'||field==='price')input.inputMode='decimal';
    const save=element('button','','保存');save.type='submit';
    const cancel=element('button','','取消');cancel.type='button';
    const close=()=>{
      form.replaceWith(button);editing=null;button.focus();
    };
    cancel.onclick=close;
    form.onkeydown=event=>{if(event.key==='Escape'){event.stopPropagation();close();}};
    form.onsubmit=async event=>{
      event.preventDefault();
      save.disabled=true;cancel.disabled=true;
      if(await commit(field,input.value,baseRevision)){
        host.querySelector('[data-field="'+field+'"]')?.focus();
      }else{
        save.disabled=false;cancel.disabled=false;
      }
    };
    if(field==='price')form.append(element('span','small',rawPriceLabel));
    form.append(input,save,cancel);button.replaceWith(form);
    editing=form;input.focus();input.select();
  }
  async function drawHistory(){
    historyView.textContent='读取历史…';
    try{
      const revisions=await records.history(part.id);
      historyView.replaceChildren();
      if(!revisions.length)historyView.textContent='暂无修改';
      for(const entry of revisions){
        const row=element('div','inspection-revision');
        const time=element('time','',dateFormat.format(new Date(entry.changed_at)));
        time.dateTime=entry.changed_at;
        const label=entry.field==='price'?'原币报价':labels[entry.field]||entry.field;
        row.append(element('strong','','#'+entry.revision+' · '+label),time,
          element('p','','原值  '+(entry.previous||'空')),element('p','','新值  '+(entry.value||'空')));
        const restore=element('button','','恢复此项原值');
        restore.type='button';
        restore.disabled=records.value(part,entry.field)===entry.previous;
        restore.onclick=async()=>{
          if(editing){message('请先保存或取消当前编辑。',true);return;}
          restore.disabled=true;
          if(!await commit(entry.field,entry.previous,records.revision(part.id)))restore.disabled=false;
        };
        if(records.canEdit())row.append(restore);
        historyView.append(row);
      }
    }catch(error){
      historyView.textContent=error.message;
    }
  }
  confirmedInput.onchange=async()=>{
    const checked=confirmedInput.checked;confirmedInput.disabled=true;
    try{
      await records.setManualConfirmed(part,checked);
      const destination=records.state.offline?'本机暂存（尚未同步）':records.state.cloudAvailable?'云端数据库':'本地 SQLite 数据库';
      message((checked?'已标记人工确认并保存到':'已取消人工确认并保存到')+destination);
      updateCloudPanel();if(!historyView.hidden)await drawHistory();
    }catch(error){confirmedInput.checked=!checked;message(error.message,true);}
    finally{confirmedInput.disabled=!records.canEdit();}
  };
  historyButton.onclick=()=>{
    historyView.hidden=!historyView.hidden;
    historyButton.setAttribute('aria-expanded',String(!historyView.hidden));
    if(!historyView.hidden)void drawHistory();
  };
  drawFields();
  updateCloudPanel();
}
