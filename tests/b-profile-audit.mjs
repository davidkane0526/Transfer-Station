import assert from 'node:assert/strict';
import {V28_OEM_DIMENSIONS,DIMENSION_PHOTOS_V28} from '../src/dimension-evidence.js';
import {getTerminalAdapterDatums} from '../src/holder-mechanics.js';

assert.equal(DIMENSION_PHOTOS_V28.B.evidence.B24.observedModel,'Zolix PHUC-1');
assert.equal(V28_OEM_DIMENSIONS.PHUC1.boreCenterSpacingEmm,33);

const adapter=getTerminalAdapterDatums();
assert.equal(adapter.spineTopWorldYmm,adapter.adapterBottomWorldYmm,
 'Current B26 ends on B06 fixed spine, not floating');
assert(adapter.socketToStemOverlapMm>0,
 'Unverified end adapter must remain attached to Ø12 socket housing');
assert(adapter.clearanceToRodMm>=0.5,
 'Adapter stem must stay BELOW second PHUC Ø12 output rod');
assert.equal(adapter.physicalMatingVerified,false,
 'Nominal contact is not real threaded mate acceptance');
assert.equal(adapter.adapterBottomWorldYmm,119);
assert.equal(adapter.rodBottomWorldYmm,132.5);
assert.throws(()=>getTerminalAdapterDatums({adapterHeightMm:21}),/penetrates/);
assert.throws(()=>getTerminalAdapterDatums({adapterCenterLocalYmm:-11,adapterHeightMm:17}),/penetrates.*rod/);
assert.throws(()=>getTerminalAdapterDatums({adapterHeightMm:5}),/disconnected/);
console.log('Photo149 PHUC lower rod-to-B26 candidate face contact and rod-clearance QA PASS');
