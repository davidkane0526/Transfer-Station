import assert from 'node:assert/strict';
import {auditTubeLensToCameraProxy,TTL200A_OPTICAL_EVIDENCE} from '../src/a-optical-reference.js';
assert.equal(TTL200A_OPTICAL_EVIDENCE.drawingReferenceWorkingDistanceMm,148);
assert.equal(TTL200A_OPTICAL_EVIDENCE.distributorWorkingDistanceMm,151.8);
const base={lensCameraSideYmm:263,cameraLowerYmm:323,cameraUpperYmm:368,
 adapterLowerYmm:259.8,adapterUpperYmm:323};
const a=auditTubeLensToCameraProxy(base);
assert.equal(a.available,true);
assert.deepEqual(a.cameraProxyToLensDistanceMm,[60,105]);
assert.equal(a.minimumReferenceShortfallWithinCameraProxyMm,43);
assert.equal(a.manufacturerReferenceOutsideCameraProxy,true);
assert.equal(a.candidateAdapterLengthMm,63.2);
assert.equal(a.sensorPlaneMeasured,false);
assert.equal(a.opticalImageFormationCertified,false);
// Rigid parking lift MUST NOT change relative optical distances.
const raised=auditTubeLensToCameraProxy(Object.fromEntries(
 Object.entries(base).map(([k,v])=>[k,v+18])));
assert.deepEqual(raised.cameraProxyToLensDistanceMm,a.cameraProxyToLensDistanceMm);
assert.equal(raised.minimumReferenceShortfallWithinCameraProxyMm,43);
// A long extension can satisfy a *geometric envelope*, never prove real imaging.
const candidate=auditTubeLensToCameraProxy({lensCameraSideYmm:263,cameraLowerYmm:408,
 cameraUpperYmm:453,adapterLowerYmm:259.8,adapterUpperYmm:408});
assert.equal(candidate.manufacturerReferenceOutsideCameraProxy,false);
assert.equal(candidate.opticalImageFormationCertified,false);
assert.equal(auditTubeLensToCameraProxy({...base,cameraUpperYmm:NaN}).available,false);
console.log('A optical-reference envelope audit: 8 checks passed');
