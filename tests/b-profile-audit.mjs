import assert from 'node:assert/strict';
import {B149,auditB149} from '../src/b-photo149-geometry.js';
import {V28_OEM_DIMENSIONS,DIMENSION_PHOTOS_V28} from '../src/dimension-evidence.js';
import {getDirectSlideClampInterfaceDatums} from '../src/holder-mechanics.js';

assert.equal(DIMENSION_PHOTOS_V28.B.evidence.B24.observedModel,'Zolix PHUC-1');
assert.equal(V28_OEM_DIMENSIONS.PHUC1.boreCenterSpacingEmm,33);
const fit=auditB149();
const connection=getDirectSlideClampInterfaceDatums({
  rodEndX:fit.lowerRodEndX,
  plateSpineFaceX:fit.glassHolderSpineLeftX,
  lowerRodY:fit.lowerRodY,
  sideBoreY:fit.lowerRodY
});
assert.equal(connection.faceGapMm,0);
assert.equal(connection.axisMismatchMm,0);
assert.equal(connection.studDiameterMm,6);
assert.equal(connection.studLengthMm,10);
assert.equal(connection.visibleBulkyAdapter,false);
assert.equal(connection.threadIdentityVerified,false);
assert.equal(connection.loadedLoadPathAccepted,false);
assert.throws(()=>getDirectSlideClampInterfaceDatums({rodEndX:32}),/face/);
assert.throws(()=>getDirectSlideClampInterfaceDatums({sideBoreY:129}),/coaxial/);
assert.throws(()=>getDirectSlideClampInterfaceDatums({studDiameterMm:12}),/step down/);
assert.throws(()=>getDirectSlideClampInterfaceDatums({studLengthMm:25}),/beyond/);
console.log('No phantom B26: photo108 direct Ø12/M6 plate-holder side joint and real hole axes PASS');
