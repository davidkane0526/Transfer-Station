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
  postAxisX:-67,postAxisZ:-15,
  postHolderBottomY:96,postHolderHeightMm:50,postHolderODmm:20,
  supportPostBottomY:96,supportPostLengthMm:100,postDiameterMm:12,
  squareClampCenterY:168,squareClampHeightMm:30,
  upperRodY:168,lowerRodY:135,phucBorePitchMm:33,
  phucCenterX:-35,phucCenterY:151.5,
  phucLengthMm:60,phucOuterDiameterMm:30,
  upperRodStartX:-90,upperRodLengthMm:70,
  lowerRodStartX:-60,lowerRodEndX:-2.5,
  glassHolderOriginY:142,glassHolderSpineLeftX:-2.5,
  glassHolderWorldX:13,
  glassCenterWorldX:56,glassWidthMm:76,
  stampOffsetFromGlassCenterX:26,stampWidthMm:20,
  heaterCenterWorldX:82,heaterWidthMm:65,stageTravelMm:12.5,
  glassHolderRightReachMm:21,
  minApproachClearanceMm:2,
  glassCenterWorldY:125.5,
  heaterTopWorldY:110.2,
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
 const glassLeftX=d.glassCenterWorldX-d.glassWidthMm/2;
 const glassRightX=d.glassCenterWorldX+d.glassWidthMm/2;
 const stampCenterX=d.glassCenterWorldX+d.stampOffsetFromGlassCenterX;
 const stampRightX=stampCenterX+d.stampWidthMm/2;
 const clampRightX=d.glassHolderWorldX+d.glassHolderRightReachMm;
 const heaterLeftX=d.heaterCenterWorldX-d.heaterWidthMm/2;
 const minimumHeaterLeftX=heaterLeftX-d.stageTravelMm;
 const nominalClampClearanceMm=heaterLeftX-clampRightX;
 const worstStageOnlyClearanceMm=minimumHeaterLeftX-clampRightX;
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
 // The plate holder is yawed 180°; its spine must align with the end stud.
 if(!(d.lowerRodStartX<d.phucCenterX-15 &&
      Math.abs(d.lowerRodEndX-d.glassHolderSpineLeftX)<.01))
   throw Error('Lower Ø12 bar must end exactly at glass holder side face, not pass through solid GCM-1302M');
 if(d.threadStubLengthMm<5||d.threadStubLengthMm>15)
   throw Error('Unverified M6 end-face stub beyond candidate range');
 if(!(glassLeftX<d.glassHolderWorldX+d.glassHolderRightReachMm&&
       d.glassHolderWorldX-1<glassLeftX&&stampRightX<=glassRightX-1.5&&
       Math.abs(stampCenterX-d.heaterCenterWorldX)<.01))
   throw Error('Stamp must sit near the RIGHT slide edge and remain registered over heater while jaws grip left edge');
 if(!(nominalClampClearanceMm>10&&worstStageOnlyClearanceMm>=d.minApproachClearanceMm))
   throw Error('GCM1302M clamp footprint would enter heater during lowering or sample X stroke');
 if(!(d.glassHolderSpineLeftX===d.glassHolderWorldX-15.5))
   throw Error('B28 end and clamp spine must follow the same shifted film fixture');
 if(!(glassToHeaterGapMm>4&&glassToHeaterGapMm<35))
   throw Error('Glass-heater separation implausible for candidate dry-transfer pose');
 return Object.freeze({
   ...d,postTopY,holderTopY,clampBottomY,clampTopY,
   holderToSquareGapMm:clampBottomY-holderTopY,
   exposedPostAboveHolderMm:postTopY-holderTopY,
   glassToHeaterGapMm,lowerRodLengthMm,upperRodEndX,
   glassLeftX,glassRightX,stampCenterX,stampRightX,clampRightX,
   heaterLeftX,nominalClampClearanceMm,worstStageOnlyClearanceMm,
   verticalContactDropMm:glassToHeaterGapMm-1.8,
   observed:['movable V25M plate below fixed guides','lower Ø12 rod directly enters GCM-1302M side, no bulky terminal bracket','two PHUC rods approximately parallel in side view'],
   candidateManufacturerMatch:{post:'PHSP12-4 100 mm',holder:'PHSH-2 50 mm'},
   acceptedGeometryOnly:true,
   threadingVerified:false,
   crossPhotoAbsoluteHeightVerified:false
 });
}


// Conservative planar-envelope guard. Film translation and NFP travel
// both move the assembly; rotation changes the square heater X extent.
// No claim of a mechanically validated full-stroke digital twin.
export function auditBLoweringPose({
  d=B149,filmShiftX=0,sampleShiftX=0,sampleAngleDeg=0,
  filmVerticalDropMm=0,filmDepthShiftMm=0
}={}){
  const q=auditB149(d),angle=sampleAngleDeg*Math.PI/180;
  const heaterLeft=d.heaterCenterWorldX+sampleShiftX*Math.cos(angle)-
    d.heaterWidthMm*(Math.abs(Math.cos(angle))+Math.abs(Math.sin(angle)))/2;
  const clampRight=q.clampRightX+filmShiftX;
  const planarGapMm=heaterLeft-clampRight;
  const depthOverlap=Math.abs(filmDepthShiftMm)<=d.heaterWidthMm/2+28;
  const possibleClash=depthOverlap&&planarGapMm<d.minApproachClearanceMm;
  const dropMm=Math.max(0,filmVerticalDropMm);
  const contactDropMm=q.glassToHeaterGapMm-1.8;
  return Object.freeze({
    heaterLeftX:heaterLeft,clampRightX:clampRight,
    planarGapMm,depthOverlap,possibleClash,
    filmVerticalDropMm:dropMm,contactDropMm,
    safeToLower:!possibleClash&&dropMm<=contactDropMm+.001,
    clampEntirelyOutsideHeater:!depthOverlap||planarGapMm>0,
    stampCenterWorldX:q.stampCenterX,
    mechanicalAcceptance:false,
    note:'Candidate planar-envelope test only; microscope, fixture and full stroke unverified'
  });
}
