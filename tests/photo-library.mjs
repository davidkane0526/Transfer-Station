import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {photoRefsForPart,photoCoverageForPart,PHOTO_LIBRARY} from '../src/photo-library.js';
const b=photoRefsForPart('B','B41');
assert.deepEqual(b.map(p=>p.id),['147']);
assert.deepEqual(b.filter(p=>p.src).map(p=>p.src),['./assets/photos/147.jpg']);
const raw=readFileSync(new URL('../assets/photos/147.jpg',import.meta.url));
assert(raw.length>10000,'Real JPEG evidence was not bundled');
assert.equal(raw[0],0xff);assert.equal(raw[1],0xd8);assert.equal(raw[2],0xff);
assert(photoRefsForPart('B','B09').some(p=>p.id==='147'));
assert(photoRefsForPart('B','B08').some(p=>p.id==='147'));
assert(photoRefsForPart('B','B35').some(p=>p.id==='147'));
assert.deepEqual(photoCoverageForPart('A','A05C').notYetBundled,['94']);
assert.equal(photoCoverageForPart('A','A05C').embeddedCount,0);
assert(PHOTO_LIBRARY['94'].src===undefined,
 'Do not attribute a missing A photo to a different image asset');
assert.deepEqual(photoRefsForPart('A','B41'),[],
 'Never attribute B rig photo evidence to platform A');
console.log('V57 photos: real embedded JPEG147, honest A05C unavailable source and part mapping PASS');
