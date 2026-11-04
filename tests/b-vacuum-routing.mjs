import assert from 'node:assert/strict';
import {VN50,movingVacuumOutlet,vacuumHosePath,auditVacuumPath}
  from '../src/b-vacuum-routing.js';
assert.equal(VN50.model,'VN-50');
assert.equal(VN50.plate.openFlowLpm,53);
assert.equal(VN50.plate.vacuumMmHg,680);
assert.equal(VN50.plate.voltageV,220);
assert.equal(VN50.plate.powerW,230);
const nominal=auditVacuumPath();
assert.equal(nominal.nominalSourceMatches,true);
assert.equal(nominal.inletMatches,true);
assert.equal(nominal.independentFromElectricController,true);
assert.equal(nominal.airPath.length,6);
assert.equal(nominal.actualPumpIntakePositionVerified,false);
assert.equal(nominal.actualHoseDiameterVerified,false);
assert.equal(nominal.verifiedFullStrokeCollisionFree,false);
assert.deepEqual(nominal.end,VN50.pumpIntakeCandidate);
for(const [shift,angle] of [[-12.5,0],[12.5,0],[0,30],[8,-25]]){
 const p=auditVacuumPath({sampleShiftMm:shift,sampleAngleDeg:angle});
 assert.equal(p.inletMatches,true);
 assert.notDeepEqual(p.start,nominal.start);
}
assert.deepEqual(movingVacuumOutlet({sampleShiftMm:0,sampleAngleDeg:0}),
                 VN50.chuckRearHoseEndNominal);
assert.equal(vacuumHosePath().length,10);
assert.equal(nominal.passesBehindController,true);
assert(nominal.cabinetClearanceMm>0,'Hose must clear the complete B36 enclosure');
assert(nominal.controllerClearanceMm>0,'Hose must clear B19 controller body');
assert(nominal.microscopeClearanceMm>0,'Moving hose must clear B16 microscope column');
assert.equal(nominal.serviceLane,'B19 controller rear / B36 cabinet rear exterior');
for(const [shift,angle] of [[-12.5,30],[12.5,30],[-12.5,-30],[12.5,-30]]){
 const edge=auditVacuumPath({sampleShiftMm:shift,sampleAngleDeg:angle});
 assert(edge.microscopeClearanceMm>0,'Extreme sample position must clear B16 post');
 assert(edge.cabinetClearanceMm>0,'Extreme sample position must clear B36');
 assert.equal(edge.passesBehindController,true);
}
console.log('V39 B15→B40 rear-of-B19 / behind-B36 route to VN-50: PASS');
