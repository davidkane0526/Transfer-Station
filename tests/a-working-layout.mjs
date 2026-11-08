import assert from 'node:assert/strict';
import {A_WORKING_LAYOUT,auditAWorkingLayout} from '../src/a-working-layout.js';
import {photo94BracketCandidate} from '../src/photo-947-assembly.js';
const original=photo94BracketCandidate({stageCenterX:-116,stageTopY:164});
assert.equal(original.handedness,'left');
assert.equal(original.leftX,-164);
assert.equal(original.legX,-164);
assert.equal(original.verticalLegLength,72);
const hypothesis=photo94BracketCandidate({
  stageCenterX:A_WORKING_LAYOUT.filmStageX,stageTopY:164,
  handedness:'right',verticalLegLength:A_WORKING_LAYOUT.lLegLengthMm
});
assert.equal(hypothesis.legX,A_WORKING_LAYOUT.filmStageX+48);
assert.equal(hypothesis.verticalLegBottomY,111.9);
const nominal=auditAWorkingLayout();
assert.equal(nominal.actualStagePosePhotoRegistered,false);
assert.equal(nominal.A17SkuVerified,false);
assert.equal(nominal.A05CClampSkuVerified,false);
assert.equal(nominal.basesSeparate,true);
assert.equal(nominal.footprintGapMm,60.25);
assert.equal(nominal.glassLeftX,10);
assert.equal(nominal.glassRightX,86);
assert.equal(nominal.stampCenterX,78);
assert.equal(nominal.stampCenterZ,0);
assert.equal(nominal.stampRightMarginMm,4);
assert.equal(nominal.clampRightX,20);
assert.equal(nominal.clampHeaterClearanceMm,25.5);
assert.equal(nominal.sampleChipTopWorldYmm,110.6);
assert.equal(nominal.metalHeaterTopWorldYmm,109.2);
assert.equal(nominal.initialVerticalStampGapMm,13);
assert.equal(nominal.candidateCanLower,true);
assert.equal(nominal.stampInsideSampleChipFootprint,true);
assert.equal(nominal.sampleChipFootprintMm,28);
assert.equal(nominal.minimumStampEdgeInsetMm,10);
const safeOffset=auditAWorkingLayout({sampleShiftMm:5,filmDepthShiftMm:3});
assert.equal(safeOffset.stampInsideSampleChipFootprint,true);
assert.equal(safeOffset.candidateCanLower,true);
const badDepth=auditAWorkingLayout({filmDepthShiftMm:12.5});
assert.equal(badDepth.stampInsideHeaterBoundingBox,true);
assert.equal(badDepth.stampInsideSampleChipFootprint,false);
assert.equal(badDepth.candidateCanLower,false);
const contact=auditAWorkingLayout({filmDropMm:13});
assert.equal(contact.verticalStampGapMm,0);
assert.equal(contact.candidateCanLower,true);
const worstStraight=auditAWorkingLayout({filmShiftMm:12.5,sampleShiftMm:-12.5});
assert.equal(worstStraight.clampHeaterClearanceMm,.5);
assert.equal(worstStraight.clipOutsideHeater,true);
assert.equal(worstStraight.stampInsideHeaterBoundingBox,true,
  '8mm stamp still fits wide heater bounding box');
assert.equal(worstStraight.stampInsideSampleChipFootprint,false,
  'Full stamp falls outside 28mm sample chip after -12.5mm stroke');
assert.equal(worstStraight.candidateCanLower,false,
  'Do not allow descent when stamp misses the chip even if heater envelope passes');
const unsafeTurn=auditAWorkingLayout({sampleAngleDeg:45,filmDropMm:13});
assert(unsafeTurn.clampHeaterClearanceMm<nominal.clampHeaterClearanceMm);
const worstTurn=auditAWorkingLayout({sampleAngleDeg:45,filmShiftMm:12.5,sampleShiftMm:-12.5,filmDropMm:13});
assert.equal(worstTurn.clipOutsideHeater,false);
assert.equal(worstTurn.candidateCanLower,false);
assert.throws(()=>auditAWorkingLayout({filmDropMm:14}),/Invalid/);
assert.equal(nominal.photographedWingScrewAxis,'X-outward');
assert.equal(nominal.filmStageX,-70.75);
assert.equal(nominal.filmBaseRepositionedMm,-24);
assert.equal(nominal.wingScrewsOutsideUndrilledGlass,true);
assert.equal(nominal.candidateFootGlassPlanarOverlap,false);
assert.equal(nominal.fullCandidateClampAssemblyCertified,false);
assert.equal(nominal.usableForMachining,false);
console.log('V58 platform A: mirrored PROXY, separate magnetic/sample bases, stamp alignment, 13mm VC13 descent, rotated clamp collision lock: PASS');
