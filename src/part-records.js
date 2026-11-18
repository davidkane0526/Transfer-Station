const fields=[
  ['name','名称'],['maker','厂家'],['model','型号'],['dims','尺寸'],
  ['qty','数量'],['unit','单位'],['material','材料'],['connection','装配接口'],
  ['price','单价'],['currency','币种'],['note','备注'],
  ['drawing','图纸链接'],['datasheet','规格链接'],['priceSource','价格来源'],
];
const labels=Object.fromEntries(fields);
const dateFormat=new Intl.DateTimeFormat('zh-CN',{
  dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Singapore'
});
const api='./api/parts';

function original(part,field){
  if(field==='price')return String(part.quote?.value??'');
  if(field==='currency')return part.quote?.currency??'';
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
    if(['price','currency','priceSource'].some(field=>value(part,field)!==original(part,field))){
      const amount=value(part,'price');
      const unit=value(part,'currency');
      result.quote=amount!==''&&unit?{
        value:Number(amount),currency:unit,source:value(part,'priceSource'),
        date:'',type:'用户录入'
      }:null;
      result.quoteStatus=result.quote?'用户录入':result.qty===0?'随所属件核对':'单价或币种待填写';
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
  function drawLinks(){
    refs.replaceChildren();
    for(const [label,url] of [
      ['实物照片','./photo-review.html?platform='+part.id[0]],
      ['图纸',records.value(part,'drawing')],['CAD',part.cad],
      ['规格',records.value(part,'datasheet')],['价格来源',records.value(part,'priceSource')]
    ]){
      if(typeof url!=='string'||!(url.startsWith('https://')||url.startsWith('./photo-review.html')))continue;
      const link=element('a','',label);
      link.href=url;link.target='_blank';link.rel='noopener noreferrer';refs.append(link);
    }
  }
  if(part.evidence)links.append(element('p','small',part.evidence));
  const sourceFields=element('div');
  links.append(refs,sourceFields);
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
    fieldList.replaceChildren();sourceFields.replaceChildren();drawLinks();
    for(const [field,label] of fields){
      const row=element('div','inspection-field');
      row.dataset.recordField=field;
      const value=records.value(part,field);
      const button=element('button','inspection-value'+(value?'':' empty'),value||'待填');
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
      (['note','drawing','datasheet','priceSource'].includes(field)?sourceFields:fieldList).append(row);
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
    input.setAttribute('aria-label',label);
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
        row.append(element('strong','','#'+entry.revision+' · '+labels[entry.field]),time,
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
