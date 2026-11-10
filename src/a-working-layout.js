// V80: platform-A installed transfer layout with vendor-height cross-check.
// The photographed A05 sheet is defined once in its local LEFT-handed form.
// The COMPLETE film-side chain A17→A15→A03→A04L→A04→A05→clamp→glass
// is then installed with a 180° yaw, rather than mirroring only A05.
const A_LAYOUT_INPUTS=Object.freeze({
  sampleCenterX:78,lBracketOverhangMm:60,metalThicknessMm:2.5,
  glassLengthMm:76,glassNearFromLegMm:34,pdmsLengthMm:8,stampRightMarginMm:4
});
const A_LOCAL_LEG_X=-A_LAYOUT_INPUTS.lBracketOverhangMm+A_LAYOUT_INPUTS.metalThicknessMm/2;
const A_LOCAL_GLASS_NEAR_X=A_LOCAL_LEG_X-A_LAYOUT_INPUTS.glassNearFromLegMm;
const A_LOCAL_STAMP_X=A_LOCAL_GLASS_NEAR_X-
  (A_LAYOUT_INPUTS.glassLengthMm-A_LAYOUT_INPUTS.stampRightMarginMm-A_LAYOUT_INPUTS.pdmsLengthMm/2);
const A_CONTACT_SOLVED_FILM_STAGE_X=A_LAYOUT_INPUTS.sampleCenterX+A_LOCAL_STAMP_X;

export const A_WORKING_LAYOUT=Object.freeze({
  filmStageX:A_CONTACT_SOLVED_FILM_STAGE_X, filmStageZ:0, sampleCenterX:A_LAYOUT_INPUTS.sampleCenterX,
  filmStageXDerivation:'sampleCenterX + localStampX after rigid 180deg yaw',
  filmStageXSolvedFromNominalPdmsTarget:true,
  filmStageXPhotoMeasured:false,filmStageXPhotoRegistered:false,
  localStampXBeforeYawMm:A_LOCAL_STAMP_X,nominalStampTargetXmm:A_LAYOUT_INPUTS.sampleCenterX,
  localBracketHandedness:'left', installedFilmYawDeg:180,
  lBracketOverhangMm:A_LAYOUT_INPUTS.lBracketOverhangMm, lBracketTopWidthMm:87, lLegLengthMm:87.6,
  metalThicknessMm:A_LAYOUT_INPUTS.metalThicknessMm,
  glassLengthMm:A_LAYOUT_INPUTS.glassLengthMm, glassWidthMm:26, glassThicknessMm:1,
  glassNearFromLegMm:A_LAYOUT_INPUTS.glassNearFromLegMm, clampLengthMm:28,
  pdmsLengthMm:A_LAYOUT_INPUTS.pdmsLengthMm, pdmsThicknessMm:1.8, stampRightMarginMm:A_LAYOUT_INPUTS.stampRightMarginMm,
  screwAxis:'scene-Z / parallel to 26mm glass short edge',
  screwPitchAlongGlassLengthMm:18,
  magnetFootprintMm:65, sampleBaseFootprintXmm:112,
  heaterFootprintMm:65, sampleChipFootprintMm:28, heaterTopWorldYmm:109.2,
  sampleChipTopWorldYmm:110.6,
  // Daheng GCM-901602M catalog combines the same T25M2L+VC13M parts at
  // 126mm reference top height. The user's installed order is reversed
  // (T25 below VC13), so 126mm is used only as an additive envelope datum,
  // NOT as proof of the stock 901602M assembly orientation. A 13mm full
  // stroke is modelled about that reference: lower endpoint 119.5mm.
  a15Vc13CatalogReferenceHeightMm:126,
  a15Vc13InstalledOrderMatchesGCM901602:false,
  a15Vc13LowerPoseHeightMm:119.5,
  bracketTopWorldYmm:199.5, initialVC13LiftMm:13,
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
    verification:'V80 vendor-height-crosschecked rigid-180 installed geometry candidate; dimensions still require physical validation',
    photoReferenceUsesSameUnmirroredSheet:true,
    actualStagePosePhotoRegistered:false,
    filmStageXSolvedFromNominalPdmsTarget:Boolean(d.filmStageXSolvedFromNominalPdmsTarget),
    filmStageXPhotoMeasured:Boolean(d.filmStageXPhotoMeasured),
    filmStageXPhotoRegistered:Boolean(d.filmStageXPhotoRegistered),
    filmStageXDerivation:d.filmStageXDerivation,
    localStampXBeforeYawMm:d.localStampXBeforeYawMm,
    nominalStampTargetXmm:d.nominalStampTargetXmm,
    solvedFilmStageXmm:d.filmStageX,
    solvedFilmMinusSampleCenterXmm:n2(d.filmStageX-d.sampleCenterX),
    A17SkuVerified:false,A05CClampSkuVerified:false,
    filmStageX:d.filmStageX,filmStageZ:d.filmStageZ,sampleStageX:d.sampleCenterX,
    localHandedness:d.localBracketHandedness,installedFilmYawDeg:d.installedFilmYawDeg,
    bracketVerticalLegMm:d.lLegLengthMm,
    a15Vc13CatalogReferenceHeightMm:d.a15Vc13CatalogReferenceHeightMm,
    a15Vc13InstalledOrderMatchesGCM901602:d.a15Vc13InstalledOrderMatchesGCM901602,
    a15Vc13LowerPoseHeightMm:d.a15Vc13LowerPoseHeightMm,
    catalogReferenceHeightIsMotionZero:false,
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
