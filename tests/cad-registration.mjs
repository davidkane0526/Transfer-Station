import assert from 'node:assert/strict';
import {parseXZ,fitRigidXZ} from '../src/cad-registration.js';

assert.deepEqual(parseXZ(' 25 , -16 '),{x:25,z:-16});
assert.deepEqual(parseXZ(' -16， 25 '),{x:-16,z:25});
for(const input of ['','5','3,','1,2,3','a,b','NaN,0','Infinity,0']){
 assert.throws(()=>parseXZ(input),undefined,'Expected parser rejection: '+input);
}
const mapped=[
 {source:{x:10,z:0},target:{x:7,z:10}},
 {source:{x:35,z:0},target:{x:7,z:-15}},
 {source:{x:10,z:20},target:{x:27,z:10}}
];
const fit=fitRigidXZ(mapped);
assert(Math.abs(fit.yawDeg-90)<1e-9,'Three.js +Y handedness must be preserved');
assert(Math.abs(fit.translationXmm-7)<1e-9);
assert(Math.abs(fit.translationZmm-20)<1e-9);
assert(fit.maxErrorMm<1e-9);
assert.equal(fit.accepted,false,'Coordinate preview cannot certify an OEM mechanical joint');
assert.equal(fit.registrationKind,'coordinate_preview_only');
assert.equal(fit.pairCount,3);
const two=fitRigidXZ(mapped.slice(0,2));
assert(Math.abs(two.yawDeg-90)<1e-9);
assert(Math.abs(two.translationZmm-20)<1e-9);
assert.throws(()=>fitRigidXZ([mapped[0]]),/至少提供两对/);
assert.throws(()=>fitRigidXZ([
 {source:{x:0,z:0},target:{x:0,z:0}},
 {source:{x:0,z:0},target:{x:25,z:0}}
]),/太近或重合/);
assert.throws(()=>fitRigidXZ([
 {source:{x:0,z:0},target:{x:0,z:0}},
 {source:{x:25,z:0},target:{x:26,z:0}}
]),/距离不一致/,'A shifted hole pitch must not be corrected by scaling');
assert.throws(()=>fitRigidXZ([
 {source:{x:0,z:0},target:{x:0,z:0}},
 {source:{x:25,z:0},target:{x:-25,z:0}},
 {source:{x:0,z:20},target:{x:0,z:20}}
]),/配准点残差/,'A 3-point reflected coordinate system must not pass rigid fit');
assert.throws(()=>fitRigidXZ([
 {source:{x:0,z:0},target:{x:0,z:0}},
 {source:{x:30,z:0},target:{x:31,z:0}}
]),/距离不一致/,'Do not accept 1mm mismatched hole pitch');
console.log('Rigid XZ feature registration QA: PASS (no automatic fit acceptance)');
