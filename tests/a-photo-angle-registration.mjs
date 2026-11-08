import assert from 'node:assert/strict';
import {A20261108PhotoAngles,aPhotoCameraPose,photoAProjectedAxis,aPhotoOrientationEvidence}
 from '../src/a-photo-angle-registration.js';

const a=aPhotoOrientationEvidence();
assert.equal(Object.keys(A20261108PhotoAngles).length,2);
assert.equal(a.sameUnchangedHardware,true);
assert.equal(a.camera1SeesNegativeZFace,true);
assert.equal(a.camera2SeesPositiveZFace,true);
assert.equal(a.bentSheetLeftReturnProjectsRightFromCamera1,true);
assert(a.projectedA04PlusXFromCamera1<-.95,
  'Photo1 upper +X G40 micrometer should project LEFT, screen-right is -X');
assert(a.projectedA04PlusXFromCamera2>.65,
  'Photo2 upper +X G40 and A15 X micrometers should project RIGHT');
assert(a.projectedA04LPlusZFromCamera2<-.60,
  'Photo2 independent lower +Z G40 micrometer should project LEFT');
assert(a.projectedA15DepthPlusZFromCamera2<-.60,
  'Photo2 independent +Z bottom micrometer must appear LEFT, not cloned from X');
assert(a.projectedA04LPlusZFromCamera1<-.20,
  'Photo1 lower +Z goniometer also projects LEFT from the screen-facing oblique view');
assert(a.azimuthSeparationCandidateDeg>110&&a.azimuthSeparationCandidateDeg<145,
  'Two different photo views cannot be represented by the same camera or a 30-degree copy');
assert.equal(a.physicallyExactCameraAngleVerified,false);
assert.equal(a.photographyToCADWorldRegistrationVerified,false);
assert.equal(a.proposedCamera1.rollDeg,0);
assert.equal(a.proposedCamera2.rollDeg,0);
for(const v of Object.values(A20261108PhotoAngles))
 assert(v.observedMonitor&&v.visibleStageFace&&v.name);
assert.throws(()=>aPhotoCameraPose('invalid',-116),/Invalid/);
assert.throws(()=>aPhotoCameraPose('monitorLeft',NaN),/Invalid/);
assert.throws(()=>photoAProjectedAxis('monitorLeft','+Y'),/horizontal mechanism/);
console.log('Photo 2026-11-08 dual-camera handedness and two independent A15 XY actuators: PASS');
