// Regression gate for photo 147: two independent orthogonal stages ABOVE a handle-free rotary.
// This is evidence consistency QA, not proof of physical hole registration or interference.
import assert from 'node:assert/strict';
import {AXES,JOINTS} from '../src/assembly-qa.js';
import {PARTS} from '../src/parts.js';
import {photoRefsForPart} from '../src/photo-library.js';
import {stageLocalTranslation,stageLocalDepthTranslation} from '../src/kinematics.js';

const all=new Set(Object.values(PARTS).flatMap(group=>group.map(p=>p.id)));
for(const id of ['B35','B08','B41','B09','B10','B11']){
  assert(all.has(id), 'Missing sample stack item: '+id);
}
assert.equal(AXES.B08.linear,0,'Rotary must not masquerade as XY stage');
assert.equal(AXES.B08.micrometers,0,'Photo147 rotary has NO projecting handle');
assert.deepEqual(AXES.B41.sceneAxes,['Z'],'Lower stage translates front/back');
assert.deepEqual(AXES.B09.sceneAxes,['X'],'Upper NFP translates left/right');
assert.equal(AXES.B41.linear,1);
assert.equal(AXES.B41.micrometers,1);
assert.equal(AXES.B09.linear,1);
assert.equal(AXES.B09.micrometers,1);
assert.equal(AXES.B41.makerAxes.length,0,'B41 maker/model must remain unverified');
for(const id of ['B08','B41','B09']){
  assert.equal(JOINTS[id].status,'candidate',id+' hole registration remains unverified');
  assert(JOINTS[id].count>=1);
  assert(photoRefsForPart('B',id).some(p=>p.id==='147'),
    id+' must retain the common photo147 evidence');
}
const eps=1e-9;
for(const a of [0,Math.PI/6,Math.PI/2,-Math.PI/3]){
  const x=stageLocalTranslation(1,a);
  const z=stageLocalDepthTranslation(1,a);
  assert(Math.abs(x.x*z.x+x.z*z.z)<eps,
    'B41 and B09 must stay orthogonal after rotary yaw');
  assert(Math.abs(Math.hypot(x.x,x.z)-1)<eps);
  assert(Math.abs(Math.hypot(z.x,z.z)-1)<eps);
}
const b41Photos=photoRefsForPart('B','B41');
assert(b41Photos.some(p=>p.id==='147'&&p.src),
  'BOM/model selection must resolve to an embedded photo147');
console.log('B photo147 stack evidence and independent X/Y kinematics: PASS (not physical interface acceptance)');
