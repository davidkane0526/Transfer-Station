// V58: photo-unverified but mechanically testable platform-A layout hypothesis.
// The original photo94 left-return configuration remains separately selectable
// in the browser. This is NEVER a measured global stage registration.
export const A_WORKING_LAYOUT=Object.freeze({
  filmStageX:-82.75, filmStageZ:0, sampleCenterX:78,
  lBracketHandedness:'right',
  lBracketOverhangMm:60, lBracketTopWidthMm:87, lLegLengthMm:52.1,
  glassLengthMm:76, glassWidthMm:26, glassThicknessMm:1,
  pdmsLengthMm:8, pdmsThicknessMm:1.8, stampRightMarginMm:4,
  magnetFootprintMm:65, sampleBaseFootprintXmm:112,
  heaterFootprintMm:65, sampleChipFootprintMm:28, heaterTopWorldYmm:109.2,
  sampleChipTopWorldYmm:110.6,
  bracketTopWorldYmm:164, initialVC13LiftMm:13,
  opticalParkingLiftMm:18, // collision-avoidance DISPLAY pose only: NOT an OEM focus travel
  maximumFilmTravelMm:12.5, maximumSampleTravelMm:12.5,
  clearanceReserveMm:0.5
});
export function auditAWorkingLayout({
  filmShiftMm=0,filmDepthShiftMm=0,sampleShiftMm=0,
  sampleAngleDeg=0,filmDropMm=0,d=A_WORKING_LAYOUT
}={}){
  const inputs=[filmShiftMm,filmDepthShiftMm,sampleShiftMm,sampleAngleDeg,filmDropMm];
  if(inputs.some(x=>!Number.isFinite(x))||filmDropMm<0||filmDropMm>d.initialVC13LiftMm)
    throw new RangeError('Invalid platform-A working candidate pose');
  const r=sampleAngleDeg*Math.PI/180,c=Math.cos(r),s=Math.sin(r);
  const legX=d.filmStageX+d.lBracketOverhangMm-1.25+filmShiftMm;
  // V70: glass must begin OUTSIDE the last wing bolt/short-foot metal.
  // Widen the right L reach by 12mm AND move the film stage left 12mm to preserve stamp center X=78 while clearing the right-hand G40 knob.
  const glassLeftX=legX+34;
  const glassRightX=glassLeftX+d.glassLengthMm;
  const stampCenterX=glassRightX-d.stampRightMarginMm-d.pdmsLengthMm/2;
  const stampCenterZ=d.filmStageZ+filmDepthShiftMm;
  const sampleWorldX=d.sampleCenterX+sampleShiftMm*c;
  const sampleWorldZ=-sampleShiftMm*s;
  const heaterHalfEnvelopeX=d.heaterFootprintMm/2*(Math.abs(c)+Math.abs(s));
  const heaterLeftX=sampleWorldX-heaterHalfEnvelopeX;
  const heaterRightX=sampleWorldX+heaterHalfEnvelopeX;
  const clampRightX=legX+44; // flush V73 10mm jaw from x=leg+34..+44, outside the heater
  const clampHeaterClearanceMm=heaterLeftX-clampRightX;
  const footprintGapMm=(d.sampleCenterX-d.sampleBaseFootprintXmm/2)-
    (d.filmStageX+d.magnetFootprintMm/2);
  const stampHalf=d.pdmsLengthMm/2;
  const stampInsideHeaterBoundingBox=
    stampCenterX-stampHalf>=heaterLeftX&&
    stampCenterX+stampHalf<=heaterRightX&&
    Math.abs(stampCenterZ-sampleWorldZ)+stampHalf<=heaterHalfEnvelopeX;
  // The 8x8mm stamp must sit on the ACTUAL DISPLAYED 28x28mm sample
  // chip, not merely within the much larger 65mm heater. For rotated
  // sample stages, check all FOUR corners in the chip's local frame.
  // An axis-aligned heater bounding box previously gave false-safe poses.
  const chipHalf=d.sampleChipFootprintMm/2;
  const stampCorners=[[-stampHalf,-stampHalf],[-stampHalf,stampHalf],
                      [stampHalf,-stampHalf],[stampHalf,stampHalf]];
  const localCorners=stampCorners.map(([ox,oz])=>{
    const dx=stampCenterX+ox-sampleWorldX;
    const dz=stampCenterZ+oz-sampleWorldZ;
    return {x:c*dx-s*dz,z:s*dx+c*dz};
  });
  const minimumStampEdgeInsetMm=Math.min(...localCorners.flatMap(p=>
    [chipHalf-Math.abs(p.x),chipHalf-Math.abs(p.z)]));
  const stampInsideSampleChipFootprint=minimumStampEdgeInsetMm>=-1e-8;
  const initialStampBottomYmm=d.bracketTopWorldYmm+d.initialVC13LiftMm-
    d.lLegLengthMm+1-1.4-d.pdmsThicknessMm/2;
  const stampBottomYmm=initialStampBottomYmm-filmDropMm;
  const verticalStampGapMm=stampBottomYmm-d.sampleChipTopWorldYmm;
  const basesSeparate=footprintGapMm>0;
  const clipOutsideHeater=clampHeaterClearanceMm>=d.clearanceReserveMm;
  const candidateCanLower=basesSeparate&&clipOutsideHeater&&
    stampInsideHeaterBoundingBox&&stampInsideSampleChipFootprint&&verticalStampGapMm>=-1e-8;
  return Object.freeze({
    verification:'unverified working layout only',
    rawPhoto94LeftBendPreservedInOtherView:true,
    actualStagePosePhotoRegistered:false,
    A17SkuVerified:false,A05CClampSkuVerified:false,
    filmStageX:d.filmStageX,filmStageZ:d.filmStageZ,sampleStageX:d.sampleCenterX,
    handedness:d.lBracketHandedness,
    bracketVerticalLegMm:d.lLegLengthMm,
    stampCenterX:Number(stampCenterX.toFixed(2)),
    stampCenterZ:Number(stampCenterZ.toFixed(2)),
    glassLeftX:Number(glassLeftX.toFixed(2)),
    glassRightX:Number(glassRightX.toFixed(2)),
    heaterLeftX:Number(heaterLeftX.toFixed(2)),
    heaterRightX:Number(heaterRightX.toFixed(2)),
    clampRightX:Number(clampRightX.toFixed(2)),
    clampHeaterClearanceMm:Number(clampHeaterClearanceMm.toFixed(2)),
    footprintGapMm:Number(footprintGapMm.toFixed(2)),
    initialVerticalStampGapMm:Number((initialStampBottomYmm-d.sampleChipTopWorldYmm).toFixed(2)),
    sampleChipTopWorldYmm:d.sampleChipTopWorldYmm,
    metalHeaterTopWorldYmm:d.heaterTopWorldYmm,
    verticalStampGapMm:Number(verticalStampGapMm.toFixed(2)),
    stampRightMarginMm:d.stampRightMarginMm,
    stampInsideHeaterBoundingBox,stampInsideSampleChipFootprint,
    sampleChipFootprintMm:d.sampleChipFootprintMm,
    minimumStampEdgeInsetMm:Number(minimumStampEdgeInsetMm.toFixed(3)),
    clipOutsideHeater,basesSeparate,
    candidateCanLower, // planar-preview eligibility ONLY, not full 3D physical safety
    photographedWingScrewAxis:'X-outward',
    glassMountActuallyObservedInPhotos194196:false,
    candidateJawsObservedInPhotos194196:false,
    fullCandidateClampAssemblyCertified:false,
    filmBaseRepositionedMm:-36,
    wingScrewsOutsideUndrilledGlass:true,
    candidateFootGlassPlanarOverlap:false,
    usableForMachining:false,
    actualClampAndMountingHolesUnknown:true,
    opticalParkingLiftMm:d.opticalParkingLiftMm,
    opticalParkingMechanismVerified:false,
    opticalWorkingDistanceVerified:false,
    fullMechanicalCollisionProof:false
  });
}
