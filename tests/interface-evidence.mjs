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
assert(b09.some(x=>x.id==='B-ROTARY-CROSSED-XY'),'B09 upper stage must attach through B41, not directly onto B08');
const b41=interfaceEvidence('B','B41');
assert(b41.some(x=>x.id==='B-ROTARY-CROSSED-XY'),'B41 newly inserted lower stage must have a mounting audit');
assert(b41.some(x=>x.missing.some(v=>v.includes('确切SKU'))),'B41 exact OEM identification remains unverified');
assert(!INTERFACES.some(x=>x.id==='B-ROTARY-NFP'),'Obsolete direct B08-B09 interface must not remain');
assert(interfaceEvidence('A','A17').some(x=>x.id==='A-MAGNET-T25M'),'A17 unverified magnetic-to-T25M joint omitted');
assert(interfaceEvidence('A','A10').some(x=>x.id==='A-MICROSCOPE-SUPPORT'),
  'A10/A18 component boundary must remain an explicit pending physical interface');
assert(interfaceEvidence('A','A18').some(x=>x.id==='A-MICROSCOPE-SUPPORT'));
const aMicroscope=interfaceEvidence('A','A18').find(x=>x.id==='A-MICROSCOPE-SUPPORT');
assert.match(aMicroscope.known,/MGZ30.*后部立柱夹持壳体/);
assert.match(aMicroscope.known,/A10横臂.*A18一体后壳/);
assert(aMicroscope.missing.some(x=>x.includes('Ø38.1mm')));
assert(aMicroscope.missing.some(x=>x.includes('独立SKU')));
assert.equal(aMicroscope.status,'pending');
const a17joint=interfaceEvidence('A','A17').find(x=>x.id==='A-MAGNET-T25M');
assert.match(a17joint.known,/长槽.*属于上方A15|银色长槽.*属于上方A15/,
  'V86 live interface evidence must assign the silver slot to A15, not A17');
assert.match(a17joint.known,/Oeabt MBS-65B\/C/);
assert.match(a17joint.known,/PTDB65/);
assert.match(a17joint.known,/LBTEK MB65/);
assert.match(a17joint.known,/13孔.*不能|不能复制.*13孔/,
  'PTDB65 hidden top-hole map must remain unmodelled candidate metadata');
assert.match(a17joint.known,/4×Ø7\/Ø11.*50×50/);
assert.match(a17joint.known,/MBS-65B.*25mm.*九孔M6.*50×50/);
assert.match(a17joint.known,/MBS-65C.*1个M6/);
assert.match(a17joint.known,/兼容性不能证明A17型号/);
assert(!/A17前侧狭槽/.test(a17joint.known),
  'Obsolete V48 A17-slot attribution must never return to live interface evidence');
assert(interfaceEvidence('A','A05C').some(x=>x.id==='A-GLASS-END'),'A05 candidate glass clamp must carry an unresolved interface');
const aGlass=interfaceEvidence('A','A05C').find(x=>x.id==='A-GLASS-END');
assert.match(aGlass.known,/已作为当前转移装配中的几何候选/,
  'A05C live ledger must not revert to the obsolete "not installed" state');
assert.match(aGlass.known,/螺杆.*平行.*玻片短边/);
assert.match(aGlass.known,/GCM-13.*功能.*对照/,
  'Daheng GCM-13 may be a mechanism comparison only, never an identified A05C SKU');
assert(!/A05C未安装/.test(aGlass.evidence));
assert(interfaceEvidence('A','A16').some(x=>x.id==='A-SAMPLE'),'A16 mounting base must be part of the real sample-side assembly audit');
const aSample=interfaceEvidence('A','A06').find(x=>x.id==='A-SAMPLE');
assert.match(aSample.known,/GCM-T25M2L\/2C/);
assert.match(aSample.known,/A02.*X\/Y两轴/);
assert.match(aSample.known,/A06无平移测微头/);
assert.match(aSample.known,/90mm.*87–93mm/);
assert(aSample.missing.some(x=>x.includes('双轴T25M2L或2C')));
assert(aSample.missing.some(x=>x.includes('全行程')));
assert(!aSample.missing.some(x=>x.includes('单轴后缀')));
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
