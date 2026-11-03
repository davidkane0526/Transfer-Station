import assert from 'node:assert/strict';
import {PARTS} from '../src/parts.js';
import {PHOTO_94_95_97,photo94BracketCandidate,getPhotoComparison} from '../src/photo-947-assembly.js';
import {STACKS,HANDLES} from '../src/photo-evidence.js';

assert.equal(PHOTO_94_95_97.rig,'A','User photographs 94-97 must not be tagged as B');
assert.deepEqual(PHOTO_94_95_97.imageToParts['94'],['A04','A05']);
assert.deepEqual(PHOTO_94_95_97.imageToParts['95'],['A15']);
assert.deepEqual(PHOTO_94_95_97.imageToParts['97'],['A15','A03']);
assert.deepEqual(PHOTO_94_95_97.stageIds,STACKS.A.film.slice(0,4));
assert.deepEqual(PHOTO_94_95_97.g40.nominalPlateMm,[40,40]);
assert.equal(PHOTO_94_95_97.g40.nominalHeightMm,20);
assert.equal(PHOTO_94_95_97.g40.centerOfRotationHeightMm,60);
assert.deepEqual(PHOTO_94_95_97.vc13m.topSizeMm,[45,45]);
assert.equal(HANDLES.A15.handles,2);
assert.equal(HANDLES.A04.direction,'+X');
assert.equal(HANDLES.A03.direction,'+Y');
const bracket=photo94BracketCandidate();
assert.equal(bracket.topY,124,'A05 must sit on A04 top plane');
assert.equal(bracket.topPlateWidth,80);
assert.equal(bracket.metalThickness,2.5);
assert.equal(bracket.topBoltCount,2);
assert.equal(bracket.fixedSheetCount,1);
assert(bracket.leftX < -136 && bracket.rightX >= -96,
 'The top L sheet must cover G40M60L top surface and overhang left');
assert.equal(bracket.verticalLegBottomY,52);
assert.equal(bracket.glassGripModelConfirmed,false);
assert.equal(bracket.loadBearingVerified,false);
const names=Object.fromEntries(PARTS.A.map(x=>[x.id,x]));
for(const id of PHOTO_94_95_97.stageIds)assert(names[id],'Photo part absent: '+id);
assert.equal(names.A03.model,'GCM-VC13M');
assert.equal(names.A04.model,'GCM-G40M60L');
assert(names.A05.name.includes('L形薄金属'),'Do not draw a square crossbeam instead of L sheet');
assert(names.A05.interfaceNote.includes('未'),'Do not certify unseen grip interface');
const refA=getPhotoComparison('A'),refB=getPhotoComparison('B');
assert(refA.matched&&!refB.matched);
assert(refB.noClaim.includes('cannot verify B PHCP-2')||refB.noClaim.includes('cannot verify B'),
 'A close-ups must not certify unrelated B metal post rod');
for(const bad of ['two vertical dangling steel rods','oversized horizontal square beam']){
 assert(PHOTO_94_95_97.visibleMetalConnection.visuallyUnsupported.includes(bad));
}
assert.throws(()=>photo94BracketCandidate({metalThickness:12}),/THIN/);
assert.throws(()=>photo94BracketCandidate({topPlateWidth:38}),/photo silhouette/);
console.log('Real-image 94/95/97 mechanical identity, A/B separation and thin bent-L QA passed');
