// V79: platform-A installed transfer layout.
// The photographed A05 sheet is defined once in its local LEFT-handed form.
// The COMPLETE film-side chain A17→A15→A03→A04L→A04→A05→clamp→glass
// is then installed with a 180° yaw, rather than mirroring only A05.
export const A_WORKING_LAYOUT=Object.freeze({
  filmStageX:-82.75, filmStageZ:0, sampleCenterX:78,
  localBracketHandedness:'left', installedFilmYawDeg:180,
  lBracketOverhangMm:60, lBracketTopWidthMm:87, lLegLengthMm:52.1,
  metalThicknessMm:2.5,
  glassLengthMm:76, glassWidthMm:26, glassThicknessMm:1,
  glassNearFromLegMm:34, clampLengthMm:28,
  pdmsLengthMm:8, pdmsThicknessMm:1.8, stampRightMarginMm:4,
  screwAxis:'scene-Z / parallel to 26mm glass short edge',
  screwPitchAlongGlassLengthMm:18,
  magnetFootprintMm:65, sampleBaseFootprintXmm:112,
  heaterFootprintMm:65, sampleChipFootprintMm:28, heaterTopWorldYmm:109.2,
  sampleChipTopWorldYmm:110.6,
  bracketTopWorldYmm:164, initialVC13LiftMm:13,
  opticalParkingLiftMm:18, // display-only until real focus mechanism is identified
  maximumFilmTravelMm:12.5, maximumSampleTravelMm:12.5,
  clearanceReserveMm:0.5
});
const n2=x=>Number(x.toFixed(2));
export function auditAWorkingLayout({
  filmShiftMm=0,filmDepthShiftMm=0,sampleShiftMm=0,
  sampleAngleDeg=0,filmDropMm=0,d=A_WORKING_LAYOUT
}={}){
  const inputs=[filmShiftMm,filmDepthShiftMm,sampleShiftMm,sampleAngleDeg,filmDropMm];
  if(inputs.some(x=>!Number.isFinite(x))||filmDropMm<0||filmDropMm>d.initialVC13LiftMm)
    throw new RangeError('Invalid platform-A installed candidate pose');
  const r=sampleAngleDeg*Math.PI/180,c=Math.cos(r),s=Math.sin(r);
  // Local coordinates before the common 180° installation rotation.
  const localLegX=-d.lBracketOverhangMm+d.metalThicknessMm/2;
  const localGlassNearX=localLegX-d.glassNearFromLegMm;
  const localGlassFarX=localGlassNearX-d.glassLengthMm;
  const localStampX=localGlassNearX-
    (d.glassLengthMm-d.stampRightMarginMm-d.pdmsLengthMm/2);
  const localClampCenterX=localGlassNearX-d.clampLengthMm/2;
  // 180° yaw around the film-stage centre maps local x -> -local x.
  const worldX=localX=>d.filmStageX-localX+filmShiftMm;
  const glassNearX=worldX(localGlassNearX);
  const glassFarX=worldX(localGlassFarX);
  const glassLeftX=Math.min(glassNearX,glassFarX);
  const glassRightX=Math.max(glassNearX,glassFarX);
  const stampCenterX=worldX(localStampX);
  const clampCenterX=worldX(localClampCenterX);
  const clampLeftX=clampCenterX-d.clampLengthMm/2;
  const clampRightX=clampCenterX+d.clampLengthMm/2;
  const stampCenterZ=d.filmStageZ+filmDepthShiftMm;
  const sampleWorldX=d.sampleCenterX+sampleShiftMm*c;
  const sampleWorldZ=-sampleShiftMm*s;
  const heaterHalfEnvelopeX=d.heaterFootprintMm/2*(Math.abs(c)+Math.abs(s));
  const heaterLeftX=sampleWorldX-heaterHalfEnvelopeX;
  const heaterRightX=sampleWorldX+heaterHalfEnvelopeX;
  const intervalGap=(l1,r1,l2,r2)=>Math.max(0,l1-r2,l2-r1);
  const clampHeaterClearanceMm=intervalGap(
    clampLeftX,clampRightX,heaterLeftX,heaterRightX);
  const footprintGapMm=(d.sampleCenterX-d.sampleBaseFootprintXmm/2)-
    (d.filmStageX+d.magnetFootprintMm/2);
  const stampHalf=d.pdmsLengthMm/2;
  const stampInsideHeaterBoundingBox=
    stampCenterX-stampHalf>=heaterLeftX&&
    stampCenterX+stampHalf<=heaterRightX&&
    Math.abs(stampCenterZ-sampleWorldZ)+stampHalf<=heaterHalfEnvelopeX;
  const chipHalf=d.sampleChipFootprintMm/2;
  const stampCorners=[[-stampHalf,-stampHalf],[-stampHalf,stampHalf],
                      [stampHalf,-stampHalf],[stampHalf,stampHalf]];
  const localCorners=stampCorners.map(([ox,oz])=>{
    const dx=stampCenterX+ox-sampleWorldX,dz=stampCenterZ+oz-sampleWorldZ;
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
    verification:'V79 rigid-180 installed geometry candidate; dimensions still require physical validation',
    photoReferenceUsesSameUnmirroredSheet:true,
    actualStagePosePhotoRegistered:false,
    A17SkuVerified:false,A05CClampSkuVerified:false,
    filmStageX:d.filmStageX,filmStageZ:d.filmStageZ,sampleStageX:d.sampleCenterX,
    localHandedness:d.localBracketHandedness,installedFilmYawDeg:d.installedFilmYawDeg,
    bracketVerticalLegMm:d.lLegLengthMm,
    stampCenterX:n2(stampCenterX),stampCenterZ:n2(stampCenterZ),
    glassLeftX:n2(glassLeftX),glassRightX:n2(glassRightX),
    clampLeftX:n2(clampLeftX),clampRightX:n2(clampRightX),
    heaterLeftX:n2(heaterLeftX),heaterRightX:n2(heaterRightX),
    clampHeaterClearanceMm:n2(clampHeaterClearanceMm),
    footprintGapMm:n2(footprintGapMm),
    initialVerticalStampGapMm:n2(initialStampBottomYmm-d.sampleChipTopWorldYmm),
    sampleChipTopWorldYmm:d.sampleChipTopWorldYmm,
    metalHeaterTopWorldYmm:d.heaterTopWorldYmm,
    verticalStampGapMm:n2(verticalStampGapMm),
    stampRightMarginMm:d.stampRightMarginMm,
    stampInsideHeaterBoundingBox,stampInsideSampleChipFootprint,
    sampleChipFootprintMm:d.sampleChipFootprintMm,
    minimumStampEdgeInsetMm:Number(minimumStampEdgeInsetMm.toFixed(3)),
    clipOutsideHeater,basesSeparate,candidateCanLower,
    screwAxis:d.screwAxis,screwAxisParallelGlassShortEdge:true,
    screwPitchAlongGlassLengthMm:d.screwPitchAlongGlassLengthMm,
    verticalFootClampBoresRequired:false,
    glassRequiredForTransfer:true,
    fullCandidateClampAssemblyCertified:false,
    usableForMachining:false,
    actualClampAndMountingHolesUnknown:true,
    opticalParkingLiftMm:d.opticalParkingLiftMm,
    opticalParkingMechanismVerified:false,
    opticalWorkingDistanceVerified:false,
    fullMechanicalCollisionProof:false
  });
}
