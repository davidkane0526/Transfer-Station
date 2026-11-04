import assert from 'node:assert/strict';
import {MOUNT_RULES,mountStatus,auditBaseTopology} from '../src/assembly-mounts.js';
for(const side of ['A','B']){
 const a=auditBaseTopology(side);
 assert.equal(a.commonBreadboardCount,1);
 assert.equal(a.photoRigIndependentFromOtherRig,true);
 assert.equal(mountStatus(side,a.commonBase).kind,'base');
 assert.equal(mountStatus(side,a.magneticBase).kind,'magnetic');
 assert.equal(mountStatus(side,a.magneticallyMountedStageId).kind,'magnetic');
 assert.equal(a.manufacturerAnchorsAllVerified,false);
}
assert.equal(mountStatus('B','B35').kind,'accessory');
assert.equal(mountStatus('B','B08').kind,'bolted');
assert.equal(mountStatus('B','B16').kind,'bolted');
assert.equal(mountStatus('B','B20').kind,'separate');
assert.equal(mountStatus('A','A16').kind,'bolted');
assert.equal(mountStatus('A','A12').kind,'separate');
assert.equal(MOUNT_RULES.A.accessoryBoards.length,0);
assert.deepEqual(MOUNT_RULES.B.accessoryBoards,['B35']);
console.log('V38 each rig single base + magnetic slide stage + bolted optics + independent external peripherals: PASS');
