import assert from 'node:assert/strict';
import {A_WORKING_LAYOUT,auditAWorkingLayout} from '../src/a-working-layout.js';
import {photo94BracketCandidate} from '../src/photo-947-assembly.js';

const original=photo94BracketCandidate({stageCenterX:-116,stageTopY:164});
assert.equal(original.handedness,'left');
assert.equal(original.leftX,-164);
assert.equal(original.legX,-164);
assert.equal(original.verticalLegLength,72);

// V79 keeps ONE left-handed physical sheet definition. Installation is a
// rigid 180° yaw of the whole film branch, never a mirrored A05-only model.
const local=photo94BracketCandidate({
  stageCenterX:A_WORKING_LAYOUT.filmStageX,stageTopY:A_WORKING_LAYOUT.bracketTopWorldYmm,
  topPlateWidth:A_WORKING_LAYOUT.lBracketTopWidthMm,
  leftOverhangMm:A_WORKING_LAYOUT.lBracketOverhangMm,
  handedness:'left',verticalLegLength:A_WORKING_LAYOUT.lLegLengthMm
});
assert.equal(local.legX,A_WORKING_LAYOUT.filmStageX-60);
assert.equal(local.verticalLegBottomY,111.9);
assert.equal(A_WORKING_LAYOUT.a15Vc13CatalogReferenceHeightMm,126);
assert.equal(A_WORKING_LAYOUT.a15Vc13LowerPoseHeightMm,119.5);
assert.equal(A_WORKING_LAYOUT.a15Vc13InstalledOrderMatchesGCM901602,false);
assert.equal(A_WORKING_LAYOUT.bracketTopWorldYmm,199.5);
assert.equal(A_WORKING_LAYOUT.lLegLengthMm,87.6);
assert.equal(A_WORKING_LAYOUT.installedFilmYawDeg,180);
assert.equal(A_WORKING_LAYOUT.localBracketHandedness,'left');
assert.equal(A_WORKING_LAYOUT.localStampXBeforeYawMm,-160.75);
assert.equal(A_WORKING_LAYOUT.nominalStampTargetXmm,78);
assert.equal(A_WORKING_LAYOUT.filmStageX,-82.75);
assert.equal(A_WORKING_LAYOUT.filmStageXSolvedFromNominalPdmsTarget,true);
assert.equal(A_WORKING_LAYOUT.filmStageXPhotoMeasured,false);
assert.equal(A_WORKING_LAYOUT.filmStageXPhotoRegistered,false);
assert.equal(A_WORKING_LAYOUT.filmStageX,
  A_WORKING_LAYOUT.sampleCenterX+A_WORKING_LAYOUT.localStampXBeforeYawMm);

const nominal=auditAWorkingLayout();
assert.equal(nominal.actualStagePosePhotoRegistered,false);
assert.equal(nominal.filmStageXSolvedFromNominalPdmsTarget,true);
assert.equal(nominal.filmStageXPhotoMeasured,false);
assert.equal(nominal.filmStageXPhotoRegistered,false);
assert.match(nominal.filmStageXDerivation,/sampleCenterX/);
assert.equal(nominal.localStampXBeforeYawMm,-160.75);
assert.equal(nominal.nominalStampTargetXmm,78);
assert.equal(nominal.solvedFilmStageXmm,-82.75);
assert.equal(nominal.solvedFilmMinusSampleCenterXmm,-160.75);
assert.equal(nominal.A17SkuVerified,false);
assert.equal(nominal.A05CClampSkuVerified,false);
assert.equal(nominal.basesSeparate,true);
assert.equal(nominal.footprintGapMm,72.25);
assert.equal(nominal.localHandedness,'left');
assert.equal(nominal.installedFilmYawDeg,180);
assert.equal(nominal.a15Vc13CatalogReferenceHeightMm,126);
assert.equal(nominal.a15Vc13LowerPoseHeightMm,119.5);
assert.equal(nominal.a15Vc13InstalledOrderMatchesGCM901602,false);
assert.equal(nominal.catalogReferenceHeightIsMotionZero,false);
assert.equal(nominal.glassLeftX,10);
assert.equal(nominal.glassRightX,86);
assert.equal(nominal.stampCenterX,78);
assert.equal(nominal.stampCenterZ,0);
assert.equal(nominal.stampRightMarginMm,4);
assert.equal(nominal.clampLeftX,10);
assert.equal(nominal.clampRightX,38);
assert.equal(nominal.clampHeaterClearanceMm,7.5);
assert.equal(nominal.sampleChipTopWorldYmm,110.6);
assert.equal(nominal.metalHeaterTopWorldYmm,109.2);
assert.equal(nominal.initialVerticalStampGapMm,13);
assert.equal(nominal.candidateCanLower,true);
assert.equal(nominal.stampInsideSampleChipFootprint,true);
assert.equal(nominal.sampleChipFootprintMm,28);
assert.equal(nominal.minimumStampEdgeInsetMm,10);
assert.equal(nominal.screwAxisParallelGlassShortEdge,true);
assert.equal(nominal.screwAxis,'scene-Z / parallel to 26mm glass short edge');
assert.equal(nominal.screwPitchAlongGlassLengthMm,18);
assert.equal(nominal.verticalFootClampBoresRequired,false);
assert.equal(nominal.glassRequiredForTransfer,true);

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
assert.equal(worstStraight.clampHeaterClearanceMm,0);
assert.equal(worstStraight.clipOutsideHeater,false);
assert.equal(worstStraight.stampInsideHeaterBoundingBox,true);
assert.equal(worstStraight.stampInsideSampleChipFootprint,false);
assert.equal(worstStraight.candidateCanLower,false);

const unsafeTurn=auditAWorkingLayout({sampleAngleDeg:45,filmDropMm:13});
assert(unsafeTurn.clampHeaterClearanceMm<nominal.clampHeaterClearanceMm);
assert.equal(unsafeTurn.clipOutsideHeater,false);
const worstTurn=auditAWorkingLayout({
  sampleAngleDeg:45,filmShiftMm:12.5,sampleShiftMm:-12.5,filmDropMm:13});
assert.equal(worstTurn.clipOutsideHeater,false);
assert.equal(worstTurn.candidateCanLower,false);
assert.throws(()=>auditAWorkingLayout({filmDropMm:14}),/Invalid/);
assert.equal(nominal.filmStageX,-82.75);
assert.equal(nominal.fullCandidateClampAssemblyCertified,false);
assert.equal(nominal.usableForMachining,false);
console.log('V80 platform A: 126mm T25M2L+VC13M envelope, rigid 180deg film chain and short-edge clamp: PASS');
