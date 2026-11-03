// Manufacturer-constrained optical holder geometry. OEM documented features:
// Zolix PHCP-2: two rotatable Ø12 mm through-bores, approx Ø25/Ø26 bodies.
// Zolix PHSP12-1/-5: Ø12 × 25/150 mm posts.
// Daheng GCM-13 plate-holder family: two screw drives push ONE moving plate,
// with M6 base interface on candidate GCM-1302M and <=5mm accepted optics.
// The offset between the two clamp bore centerlines and exact GCM jaw
// envelope are DISPLAY CANDIDATES, not measured OEM fit dimensions.
export const HOLDER_OEM={
  clampBoreDiameterMm:12,
  postDiameterMm:12,
  shortPostLengthMm:25,
  longPostLengthMm:150,
  phcpBodyDiametersMm:[25,26],
  gcmMaximumOpticThicknessMm:5,
  gcmScrewDriveCount:2
};
export function getPostBaseDatums({
 outerDiameterMm=36,mountBoreDiameterMm=6.1,seatDiameterMm=12.1,
 heightMm=6,seatDepthMm=3
}={}){
 // PHPB-1 OEM confirms an M6 TH (through) interface and Ø12-mm
 // post-base family. The actual seating depth and fitting diameters
 // below remain preview placeholders rather than an OEM bore drawing.
 if(mountBoreDiameterMm>=seatDiameterMm||seatDiameterMm>=outerDiameterMm)
   throw new Error('Post base must distinguish M6 mounting through-hole from larger post seat');
 if(seatDepthMm<=0||seatDepthMm>=heightMm)
   throw new Error('Post-base upper seat must not become a full Ø12 through-hole');
 return {outerDiameterMm,mountBoreDiameterMm,seatDiameterMm,
  heightMm,seatDepthMm,lowerThroughLengthMm:heightMm-seatDepthMm,
  verifiedThroughType:'M6 TH',manufacturer:'Zolix PHPB-1',
  seatDepthVerified:false,physicalEngagementVerified:false};
}
export function getCrossClampDatums({
  supportPostZmm=-15,horizontalPostZmm=0,postRadiusMm=6,
  ringOuterRadiiMm=[12.5,13],minimumRodSurfaceGapMm=2
}={}){
  const boreSpacingMm=Math.abs(supportPostZmm-horizontalPostZmm);
  const rodSurfaceClearanceMm=boreSpacingMm-2*postRadiusMm;
  // The two OEM through-holes are disjoint in a candidate swivel configuration.
  if(!(rodSurfaceClearanceMm>=minimumRodSurfaceGapMm))
    throw new Error('Two solid Ø12 posts would intersect or violate visual clearance');
  if(ringOuterRadiiMm.some(r=>r<=postRadiusMm))
    throw new Error('A clamp ring cannot be thinner than its post bore');
  return {
    verticalBore:{axis:'Y',x:0,z:supportPostZmm},
    horizontalBore:{axis:'X',x:0,z:horizontalPostZmm},
    boreSpacingMm,rodSurfaceClearanceMm,
    pivot:{x:11,y:11,z:supportPostZmm/2,radiusMm:4.5,lengthMm:8},
    outerDiametersMm:ringOuterRadiiMm.map(r=>2*r),
    interfaceAccepted:false,
    evidence:'Zolix PHCP-2 OEM Ø12 bores; offset is unverified assembly proxy'
  };
}
export function getPlateHolderJawDatums({
  holderBaseWorldYmm=142,slideCenterWorldYmm=125.5,
  slideThicknessMm=1,nominalJawGapMm=1.5,
  jawLengthMm=22,jawHalfWidthZmm=28,screwZmm=[-17,17]
}={}){
  if(slideThicknessMm>HOLDER_OEM.gcmMaximumOpticThicknessMm)
    throw new Error('The selected slide exceeds Daheng GCM-13 documented <=5mm thickness');
  if(!(nominalJawGapMm>slideThicknessMm))
    throw new Error('The two clamping faces overlap the glass in preview');
  const glassBottom=slideCenterWorldYmm-slideThicknessMm/2;
  const glassTop=slideCenterWorldYmm+slideThicknessMm/2;
  const fixedJawTop=glassBottom;
  // The open 1.5-mm mouth is for insertion, NOT a clamping condition.
  // Display the pressure plate at nominal CONTACT with the 1-mm glass;
  // actual preload, force, safe contact stresses and travel remain unknown.
  const contactJawGapMm=slideThicknessMm;
  const previewClosingTravelMm=nominalJawGapMm-contactJawGapMm;
  const movableJawBottom=fixedJawTop+contactJawGapMm;
  const movablePlateThicknessMm=3.5;
  const screwShaftLengthMm=12;
  const movablePlateTopLocalY=movableJawBottom+movablePlateThicknessMm-holderBaseWorldYmm;
  const screwShaftCenterLocalY=movablePlateTopLocalY+screwShaftLengthMm/2;
  const screwShaftBottomLocalY=screwShaftCenterLocalY-screwShaftLengthMm/2;
  if(Math.abs(screwShaftBottomLocalY-movablePlateTopLocalY)>1e-8)
    throw new Error('Adjustment screw does not contact the common moving plate');
  const screwCount=screwZmm.length;
  if(screwCount!==HOLDER_OEM.gcmScrewDriveCount)
    throw new Error('Daheng GCM-13 must have two adjustment threads on one moving plate');
  if(screwZmm.some(z=>Math.abs(z)>jawHalfWidthZmm))
    throw new Error('Adjustment screw misses the common moving plate');
  return {
    fixedJawTopLocalY:fixedJawTop-holderBaseWorldYmm,
    movableJawBottomLocalY:movableJawBottom-holderBaseWorldYmm,
    glassBottom,glassTop,slideThicknessMm,nominalJawGapMm,
    contactJawGapMm,previewClosingTravelMm,mode:'nominal_contact_no_verified_clamp_force',
    jawLengthMm,jawHalfWidthZmm,screwZmm,movablePlateThicknessMm,
    screwShaftLengthMm,screwShaftCenterLocalY,screwShaftBottomLocalY,movablePlateTopLocalY,
    actuatorCount:screwCount,independentMovingPlates:1,
    physicallyAccepted:false,
    known:'Daheng GCM-13 twin screws actuate a common middle pressure plate',
    unknown:'GCM-1302M specific jaw outline and exact screw/plate coordinates'
  };
}

