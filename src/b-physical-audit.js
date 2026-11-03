// Strict evidence and reach audit for user-selected B 94/95/97 profile.
// This is NOT a claim that the old A archive tags are correct: the user
// explicitly requested inspecting these photos as the current B candidate.
// Geometry measurements are screen-assembly coordinates, not metrology.
export function auditBPhotoProfile({stageCenterX, sampleCenterX, stageTopY, bracket, intendedGlassY=105}={}){
 if(!bracket || !Number.isFinite(stageCenterX) || !Number.isFinite(sampleCenterX))
   throw Error('B photo-profile audit requires actual stage, sample and bracket datums');
 const nearestSheetX=Math.max(bracket.leftX,bracket.rightX);
 const horizontalGapMm=Math.max(0,sampleCenterX-nearestSheetX);
 const legTipYmm=bracket.verticalLegBottomY;
 const tipToGlassHeightMm=intendedGlassY-legTipYmm;
 const sourceImages=['94','95','97'];
 return Object.freeze({
   profile:'user-selected-B-94-95-97',
   sourceImages,
   archiveAssignmentConflict:true,
   filmSequence:['GCM-T25M','GCM-VC13M','GCM-G40M60L','bent L sheet'],
   observedFilmClamp:false,
   sampleAndFilmSameRigVerified:false,
   transferPathConnected:false,
   fullAssemblyAccepted:false,
   nearestSheetX,horizontalGapMm,legTipYmm,tipToGlassHeightMm,
   stageTopY,stageCenterX,sampleCenterX,
   note:'B32 reaches only the photographed L sheet; no photographic proof of a slide jaw or of the B09 sample branch belonging to this same machine'
 });
}
