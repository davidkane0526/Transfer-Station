import assert from 'node:assert/strict';
import {PARTS} from '../src/parts.js';
import {STACKS,HANDLES,MAGNET_PLACEMENT} from '../src/photo-evidence.js';

for(const [name,stack] of Object.entries(STACKS)){
  const ids=new Set(PARTS[name].map(p=>p.id));
  for(const branch of ['film','sample']){
    for(const id of stack[branch])
      assert(ids.has(id),name+' '+branch+' part absent from photo ledger: '+id);
  }
}
assert.deepEqual(STACKS.B.film.slice(0,3),['B02','B03','B04']);
assert.deepEqual(STACKS.B.sample.slice(0,2),['B08','B09']);
assert.deepEqual(STACKS.A.film.slice(0,3),['A15','A03','A04']);
assert.deepEqual(STACKS.A.sample.slice(0,2),['A06','A02']);
assert.equal(MAGNET_PLACEMENT.id,'B02');
assert.equal(MAGNET_PLACEMENT.lowest,true);
assert.equal(PARTS.A.filter(p=>p.model==='GCM-T25M').length,2,
 'Photo 97 and 100 require TWO physically distinct T25Ms in A platform');
assert(PARTS.A.find(p=>p.id==='A02').group==='sample');
assert(PARTS.A.find(p=>p.id==='A15').group==='film');
const expected={B03:'-X',B04:'+Y',B08:'+Z',B09:'+X',
 A02:'+X',A15:'+X',A03:'+Y',A04:'+X'};
for(const [id,dir]of Object.entries(expected))
 assert.equal(HANDLES[id].direction,dir,'Wrong actuator direction '+id);
console.log('Photo-grounded A/B component ordering and actuator direction checks passed');
