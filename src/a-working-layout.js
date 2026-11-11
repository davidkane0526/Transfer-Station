// V130: platform-A canonical installed transfer layout.
// Photo 1 is the orientation anchor. Photo-reference and working modes use
// the SAME physical A17→A15→A03→A04L→A04→A05→clamp→glass geometry and
// the same 180° installed yaw; working mode only changes pose/travel.
// Photos 2/3 are rotated side inspections and do not redefine world handedness.
const A_LAYOUT_INPUTS=Object.freeze({
  sampleCenterX:78,lBracketOverhangMm:60,metalThicknessMm:2.5,
  glassLengthMm:76,glassNearFromLegMm:12,pdmsLengthMm:8,stampRightMarginMm:4
});
const A_LOCAL_LEG_X=-A_LAYOUT_INPUTS.lBracketOverhangMm+A_LAYOUT_INPUTS.metalThicknessMm/2;
const A_LOCAL_GLASS_NEAR_X=A_LOCAL_LEG_X-A_LAYOUT_INPUTS.glassNearFromLegMm;
const A_LOCAL_STAMP_X=A_LOCAL_GLASS_NEAR_X-
  (A_LAYOUT_INPUTS.glassLengthMm-A_LAYOUT_INPUTS.stampRightMarginMm-A_LAYOUT_INPUTS.pdmsLengthMm/2);
const A_CONTACT_SOLVED_FILM_STAGE_X=A_LAYOUT_INPUTS.sampleCenterX+A_LOCAL_STAMP_X;
const A_VERTICAL_INPUTS=Object.freeze({
  bracketTopWorldYmm:199.5,
  sampleChipTopWorldYmm:111.4,
  glassCenterAboveLegBottomMm:-0.5,
  pdmsCenterBelowGlassCenterMm:1.4,
  pdmsThicknessMm:1.8,
  transferDropMm:13
});
const A_CONTACT_SOLVED_LEG_LENGTH=
  A_VERTICAL_INPUTS.bracketTopWorldYmm+
  A_VERTICAL_INPUTS.glassCenterAboveLegBottomMm-
  A_VERTICAL_INPUTS.pdmsCenterBelowGlassCenterMm-
  A_VERTICAL_INPUTS.pdmsThicknessMm/2-
  A_VERTICAL_INPUTS.sampleChipTopWorldYmm;

