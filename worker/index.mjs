const PART_PATTERN=/^[AB](?:\d{2}[A-Z]{0,2}|-H\d{2})$/;
const FIELDS=new Set(['name','maker','model','dims','material','qty','unit','price','currency','priceSource','datasheet','drawing','connection','note','manualConfirmed']);
const LINK_FIELDS=new Set(['priceSource','datasheet','drawing']);
const ALLOWED_ORIGINS=new Set(['https://davidkane0526.github.io','http://127.0.0.1:4175','http://localhost:4175']);
function corsHeaders(request){
  const origin=request.headers.get('Origin')||'';
  const headers={'Vary':'Origin','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Authorization,Content-Type','Access-Control-Max-Age':'86400'};
  if(ALLOWED_ORIGINS.has(origin))headers['Access-Control-Allow-Origin']=origin;
  return headers;
}
function json(request,payload,status=200){
  const headers=new Headers(corsHeaders(request));
  headers.set('Content-Type','application/json; charset=utf-8');headers.set('Cache-Control','no-store');headers.set('X-Content-Type-Options','nosniff');
  return new Response(JSON.stringify(payload),{status,headers});
}
function equalSecret(a,b){
  if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;
  let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;
}
function authorized(request,env){
  const expected=env.WRITE_TOKEN;
  if(typeof expected!=='string'||expected.length<32)return json(request,{error:'服务器尚未配置有效的云端写入密钥。'},503);
  const header=request.headers.get('Authorization')||'',supplied=header.startsWith('Bearer ')?header.slice(7):'';
  if(!equalSecret(supplied,expected))return json(request,{error:'云端写入密钥无效或未提供。'},401);
  return null;
}
async function readJson(request){
  const length=Number(request.headers.get('Content-Length')||0);
  if(length>1024*1024)throw new Error('请求内容不能超过 1 MB。');
  const raw=await request.text();if(raw.length>1024*1024)throw new Error('请求内容不能超过 1 MB。');
  try{return JSON.parse(raw);}catch{throw new Error('请求 JSON 格式无效。');}
}
function cleanValue(field,value){
  if(typeof value!=='string'||value.length>4000)throw new Error('字段必须是 4000 个字符以内的文本。');
  value=value.trim();
  if(['qty','price'].includes(field)&&value&&!/^\d{1,9}(?:\.\d{1,4})?$/.test(value))throw new Error('请输入有效的非负数字。');
  if(field==='currency'&&value&&!/^[A-Z]{3}$/i.test(value))throw new Error('请使用三字母币种代码，例如 CNY。');
  if(field==='manualConfirmed'&&!['true','false'].includes(value))throw new Error('人工确认状态无效。');
  if(LINK_FIELDS.has(field)&&value){let url;try{url=new URL(value);}catch{throw new Error('请填写完整的 HTTPS 链接。');}if(url.protocol!=='https:')throw new Error('请填写完整的 HTTPS 链接。');}
  return field==='currency'?value.toUpperCase():value;
}
function parseSnapshot(row){
  if(!row)return {revision:0,values:{},field:null};
  let values={};try{values=JSON.parse(row.snapshot)||{};}catch{}
  return {revision:Number(row.revision)||0,values,field:row.field||null};
}
async function getHead(db,part){
  const row=await db.prepare('SELECT revision,field,snapshot FROM part_revision WHERE part=? ORDER BY revision DESC LIMIT 1').bind(part).first();
  return parseSnapshot(row);
}
async function getParts(db){
  const sql='SELECT p.part,p.revision,p.field,p.snapshot FROM part_revision p '+
    'JOIN (SELECT part,MAX(revision) AS revision FROM part_revision GROUP BY part) h ON p.part=h.part AND p.revision=h.revision';
  const result=await db.prepare(sql).all(),parts={};
  for(const row of result.results||[])parts[row.part]=parseSnapshot(row);
  return parts;
}
async function getHistory(db,part){
  const live=await db.prepare("SELECT revision,changed_at,field,previous,value FROM part_revision WHERE part=? AND field!='__import__' ORDER BY revision DESC").bind(part).all();
  const imported=await db.prepare('SELECT entries_json FROM part_import_history WHERE part=?').bind(part).first();
  const history=(live.results||[]).map(row=>({revision:row.revision,changed_at:row.changed_at,field:row.field,previous:row.previous,value:row.value}));
  if(imported?.entries_json){
    try{const entries=JSON.parse(imported.entries_json);if(Array.isArray(entries))entries.forEach((entry,index)=>history.push({
      revision:-Math.abs(Number(entry.revision)||index+1),changed_at:entry.changed_at||imported.imported_at,
      field:entry.field,previous:String(entry.previous??''),value:String(entry.value??'')
    }));}catch{}
  }
  history.sort((a,b)=>String(b.changed_at).localeCompare(String(a.changed_at)));return history;
}
async function saveField(request,env,part){
  const denied=authorized(request,env);if(denied)return denied;
  let body;try{body=await readJson(request);}catch(error){return json(request,{error:error.message},400);}
  const field=body?.field;if(!FIELDS.has(field))return json(request,{error:'此字段不可编辑。'},400);
  let value;try{value=cleanValue(field,body.value);}catch(error){return json(request,{error:error.message},400);}
  const original=body.original??'',expected=body.baseRevision;
  if(typeof original!=='string'||original.length>4000||!Number.isInteger(expected)||expected<0)return json(request,{error:'缺少有效的原始值或版本号。'},400);
  const current=await getHead(env.DB,part);
  if(expected!==current.revision)return json(request,{error:'此零件已有新的修改。请复核最新值再保存。',part:current},409);
  const previous=String(current.values[field]??original);if(previous===value)return json(request,{part:current});
  const values={...current.values,[field]:value},now=new Date().toISOString();
  const sql='INSERT INTO part_revision(part,parent,changed_at,field,previous,value,snapshot) '+
    'SELECT ?,?,?,?,?,?,? WHERE COALESCE((SELECT MAX(revision) FROM part_revision WHERE part=?),0)=?';
  const result=await env.DB.prepare(sql).bind(part,current.revision||null,now,field,previous,value,JSON.stringify(values),part,current.revision).run();
  if(Number(result.meta?.changes||0)!==1){const latest=await getHead(env.DB,part);return json(request,{error:'保存冲突：该零件已被其他页面修改。',part:latest},409);}
  return json(request,{part:await getHead(env.DB,part)});
}
async function importLocalSnapshot(request,env){
  const denied=authorized(request,env);if(denied)return denied;
  let body;try{body=await readJson(request);}catch(error){return json(request,{error:error.message},400);}
  const snapshot=body?.snapshot||{};
  const localParts=snapshot.parts&&typeof snapshot.parts==='object'?snapshot.parts:{};
  const localConfirmations=snapshot.confirmations&&typeof snapshot.confirmations==='object'?snapshot.confirmations:{};
  const localHistory=snapshot.history&&typeof snapshot.history==='object'?snapshot.history:{};
  const ids=[...new Set([...Object.keys(localParts),...Object.keys(localConfirmations),...Object.keys(localHistory)])];
  if(ids.length>200)return json(request,{error:'单次迁移最多支持 200 个零件记录。'},400);
  const prepared=[],conflicts=[];
  for(const id of ids){
    if(!PART_PATTERN.test(id))return json(request,{error:'发现无效零件编号：'+id},400);
    const localHead=localParts[id]||{values:{}},values={...(localHead.values||{})};
    const confirmation=localConfirmations[id];
    if(confirmation&&typeof confirmation.checked==='boolean')values.manualConfirmed=String(confirmation.checked);
    const entries=Array.isArray(localHistory[id])?localHistory[id].slice(0,100):[];
    if(!Object.keys(values).length&&entries.length){
      for(const entry of [...entries].sort((a,b)=>(a.revision||0)-(b.revision||0)))if(FIELDS.has(entry.field))values[entry.field]=String(entry.value??'');
    }
    for(const [field,value] of Object.entries(values)){
      if(!FIELDS.has(field))return json(request,{error:'本机记录包含不可迁移字段：'+field},400);
      try{values[field]=cleanValue(field,String(value));}catch(error){return json(request,{error:id+' / '+field+'：'+error.message},400);}
    }
    const history=[];
    for(const entry of entries){
      if(!FIELDS.has(entry.field))continue;
      try{history.push({
        revision:Number.isInteger(entry.revision)?entry.revision:history.length+1,field:entry.field,
        previous:cleanValue(entry.field,String(entry.previous??'')),value:cleanValue(entry.field,String(entry.value??'')),
        changed_at:typeof entry.changed_at==='string'&&Number.isFinite(Date.parse(entry.changed_at))?entry.changed_at:new Date().toISOString()
      });}catch(error){return json(request,{error:id+' 历史记录：'+error.message},400);}
    }
    if(confirmation&&typeof confirmation.checked==='boolean'&&!history.some(entry=>entry.field==='manualConfirmed')){
      history.push({
        revision:history.reduce((max,entry)=>Math.max(max,entry.revision||0),0)+1,
        field:'manualConfirmed',previous:'false',value:String(confirmation.checked),
        changed_at:typeof confirmation.changed_at==='string'&&Number.isFinite(Date.parse(confirmation.changed_at))?confirmation.changed_at:new Date().toISOString()
      });
    }
    const current=await getHead(env.DB,id);
    if(current.revision){
      if(current.field==='__import__'&&JSON.stringify(current.values)===JSON.stringify(values))continue;
      conflicts.push(id);continue;
    }
    if(Object.keys(values).length||history.length)prepared.push({id,values,history});
  }
  if(conflicts.length)return json(request,{error:'云端已有同编号零件记录。为避免覆盖，未执行本次迁移。',conflicts},409);
  for(let offset=0;offset<prepared.length;offset+=40){
    const statements=[];
    for(const item of prepared.slice(offset,offset+40)){
      const now=new Date().toISOString();
      statements.push(env.DB.prepare("INSERT INTO part_revision(part,parent,changed_at,field,previous,value,snapshot) VALUES (?,NULL,?,'__import__','','本机数据迁移',?)").bind(item.id,now,JSON.stringify(item.values)));
      if(item.history.length)statements.push(env.DB.prepare('INSERT INTO part_import_history(part,imported_at,entries_json) VALUES (?,?,?) ON CONFLICT(part) DO UPDATE SET imported_at=excluded.imported_at,entries_json=excluded.entries_json').bind(item.id,now,JSON.stringify(item.history)));
    }
    if(statements.length)await env.DB.batch(statements);
  }
  return json(request,{ok:true,imported:prepared.length,alreadyImported:ids.length-prepared.length});
}
export default {
  async fetch(request,env){
    const url=new URL(request.url),path=url.pathname,origin=request.headers.get('Origin')||'';
    if(request.method==='OPTIONS'){
      if(origin&&!ALLOWED_ORIGINS.has(origin))return json(request,{error:'Origin not allowed.'},403);
      return new Response(null,{status:204,headers:corsHeaders(request)});
    }
    try{
      if(path==='/api/health'&&request.method==='GET'){await env.DB.prepare('SELECT 1 AS ok').first();return json(request,{ok:true,database:'ready'});}
      if(path==='/api/parts'&&request.method==='GET')return json(request,{parts:await getParts(env.DB)});
      if(path==='/api/auth/check'&&request.method==='POST'){const denied=authorized(request,env);return denied||json(request,{ok:true});}
      if(path==='/api/import'&&request.method==='POST')return await importLocalSnapshot(request,env);
      const historyMatch=path.match(/^\/api\/parts\/([AB](?:\d{2}[A-Z]{0,2}|-H\d{2}))\/history$/);
      if(historyMatch&&request.method==='GET')return json(request,{history:await getHistory(env.DB,historyMatch[1])});
      const partMatch=path.match(/^\/api\/parts\/([AB](?:\d{2}[A-Z]{0,2}|-H\d{2}))$/);
      if(partMatch&&request.method==='POST')return await saveField(request,env,partMatch[1]);
      return json(request,{error:'API endpoint not found.'},404);
    }catch(error){return json(request,{error:'云端数据库请求失败。',detail:String(error?.message||error)},500);}
  }
};
