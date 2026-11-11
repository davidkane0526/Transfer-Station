// V135. Platform A only. Millimetres; Three.js Y is up.
// These are cable-clearance/render datums, not photograph-calibrated wiring or
// manufacturer-certified mechanical/electrical interfaces.
export const A_CONTROL_DATUMS = Object.freeze({
  sampleX:78,
  heaterOriginY:82,
  ledOrigin:[174,220,0],
  ledSlipRingCenter:[187.5,220,0],
  ledPostBase:[187.5,20,-87.5],
  ledPostTopY:219,
  ledBridgeHeightY:194,
  driverSocket:[262,42,-133], // candidate back-face position, NOT pin location
  relayInterface:[253,18,40], // candidate service-envelope point, not a wiring terminal
  powerReturnInterface:[271,18,40],
  temperatureServiceInterface:[305,14,25],
  sampleRearZ:-32.5,
  heatingCoreIdentified:false,
  temperatureProbeTypeVerified:false,
  relayWiringVerified:false,
  heaterSupplyIdentified:false,
  temperatureControllerIdentified:false,
  ledSupportInstalledFromPhotoVerified:false,
  ledRingOEMFamily:'Thorlabs SM1RC (manufacturer mounting example)',
  ledDriverLEDPortConnectorFamily:'M8 x 1, four-pin',
  ledDriverElectricalPolarityVerified:false
});
const pt=(x,y,z)=>[Number(x.toFixed(3)),Number(y.toFixed(3)),Number(z.toFixed(3))];
const finite=(...ns)=>ns.every(Number.isFinite);
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
// Three.js +Y yaw: local +X -> world(cos,0,-sin).
export function aHeaterLocalToWorld(x,y,z,{sampleShiftMm=0,sampleDepthShiftMm=0,sampleAngleDeg=0}={}){
  if(!finite(x,y,z,sampleShiftMm,sampleDepthShiftMm,sampleAngleDeg))throw new TypeError('Nonfinite Platform A sample pose');
  if(Math.abs(sampleShiftMm)>12.5||Math.abs(sampleDepthShiftMm)>12.5||Math.abs(sampleAngleDeg)>180)
    throw new RangeError('Platform A candidate pose out of supported envelope');
  const r=sampleAngleDeg*Math.PI/180,c=Math.cos(r),s=Math.sin(r);
  return pt(A_CONTROL_DATUMS.sampleX+c*(sampleShiftMm+x)+s*(sampleDepthShiftMm+z),
    A_CONTROL_DATUMS.heaterOriginY+y,
    -s*(sampleShiftMm+x)+c*(sampleDepthShiftMm+z));
}
export function aControlRoutes({sampleShiftMm=0,sampleDepthShiftMm=0,sampleAngleDeg=0,opticalLiftMm=0}={}){
  if(!finite(sampleShiftMm,sampleDepthShiftMm,sampleAngleDeg,opticalLiftMm)||opticalLiftMm<0||opticalLiftMm>18)
    throw new RangeError('Invalid A electrical routing pose');
  const sample={sampleShiftMm,sampleDepthShiftMm,sampleAngleDeg};
  const ledRoot=A_CONTROL_DATUMS.ledOrigin;
  const ledStart=pt(ledRoot[0]+55,ledRoot[1]-38+opticalLiftMm,12);
  // The LED lamp has an independent support. A22 uses a flexible service loop.
  const led=[
    ledStart,pt(232,184+opticalLiftMm,-14),pt(235,163+opticalLiftMm*.5,-64),
    pt(240,104,-120),pt(261,54,-142),pt(...A_CONTROL_DATUMS.driverSocket)
  ];
  // Distinct REAR exits from A07. These points indicate candidate cable
  // origins on the brown/intermediate layer, not guaranteed thermal feedthroughs.
  // Source datums coincide with the rear bores in the A07 metal chuck
  // and with the terminals of A26/A27, rather than arbitrary layer colors.
  const first=aHeaterLocalToWorld(10,18.2,-32.5,sample);
  const second=aHeaterLocalToWorld(16,18.2,-32.5,sample);
  const sensor=aHeaterLocalToWorld(-10,21.1,-32.5,sample);
  // Short stage-local leads then a compact service corridor beside
  // the microscope, instead of three high free-floating cable arcs.
  const heaterA=[first,
    aHeaterLocalToWorld(10,18.2,-43,sample),
    aHeaterLocalToWorld(28,43,-59,sample),
    pt(162,120,-41),pt(226,120,-24),pt(...A_CONTROL_DATUMS.relayInterface)];
  const heaterB=[second,
    aHeaterLocalToWorld(16,18.2,-44,sample),
    aHeaterLocalToWorld(34,47,-61,sample),
    pt(171,127,-36),pt(233,122,-18),pt(...A_CONTROL_DATUMS.powerReturnInterface)];
  const temperature=[sensor,
    aHeaterLocalToWorld(-10,21.1,-43,sample),
    aHeaterLocalToWorld(24,51,-62,sample),
    pt(181,136,-31),pt(257,123,-6),pt(...A_CONTROL_DATUMS.temperatureServiceInterface)];
  const paths={led,heaterA,heaterB,temperature};
  for(const p of Object.values(paths)){
    if(p.some(v=>v.some(n=>!Number.isFinite(n))))throw new TypeError('Nonfinite route waypoint');
    if(p.some((v,i)=>i>0&&dist(v,p[i-1])<1))throw new RangeError('Degenerate cable path');
  }
  return Object.freeze({
    paths,
    endpoints:{
      ledHead:led[0],ledDriver:led.at(-1),
      heaterFirst:heaterA[0],heaterSecond:heaterB[0],temperatureProbe:temperature[0],
      heaterRelayEnvelope:heaterA.at(-1),powerServiceEnvelope:heaterB.at(-1),
      temperatureServiceEnvelope:temperature.at(-1)
    },
    provenance:'routing candidate; A07/A13 thermal topology and terminals not certified',
    physicallyCertified:false,
    manufacturerPinoutVerified:false,
    allPowerAndSensorRoutesSeparated:true
  });
}
export function auditAControlRoutes(options={}){
  const r=aControlRoutes(options);
  const d=A_CONTROL_DATUMS;
  const out={
    ledEndsAtDriverSocket:dist(r.endpoints.ledDriver,d.driverSocket)<.001,
    ledStartsAtLampTail:r.endpoints.ledHead[0]===d.ledOrigin[0]+55,
    // Behind the heater is stage-local -Z, not world -Z after A06 rotation.
    heaterStartsBehindA07:dist(r.endpoints.heaterFirst,
      aHeaterLocalToWorld(10,18.2,d.sampleRearZ,options))<.01 &&
      dist(r.endpoints.heaterSecond,
      aHeaterLocalToWorld(16,18.2,d.sampleRearZ,options))<.01,
    temperatureStartsBehindA07:dist(r.endpoints.temperatureProbe,
      aHeaterLocalToWorld(-10,21.1,d.sampleRearZ,options))<.01,
    firstCableGuidesFollowStage:['heaterA','heaterB','temperature'].every((key,i)=>{
      const x=[10,16,-10][i],y=[18.2,18.2,21.1][i],z=[-43,-44,-43][i];
      return dist(r.paths[key][1],aHeaterLocalToWorld(x,y,z,options))<.01;
    }),
    powerAndSenseSeparate:dist(r.endpoints.heaterFirst,r.endpoints.temperatureProbe)>3,
    singleRelayCannotServeAsTemperatureController:!d.temperatureControllerIdentified,
    noFalseMainsPinoutCertification:!r.manufacturerPinoutVerified,
    fullElectricalAcceptance:false,
    supportsMovingSample:true,
    supportsOpticalParking:true
  };
  return Object.freeze(out);
}
