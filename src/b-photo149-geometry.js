// Photo149 ruler-calibrated B film-arm datums (scene Y is height).
// These WORLD coordinates are a constrained *fit* to the image, not a
// manufacturer mating drawing. PHUC bore pitch and post/holder catalog
// lengths are kept in separate evidence classes.
export const B149={
  b04BaseY:73,b04TopY:105, // 32mm silhouette fit, NOT V25M factory height
  supportPlateBottomY:105,supportPlateHeightMm:6,
  postAxisX:-88,postAxisZ:-15,
  postHolderBottomY:111,postHolderHeightMm:50,postHolderODmm:20,
  supportPostBottomY:111,supportPostLengthMm:100,postDiameterMm:12,
  squareClampCenterY:190,squareClampHeightMm:30,
  upperRodY:190,lowerRodY:157,phucBorePitchMm:33,
  phucCenterX:-30,phucCenterY:173.5,
  phucLengthMm:60,phucOuterDiameterMm:30,
  glassHolderSpineTopY:119,terminalSocketCenterY:157
};
export function auditB149(d=B149){
 const postTopY=d.supportPostBottomY+d.supportPostLengthMm;
 const holderTopY=d.postHolderBottomY+d.postHolderHeightMm;
 const clampBottomY=d.squareClampCenterY-d.squareClampHeightMm/2;
 const phucUpperY=d.phucCenterY+d.phucBorePitchMm/2;
 const phucLowerY=d.phucCenterY-d.phucBorePitchMm/2;
 if(Math.abs(d.b04TopY-d.supportPlateBottomY)>0.01)throw Error('B05 floats over V25M');
 if(Math.abs(d.supportPlateBottomY+d.supportPlateHeightMm-d.postHolderBottomY)>0.01)throw Error('Black sleeve not seated on black top plate');
 if(!(holderTopY<clampBottomY && postTopY>clampBottomY+d.squareClampHeightMm))throw Error('Vertical support post cannot cross square clamp above post holder');
 if(d.postDiameterMm!==12)throw Error('Real support post diameter must be compatible with PHSH/PHUC');
 if(Math.abs(phucUpperY-d.upperRodY)>0.01||Math.abs(phucLowerY-d.lowerRodY)>0.01)throw Error('PHUC clamp axes do not match upper and lower rods');
 if(Math.abs(d.upperRodY-d.lowerRodY-d.phucBorePitchMm)>0.01)throw Error('PHUC manufacturer 33mm pitch violated');
 if(d.phucLengthMm!==60||d.phucOuterDiameterMm!==30)throw Error('PHUC OEM envelope mismatch');
 return Object.freeze({
   ...d,postTopY,holderTopY,clampBottomY,
   holderToSquareGapMm:clampBottomY-holderTopY,
   exposedPostAboveHolderMm:postTopY-holderTopY,
   photoRulerVerifiedDimensions:['vertical rod reaches ABOVE square connector','upper/lower horizontal bar directions are parallel in photo149'],
   catalogCandidates:{post:'PHSP12-4 100mm',postHolder:'PHSH-2 50mm'},
   exactSleeveSkuConfirmed:false,exactPostSkuConfirmed:false,
   realVerticalRegistrationAccepted:false,
   lowerRodToGlassClampInterfaceAccepted:false
 });
}
