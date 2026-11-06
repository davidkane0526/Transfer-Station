import assert from 'node:assert/strict';
import {PARTS} from '../src/parts.js';
import {PHOTO_94_95_97,photo94BracketCandidate,getPhotoComparison,vc13PhotoScrewDatums,photo95FrontDriveDatums} from '../src/photo-947-assembly.js';
import {STACKS,HANDLES} from '../src/photo-evidence.js';

assert.equal(PHOTO_94_95_97.rig,'A','User photographs 94-97 must not be tagged as B');
assert.deepEqual(PHOTO_94_95_97.imageToParts['94'],['A04L','A04','A05']);
assert.deepEqual(PHOTO_94_95_97.imageToParts['95'],['A15']);
assert.deepEqual(PHOTO_94_95_97.imageToParts['97'],['A15','A03']);
assert.deepEqual(PHOTO_94_95_97.stageIds,STACKS.A.film.slice(1,6));
assert.deepEqual(STACKS.A.film.slice(6),['A05C','A05G'],
 'Unverified clamp and right-edge glass must be separate from the photo94-confirmed bracket');
assert.equal(STACKS.A.film[0],'A17','A17 is user-confirmed magnetic mounting relation, not photo94-visible model');
assert.deepEqual(PHOTO_94_95_97.g40.nominalPlateMm,[40,40]);
assert.equal(PHOTO_94_95_97.g40.nominalHeightMm,20);
const frontDrive=photo95FrontDriveDatums();
assert(frontDrive.supportConnected);
assert.equal(frontDrive.overlapLeftMm,2.5);
assert.equal(frontDrive.overlapRightMm,2.5);
assert(frontDrive.clearanceFromStageFrontMm>=0.5,
 'Photo95 shaft must not penetrate solid 65mm T25M front wall');
assert.throws(()=>photo95FrontDriveDatums({shaftCenterFrontZmm:32.7}),
 /penetrates/,'Original front shaft was inside the stage face');
assert.throws(()=>photo95FrontDriveDatums({shaftLengthMm:40}),
 /floating/,'Short front rod must not hang in space between black stops');
const upright=vc13PhotoScrewDatums();
assert.equal(upright.drumTopLocalYmm,48);
assert.equal(upright.frontZmm,40);
assert.throws(()=>vc13PhotoScrewDatums({frontZmm:25}),/intersects/,
 'Old VC13 front drive would penetrate the moving plate sweep');
assert.equal(upright.clearanceToG40Mm,3);
assert(upright.stemCenterLocalYmm+upright.stemLengthMm/2 >
 upright.drumCenterLocalYmm-upright.drumLengthMm/2);
assert.throws(()=>vc13PhotoScrewDatums({drumCenterLocalYmm:58}),
 /intrudes/,'Old screenshot failure: VC13 silver knurl must never enter G40 body');

assert.equal(PHOTO_94_95_97.g40.centerOfRotationHeightMm,60);
assert.deepEqual(PHOTO_94_95_97.vc13m.topSizeMm,[65,65]);
assert.equal(HANDLES.A15.handles,2);
assert.equal(HANDLES.A04L.direction,'-X');
assert.equal(HANDLES.A04.direction,'+X');
assert.equal(PHOTO_94_95_97.visibleMetalConnection.likelySecondGoniometerUnderNamedG40,true);
assert.equal(PHOTO_94_95_97.visibleMetalConnection.lowerGoniometerModelVerified,false);
assert.equal(HANDLES.A03.direction,'+Y');
const bracket=photo94BracketCandidate();
assert.equal(bracket.topY,164,'V47 A05 rests on two independent nominal 20mm goniometer modules');
assert.equal(bracket.topPlateWidth,75);
assert.equal(bracket.leftOverhangMm,48);
assert.equal(bracket.leftX,-164);
assert.equal(bracket.rightX,-89);
assert.equal(bracket.topLengthNotFromRuler,true);
assert.equal(bracket.metalThickness,2.5);
assert.equal(bracket.topPlateDepth,12,'The black L strip is a narrow front-edge strap, not a broad 32mm cover');
assert.equal(bracket.sheetFrontZ,13);

assert.equal(bracket.topBoltCount,2);
assert.equal(bracket.fixedSheetCount,1);
assert(bracket.leftX < -136 && bracket.rightX >= -96,
 'The top L sheet must cover G40M60L top surface and overhang left');
assert.equal(bracket.verticalLegBottomY,92);
assert.equal(bracket.glassGripModelConfirmed,false);
assert.equal(bracket.loadBearingVerified,false);
const names=Object.fromEntries(PARTS.A.map(x=>[x.id,x]));
for(const id of PHOTO_94_95_97.stageIds)assert(names[id],'Photo part absent: '+id);
assert.equal(names.A03.model,'GCM-VC13M');
assert.equal(names.A04.model,'GCM-G40M60L');
assert.match(names.A04L.model,/GCM-G40M40L/);
assert.match(names.A04L.interfaceNote,/未确认|待/);
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
