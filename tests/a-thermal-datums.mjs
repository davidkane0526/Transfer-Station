import assert from 'node:assert/strict';
import {A_THERMAL,aThermalPoseLocalToWorld,aVacuumRoute,auditAThermalTopology}
 from '../src/a-thermal-datums.js';
const d=A_THERMAL,q=auditAThermalTopology();
assert.equal(q.stackHeightMm,28);
assert.equal(q.sampleTopAboveBoardMm,89.2);
assert.equal(q.heaterFitsPocket,true);
assert.equal(q.ductClearsHeater,true);
assert.equal(q.suctionExitBehindChuck,true);
assert.equal(q.rearHeaterCount,2);
assert.equal(q.separateTemperatureContact,true);
assert.equal(q.actualEquipmentElectricalReady,false);
assert.equal(q.woodMaterialUserConfirmed,true);
assert.equal(q.woodAndMetalAreSeparateParts,true);
assert.equal(q.internalVacuumDuctRigidInMetal,true);
assert.equal(q.heaterNominallySandwichedAboveWood,true);
const nominal=aVacuumRoute();
assert.deepEqual(nominal.path[0],[78,104.7,-43.5]);
for(let x of [-12.5,-8,0,8,12.5])for(let yaw=-180;yaw<=180;yaw+=5){
 const options={sampleShiftMm:x,sampleAngleDeg:yaw};
 const moved=aVacuumRoute(options);
 assert.deepEqual(moved.path[0],aThermalPoseLocalToWorld(d.suctionFittingTailLocal,options));
 assert.deepEqual(moved.path.at(-1),nominal.path.at(-1));
 assert(moved.path.every(pt=>pt.every(Number.isFinite)));
}
assert.throws(()=>aVacuumRoute({sampleAngleDeg:900}),RangeError);
console.log('V135 A vacuum/heater/sensor functional datums and 365-pose flexible hose: PASS');
