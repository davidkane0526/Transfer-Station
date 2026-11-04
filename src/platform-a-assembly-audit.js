// V45: the photo-fitted first rig (A) is NOT yet a complete usable transfer assembly.
// This module measures the mutually inconsistent proxy scene datums; none of these
// coordinates should be mistaken for a dimension observed in user photos.
export function auditPlatformAAssembly({
  filmStageX=-116,sampleCenterX=78,sampleHeaterWidthMm=65,
  bracketTopWidthMm=80,bracketOverhangLeftMm=60,
  bracketReturnWidthMm=13,filmTravelHalfMm=12.5,sampleTravelHalfMm=12.5,
  bracketLowestYmm=72,heaterTopYmm=99.2
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
  const remainingHorizontalGapMm=heaterLeftX-
    (farthestRightReturnX+filmTravelHalfMm+sampleTravelHalfMm);
  const heightErrorMm=heaterTopYmm-bracketLowestYmm;
  return Object.freeze({
    profile:'A_photo94_95_97_layout_candidate',
    photoConfirmedGlassClamp:false,
    photoConfirmedMagneticBaseSku:false,
    filmStageX,sampleCenterX,
    stageCenterGapMm:Math.abs(sampleCenterX-filmStageX),
    bracketLeftTipX:leftTipX,
    bracketReturnRightEdgeX:farthestRightReturnX,
    heaterLeftX,
    optimisticResidualHorizontalGapMm:Number(remainingHorizontalGapMm.toFixed(1)),
    verticalBracketBelowHeaterTopMm:Number(heightErrorMm.toFixed(1)),
    nominalApproachEnvelopeRegistered:remainingHorizontalGapMm<=0,
    clampMechanicalInterfaceClosed:false,
    functionalTransferAccepted:false,
    missing:['A05 lower glass jaw model & fixing thread','A17 magnetic base actual SKU, height & mounting pitch',
      'film stage/thermal stage relative origin and direction','A02 actual travel axis','A05-to-glass-to-PDMS contact height'],
    note:'The CURRENT nominal assembly places the folded tip away from, and below, the sample. Do not mirror or stretch the arm without new photographic datum.'
  });
}
