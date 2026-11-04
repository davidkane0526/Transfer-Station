import assert from 'node:assert/strict';
import {auditB35MicroscopeFasteners} from '../src/b35-fastener-audit.js';
const a=auditB35MicroscopeFasteners();
assert.equal(a.candidateFootHoleCount,4);
assert.equal(a.footHasFourCandidateThroughBores,true);
assert.equal(a.footBoreDiameterMm,6.5,'An M6 screw cannot pass the previous Ø4 hole');
assert.equal(a.proposedThreadPilotDiameterMm,5);
assert.equal(a.proposedThreadPilotDepthMm,6);
assert.equal(a.candidateThreadPilotCount,4);
assert.equal(a.maxMismatchMm,0,'Nominal geometry must register all four candidate hole centres');
assert.equal(a.boardBoltPatternAligned,true);
assert.equal(a.nominalGridRegistered,true);
assert.deepEqual(a.microscopePostShiftFromV44Mm,{x:8,z:12});
assert.equal(a.boardAnchorThreadVerified,false);
assert.equal(a.knownOEMBoardSku,false);
assert.equal(a.loadBearingFastenerJointAccepted,false,
 'A plausible candidate bolt layout is NOT approval for a real load-bearing microscope');
const old=auditB35MicroscopeFasteners({microscopeCenterX:82,microscopeCenterZ:-112});
assert(old.maxMismatchMm>14&&old.maxMismatchMm<15,
  'Regression: the old scene location had ~14.4 mm centre mismatch');
assert.equal(old.boardBoltPatternAligned,false);
assert.throws(()=>auditB35MicroscopeFasteners({boardBlindDepthMm:12}),/Invalid/);
assert.throws(()=>auditB35MicroscopeFasteners({proposedThreadPilotDiameterMm:7}),/Invalid/);
console.log('V45 B16/B35 nominal four-hole registration, M6 fit and OEM uncertainty: PASS');
