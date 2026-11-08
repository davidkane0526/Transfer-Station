// Camera-side constraints from TWO distinct 2026-11-08 user photographs.
// Both depict the SAME platform A. Monitor location is EXTERNAL
// reference only, never part of the instrument assembly.
// Camera distances/pitch are first-pass, not calibrated focal solutions.
// Scene coordinates: +X right with the VC13M labeled face at scene +Z,
// +Y vertical, A15 reverse silver slot at -Z.
// From -Z, projected +X appears LEFT; from +X/+Z projected +X
// appears RIGHT, and projected +Z (the second XY actuator) appears LEFT.
export const A20261108PhotoAngles=Object.freeze({
  monitorBehind:{
    id:'monitor-behind',name:'照片1｜屏幕居中、长槽板面朝镜头',
    cameraOffsetMm:Object.freeze([14,43,-345]),
    targetOffsetMm:Object.freeze([0,128,0]),
    observedMonitor:'large nearly frontal Windows desktop behind transfer stack',
    visibleStageFace:'A15 silver sliding slot -Z',
    visibleMicrometers:['A15 X at image LEFT','upper G40 +X at image LEFT'],
    bentBracketScreenSide:'RIGHT',
    originalCameraCalibrated:false
  },
  monitorLeft:{
    id:'monitor-left',name:'照片2｜屏幕偏左、VC13M铭牌正面',
    cameraOffsetMm:Object.freeze([245,90,265]),
    targetOffsetMm:Object.freeze([0,119,0]),
    observedMonitor:'Windows desktop on LEFT of instrument image',
    visibleStageFace:'A03/VC13M +Z front and right-hand +X knobs',
    visibleMicrometers:['upper G40 +X RIGHT','A15 +X RIGHT','A15 +Z LEFT'],
    bentBracketScreenSide:'LEFT or partly occluded',
    originalCameraCalibrated:false
  }
});
export function aPhotoCameraPose(mode,stageX){
  const c=A20261108PhotoAngles[mode];
  if(!c||!Number.isFinite(stageX))throw new RangeError('Invalid A photo camera');
  return {
    id:c.id,
    position:[stageX+c.cameraOffsetMm[0],c.cameraOffsetMm[1]+c.targetOffsetMm[1],
      c.cameraOffsetMm[2]],
    target:[stageX+c.targetOffsetMm[0],c.targetOffsetMm[1],c.targetOffsetMm[2]],
    rollDeg:0,
    fullyCalibrated:false
  };
}
export function photoAProjectedAxis(mode,axis){
  const def=A20261108PhotoAngles[mode];
  if(!def)throw new RangeError('Unknown A photo direction');
  const [cx,,cz]=def.cameraOffsetMm;
  const h=Math.hypot(cx,cz);
  if(h<=0)throw new RangeError('Photo camera at target');
  const rightX=cz/h,rightZ=-cx/h;
  const v=axis==='+X'?[1,0]:axis==='-X'?[-1,0]:
    axis==='+Z'?[0,1]:axis==='-Z'?[0,-1]:null;
  if(!v)throw new RangeError('Expected one horizontal mechanism axis');
  return Number((rightX*v[0]+rightZ*v[1]).toFixed(4));
}
export function aPhotoOrientationEvidence(){
  const m1=aPhotoCameraPose('monitorBehind',-116);
  const m2=aPhotoCameraPose('monitorLeft',-116);
  const az=key=>{
    const p=A20261108PhotoAngles[key].cameraOffsetMm;
    return Math.atan2(p[0],p[2])*180/Math.PI;
  };
  let separation=Math.abs(az('monitorBehind')-az('monitorLeft'));
  separation=Math.min(separation,360-separation);
  return {
    sameUnchangedHardware:true,
    photographedScreenIsExternalReference:true,
    camera1SeesNegativeZFace:true,
    camera2SeesPositiveZFace:true,
    projectedA04PlusXFromCamera1:photoAProjectedAxis('monitorBehind','+X'),
    projectedA04PlusXFromCamera2:photoAProjectedAxis('monitorLeft','+X'),
    projectedA04LMinusXFromCamera2:photoAProjectedAxis('monitorLeft','-X'),
    projectedA15DepthPlusZFromCamera2:photoAProjectedAxis('monitorLeft','+Z'),
    bentSheetLeftReturnProjectsRightFromCamera1:
      photoAProjectedAxis('monitorBehind','-X')>0,
    azimuthSeparationCandidateDeg:Number(separation.toFixed(2)),
    proposedCamera1:m1,proposedCamera2:m2,
    physicallyExactCameraAngleVerified:false,
    photographyToCADWorldRegistrationVerified:false
  };
}
