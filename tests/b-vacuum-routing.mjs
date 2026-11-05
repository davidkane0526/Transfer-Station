import assert from 'node:assert/strict';
import {VN50,movingVacuumOutlet,vacuumHosePath,auditVacuumPath,auditVacuumEnvelope}
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
assert.equal(nominal.fullStrokeGridPass,false,
  'A single-pose audit must not claim to validate the complete motion envelope');
assert.deepEqual(nominal.end,VN50.pumpIntakeCandidate);
for(const [shift,angle] of [[-12.5,0],[12.5,0],[0,30],[8,-25]]){
 const p=auditVacuumPath({sampleShiftMm:shift,sampleAngleDeg:angle});
 assert.equal(p.inletMatches,true);
 assert.notDeepEqual(p.start,nominal.start);
}
assert.deepEqual(movingVacuumOutlet({sampleShiftMm:0,sampleAngleDeg:0}),
                 VN50.chuckRearHoseEndNominal);
const depthOnly=movingVacuumOutlet({sampleShiftMm:0,sampleDepthShiftMm:5,sampleAngleDeg:0});
assert.equal(depthOnly.x,VN50.chuckRearHoseEndNominal.x);
assert.equal(depthOnly.z,VN50.chuckRearHoseEndNominal.z+5);
const depthTurned=movingVacuumOutlet({sampleDepthShiftMm:5,sampleAngleDeg:90});
assert(Math.abs(depthTurned.x-movingVacuumOutlet({sampleAngleDeg:90}).x-5)<1e-8,
  'A 90-degree B08 rotation must transform B41 depth travel into scene X');
assert.equal(vacuumHosePath().length,13);
assert.equal(nominal.passesBehindController,true);
assert(nominal.cabinetClearanceMm>0,'Hose must clear the complete B36 enclosure');
assert(nominal.controllerClearanceMm>0,'Hose must clear B19 controller body');
assert(nominal.microscopeClearanceMm>0,'Moving hose must clear B16 microscope column');
assert.equal(nominal.serviceLane,'B19 controller rear / B36 cabinet rear exterior · Y=70 mm');
assert.equal(nominal.routeHeightMm,70);
assert.equal(nominal.routeAroundCabinetLeft,true);
assert.equal(nominal.routeAroundCabinetRight,true);
assert(nominal.minimumHarnessClearanceMm>2,
  'B40 must keep at least 2mm surface clearance from B37/B38 at the nominal pose');
for(const c of nominal.harnessClearances)assert(c.surfaceMm>2,c.id+' harness clearance');
const envelope=auditVacuumEnvelope();
assert.equal(envelope.fullStrokeGridPass,true);
assert.equal(envelope.continuousBetweenSamplesProven,false);
assert.equal(envelope.posesChecked,18795,
  'Crossed sample-axis envelope must include both 0.5mm×1° sweeps and combined XY corner poses');
assert(envelope.minimumClearancesMm.cabinet>0);
assert(envelope.minimumClearancesMm.controller>0);
assert(envelope.minimumClearancesMm.microscope>0);
assert(envelope.minimumClearancesMm.harness>2,
  'Entire sampled envelope must retain >2mm hose-to-wire surface clearance');
for(const [shift,angle] of [[-12.5,90],[12.5,90],[-12.5,-90],[12.5,-90]]){
 const edge=auditVacuumPath({sampleShiftMm:shift,sampleAngleDeg:angle});
 assert(edge.microscopeClearanceMm>0,'Extreme sample position must clear B16 post');
 assert(edge.cabinetClearanceMm>0,'Extreme sample position must clear B36');
 assert.equal(edge.passesBehindController,true);
}
console.log('V55 B40/B37/B38 crossed sample-axis clearances and combined-pose audit: PASS');
