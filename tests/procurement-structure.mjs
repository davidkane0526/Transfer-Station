import assert from 'node:assert/strict';
import {PURCHASE,csvExportRows,pricedSummary,procurementRows} from '../src/procurement.js';
import {PARTS} from '../src/parts.js';

const b35=PURCHASE.B.B35;
assert.ok(b35,'B35 must have its own procurement record');
assert.match(b35.category,/Thorlabs光学孔板/);
assert.match(b35.note,/四角M6沉孔共4个且无中央第五孔/);
assert.doesNotMatch(b35.note,/GCM-420302M|NT\$1,783/,
  'B02 magnet data must never be merged into B35');

const b02=PURCHASE.B.B02;
assert.ok(b02,'B02 must have an independent procurement record');
assert.match(b02.category,/GCM-420302M/);
assert.equal(b02.quote.value,1783);
assert.equal(b02.quote.currency,'TWD');
assert.match(b02.note,/5-M6/);
assert.match(b02.note,/中央M6/);

assert.match(PURCHASE.A.A05.category,/折弯连接片/);
assert.match(PURCHASE.A.A05C.category,/玻片夹持器/);
assert.match(PURCHASE.A.A05G.category,/载玻片耗材/);
console.log('B35/B02 procurement separation and A05 BOM split: PASS');

const all=Object.keys(PARTS).flatMap(key=>procurementRows(key,PARTS[key],{archive:true}));
assert.equal(all.filter(p=>p.hardware).length,25);
assert.equal(new Set(all.map(p=>p.id)).size,all.length);
assert.ok(all.every(p=>p.model&&p.dims&&p.evidence&&p.connection!=='按相邻接合面核对'));
assert.ok(all.filter(p=>p.quote).every(p=>p.quote.source.startsWith('https://')&&p.quote.date));
const find=id=>all.find(p=>p.id===id);
assert.equal(find('A05CS').qty,2);
assert.equal(find('B14').qty,4);
assert.match(find('A11').quote.type,/历史/);
assert.match(find('B-H01').model,/ISO 7380-1/);
assert.equal(find('B-H12').scope,'备用方案 / 历史记录');
const bCurrent=procurementRows('B',PARTS.B.filter(p=>!['B29','B30','B31','B32'].includes(p.id)));
assert.ok(!bCurrent.some(p=>p.id==='B-H12'));
assert.equal(pricedSummary(all.filter(p=>p.qty===0)).unpriced,0);
const csv=csvExportRows(all);
assert.equal(csv.length,all.length+1);
assert.deepEqual(csv[0].slice(-4),['scope','traceability','connection','quoteStatus']);
console.log('All BOM rows cite evidence and preserve variant scope and quantities: PASS');