export const A_WORKING_LAYOUT=Object.freeze({
  filmStageX:A_CONTACT_SOLVED_FILM_STAGE_X,filmStageZ:0,sampleCenterX:A_LAYOUT_INPUTS.sampleCenterX,
  filmStageXDerivation:'sampleCenterX + localStampX after canonical rigid 180deg yaw',
  filmStageXSolvedFromNominalPdmsTarget:true,filmStageXPhotoMeasured:false,filmStageXPhotoRegistered:false,
  localStampXBeforeYawMm:A_LOCAL_STAMP_X,nominalStampTargetXmm:A_LAYOUT_INPUTS.sampleCenterX,
  localBracketHandedness:'left',installedFilmYawDeg:180,canonicalPhotoYawDeg:180,
  photoAndWorkingSharePhysicalOrientation:true,
  lBracketOverhangMm:A_LAYOUT_INPUTS.lBracketOverhangMm,lBracketTopWidthMm:87,
  lLegLengthMm:A_CONTACT_SOLVED_LEG_LENGTH,
  lLegLengthDerivation:'lowered PDMS bottom == candidate sample-chip top after glass is clamped below A05 foot',
  lLegLengthSolvedFromNominalContact:true,lLegLengthPhotoMeasured:false,
  glassCenterAboveLegBottomMm:A_VERTICAL_INPUTS.glassCenterAboveLegBottomMm,
  pdmsCenterBelowGlassCenterMm:A_VERTICAL_INPUTS.pdmsCenterBelowGlassCenterMm,
  metalThicknessMm:A_LAYOUT_INPUTS.metalThicknessMm,
  glassLengthMm:A_LAYOUT_INPUTS.glassLengthMm,glassWidthMm:26,glassThicknessMm:1,
  glassNearFromLegMm:A_LAYOUT_INPUTS.glassNearFromLegMm,clampLengthMm:28,clampBladeTotalLengthMm:40,
  pdmsLengthMm:A_LAYOUT_INPUTS.pdmsLengthMm,pdmsThicknessMm:A_VERTICAL_INPUTS.pdmsThicknessMm,
  stampRightMarginMm:A_LAYOUT_INPUTS.stampRightMarginMm,
  screwAxis:'scene-Y / vertical through A05 folded foot',
  screwPairLine:'scene-Z / parallel to 26mm glass short edge',
  screwPitchAcrossGlassShortEdgeMm:13,
  magnetFootprintMm:65,sampleBaseFootprintXmm:112,heaterFootprintMm:65,sampleChipFootprintMm:28,
  heaterTopWorldYmm:110,sampleChipTopWorldYmm:A_VERTICAL_INPUTS.sampleChipTopWorldYmm,
  a15Vc13CatalogReferenceHeightMm:126,a15Vc13InstalledOrderMatchesGCM901602:false,
  a15Vc13LowerPoseHeightMm:119.5,bracketTopWorldYmm:A_VERTICAL_INPUTS.bracketTopWorldYmm,
  initialVC13LiftMm:A_VERTICAL_INPUTS.transferDropMm,opticalParkingLiftMm:18,
  maximumFilmTravelMm:12.5,maximumSampleTravelMm:12.5,clearanceReserveMm:0.5
});
const n2=x=>Number(x.toFixed(2));
export function auditAWorkingLayout({
 filmShiftMm=0,filmDepthShiftMm=0,sampleShiftMm=0,sampleAngleDeg=0,filmDropMm=0,d=A_WORKING_LAYOUT
}={}){
 const inputs=[filmShiftMm,filmDepthShiftMm,sampleShiftMm,sampleAngleDeg,filmDropMm];
 if(inputs.some(x=>!Number.isFinite(x))||filmDropMm<0||filmDropMm>d.initialVC13LiftMm)
  throw new RangeError('Invalid platform-A installed candidate pose');
 const r=sampleAngleDeg*Math.PI/180,c=Math.cos(r),s=Math.sin(r);
 const localLegX=-d.lBracketOverhangMm+d.metalThicknessMm/2;
 const localGlassNearX=localLegX-d.glassNearFromLegMm;
 const localGlassFarX=localGlassNearX-d.glassLengthMm;
 const localStampX=localGlassNearX-(d.glassLengthMm-d.stampRightMarginMm-d.pdmsLengthMm/2);
 const localClampCenterX=localGlassNearX-d.clampLengthMm/2;
 const worldX=localX=>d.filmStageX-localX+filmShiftMm;
 const glassNearX=worldX(localGlassNearX),glassFarX=worldX(localGlassFarX);
 const glassLeftX=Math.min(glassNearX,glassFarX),glassRightX=Math.max(glassNearX,glassFarX);
 const stampCenterX=worldX(localStampX),clampCenterX=worldX(localClampCenterX);
 const clampLeftX=clampCenterX-d.clampLengthMm/2,clampRightX=clampCenterX+d.clampLengthMm/2;
 const stampCenterZ=d.filmStageZ+filmDepthShiftMm;
 const sampleWorldX=d.sampleCenterX+sampleShiftMm*c,sampleWorldZ=-sampleShiftMm*s;
 const heaterHalfEnvelopeX=d.heaterFootprintMm/2*(Math.abs(c)+Math.abs(s));
 const heaterLeftX=sampleWorldX-heaterHalfEnvelopeX,heaterRightX=sampleWorldX+heaterHalfEnvelopeX;
 const intervalGap=(l1,r1,l2,r2)=>Math.max(0,l1-r2,l2-r1);
 const clampHeaterClearanceMm=intervalGap(clampLeftX,clampRightX,heaterLeftX,heaterRightX);
 const footprintGapMm=(d.sampleCenterX-d.sampleBaseFootprintXmm/2)-(d.filmStageX+d.magnetFootprintMm/2);
 const stampHalf=d.pdmsLengthMm/2;
 const stampInsideHeaterBoundingBox=stampCenterX-stampHalf>=heaterLeftX&&stampCenterX+stampHalf<=heaterRightX&&
  Math.abs(stampCenterZ-sampleWorldZ)+stampHalf<=heaterHalfEnvelopeX;
 const chipHalf=d.sampleChipFootprintMm/2;
 const corners=[[-stampHalf,-stampHalf],[-stampHalf,stampHalf],[stampHalf,-stampHalf],[stampHalf,stampHalf]];
 const localCorners=corners.map(([ox,oz])=>{
  const dx=stampCenterX+ox-sampleWorldX,dz=stampCenterZ+oz-sampleWorldZ;
  return {x:c*dx-s*dz,z:s*dx+c*dz};
 });
 const minimumStampEdgeInsetMm=Math.min(...localCorners.flatMap(p=>[chipHalf-Math.abs(p.x),chipHalf-Math.abs(p.z)]));
 const stampInsideSampleChipFootprint=minimumStampEdgeInsetMm>=-1e-8;
 const initialStampBottomYmm=d.bracketTopWorldYmm+d.initialVC13LiftMm-d.lLegLengthMm+
  d.glassCenterAboveLegBottomMm-d.pdmsCenterBelowGlassCenterMm-d.pdmsThicknessMm/2;
 const stampBottomYmm=initialStampBottomYmm-filmDropMm;
 const verticalStampGapMm=stampBottomYmm-d.sampleChipTopWorldYmm;
 const basesSeparate=footprintGapMm>0,clipOutsideHeater=clampHeaterClearanceMm>=d.clearanceReserveMm;
 const candidateCanLower=basesSeparate&&clipOutsideHeater&&stampInsideHeaterBoundingBox&&
  stampInsideSampleChipFootprint&&verticalStampGapMm>=-1e-8;
 return Object.freeze({
  verification:'V130 photo1-canonical geometry; vertical wing screws and short-edge screw-pair alignment',
  photoReferenceUsesSameUnmirroredSheet:true,photoAndWorkingSharePhysicalOrientation:true,
  canonicalPhotoYawDeg:d.canonicalPhotoYawDeg,actualStagePosePhotoRegistered:false,
  filmStageXSolvedFromNominalPdmsTarget:true,filmStageXPhotoMeasured:false,filmStageXPhotoRegistered:false,
  filmStageXDerivation:d.filmStageXDerivation,localStampXBeforeYawMm:d.localStampXBeforeYawMm,
  nominalStampTargetXmm:d.nominalStampTargetXmm,solvedFilmStageXmm:d.filmStageX,
  solvedFilmMinusSampleCenterXmm:n2(d.filmStageX-d.sampleCenterX),
  A17SkuVerified:false,A05CClampSkuVerified:false,filmStageX:d.filmStageX,filmStageZ:d.filmStageZ,
  sampleStageX:d.sampleCenterX,localHandedness:d.localBracketHandedness,installedFilmYawDeg:180,
  bracketVerticalLegMm:d.lLegLengthMm,bracketVerticalLegSolvedFromNominalContact:true,
  bracketVerticalLegPhotoMeasured:false,bracketVerticalLegDerivation:d.lLegLengthDerivation,
  glassCenterAboveLegBottomMm:d.glassCenterAboveLegBottomMm,pdmsCenterBelowGlassCenterMm:d.pdmsCenterBelowGlassCenterMm,
  pdmsThicknessCandidateMm:d.pdmsThicknessMm,loweredStampBottomTargetYmm:d.sampleChipTopWorldYmm,
  a15Vc13CatalogReferenceHeightMm:d.a15Vc13CatalogReferenceHeightMm,
  a15Vc13InstalledOrderMatchesGCM901602:false,a15Vc13LowerPoseHeightMm:d.a15Vc13LowerPoseHeightMm,
  catalogReferenceHeightIsMotionZero:false,stampCenterX:n2(stampCenterX),stampCenterZ:n2(stampCenterZ),
  glassLeftX:n2(glassLeftX),glassRightX:n2(glassRightX),clampLeftX:n2(clampLeftX),clampRightX:n2(clampRightX),
  heaterLeftX:n2(heaterLeftX),heaterRightX:n2(heaterRightX),clampHeaterClearanceMm:n2(clampHeaterClearanceMm),
  footprintGapMm:n2(footprintGapMm),initialVerticalStampGapMm:n2(initialStampBottomYmm-d.sampleChipTopWorldYmm),
  sampleChipTopWorldYmm:d.sampleChipTopWorldYmm,metalHeaterTopWorldYmm:d.heaterTopWorldYmm,
  verticalStampGapMm:n2(verticalStampGapMm),stampRightMarginMm:d.stampRightMarginMm,
  stampInsideHeaterBoundingBox,stampInsideSampleChipFootprint,sampleChipFootprintMm:d.sampleChipFootprintMm,
  minimumStampEdgeInsetMm:Number(minimumStampEdgeInsetMm.toFixed(3)),clipOutsideHeater,basesSeparate,candidateCanLower,
  screwAxis:d.screwAxis,screwAxisVertical:true,screwPairLine:d.screwPairLine,
  screwPairLineParallelGlassShortEdge:true,screwPitchAcrossGlassShortEdgeMm:d.screwPitchAcrossGlassShortEdgeMm,
  verticalFootClampBoresRequired:true,verticalFootClampBoreCount:2,glassRequiredForTransfer:true,
  fullCandidateClampAssemblyCertified:false,usableForMachining:false,actualClampAndMountingHolesUnknown:true,
  opticalParkingLiftMm:d.opticalParkingLiftMm,opticalParkingMechanismVerified:false,
  opticalWorkingDistanceVerified:false,fullMechanicalCollisionProof:false
 });
}