// Direct B28 Ø12 bar-to-B06 GCM-1302M side-face interface per photos
// 108 and 150. B26 now represents ONLY an unverified Ø6/M6 threaded
// END STUD. The old 26mm black socket and 27mm hanging block did NOT
// exist in the supplied photograph and must not return.
export function getDirectSlideClampInterfaceDatums({
  rodEndX=24.5,plateSpineFaceX=24.5,
  lowerRodY=135,sideBoreY=135,
  rodDiameterMm=12,studDiameterMm=6,studLengthMm=10,
  spineLengthMm=17
}={}){
  const faceGapMm=plateSpineFaceX-rodEndX;
  const axisMismatchMm=Math.abs(lowerRodY-sideBoreY);
  const insertionDepthMm=studLengthMm;
  if(Math.abs(faceGapMm)>0.05)throw Error('Lower Ø12 bar does not terminate on GCM1302M spine face');
  if(axisMismatchMm>0.05)throw Error('M6 stud and plate-holder side hole are not coaxial');
  if(studDiameterMm>=rodDiameterMm || studDiameterMm<=0)
    throw Error('End stud must step down from Ø12 rod rather than continue full-sized rod into solid clamp');
  if(studLengthMm>spineLengthMm || studLengthMm<3)
    throw Error('Unverified stud would emerge beyond or fail to enter plate-holder spine');
  return Object.freeze({
    rodEndX,plateSpineFaceX,lowerRodY,sideBoreY,
    rodDiameterMm,studDiameterMm,studLengthMm,insertionDepthMm,
    faceGapMm,axisMismatchMm,
    visibleBulkyAdapter:false,
    threadIdentityVerified:false,
    loadedLoadPathAccepted:false,
    note:'A direct side connection appears in photos108/150; M6 thread and insertion are unconfirmed'
  });
}
