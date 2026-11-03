import assert from 'node:assert/strict';
import {PARTS,CONFIG} from '../src/parts.js';
import {PURCHASE} from '../src/procurement.js';
import {OPTICAL_HARDWARE,HOLDER_CONNECTIVITY,checkSourcedHolderPath} from '../src/vendor-hardware.js';
import {filmCantileverB} from '../src/assembly-qa.js';
import {DIMENSION_PHOTOS_V28,V28_OEM_DIMENSIONS} from '../src/dimension-evidence.js';

const b=new Map(PARTS.B.map(item=>[item.id,item]));
for(const id of ['B05','B06','B24','B25','B26','B27','B28','B33']){
 assert(b.has(id),'Unmodelled mechanical component: '+id);
 assert(PURCHASE.B[id],'Missing independent BOM line: '+id);
}
const path=checkSourcedHolderPath();
assert.equal(path.connected,true);
assert.equal(path.realHardwareIdentityAccepted,true,'Photo149 and 150 physically confirm two model identities');
assert.equal(path.fullAssemblyAccepted,false,'Thread, tilt, and rod length not accepted');
assert.equal(path.physicalFastenersAccepted,false);
assert.equal(path.links,9);
assert.equal(HOLDER_CONNECTIVITY.filter(x=>x.to==='B28').length,1);
assert.equal(HOLDER_CONNECTIVITY.filter(x=>x.to==='B33').length,1);

const clamp=OPTICAL_HARDWARE.B24;
assert.equal(clamp.model,'PHUC-1');
assert.equal(b.get('B24').model,'PHUC-1');
assert.equal(b.get('B24').level,'D');
assert.equal(clamp.known.weightKg,0.12);
assert.equal(clamp.known.outerDiameterBmm,30);
assert.equal(clamp.known.lengthAmm,60);
assert.equal(clamp.known.boreCenterSpacingEmm,33);
assert.equal(clamp.known.postDiameterMm,12);
assert.equal(clamp.alternative.model,'PHCP-2','Old erroneous clamp only alternative');
assert.equal(DIMENSION_PHOTOS_V28.B.evidence.B24.observedModel,'Zolix PHUC-1');
assert.equal(V28_OEM_DIMENSIONS.PHUC1.boreCenterSpacingEmm,33);
assert(!PURCHASE.B.B24.quote,'Do not apply PHCP-2 USD10 to PHUC-1');
assert(PURCHASE.B.B24.drawing.includes('PHUC.pdf'));

const long=OPTICAL_HARDWARE.B25,short=OPTICAL_HARDWARE.B27;
assert.equal(long.known.diameterMm,12);
assert.equal(short.known.diameterMm,12);
assert.equal(long.known.overallLengthMm,150,'150mm is candidate product not ruler measurement');
assert.equal(short.known.overallLengthMm,25,'25mm is candidate product not ruler measurement');
assert.equal(b.get('B27').level,'C');
assert.equal(b.get('B25').level,'C');

assert.equal(OPTICAL_HARDWARE.B06.known.thread,'M6');
assert.equal(OPTICAL_HARDWARE.B06.known.modelLmm,60);
assert.equal(OPTICAL_HARDWARE.B06.known.acceptsPlateThicknessUpToMm,5);
assert.equal(b.get('B06').model,'GCM-1302M');
assert(b.get('B06').evidence.includes('150'));
assert(OPTICAL_HARDWARE.B06.confidence.includes('photo150-model-confirmed'));
assert(PURCHASE.B.B06.datasheet?.startsWith('https://'));
assert(PURCHASE.B.B24.datasheet?.startsWith('https://'));
assert(PURCHASE.B.B28.note.includes('82mm'),'B28 candidate length cannot masquerade as measured');

const film=filmCantileverB({armX:CONFIG.B.armX,sampleX:CONFIG.B.sampleX});
assert.equal(film.oemRodLengthMm,150);
assert.equal(film.clampWorldX,40);
assert(film.jawEndX<film.opticalLeftLimitX);
assert(!PURCHASE.B.B26.datasheet,'Unidentified adapter cannot have an OEM datasheet');
assert(PURCHASE.B.B24.alternatives.some(a=>a[1].includes('Ø12.7')),
 'Must distinguish incompatible Daheng Ø12.7 from PHUC-1 Ø12');
assert.equal(PARTS.A.find(x=>x.id==='A16').model,'GCM-5306M');
assert(PURCHASE.A.A16,'A16 must have its own purchase line');
console.log('Photo-confirmed PHUC-1/GCM-1302M, 9 mechanical links, correct A16 base and BOM: PASS');
