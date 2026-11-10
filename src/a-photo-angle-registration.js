// V130: photo 1 is the canonical platform-A orientation anchor.
// Photos 2 and 3 are rotated side inspections. Their screen-left/right
// constrains topology only and must not redefine photo 1 handedness.
export const A20261108PhotoAngles=Object.freeze({
 monitorBehind:{id:'canonical-front',name:'图1｜正确朝向基准',cameraOffsetMm:Object.freeze([100,43,345]),
  targetOffsetMm:Object.freeze([0,128,0]),evidenceRole:'canonical-orientation-anchor',
  hardwareRotatedForPhoto:false,originalCameraCalibrated:false},
 monitorLeft:{id:'rotated-side-a',name:'图2｜旋转后的侧面 A',cameraOffsetMm:Object.freeze([245,90,-265]),
  targetOffsetMm:Object.freeze([0,119,0]),evidenceRole:'rotated-side-topology-only',
  hardwareRotatedForPhoto:true,hardwareYawCandidateDeg:90,originalCameraCalibrated:false},
 monitorRight:{id:'rotated-side-b',name:'图3｜旋转后的侧面 B',cameraOffsetMm:Object.freeze([-245,78,-235]),
  targetOffsetMm:Object.freeze([0,119,0]),evidenceRole:'rotated-side-topology-only',
  hardwareRotatedForPhoto:true,hardwareYawCandidateDeg:-90,originalCameraCalibrated:false}
});
export function aPhotoCameraPose(mode,stageX){
 const c=A20261108PhotoAngles[mode];
 if(!c||!Number.isFinite(stageX))throw new RangeError('Invalid A photo camera');
 return {id:c.id,position:[stageX+c.cameraOffsetMm[0],c.cameraOffsetMm[1]+c.targetOffsetMm[1],c.cameraOffsetMm[2]],
  target:[stageX+c.targetOffsetMm[0],c.targetOffsetMm[1],c.targetOffsetMm[2]],rollDeg:0,
  evidenceRole:c.evidenceRole,hardwareRotatedForPhoto:Boolean(c.hardwareRotatedForPhoto),
  hardwareYawCandidateDeg:c.hardwareYawCandidateDeg??0,hardwareYawVerified:false,fullyCalibrated:false};
}
export function photoAProjectedAxis(mode,axis){
 const def=A20261108PhotoAngles[mode];if(!def)throw new RangeError('Unknown A photo direction');
 const [cx,,cz]=def.cameraOffsetMm,h=Math.hypot(cx,cz);if(h<=0)throw new RangeError('Photo camera at target');
 const rightX=cz/h,rightZ=-cx/h;
 const v=axis==='+X'?[1,0]:axis==='-X'?[-1,0]:axis==='+Z'?[0,1]:axis==='-Z'?[0,-1]:null;
 if(!v)throw new RangeError('Expected one horizontal mechanism axis');
 return Number((rightX*v[0]+rightZ*v[1]).toFixed(4));
}
export function aPhotoOrientationEvidence(){
 return {canonicalOrientationSource:'photo-1',photo1DefinesInstalledHandedness:true,canonicalInstalledYawDeg:180,
  photo2HardwareRotatedForSideView:true,photo3HardwareRotatedForSideView:true,
  sideViewsMayConstrainTopologyButNotCanonicalScreenDirection:true,sideHardwareYawExactlyVerified:false,
  photoReferenceAndWorkingOrientationMustMatch:true,photographyToCADWorldRegistrationVerified:false,
  proposedCamera1:aPhotoCameraPose('monitorBehind',-116),proposedCamera2:aPhotoCameraPose('monitorLeft',-116),
  proposedCamera3:aPhotoCameraPose('monitorRight',-116)};
}
