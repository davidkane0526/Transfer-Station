import assert from 'node:assert/strict';
import {stageLocalTranslation} from '../src/kinematics.js';
const near=(x,y,tol=1e-10)=>assert(Math.abs(x-y)<tol, x+' is not approximately '+y);
let p=stageLocalTranslation(8,0);near(p.x,8);near(p.z,0);
p=stageLocalTranslation(8,Math.PI/2);near(p.x,0);near(p.z,-8);
p=stageLocalTranslation(-8,Math.PI/2);near(p.x,0);near(p.z,8);
p=stageLocalTranslation(5,Math.PI/4);near(p.x,5/Math.sqrt(2));near(p.z,-5/Math.sqrt(2));
assert.throws(()=>stageLocalTranslation(NaN,0),TypeError);
console.log('Kinematic local-coordinate checks passed');
