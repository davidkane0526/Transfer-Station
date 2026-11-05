import assert from 'node:assert/strict';
import {PURCHASE} from '../src/procurement.js';

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
