import assert from 'node:assert/strict';
import {HOLDER_OEM,getCrossClampDatums,getPostBaseDatums,getPlateHolderJawDatums}
 from '../src/holder-mechanics.js';

assert.equal(HOLDER_OEM.clampBoreDiameterMm,12);
assert.equal(HOLDER_OEM.postDiameterMm,12);
const base=getPostBaseDatums();
assert.equal(base.verifiedThroughType,'M6 TH');
assert(base.mountBoreDiameterMm<base.seatDiameterMm,
 'Do not pretend PHPB-1 has a full-depth Ø12 mounting bore');
assert.equal(base.lowerThroughLengthMm+base.seatDepthMm,base.heightMm);
assert.equal(base.seatDepthVerified,false);
assert.equal(base.physicalEngagementVerified,false);
assert.throws(()=>getPostBaseDatums({mountBoreDiameterMm:12.1,seatDiameterMm:12.1}),
 /distinguish/);
assert.throws(()=>getPostBaseDatums({seatDepthMm:6}),/full/);

assert.deepEqual(HOLDER_OEM.phcpBodyDiametersMm,[25,26]);
const clamp=getCrossClampDatums();
assert.equal(clamp.verticalBore.axis,'Y');
assert.equal(clamp.horizontalBore.axis,'X');
assert.notEqual(clamp.verticalBore.z,clamp.horizontalBore.z,
 'The two PHCP-2 shaft axes must not intersect at the same datum');
assert.equal(clamp.boreSpacingMm,15);
assert.equal(clamp.rodSurfaceClearanceMm,3);
assert(clamp.rodSurfaceClearanceMm>=2);
assert.deepEqual(clamp.outerDiametersMm,[25,26]);
assert.equal(clamp.interfaceAccepted,false);
assert.throws(()=>getCrossClampDatums({supportPostZmm:-10}),
 /intersect|clearance/,'Two cylindrical Ø12 posts must never occupy the same volume');
assert.throws(()=>getCrossClampDatums({supportPostZmm:0}),
 /intersect|clearance/);
assert.throws(()=>getCrossClampDatums({ringOuterRadiiMm:[5,13]}),/thinner/);
const jaws=getPlateHolderJawDatums();
assert.equal(jaws.glassBottom,104.5);
assert.equal(jaws.glassTop,105.5);
assert.equal(jaws.fixedJawTopLocalY,-17);
assert.equal(jaws.movableJawBottomLocalY,-16);
assert.equal(jaws.nominalJawGapMm,1.5,'1.5mm is open insertion gap only');
assert.equal(jaws.contactJawGapMm,1,'Modeled moving plate must touch 1mm slide');
assert.equal(jaws.previewClosingTravelMm,.5);
assert.equal(jaws.mode,'nominal_contact_no_verified_clamp_force');
assert.equal(jaws.nominalJawGapMm,1.5);
assert.equal(jaws.actuatorCount,2);
assert.equal(jaws.independentMovingPlates,1);
assert.equal(jaws.screwShaftBottomLocalY,jaws.movablePlateTopLocalY,
 'Adjustment screws must physically contact, not float over, the common pressure plate');
assert(jaws.fixedJawTopLocalY<jaws.movableJawBottomLocalY);
assert.equal(jaws.movableJawBottomLocalY+121.5,jaws.glassTop);
assert.equal(jaws.physicallyAccepted,false);
assert.throws(()=>getPlateHolderJawDatums({slideThicknessMm:5.1}),/exceeds/);
assert.throws(()=>getPlateHolderJawDatums({nominalJawGapMm:.75}),/overlap/);
assert.throws(()=>getPlateHolderJawDatums({screwZmm:[-17]}),/two adjustment/);
assert.throws(()=>getPlateHolderJawDatums({screwZmm:[-30,17]}),/misses/);
console.log('V25.1: Zolix offset through-bores and Daheng common pressure plate: PASS (all datum values remain candidates)');
