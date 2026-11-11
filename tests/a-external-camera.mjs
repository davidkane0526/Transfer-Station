import assert from 'node:assert/strict';
import {A_EXTERNAL_FOCUS_IDS,calculateAExternalCamera} from '../src/a-external-camera.js';
assert.deepEqual(A_EXTERNAL_FOCUS_IDS,['A07','A12','A29','A30','A33']);
const pts=[];for(const [a,b] of [[[45,82,-40],[110,110,40]],[[232,0,-132],[292,86,-28]],[[240,0,21],[336,160,169]],[[240,0,-245],[450,150,-135]],[[78,80,-220],[435,115,-40]]])for(const x of [a[0],b[0]])for(const y of [a[1],b[1]])for(const z of [a[2],b[2]])pts.push([x,y,z]);
for(const aspect of [.65,1,1.35,1.75,2.5]){const fit=calculateAExternalCamera(pts,{aspect});assert(fit.allWithinFrame,'viewport '+aspect);assert(fit.bound.x<.95&&fit.bound.y<.95);assert.deepEqual(fit,calculateAExternalCamera(pts,{aspect}));}
assert.throws(()=>calculateAExternalCamera([]),TypeError);
assert.throws(()=>calculateAExternalCamera(pts,{fovDeg:180}),RangeError);
assert.throws(()=>calculateAExternalCamera(pts,{direction:[0,0,0]}),RangeError);
console.log('V140 external camera fit: 5 aspect ratios PASS');