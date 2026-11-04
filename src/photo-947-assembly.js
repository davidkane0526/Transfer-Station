// Photo-grounded assembly evidence for image_94, image_95 and image_97.
// The images physically show the FIRST rig, currently named platform A.
// All photo silhouettes are constraints, not inferred purchase-ready sheet metal.
export const PHOTO_94_95_97={
  rig:'A',stageIds:['A15','A03','A04','A05'],
  sequenceBottomUp:['GCM-T25M','GCM-VC13M','GCM-G40M60L','bent L sheet bracket'],
  imageToParts:{'94':['A04','A05'],'95':['A15'],'97':['A15','A03']},
  t25m:{nominalXYmm:[65,65],twoAxisHeightMm:33,minimumVisibleMicrometerCount:2},
  vc13m:{maker:'Daheng',model:'GCM-VC13M',topSizeMm:[65,65],verticalAxisCount:1,
    spindleOrientation:'up along scene Y'},
  g40:{maker:'Daheng',model:'GCM-G40M60L',nominalPlateMm:[40,40],nominalHeightMm:20,
    centerOfRotationHeightMm:60,travelDeg:5,micrometers:1,micrometerDirection:'+X'},
  visibleMetalConnection:{kind:'one-piece bent L sheet',confirmedBentCorner:true,
    topFastenerHeadsVisible:2,unverifiedThickness:true,
    visuallyUnsupported:['150mm Zolix cross-rod','PHCP2 round clamp on this stack',
      'two vertical dangling steel rods','oversized horizontal square beam']}
};
// VC13M centre micrometer is in FRONT of the upright stage and must
// terminate BELOW the G40M60L mounting plane. V26 displayed its drum
// up to local Y=69, penetrating the G40 body starting at local Y=51.
export function photo95FrontDriveDatums({
 shaftCenterXmm=-0.5,shaftLengthMm=58,
 leftBracketCenterXmm=-30,leftBracketWidthMm=6,
 rightBracketCenterXmm=31,rightBracketWidthMm=10,
 shaftCenterFrontZmm=38.5,shaftRadiusMm=4.3,
 stageFrontFaceZmm=32.5
}={}){
 // The 95 front shaft used to run straight THROUGH the 65mm
 // plate's front face (centerZ 32.7 ± R4.3). Even the visual
 // proxy must respect the stage's 32.5mm front envelope.
 const clearanceFromStageFrontMm=shaftCenterFrontZmm-shaftRadiusMm-stageFrontFaceZmm;
 if(clearanceFromStageFrontMm<0.5)
   throw new Error('Photo95 front shaft penetrates the base stage front wall');
 const shaftLeftMm=shaftCenterXmm-shaftLengthMm/2;
 const shaftRightMm=shaftCenterXmm+shaftLengthMm/2;
 const leftBracketInsideMm=leftBracketCenterXmm+leftBracketWidthMm/2;
 const rightBracketInsideMm=rightBracketCenterXmm-rightBracketWidthMm/2;
 const overlapLeftMm=leftBracketInsideMm-shaftLeftMm;
 const overlapRightMm=shaftRightMm-rightBracketInsideMm;
 if(overlapLeftMm<1||overlapRightMm<1)
  throw new Error('Photo95 front drive shaft has a floating unsupported end');
 return {shaftCenterXmm,shaftLengthMm,shaftLeftMm,shaftRightMm,
  leftBracketCenterXmm,leftBracketWidthMm,rightBracketCenterXmm,
  rightBracketWidthMm,overlapLeftMm,overlapRightMm,
  shaftCenterFrontZmm,shaftRadiusMm,clearanceFromStageFrontMm,
  supportConnected:true,dimensionsVerified:false};
}
export function vc13PhotoScrewDatums({
  topPlaneLocalYmm=51,
  drumCenterLocalYmm=39,drumLengthMm=18,
  stemCenterLocalYmm=24,stemLengthMm=28,
  frontZmm=40
}={}){
  const drumTopLocalYmm=drumCenterLocalYmm+drumLengthMm/2;
  const stemTopLocalYmm=stemCenterLocalYmm+stemLengthMm/2;
  const clearanceToG40Mm=topPlaneLocalYmm-drumTopLocalYmm;
  if(clearanceToG40Mm<2)throw new Error('VC13 micrometer intrudes into G40 mounting plane');
  if(stemTopLocalYmm<drumCenterLocalYmm-drumLengthMm/2)
    throw new Error('Micrometer steel stem is not coupled into its drum');
  // V46: previous +Z25 shaft passed through the large moving 65mm
  // top platform at full downward travel. Put its nominal Ø13.6
  // drum outside +Z32.5 top boundary with 0.7mm candidate margin.
  if(frontZmm-drumLengthMm*0-6.8<=32.5)
    throw new Error('VC13 front drum intersects movable top footprint');
  return {topPlaneLocalYmm,drumCenterLocalYmm,drumLengthMm,
    stemCenterLocalYmm,stemLengthMm,frontZmm,
    drumTopLocalYmm,clearanceToG40Mm,
    measuredFromPhoto:false,makerGeometryVerified:false};
}
export function photo94BracketCandidate({
  stageCenterX=-116,stageTopY=144,topPlateWidth=80,topPlateDepth=12,
  verticalLegLength=72,metalThickness=2.5
}={}){
  if(!(topPlateWidth>40&&topPlateWidth<110))throw Error('L bracket width is only a photo silhouette candidate');
  if(!(metalThickness>1&&metalThickness<4))throw Error('A05 should be a THIN bent sheet, not a structural 12mm bar');
  if(!(verticalLegLength>45&&verticalLegLength<110))throw Error('Unsupported photo94 long drop');
  const leftX=stageCenterX-(topPlateWidth-20);
  const rightX=leftX+topPlateWidth;
  const centerX=(leftX+rightX)/2;
  const legCenterY=stageTopY-verticalLegLength/2;
  const verticalLegBottomY=stageTopY-verticalLegLength;
  const sheetFrontZ=13; // photo94 black sheet lies near front edge of G40, not broad center cover
  return {leftX,rightX,centerX,topY:stageTopY,
    topPlateWidth,topPlateDepth,sheetFrontZ,metalThickness,verticalLegLength,
    legCenterY,verticalLegBottomY,
    topBoltWorldX:[stageCenterX-14,stageCenterX+14],
    fixedSheetCount:1,topBoltCount:2,
    glassGripModelConfirmed:false,loadBearingVerified:false,
    sourceImages:['94','95','97']};
}
export function getPhotoComparison(platform){
 if(platform==='A')return {reference:'photos 94/95/97',matched:true,
  confirmedParts:['A15','A03','A04','A05'],noClaim:'A05 glass clamp SKU remains unknown'};
 if(platform==='B')return {reference:'photos 108/109/110/111',matched:false,
  confirmedParts:['B03','B04','B09'],
  noClaim:'Photos 94/95/97 show A hardware; they cannot verify B PHCP-2 or GCM-V25M'};
 throw Error('Unknown rig');
}
