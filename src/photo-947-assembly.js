// Photo-grounded assembly evidence for image_94, image_95 and image_97.
// The images physically show the FIRST rig, currently named platform A.
// All photo silhouettes are constraints, not inferred purchase-ready sheet metal.
export const PHOTO_94_95_97={
  rig:'A',stageIds:['A15','A03','A04','A05'],
  sequenceBottomUp:['GCM-T25M','GCM-VC13M','GCM-G40M60L','bent L sheet bracket'],
  imageToParts:{'94':['A04','A05'],'95':['A15'],'97':['A15','A03']},
  t25m:{nominalXYmm:[65,65],twoAxisHeightMm:33,minimumVisibleMicrometerCount:2},
  vc13m:{maker:'Daheng',model:'GCM-VC13M',topSizeMm:[45,45],verticalAxisCount:1,
    spindleOrientation:'up along scene Y'},
  g40:{maker:'Daheng',model:'GCM-G40M60L',nominalPlateMm:[40,40],nominalHeightMm:20,
    centerOfRotationHeightMm:60,travelDeg:5,micrometers:1,micrometerDirection:'+X'},
  visibleMetalConnection:{kind:'one-piece bent L sheet',confirmedBentCorner:true,
    topFastenerHeadsVisible:2,unverifiedThickness:true,
    visuallyUnsupported:['150mm Zolix cross-rod','PHCP2 round clamp on this stack',
      'two vertical dangling steel rods','oversized horizontal square beam']}
};
export function photo94BracketCandidate({
  stageCenterX=-116,stageTopY=124,topPlateWidth=80,topPlateDepth=32,
  verticalLegLength=72,metalThickness=2.5
}={}){
  if(!(topPlateWidth>40&&topPlateWidth<110))throw Error('L bracket width is only a photo silhouette candidate');
  if(!(metalThickness>1&&metalThickness<4))throw Error('A05 should be a THIN bent sheet, not a structural 12mm bar');
  if(!(verticalLegLength>45&&verticalLegLength<110))throw Error('Unsupported photo94 long drop');
  const leftX=stageCenterX-(topPlateWidth/2-20);
  const rightX=leftX+topPlateWidth;
  const centerX=(leftX+rightX)/2;
  const legCenterY=stageTopY-verticalLegLength/2;
  const verticalLegBottomY=stageTopY-verticalLegLength;
  return {leftX,rightX,centerX,topY:stageTopY,
    topPlateWidth,topPlateDepth,metalThickness,verticalLegLength,
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
