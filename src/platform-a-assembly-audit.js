import {inferAProxyDimensionsFromOriginalPhotos} from './a-photo-scale-calibration.js';
import {V48_RULER_EVIDENCE,auditV48RulerRegistration} from './v48-ruler-registration.js';
const V47_A_LOCAL_SHEET=inferAProxyDimensionsFromOriginalPhotos();
// V47: first-rig local sheet dimensions scale to photo94 G40, global origin unregistered.
// This module measures the mutually inconsistent proxy scene datums; none of these
// coordinates should be mistaken for a dimension observed in user photos.
export function auditPlatformAAssembly({
  filmStageX=-116,sampleCenterX=78,sampleHeaterWidthMm=65,
  bracketTopWidthMm=Math.round(V47_A_LOCAL_SHEET.sheetTopWidthMm),
  bracketOverhangLeftMm=Math.round(V47_A_LOCAL_SHEET.sheetLeftOverhangMm),
  bracketReturnWidthMm=13,filmTravelHalfMm=12.5,sampleTravelHalfMm=12.5,
  bracketLowestYmm=92,heaterTopYmm=auditV48RulerRegistration().sampleTopGlobalMm
}={}){
  const numbers=[filmStageX,sampleCenterX,sampleHeaterWidthMm,
    bracketTopWidthMm,bracketOverhangLeftMm,bracketReturnWidthMm,
    filmTravelHalfMm,sampleTravelHalfMm,bracketLowestYmm,heaterTopYmm];
  if(numbers.some(v=>!Number.isFinite(v))||sampleHeaterWidthMm<=0||
    bracketTopWidthMm<=0||bracketOverhangLeftMm<0||
    bracketReturnWidthMm<=0||filmTravelHalfMm<0||sampleTravelHalfMm<0)
    throw new RangeError('Invalid A rig candidate geometry');
  // Photo94 folded metal overhang faces left in the CURRENT coordinates.
  const leftTipX=filmStageX-bracketOverhangLeftMm;
  const farthestRightReturnX=leftTipX+bracketReturnWidthMm;
  const heaterLeftX=sampleCenterX-sampleHeaterWidthMm/2;
  // Best-case shift uses both stages toward one another.
  const combinedTravelMm=filmTravelHalfMm+sampleTravelHalfMm;
  const remainingHorizontalGapMm=heaterLeftX-
    (farthestRightReturnX+combinedTravelMm);
  // Sensitivity-only scenario: mirror the narrow L sheet around A15 X.
  // This is NOT a photographed orientation change nor a CAD repair.
  const mirrorTipLeftX=2*filmStageX-farthestRightReturnX;
  const mirrorTipRightX=2*filmStageX-leftTipX;
  const mirroredGapMm=heaterLeftX-(mirrorTipRightX+combinedTravelMm);
  const heightErrorMm=heaterTopYmm-bracketLowestYmm;
  return Object.freeze({
    profile:'A_photo94_95_97_layout_candidate',
    photoConfirmedGlassClamp:false,
    localSheetSizeManuallyCalibratedFromG40Photo94:true,
    secondTwentyMmGoniometerCandidateAdded:true,
    secondGoniometerActualSkuVerified:false,
    sourceRulerMeasurementsAvailable:true,
    sourceRulerPhotoIds:['17','18','19','20','21'],
    sampleTopAboveBoardMeasuredRangeMm:[V48_RULER_EVIDENCE.A.sampleTopHeightAboveBreadboardMm.min,V48_RULER_EVIDENCE.A.sampleTopHeightAboveBreadboardMm.max],
    sampleTopStackGeometryRulerCompatible:auditV48RulerRegistration().sampleTopWithinVisibleRulerRange,
    absoluteFilmSampleCoordinatesPhotoRegistered:false,
    photoConfirmedMagneticBaseSku:false,
    filmStageX,sampleCenterX,
    stageCenterGapMm:Math.abs(sampleCenterX-filmStageX),
    bracketLeftTipX:leftTipX,
    bracketReturnRightEdgeX:farthestRightReturnX,
    heaterLeftX,
    optimisticResidualHorizontalGapMm:Number(remainingHorizontalGapMm.toFixed(1)),
    mirroredReturnLeftX:mirrorTipLeftX,
    mirroredReturnRightX:mirrorTipRightX,
    mirroredOrientationResidualGapMm:Number(mirroredGapMm.toFixed(1)),
    bestOfTwoOrientationsResidualGapMm:Number(Math.min(remainingHorizontalGapMm,mirroredGapMm).toFixed(1)),
    orientationFlipAloneCannotResolveReach:mirroredGapMm>0&&remainingHorizontalGapMm>0,
    orientationMeasuredFromPhoto:false,
    verticalBracketBelowHeaterTopMm:Number(heightErrorMm.toFixed(1)),
    nominalApproachEnvelopeRegistered:remainingHorizontalGapMm<=0,
    clampMechanicalInterfaceClosed:false,
    functionalTransferAccepted:false,
    missing:['A05 lower glass jaw model & fixing thread','A17 magnetic base actual SKU, height & mounting pitch',
      'film stage/thermal stage relative origin and direction','A02 actual travel axis','A05-to-glass-to-PDMS contact height'],
    note:'A ruler photos17/18 establish silver sample top near90mm ABOVE THE BOARD TOP, not absolute model-Z; A05 local sheet uses original photo94 OEM ratio. Global film-to-sample X/Y registration remains UNKNOWN, so horizontal reach gaps are provisional scene diagnostics.'
  });
}
