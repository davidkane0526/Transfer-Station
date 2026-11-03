import assert from 'node:assert/strict';
import {AXES,JOINTS,filmCantileverB} from '../src/assembly-qa.js';
import {CONFIG,PARTS} from '../src/parts.js';

assert.deepEqual(AXES.B09.makerAxes,['X'],'NFP must remain OEM X-axis only');
assert.equal(AXES.B09.micrometers,1,'Never invent a second NFP handle');
assert.equal(AXES.B09.linear,1,'NFP-1462C is a one-axis linear stage');
assert.equal(AXES.B08.linear,0,'B08 rotary is not a second linear axis');
assert.deepEqual(AXES.B03.sceneAxes,['X','Z'],
 'The Daheng XY stage is scene X/Z because scene Y is height');
assert.equal(AXES.B03.micrometers,2,'B03 has two independent handwheels');
assert.equal(AXES.A15.micrometers,2,'A15 has two independent handwheels');
const film=filmCantileverB({
 armX:CONFIG.B.armX,sampleX:CONFIG.B.sampleX
});
assert.equal(film.loopBack,false,'Do not draw a fabricated wraparound loop');
assert.equal(film.verticalFreeRods,0,'No freestanding rods or faux guides');
assert.equal(film.clampWorldX,CONFIG.B.sampleX-42);
assert.equal(film.glassLeftEdgeX,CONFIG.B.sampleX+5-76/2);
assert.equal(film.rodEndX,CONFIG.B.sampleX-42-CONFIG.B.armX);
assert.equal(film.rodLength,140,'The arm must end LEFT of the optical axis');
assert.equal(film.terminalBottomLocalY,-7,'Support reaches B06 at world Y=128');
assert.equal(film.terminalHeight,27);
assert.equal(film.rodCenterY,20);
assert.equal(film.oemRodLengthMm,150);
assert.equal(film.hiddenInsertionMm,10);
assert.equal(film.terminalBottomLocalY+135,128);
assert.equal(film.mountY,135,'B05 base must seat onto B04 top at world Y=135');
assert(film.rodEndX+CONFIG.B.armX<CONFIG.B.sampleX-17,
 'Metal rod must not cross the objective center or lens envelope');
assert(film.jawEndX>film.glassLeftEdgeX,'Edge jaws must overlap glass edge');
assert(film.jawEndX<film.opticalLeftLimitX,'Metal jaw must stop before optical keep-out');
assert.equal(film.opticalAxisTraversed,false);
assert.throws(()=>filmCantileverB({armX:CONFIG.B.armX,sampleX:CONFIG.B.sampleX,glassClampXOffset:0}),
 /optical keep-out/,'A rod ending at the optical axis must be rejected');
assert.equal(film.physicalJointAccepted,false,'Candidate arm height is not physical acceptance');
assert.throws(()=>filmCantileverB({armX:1,sampleX:2}),/span/);
const valid=new Set(Object.values(PARTS).flatMap(x=>x.map(v=>v.id)));
for(const [id,joint] of Object.entries(JOINTS)){
 assert(valid.has(id),'Fastener on non-existent part '+id);
 assert(joint.count>0&&Number.isInteger(joint.count));
 assert(joint.status==='candidate'||joint.status==='count-and-flush-user-confirmed');
}
assert.equal(JOINTS.B14.count,4);
assert.equal(JOINTS.B14.status,'count-and-flush-user-confirmed');
assert.equal(JOINTS.B09.status,'candidate','Never infer NFP-to-rotary bolt length');
assert.equal(JOINTS.B06.count,2);
console.log('Structural QA: X-only NFP; B03 XY; no return loop; supported film clamp; visible provisional fasteners PASS');
