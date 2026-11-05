import {inferAProxyDimensionsFromOriginalPhotos} from './a-photo-scale-calibration.js';
import {CONFIG} from './parts.js';
import {V48_RULER_EVIDENCE,auditV48RulerRegistration} from './v48-ruler-registration.js';
const V47_A_LOCAL_SHEET=inferAProxyDimensionsFromOriginalPhotos();
// V47: first-rig local sheet dimensions scale to photo94 G40, global origin unregistered.
// This module measures the mutually inconsistent proxy scene datums; none of these
// coordinates should be mistaken for a dimension observed in user photos.
export function auditPlatformAAssembly({
  filmStageX=CONFIG.A.armX,sampleCenterX=CONFIG.A.sampleX,sampleHeaterWidthMm=65,
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
  // Photo94 silhouette: the L bracket is attached to A15, with a
  // free left-hand return. Use symmetric interval separation, not
  // "heater left minus bracket right" alone. That old one-sided test
  // incorrectly accepted a bracket far to the RIGHT of the heater.
  const leftTipX=filmStageX-bracketOverhangLeftMm;
  const farthestRightReturnX=leftTipX+bracketReturnWidthMm;
  const heaterLeftX=sampleCenterX-sampleHeaterWidthMm/2;
  const heaterRightX=sampleCenterX+sampleHeaterWidthMm/2;
  const combinedTravelMm=filmTravelHalfMm+sampleTravelHalfMm;
  const intervalGap=(leftA,rightA,leftB,rightB)=>
    Math.max(0,leftA-rightB,leftB-rightA);
  const remainingHorizontalGapMm=Math.max(0,
    intervalGap(leftTipX,farthestRightReturnX,heaterLeftX,heaterRightX)-
    combinedTravelMm);
  // Sensitivity only: mirroring is NOT photo-grounded and cannot be
  // promoted to a real installed orientation.
  const mirrorTipLeftX=2*filmStageX-farthestRightReturnX;
  const mirrorTipRightX=2*filmStageX-leftTipX;
  const mirroredGapMm=Math.max(0,
    intervalGap(mirrorTipLeftX,mirrorTipRightX,heaterLeftX,heaterRightX)-
    combinedTravelMm);
  // Mechanical feasibility of an UNMEASURED global placement. 112mm
  // A16 OEM length and 65mm A17 candidate width must not overlap at
  // the common board plane; a 5mm scene-only reserve is not OEM data.
  const filmMagnetHalfWidthMm=32.5;
  const sampleBaseHalfWidthMm=56;
  const candidateBaseReserveMm=5;
  const requiredRightOfSampleMm=sampleBaseHalfWidthMm+
    filmMagnetHalfWidthMm+candidateBaseReserveMm;
  const maxFilmXOnBoard=CONFIG.board.width/2-filmMagnetHalfWidthMm;
  const maxRelativeReachFromLeftBracketMm=bracketOverhangLeftMm+
    sampleHeaterWidthMm/2+combinedTravelMm;
  const tentativeFilmStageXInterval=[
    Number((sampleCenterX+requiredRightOfSampleMm).toFixed(1)),
    Number(Math.min(maxFilmXOnBoard,
      sampleCenterX+maxRelativeReachFromLeftBracketMm).toFixed(1))
  ];
  const sceneOnlyCandidateIntervalExists=
    tentativeFilmStageXInterval[0]<=tentativeFilmStageXInterval[1];
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
    currentFilmMinusSampleXmm:filmStageX-sampleCenterX,
    heaterRightX,
    candidateRelativeMountingReserveMm:candidateBaseReserveMm,
    tentativeFilmStageXInterval,
    sceneOnlyCandidateIntervalExists,
    candidateIntervalUsesUnverifiedA17Footprint:true,
    candidateIntervalIsPhotoRegistration:false,
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
