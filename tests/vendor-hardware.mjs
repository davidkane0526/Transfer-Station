import assert from 'node:assert/strict';
import {PARTS,CONFIG} from '../src/parts.js';
import {PURCHASE} from '../src/procurement.js';
import {OPTICAL_HARDWARE,HOLDER_CONNECTIVITY,checkSourcedHolderPath} from '../src/vendor-hardware.js';
import {filmCantileverB} from '../src/assembly-qa.js';

const b=new Map(PARTS.B.map(item=>[item.id,item]));
for(const id of ['B05','B06','B24','B25','B26','B27']){
 assert(b.has(id),'Unmodelled mechanical component: '+id);
 assert(PURCHASE.B[id],'Missing independent BOM line: '+id);
}
const path=checkSourcedHolderPath();
assert.equal(path.connected,true);
assert.equal(path.realHardwareIdentityAccepted,false);
assert.equal(path.physicalFastenersAccepted,false);
assert.equal(path.links,7);
const clamp=OPTICAL_HARDWARE.B24;
assert.equal(clamp.model,'PHCP-2');
assert.deepEqual(clamp.known,{postDiameterMm:12,holes:2,relativeRotationDeg:360,weightKg:0.05});
assert.equal(clamp.alternative.model,'PHCP-1');
const long=OPTICAL_HARDWARE.B25,short=OPTICAL_HARDWARE.B27;
assert.equal(long.model,'PHSP12-5');
assert.equal(long.known.overallLengthMm,150);
assert.equal(short.known.overallLengthMm,25);
assert.equal(long.known.diameterMm,clamp.known.postDiameterMm);
assert.equal(short.known.diameterMm,clamp.known.postDiameterMm);
assert.equal(OPTICAL_HARDWARE.B06.known.thread,'M6');
assert.equal(OPTICAL_HARDWARE.B06.known.modelLmm,60);
assert.equal(OPTICAL_HARDWARE.B06.known.acceptsPlateThicknessUpToMm,5);
const film=filmCantileverB({armX:CONFIG.B.armX,sampleX:CONFIG.B.sampleX});
assert.equal(film.oemRodLengthMm,150);
assert.equal(film.rodCenterY,20);
assert.equal(film.hiddenInsertionMm,10);
assert.equal(film.clampWorldX,40);
assert(film.jawEndX < film.opticalLeftLimitX);
assert(!PURCHASE.B.B26.datasheet,'Unidentified terminal adapter cannot be given a fictitious OEM data sheet');
for(const id of ['B06','B24','B25','B27']){
 assert.equal(b.get(id).level,'C','Physical photo identity of '+id+' must remain candidate');
 assert(PURCHASE.B[id].datasheet?.startsWith('https://'),'Part '+id+' has no real vendor reference');
 assert(OPTICAL_HARDWARE[id].confidence.includes('not-confirmed'),
  'Photo identity was falsely upgraded for '+id);
}
assert(PURCHASE.B.B24.alternatives.some(a=>a[1].includes('Ø12.7')),
 'Must disclose incompatibility of DHC 12.7-mm and Zolix 12-mm posts');
console.log('Official-source optical holder chain: PASS, exact physical identities still unverified');
