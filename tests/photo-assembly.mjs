import assert from 'node:assert/strict';
import {PARTS} from '../src/parts.js';
import {STACKS,HANDLES,MAGNET_PLACEMENT,OEM_DRAWING_CONSTRAINTS} from '../src/photo-evidence.js';

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
assert.equal(HANDLES.B03.localDirection,'+X');
assert.equal(HANDLES.B03.installationYawDeg,180);
assert.equal(HANDLES.B03.brandedFace,'-Z');
// Model-space projection test: the exact same B03 micrometer must appear LEFT
// from magnetic-base front (+Z, photo108) and RIGHT from stage branded rear
// (-Z, photo109). This catches the previous "same-face" false pass.
const yaw=HANDLES.B03.installationYawDeg*Math.PI/180;
const handGlobalX=Math.cos(yaw); // local +X transformed through yaw
const stageLogoGlobalZ=Math.cos(yaw); // local +Z transformed through yaw
assert(handGlobalX<-.99,'B03 handle must point world -X relative to base label');
assert(stageLogoGlobalZ<-.99,'B03 logo must face rear -Z, unlike magnet front');
const frontScreenRight=handGlobalX; // +Z camera screen-right is +X
const rearScreenRight=-handGlobalX; // -Z camera screen-right is -X
assert(frontScreenRight<0&&rearScreenRight>0,
 'same B03 handle should look left in 108 and right in 109');
assert.equal(PARTS.A.filter(p=>p.id==='A02'||p.id==='A15').length,2,
 'Photo 97 and 100 require TWO physically distinct T25Ms in A platform');
assert(PARTS.A.find(p=>p.id==='A02').group==='sample');
assert(PARTS.A.find(p=>p.id==='A15').group==='film');
const expected={B03:'-X',B04:'+Y',B08:'+Z',B09:'+X',
 A02:'+X',A15:'+X',A03:'+Y',A04:'+X'};
for(const [id,dir]of Object.entries(expected))
 assert.equal(HANDLES[id].direction,dir,'Wrong actuator direction '+id);
assert.equal(OEM_DRAWING_CONSTRAINTS.twoAxisT25M.heightMm,33);
assert.equal(OEM_DRAWING_CONSTRAINTS.twoAxisT25M.micrometerCount,2);
for(const id of ['B03','A15']){
  assert.equal(HANDLES[id].handles,2,id+' must have TWO horizontal heads');
  assert.equal(HANDLES[id].axes,2,id+' must have two motion axes');
  assert.equal(HANDLES[id].thicknessMm,33,id+' must use original 33mm manufacturer thickness');
  assert.equal(HANDLES[id].secondaryDirection,'+Z',id+' has perpendicular depth control');
}
assert.equal(HANDLES.A02.subtypeUnverified,true);
console.log('Photo-grounded 2-axis/3-axis drive counts and maker dimension constraints passed');
