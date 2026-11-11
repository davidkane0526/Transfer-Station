import assert from 'node:assert/strict';
import {A_CONTROL_DATUMS,aControlRoutes,aHeaterLocalToWorld,auditAControlRoutes}
  from '../src/a-control-interfaces.js';

const nominal=aControlRoutes();
assert.deepEqual(Object.keys(nominal.paths),['led','heaterA','heaterB','temperature']);
assert.equal(nominal.physicallyCertified,false);
assert.equal(nominal.manufacturerPinoutVerified,false);
assert.deepEqual(nominal.endpoints.ledDriver,A_CONTROL_DATUMS.driverSocket);
assert.equal(nominal.paths.heaterA.length,6);
assert.equal(nominal.paths.heaterB.length,6);
assert.equal(nominal.paths.temperature.length,6);
assert.equal(auditAControlRoutes().powerAndSenseSeparate,true);
assert.equal(auditAControlRoutes().singleRelayCannotServeAsTemperatureController,true);
assert.equal(auditAControlRoutes().fullElectricalAcceptance,false);

const moved=aControlRoutes({sampleShiftMm:4});
assert.equal(moved.endpoints.heaterFirst[0]-nominal.endpoints.heaterFirst[0],4);
assert.equal(moved.endpoints.heaterSecond[0]-nominal.endpoints.heaterSecond[0],4);
assert.equal(moved.endpoints.temperatureProbe[0]-nominal.endpoints.temperatureProbe[0],4);
assert.deepEqual(moved.endpoints.ledHead,nominal.endpoints.ledHead);
assert.deepEqual(moved.endpoints.ledDriver,nominal.endpoints.ledDriver);
assert.deepEqual(moved.endpoints.heaterRelayEnvelope,nominal.endpoints.heaterRelayEnvelope);
assert.deepEqual(moved.endpoints.temperatureServiceEnvelope,nominal.endpoints.temperatureServiceEnvelope);
const yaw=aControlRoutes({sampleShiftMm:4,sampleAngleDeg:90});
assert(Math.abs(yaw.endpoints.heaterFirst[2]-nominal.endpoints.heaterFirst[2])>5);
assert.deepEqual(yaw.endpoints.heaterRelayEnvelope,nominal.endpoints.heaterRelayEnvelope);
assert.deepEqual(yaw.endpoints.temperatureServiceEnvelope,nominal.endpoints.temperatureServiceEnvelope);
assert.deepEqual(aHeaterLocalToWorld(0,0,0,{sampleShiftMm:0,sampleAngleDeg:0}),
  [78,81.2,0]);

const parked=aControlRoutes({opticalLiftMm:18});
assert.equal(parked.endpoints.ledHead[1]-nominal.endpoints.ledHead[1],18);
assert.deepEqual(parked.endpoints.ledDriver,nominal.endpoints.ledDriver);
assert.deepEqual(parked.endpoints.heaterFirst,nominal.endpoints.heaterFirst);
assert.equal(auditAControlRoutes({sampleShiftMm:4,opticalLiftMm:18})
  .supportsMovingSample,true);
assert.throws(()=>aControlRoutes({sampleShiftMm:26}),RangeError);
assert.throws(()=>aControlRoutes({sampleAngleDeg:Infinity}),RangeError);
assert.throws(()=>aControlRoutes({opticalLiftMm:19}),RangeError);
assert.equal(A_CONTROL_DATUMS.temperatureControllerIdentified,false);
assert.equal(A_CONTROL_DATUMS.heaterSupplyIdentified,false);
assert.equal(A_CONTROL_DATUMS.ledSupportInstalledFromPhotoVerified,false);
console.log('V133 A LED mount/service endpoints, power/sense separation and motion routing: PASS');
