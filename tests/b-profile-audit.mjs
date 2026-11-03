import assert from 'node:assert/strict';
import {CONFIG} from '../src/parts.js';
import {photo94BracketCandidate} from '../src/photo-947-assembly.js';
import {auditBPhotoProfile} from '../src/b-physical-audit.js';
import {getTerminalAdapterDatums} from '../src/holder-mechanics.js';

const bracket=photo94BracketCandidate({stageCenterX:CONFIG.B.armX,stageTopY:144});
const b=auditBPhotoProfile({stageCenterX:CONFIG.B.armX,
 sampleCenterX:CONFIG.B.sampleX,stageTopY:144,bracket});
assert.equal(b.profile,'user-selected-B-94-95-97');
assert.equal(b.observedFilmClamp,false);
assert.equal(b.sampleAndFilmSameRigVerified,false);
assert.equal(b.transferPathConnected,false);
assert.equal(b.fullAssemblyAccepted,false);
assert(b.horizontalGapMm>100,'Current L sheet ends far from the optical axis: never mark B as complete');
assert(b.tipToGlassHeightMm>0,'Do not imply the unmeasured L leg terminates at the glass plane');
const adapter=getTerminalAdapterDatums();
assert.equal(adapter.spineTopWorldYmm,adapter.adapterBottomWorldYmm);
assert(adapter.socketToStemOverlapMm>0,'Round sleeve and terminal stem must physically touch');
assert.equal(adapter.physicalMatingVerified,false);
assert.throws(()=>getTerminalAdapterDatums({adapterHeightMm:21}),/disconnected/);
assert.throws(()=>getTerminalAdapterDatums({adapterHeightMm:46}),/penetrates/);
console.log('B photo-profile and terminal adapter physical QA: confirmed unresolved interfaces are visible; candidate mating faces connected PASS');
