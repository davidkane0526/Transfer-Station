/**
 * V170: photo-proxy front-port and documented thread-family comparison.
 * The actual A09 model, electrical connector and optical sensor plane remain
 * unidentified. Do not interpret this as installed Thorlabs adapter CAD.
 */
export const A09_CAMERA_INTERFACE_EVIDENCE=Object.freeze({
  familyDrawingUrl:'https://en.daheng-imaging.com/list-61-1.html',
  dahengCmountManualUrl:'https://www.dahengimaging.com/downloads/MERCURY2%20USB3%20Vision%20Cameras%20User%20Manual_V2.0.4.pdf',
  externalCMountThreadReferenceMm:25.4,
  thorlabsCameraAdapterSku:'SM2A55',
  thorlabsAdapterUrl:'https://www.thorlabs.de/newgrouppage9.cfm?objectgroup_id=8210&pn=SM2A55',
  adapterSourceDirection:'internal SM2 (2.035-40) to external C-mount (1.00-32)',
  cameraBodyPhotoProxyDimensionsMm:[50,45,44],
  mouthCandidateDiameterMm:24.4,
  mouthCandidateDepthMm:10,
  frontRingCandidateDiameterMm:30,
  adapterTubeCandidateInternalDiameterMm:52.2
});
const fixed=x=>Number(x.toFixed(2));
export function auditA09CameraCoupling({tubeInnerDiameterMm,frontRingOuterDiameterMm,mouthDiameterMm,
    cameraBodyLowerYmm,adapterUpperYmm,cameraModelConfirmed=false,installedAdapterCount=0}){
  const values=[tubeInnerDiameterMm,frontRingOuterDiameterMm,mouthDiameterMm,cameraBodyLowerYmm,adapterUpperYmm];
  if(values.some(v=>typeof v!=='number'||!Number.isFinite(v))||
     tubeInnerDiameterMm<=frontRingOuterDiameterMm||frontRingOuterDiameterMm<=mouthDiameterMm||mouthDiameterMm<=0||
     !Number.isInteger(installedAdapterCount)||installedAdapterCount<0)
    return {available:false,reason:'invalid-envelope-or-count'};
  const axialFaceGapMm=fixed(cameraBodyLowerYmm-adapterUpperYmm);
  const annularRadialGapMm=fixed((tubeInnerDiameterMm-frontRingOuterDiameterMm)/2);
  return {
    available:true,photoFitBodyDimensionsMm:[...A09_CAMERA_INTERFACE_EVIDENCE.cameraBodyPhotoProxyDimensionsMm],
    candidateMouthDiameterMm:fixed(mouthDiameterMm),
    candidateBlindMouthDepthMm:A09_CAMERA_INTERFACE_EVIDENCE.mouthCandidateDepthMm,
    candidateFrontRingOuterDiameterMm:fixed(frontRingOuterDiameterMm),
    tubeInnerDiameterMm:fixed(tubeInnerDiameterMm),
    unbridgedNominalRadialGapMm:annularRadialGapMm,
    cameraToTubeAxialFaceGapMm:axialFaceGapMm,
    installedCameraThreadAdapterCount:installedAdapterCount,
    requiresDifferentDiameterThreadAdapter:annularRadialGapMm>0,
    axialFaceTouchIsNotThreadEngagement:axialFaceGapMm===0&&annularRadialGapMm>0,
    suggestedOEMFamilyComparison:A09_CAMERA_INTERFACE_EVIDENCE.thorlabsCameraAdapterSku,
    suggestedAdapterInstalled:false,
    cameraCmountInterfaceConfirmed:cameraModelConfirmed,
    physicalJointVerified:false,
    opticalSensorPlaneVerified:false,
    engineeringGrade:false
  };
}
