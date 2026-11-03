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
export function getCrossClampDatums({
  supportPostZmm=-20,horizontalPostZmm=0,postRadiusMm=6,
  ringOuterRadiiMm=[12.5,13],minimumRodSurfaceGapMm=2
}={}){
  const boreSpacingMm=Math.abs(supportPostZmm-horizontalPostZmm);
  const rodSurfaceClearanceMm=boreSpacingMm-2*postRadiusMm;
  if(!(rodSurfaceClearanceMm>=minimumRodSurfaceGapMm))
    throw new Error('Two solid Ø12 posts would intersect or violate visual clearance');
  if(ringOuterRadiiMm.some(r=>r<=postRadiusMm))
    throw new Error('A clamp ring cannot be thinner than its post bore');
  return {
    verticalBore:{axis:'Y',x:0,z:supportPostZmm},
    horizontalBore:{axis:'X',x:0,z:horizontalPostZmm},
    boreSpacingMm,rodSurfaceClearanceMm,
    outerDiametersMm:ringOuterRadiiMm.map(r=>2*r),
    interfaceAccepted:false,
    evidence:'Zolix PHCP-2 OEM Ø12 bores; offset is unverified assembly proxy'
  };
}
export function getPlateHolderJawDatums({
  holderBaseWorldYmm=121.5,slideCenterWorldYmm=105,
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
  const movableJawBottom=fixedJawTop+nominalJawGapMm;
  const screwCount=screwZmm.length;
  if(screwCount!==HOLDER_OEM.gcmScrewDriveCount)
    throw new Error('Daheng GCM-13 must have two adjustment threads on one moving plate');
  if(screwZmm.some(z=>Math.abs(z)>jawHalfWidthZmm))
    throw new Error('Adjustment screw misses the common moving plate');
  return {
    fixedJawTopLocalY:fixedJawTop-holderBaseWorldYmm,
    movableJawBottomLocalY:movableJawBottom-holderBaseWorldYmm,
    glassBottom,glassTop,slideThicknessMm,nominalJawGapMm,
    jawLengthMm,jawHalfWidthZmm,screwZmm,
    actuatorCount:screwCount,independentMovingPlates:1,
    physicallyAccepted:false,
    known:'Daheng GCM-13 twin screws actuate a common middle pressure plate',
    unknown:'GCM-1302M specific jaw outline and exact screw/plate coordinates'
  };
}
