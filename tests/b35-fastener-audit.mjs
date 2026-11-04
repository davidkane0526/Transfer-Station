import assert from 'node:assert/strict';
import {auditB35MicroscopeFasteners} from '../src/b35-fastener-audit.js';
const a=auditB35MicroscopeFasteners();
assert.equal(a.candidateFootHoleCount,4);
assert.equal(a.footHasFourCandidateThroughBores,true);
assert.equal(a.footBoreDiameterMm,4);
assert.equal(a.holesAreDecorativeBlindRecesses,true);
assert.equal(a.boardBoltPatternAligned,false,
  'A contact-area pass must NEVER be mistaken for matching fastener holes');
assert(a.maxMismatchMm>14&&a.maxMismatchMm<15,
  'Current photo-fit B16 bolts do not line up with cosmetic B35 grid');
assert.equal(a.boardAnchorThreadVerified,false);
assert.equal(a.knownOEMBoardSku,false);
assert.equal(a.loadBearingFastenerJointAccepted,false);
const aligned=auditB35MicroscopeFasteners({microscopeCenterX:90,microscopeCenterZ:-100});
assert.equal(aligned.maxMismatchMm,0,
  'Diagnostic must detect alignment if candidate datums happen to coincide');
assert.equal(aligned.loadBearingFastenerJointAccepted,false,
  'Even aligned decorative recesses cannot prove threaded engagement');
assert.throws(()=>auditB35MicroscopeFasteners({boardBlindDepthMm:12}),/Invalid/);
console.log('V35 B35/B16 actual support vs unverified mounting holes: PASS');
