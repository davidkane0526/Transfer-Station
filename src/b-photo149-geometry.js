// Scene Y-up engineering-fit datums. Read 108/149/150 together.
// PHOTO: the V25M carriage's horizontal B05 plate is SIDE-mounted
// BELOW the top of the fixed vertical guides. It is NOT stacked on
// the highest point of the V25M housing.
// Exact component length/pitch must not be inferred from perspective.
export const B149=Object.freeze({
  b04BaseY:73,
  stageCenterX:-112,
  b05CenterX:-51.5,b05LeftFaceX:-84,
  fixedGuideRightFaceX:-84,sideBracketRightFaceX:-84,
  movingGuideFrontZ:7,sideBracketBackZ:7,
  b04GuideTopY:131,
  b04MovingFlangeTopY:90,
  supportPlateBottomY:90,
  supportPlateHeightMm:6,
  postAxisX:-52,postAxisZ:-15,
  postHolderBottomY:96,postHolderHeightMm:50,postHolderODmm:20,
  supportPostBottomY:96,supportPostLengthMm:100,postDiameterMm:12,
  squareClampCenterY:168,squareClampHeightMm:30,
  upperRodY:168,lowerRodY:135,phucBorePitchMm:33,
  phucCenterX:-5,phucCenterY:151.5,
  phucLengthMm:60,phucOuterDiameterMm:30,
  upperRodStartX:-75,upperRodLengthMm:85,
  lowerRodStartX:-30,lowerRodEndX:24.5,
  glassHolderOriginY:142,glassHolderSpineLeftX:24.5,
  glassCenterWorldY:125.5,
  heaterTopWorldY:98.2,
  threadStubDiameterMm:6,threadStubLengthMm:10
});
export function auditB149(d=B149){
 const postTopY=d.supportPostBottomY+d.supportPostLengthMm;
 const holderTopY=d.postHolderBottomY+d.postHolderHeightMm;
 const clampBottomY=d.squareClampCenterY-d.squareClampHeightMm/2;
 const clampTopY=d.squareClampCenterY+d.squareClampHeightMm/2;
 const phucUpperY=d.phucCenterY+d.phucBorePitchMm/2;
 const phucLowerY=d.phucCenterY-d.phucBorePitchMm/2;
 const glassToHeaterGapMm=d.glassCenterWorldY-.5-d.heaterTopWorldY;
 const lowerRodLengthMm=d.lowerRodEndX-d.lowerRodStartX;
 const upperRodEndX=d.upperRodStartX+d.upperRodLengthMm;
 // Side-mounted V25M photo108 connection must NOT occupy the
 // stationary upright's volume. Output bridge and B05 meet at X=-84;
 // upper B05 plate lies ENTIRELY to the right of fixed guide.
 if(Math.abs(d.b05LeftFaceX-d.fixedGuideRightFaceX)>.01 ||
    Math.abs(d.sideBracketRightFaceX-d.b05LeftFaceX)>.01 ||
    Math.abs(d.movingGuideFrontZ-d.sideBracketBackZ)>.01)
   throw Error('Side mounted B05 would penetrate fixed V25M guide or detach from moving carriage');
 if(Math.abs(d.postAxisX-d.b05CenterX)>22)
   throw Error('Vertical sleeve would hang beyond B05 mounting plate');
 if(Math.abs(d.b04MovingFlangeTopY-d.supportPlateBottomY)>.01)
   throw Error('B05 floats above the MOVABLE V25M side carriage');
 if(d.b04MovingFlangeTopY>=d.b04GuideTopY)
   throw Error('B05 must be beneath the fixed V25M guide top in actual photo108');
 if(Math.abs(d.supportPlateBottomY+d.supportPlateHeightMm-d.postHolderBottomY)>.01)
   throw Error('Black sleeve is not seated on the side-mounted B05 plate');
 if(!(holderTopY<clampBottomY&&postTopY>clampTopY))
   throw Error('Support rod must cross separate square clamp ABOVE black sleeve');
 if(d.postDiameterMm!==12||d.threadStubDiameterMm>=d.postDiameterMm)
   throw Error('Rod/adapter diameters must represent step-down to M6, not a second Ø12 clamp');
 if(Math.abs(phucUpperY-d.upperRodY)>.01||Math.abs(phucLowerY-d.lowerRodY)>.01 ||
    Math.abs(d.upperRodY-d.lowerRodY-d.phucBorePitchMm)>.01)
   throw Error('PHUC-1 33mm hole centre pitch or rod axes mismatch');
 if(d.phucLengthMm!==60||d.phucOuterDiameterMm!==30)
   throw Error('PHUC OEM envelope mismatch');
 if(!(d.upperRodStartX < d.postAxisX-12 && Math.abs(upperRodEndX-(d.phucCenterX+15))<.01))
   throw Error('Upper rod must reach from B33 into PHUC-1 without unsupported extra 150mm tail');
 // The plate holder is yawed 180°, so its spine's OUTER left face is X24.5.
 if(!(d.lowerRodStartX<d.phucCenterX-15 &&
      Math.abs(d.lowerRodEndX-d.glassHolderSpineLeftX)<.01))
   throw Error('Lower Ø12 bar must end exactly at glass holder side face, not pass through solid GCM-1302M');
 if(d.threadStubLengthMm<5||d.threadStubLengthMm>15)
   throw Error('Unverified M6 end-face stub beyond candidate range');
 if(!(glassToHeaterGapMm>4&&glassToHeaterGapMm<35))
   throw Error('Glass-heater separation implausible for candidate dry-transfer pose');
 return Object.freeze({
   ...d,postTopY,holderTopY,clampBottomY,clampTopY,
   holderToSquareGapMm:clampBottomY-holderTopY,
   exposedPostAboveHolderMm:postTopY-holderTopY,
   glassToHeaterGapMm,lowerRodLengthMm,upperRodEndX,
   observed:['movable V25M plate below fixed guides','lower Ø12 rod directly enters GCM-1302M side, no bulky terminal bracket','two PHUC rods approximately parallel in side view'],
   candidateManufacturerMatch:{post:'PHSP12-4 100 mm',holder:'PHSH-2 50 mm'},
   acceptedGeometryOnly:true,
   threadingVerified:false,
   crossPhotoAbsoluteHeightVerified:false
 });
}
