import assert from 'node:assert/strict';
import {PARTS} from '../src/parts.js';
import {INTERFACES,interfaceEvidence,procurementInterfaceFields} from '../src/interface-evidence.js';
import {enriched,csvExportRows} from '../src/procurement.js';

const assemblies=new Map(Object.entries(PARTS).map(([p,items])=>[p,new Set(items.map(x=>x.id))]));
const ids=new Set();
for(const item of INTERFACES){
  assert(!ids.has(item.id),'Duplicate mechanical interface: '+item.id);
  ids.add(item.id);
  assert.equal(item.status,'pending','Do not certify physical interfaces without measurements: '+item.id);
  assert(item.known.length>12,'Missing evidence-qualified known features: '+item.id);
  assert(item.missing.length>=2,'Each interface needs measurable unresolved data: '+item.id);
  assert(item.evidence.length>0,'Missing evidence provenance: '+item.id);
  for(const partId of item.parts){
    assert(assemblies.get(item.platform)?.has(partId),'Unknown part '+partId+' in '+item.id);
    assert(interfaceEvidence(item.platform,partId).some(x=>x.id===item.id));
  }
}
const b09=interfaceEvidence('B','B09');
assert(b09.some(x=>x.id==='B-ROTARY-NFP'),'NFP mounting interface omitted');
assert(b09.some(x=>x.id==='B-CHUCK-FASTENERS'),'Upper fastener interface omitted');
assert(b09.some(x=>x.missing.some(s=>s.includes('攻丝孔组'))),
  'Vendor clearance holes must never silently become tapped upper fastener holes');
const fastener=interfaceEvidence('B','B14')[0];
assert(fastener.missing.some(x=>x.includes('有效螺纹深度')),'Thread engagement unknown');
assert(fastener.evidence.includes('I:M6×25'),'M6×25 must remain explicitly an old candidate');
assert(!INTERFACES.some(x=>x.status==='accepted'),'No physical acceptance evidence supplied');

for(const platform of ['A','B']){
 const rows=PARTS[platform].map(p=>enriched(platform,p));
 const matrix=csvExportRows(rows);
 const fields=matrix[0];
 const status=fields.indexOf('interfaceReview'),missing=fields.indexOf('interfaceGaps');
 assert(status>=0&&missing>=0,'Procurement must export physical-interface unknowns');
 assert(matrix.length===rows.length+1,'CSV row count changed');
 const b=platform==='B'?'B14':'A15';
 const i=rows.findIndex(x=>x.id===b);
 assert(matrix[i+1][status].startsWith('待核验'),'Critical hardware '+b+' is not buy-ready');
 assert(matrix[i+1][missing].length>15,'CSV omits '+b+' acceptance gaps');
}
assert(procurementInterfaceFields('B','B01').interfaceReview.includes('未建立独立'),
 'No interface record must not be represented as verified');
console.log('Physical-interface acceptance ledger and procurement export: PASS');
