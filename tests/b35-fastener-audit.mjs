import assert from 'node:assert/strict';
import {auditB35MicroscopeFasteners,auditB08ToB35Mount} from '../src/b35-fastener-audit.js';

const a=auditB35MicroscopeFasteners();
assert.equal(a.boardSkuCandidate,'Thorlabs MB2530/M');
assert.equal(a.boardSkuConfirmed,false);
assert.deepEqual(a.boardSizePhotoFitMm,[250,300,12]);
assert.equal(a.officialCandidateThicknessMm,12.7);
assert.equal(a.gridHolePitchMm,25);
assert.equal(a.gridEdgeOffsetMm,12.5);
assert.equal(a.gridHoleCount,120,'MB2530/M candidate grid is 10×12 through-tapped M6');
assert.equal(a.gridThrough,true);
assert.equal(a.gridTapDrillDiameterMm,5);
assert.equal(a.mountingHoleInsetMm,25);
assert.equal(a.mountingHoleCount,4);
assert.equal(a.mountingCounterboreCount,4);
assert.equal(a.centralFifthCounterbore,false);
assert.equal(a.mountingHolePattern,'four corner counterbores only');
assert.deepEqual(a.boardAnchorHolePositionsWorldMm,[[-25,-125],[-25,125],[175,-125],[175,125]]);
assert.equal(a.boardAnchorsAlignToB01CandidateGrid,true);
assert.deepEqual(a.footCenterWorldMm,[87.5,-112.5]);
assert.deepEqual(a.footHolePositionsWorldMm,[[62.5,-137.5],[62.5,-87.5],[112.5,-137.5],[112.5,-87.5]]);
assert.equal(a.candidateFootHoleCount,4);
assert.equal(a.footBoreDiameterMm,6.5);
assert.equal(a.maxMismatchMm,0);
assert.equal(a.nominalGridRegistered,true);
assert.equal(a.boardBoltPatternAligned,true);
assert.equal(a.boardThreadedFixingVerified,false);
assert.equal(a.boardAnchorThreadVerified,false);
assert.equal(a.loadedJointAccepted,false);
assert.equal(a.loadBearingFastenerJointAccepted,false);
assert.equal(a.holesAreDecorativeBlindRecesses,false);

const oldV45=auditB35MicroscopeFasteners({microscopeCenterX:90,microscopeCenterZ:-100});
assert.equal(oldV45.nominalGridRegistered,false);
assert.ok(Math.abs(oldV45.maxMismatchMm-Math.hypot(2.5,12.5))<.01,
  'V45 90/-100 foot coordinates miss the true MB2530/M grid phase');
const originalPhotoFit=auditB35MicroscopeFasteners({microscopeCenterX:82,microscopeCenterZ:-112});
assert.ok(Math.abs(originalPhotoFit.maxMismatchMm-Math.hypot(5.5,.5))<.01,
  'original photo-fit center is close but not exactly on the OEM grid');
assert.throws(()=>auditB35MicroscopeFasteners({boardPitchMm:0}),/finite and positive/);
assert.throws(()=>auditB35MicroscopeFasteners({boardWidthMm:20,boardEdgeOffsetMm:12.5}),/edge offset/);
// The photographed B16 foot aligns with the CANDIDATE B35 grid; the
// distinct B08 four-hole OEM base does not at the existing optical datum.
const rotary=auditB08ToB35Mount();
assert.equal(rotary.candidateGridDirectFit,false);
assert.equal(rotary.currentSceneBoltedJointAccepted,false);
assert.equal(rotary.realMachineMountVerified,false);
assert.equal(rotary.mountingHolePairs.length,4);
assert(Math.abs(rotary.maxMismatchMm-Math.hypot(5.5,12.5))<.002,
  'B08's four OEM base holes do not coincide with B35 photo-fit grid');
const hypothetical=auditB08ToB35Mount({rotaryCenterX:87.5,rotaryCenterZ:12.5});
assert.equal(hypothetical.maxMismatchMm,0,
  'The checker must recognize a grid-compatible hypothetical pose, without relocating the optical axis');
assert.equal(hypothetical.realMachineMountVerified,false);
assert.throws(()=>auditB08ToB35Mount({rotaryMountPitchMm:0}),/Invalid/);
console.log('V51 MB2530/M candidate grid, B35 anchors and B16 foot registration: PASS');
