/**
 * Mechanical envelope test for the current A08/A14/A09 photo-fit assembly.
 * Optical sensor location is UNKNOWN. The camera body's AABB is an envelope,
 * never an inferred focal plane or confirmed C-mount registration.
 *
 * TTL200-A Rev B OEM drawing gives reference WD 148 mm; some distributors
 * publish 151.8 mm. Both are shown as source-specific context, not tolerance.
 */
export const TTL200A_OPTICAL_EVIDENCE = Object.freeze({
  focalLengthMm:200,
  drawingReferenceWorkingDistanceMm:148,
  distributorWorkingDistanceMm:151.8,
  manufacturerDrawing:'TTN116903-E0W Rev B, 11 May 2018',
  drawingUrl:'https://www.oxxius.ru/upload/iblock/439/nnqcz1typ0xi4j8o1473uwc5izf6lyzm/TTN116903_E0W.pdf',
  distributorUrl:'https://www.govolition.com/product/V40-TTL200-A'
});
const mm=x=>Number(x.toFixed(2));
export function auditTubeLensToCameraProxy({lensCameraSideYmm,cameraLowerYmm,cameraUpperYmm,adapterLowerYmm,adapterUpperYmm}){
  const nums=[lensCameraSideYmm,cameraLowerYmm,cameraUpperYmm,adapterLowerYmm,adapterUpperYmm];
  if(nums.some(x=>typeof x!=='number'||!Number.isFinite(x))||cameraUpperYmm<cameraLowerYmm)
    return {available:false,reason:'invalid-world-space-datums'};
  const nearestDistanceMm=mm(cameraLowerYmm-lensCameraSideYmm);
  const farthestDistanceMm=mm(cameraUpperYmm-lensCameraSideYmm);
  const minWD=TTL200A_OPTICAL_EVIDENCE.drawingReferenceWorkingDistanceMm;
  const altWD=TTL200A_OPTICAL_EVIDENCE.distributorWorkingDistanceMm;
  const minAdditionalMm=mm(Math.max(0,minWD-farthestDistanceMm));
  const refOutside=nearestDistanceMm>altWD||farthestDistanceMm<minWD;
  return {
    available:true,
    lensCameraSideYmm:mm(lensCameraSideYmm),
    cameraBodyLowerYmm:mm(cameraLowerYmm),
    cameraBodyUpperYmm:mm(cameraUpperYmm),
    candidateAdapterLengthMm:mm(adapterUpperYmm-adapterLowerYmm),
    candidateAdapterLowerYmm:mm(adapterLowerYmm),
    candidateAdapterUpperYmm:mm(adapterUpperYmm),
    cameraProxyToLensDistanceMm:[nearestDistanceMm,farthestDistanceMm],
    drawingReferenceWorkingDistanceMm:minWD,
    distributorWorkingDistanceMm:altWD,
    // This only describes the current PHOTO-FIT CAMERA BODY ENVELOPE.
    manufacturerReferenceOutsideCameraProxy:refOutside,
    minimumReferenceShortfallWithinCameraProxyMm:minAdditionalMm,
    cameraModelConfirmed:false,
    sensorPlaneMeasured:false,
    mountingFlangeVerified:false,
    tubeLensInstalledDirectionVerified:false,
    opticalImageFormationCertified:false
  };
}
