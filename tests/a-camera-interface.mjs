import assert from 'node:assert/strict';
import {auditA09CameraCoupling,A09_CAMERA_INTERFACE_EVIDENCE as E} from '../src/a-camera-interface.js';
assert.equal(E.thorlabsCameraAdapterSku,'SM2A55');
assert.deepEqual(E.cameraBodyPhotoProxyDimensionsMm,[50,45,44]);
const a=auditA09CameraCoupling({tubeInnerDiameterMm:52.2,frontRingOuterDiameterMm:30,
 mouthDiameterMm:24.4,cameraBodyLowerYmm:323,adapterUpperYmm:323});
assert.equal(a.available,true);
assert.equal(a.unbridgedNominalRadialGapMm,11.1);
assert.equal(a.cameraToTubeAxialFaceGapMm,0);
assert.equal(a.axialFaceTouchIsNotThreadEngagement,true);
assert.equal(a.installedCameraThreadAdapterCount,0);
assert.equal(a.suggestedAdapterInstalled,false);
assert.equal(a.physicalJointVerified,false);
assert.equal(a.cameraCmountInterfaceConfirmed,false);
assert.equal(a.engineeringGrade,false);
const raised=auditA09CameraCoupling({tubeInnerDiameterMm:52.2,frontRingOuterDiameterMm:30,
 mouthDiameterMm:24.4,cameraBodyLowerYmm:341,adapterUpperYmm:341});
assert.equal(raised.unbridgedNominalRadialGapMm,a.unbridgedNominalRadialGapMm);
assert.equal(raised.cameraToTubeAxialFaceGapMm,0);
// V170 CI: live WebGL mesh coordinates can round to IEEE-754 -0.
const floatNoise=auditA09CameraCoupling({tubeInnerDiameterMm:52.2,frontRingOuterDiameterMm:30,
 mouthDiameterMm:24.4,cameraBodyLowerYmm:322.99999999999994,adapterUpperYmm:323});
assert.equal(Object.is(floatNoise.cameraToTubeAxialFaceGapMm,-0),false);
assert.equal(floatNoise.cameraToTubeAxialFaceGapMm,0);
const actualGap=auditA09CameraCoupling({tubeInnerDiameterMm:52.2,frontRingOuterDiameterMm:30,
 mouthDiameterMm:24.4,cameraBodyLowerYmm:322.8,adapterUpperYmm:323});
assert.equal(actualGap.cameraToTubeAxialFaceGapMm,-.2);
assert.equal(auditA09CameraCoupling({tubeInnerDiameterMm:28,frontRingOuterDiameterMm:30,
 mouthDiameterMm:24.4,cameraBodyLowerYmm:323,adapterUpperYmm:323}).available,false);
console.log('V170 A09 camera inlet and coupling audit: 14 checks passed');
