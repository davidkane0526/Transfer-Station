import {displayPrice,formatRmb,priceEvidence} from './quote-display.js';

const fields=[
  ['name','名称'],['maker','厂家'],['model','型号'],['dims','尺寸'],
  ['qty','数量'],['unit','单位'],['material','材料'],['connection','装配接口'],
  ['price','参考单价（人民币）'],['currency','原币币种'],['note','备注'],
  ['drawing','图纸链接'],['datasheet','规格链接'],['priceSource','价格来源'],
];
const labels=Object.fromEntries(fields);
const dateFormat=new Intl.DateTimeFormat('zh-CN',{
  dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Singapore'
});
const api='./api/parts';

function original(part,field){
  if(field==='price')return String(part.quote?.value??'');
  if(field==='currency')return part.quote?.currency??'CNY';
  if(field==='priceSource')return part.quote?.source??'';
  return String(part[field]??'');
}

export function createPartRecords(){
  const heads=new Map();
  const state={ready:false,offline:false};
  async function send(url,options){
    const response=await fetch(url,{cache:'no-store',...options});
    const data=await response.json().catch(()=>null);
    if(!response.ok||!data){
      const error=new Error(data?.error||'数据库暂不可用。');
      Object.assign(error,{status:response.status,part:data?.part});
      throw error;
    }
    return data;
  }
  const refresh=async()=>{
    const {parts}=await send(api);
    if(!parts)throw new Error('数据库暂不可用。');
    heads.clear();
    for(const [id,head] of Object.entries(parts))heads.set(id,head);
    state.ready=true;
  };
  const revision=id=>heads.get(id)?.revision??0;
  const value=(part,field)=>heads.get(part.id)?.values[field]??original(part,field);
  const apply=part=>{
    const edited=heads.get(part.id)?.values;
    if(!edited)return part;
    const {price,currency,priceSource,...ordinary}=edited;
    const result={...part,...ordinary};
    if(typeof result.qty==='string')result.qty=result.qty===''?'':Number(result.qty);
    const changed=field=>value(part,field)!==original(part,field);
    const modelChanged=changed('maker')||changed('model');
    const amountChanged=changed('price')||changed('currency');
    if(modelChanged)result.traceability='厂家 / 型号已编辑，待复核';
    if(amountChanged||changed('priceSource')){
      const amount=value(part,'price');
      const unit=value(part,'currency');
      result.quote=amount!==''&&unit?{
        ...part.quote,
        value:Number(amount),currency:unit,source:edited.priceSource??(amountChanged?'':part.quote?.source??''),
        date:'',type:'用户录入'
      }:null;
      result.quoteStatus=result.quote?'用户录入':result.qty===0?'随所属件核对':'单价或币种待填写';
    }else if(modelChanged&&part.quote){
      result.quote=null;
      result.quoteStatus='型号已编辑 · 待核价';
    }
    return result;
  };
  const history=async id=>(await send(api+'/'+id+'/history')).history;
  const save=async(part,field,next,baseRevision)=>{
    try{
      const {part:head}=await send(api+'/'+part.id,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({field,value:next,original:original(part,field),baseRevision})
      });
      heads.set(part.id,head);
    }catch(error){
      if(error.part)heads.set(part.id,error.part);
      throw error;
    }
  };
  return {state,refresh,revision,value,apply,history,save};
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
  historyButton.hidden=records.state.offline;
  historyButton.setAttribute('aria-expanded','false');
  header.append(element('span','part-id',part.id),historyButton);
  const title=element('h2','',records.value(part,'name')||part.id);
  const hint=element('p','inspection-status',records.state.offline?'静态预览 · 资料只读':
    records.state.ready?'双击字段编辑':'正在连接数据库…');
  const status=element('p','inspection-status');
  status.setAttribute('role','status');
  status.hidden=true;
  const historyView=element('div');
  historyView.hidden=true;
  const fieldList=element('div','inspection-field-list');
  const links=element('details','inspection-info');
  links.append(element('summary','','资料与备注'));
  const refs=element('div','inspection-sources');
  const quoteDetails=element('p','small');
  function drawLinks(quote,price){
    refs.replaceChildren();
    for(const [label,url] of [
      ['实物照片','./photo-review.html?platform='+part.id[0]],
      ['图纸',records.value(part,'drawing')],['CAD',part.cad],
      ['规格',records.value(part,'datasheet')],['价格来源',quote?.source],
      ['折算汇率',price?.exchange?.source]
    ]){
      if(typeof url!=='string'||!(url.startsWith('https://')||url.startsWith('./photo-review.html')))continue;
      const link=element('a','',label);
      link.href=url;link.target='_blank';link.rel='noopener noreferrer';refs.append(link);
    }
  }
  if(part.evidence)links.append(element('p','small',part.evidence));
  const sourceFields=element('div');
  links.append(refs,quoteDetails,sourceFields);
  host.append(header,title,hint,status,historyView,fieldList,links);
  if(!hasMesh){
    const notice=element('p','inspection-status','此条目暂无独立 3D 网格。');
    host.insertBefore(notice,fieldList);
  }
  function message(text,error=false){
    status.textContent=text;status.hidden=!text;status.classList.toggle('error',error);
  }
  async function commit(field,next,baseRevision){
    try{
      await records.save(part,field,next,baseRevision);
      if(!host.contains(header))return true;
      message('已保存 · #'+records.revision(part.id));
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
      const button=element('button','inspection-value'+(empty?' empty':''),value||'待填');
      button.type='button';
      button.dataset.field=field;
      button.setAttribute('aria-label','编辑'+label);
      button.title=records.state.offline?'静态预览只读':'双击编辑';
      button.disabled=records.state.offline;
      button.ondblclick=()=>edit(row,button,field,label);
      button.onkeydown=event=>{
        if(event.key==='Enter'||event.key==='F2'){
          event.preventDefault();edit(row,button,field,label);
        }
      };
      row.append(element('span','',label),button);
      if(field==='model')row.append(element('span','part-evidence-badge',record.traceability));
      if(field==='price'&&quote?.candidate)row.append(element('span','part-evidence-badge','备选型号报价'));
      (['currency','note','drawing','datasheet','priceSource'].includes(field)?sourceFields:fieldList).append(row);
    }
  }
  function edit(row,button,field,label){
    if(editing||records.state.offline)return;
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
        const label=entry.field==='price'?'原币报价':labels[entry.field];
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
        row.append(restore);
        historyView.append(row);
      }
    }catch(error){
      historyView.textContent=error.message;
    }
  }
  historyButton.onclick=()=>{
    historyView.hidden=!historyView.hidden;
    historyButton.setAttribute('aria-expanded',String(!historyView.hidden));
    if(!historyView.hidden)void drawHistory();
  };
  drawFields();
}
