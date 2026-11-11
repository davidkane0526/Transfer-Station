// V133. Platform A only. Millimetres; Three.js Y is up.
// These are cable-clearance/render datums, not photograph-calibrated wiring or
// manufacturer-certified mechanical/electrical interfaces.
export const A_CONTROL_DATUMS = Object.freeze({
  sampleX:78,
  heaterOriginY:81.2,
  ledOrigin:[174,220,0],
  ledSlipRingCenter:[187.5,220,0],
  ledPostBase:[187.5,20,-87.5],
  ledPostTopY:219,
  ledBridgeHeightY:194,
  driverSocket:[262,65,-119], // candidate back-face position, NOT pin location
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
export function aHeaterLocalToWorld(x,y,z,{sampleShiftMm=0,sampleAngleDeg=0}={}){
  if(!finite(x,y,z,sampleShiftMm,sampleAngleDeg))throw new TypeError('Nonfinite Platform A sample pose');
  if(Math.abs(sampleShiftMm)>12.5||Math.abs(sampleAngleDeg)>180)
    throw new RangeError('Platform A candidate pose out of supported envelope');
  const r=sampleAngleDeg*Math.PI/180,c=Math.cos(r),s=Math.sin(r);
  return pt(A_CONTROL_DATUMS.sampleX+c*(sampleShiftMm+x)+s*z,
    A_CONTROL_DATUMS.heaterOriginY+y,
    -s*(sampleShiftMm+x)+c*z);
}
export function aControlRoutes({sampleShiftMm=0,sampleAngleDeg=0,opticalLiftMm=0}={}){
  if(!finite(sampleShiftMm,sampleAngleDeg,opticalLiftMm)||opticalLiftMm<0||opticalLiftMm>18)
    throw new RangeError('Invalid A electrical routing pose');
  const sample={sampleShiftMm,sampleAngleDeg};
  const ledRoot=A_CONTROL_DATUMS.ledOrigin;
  const ledStart=pt(ledRoot[0]+55,ledRoot[1]-38+opticalLiftMm,12);
  // The LED lamp has an independent support. A22 uses a flexible service loop.
  const led=[
    ledStart,pt(236,184+opticalLiftMm,-3),pt(251,154+opticalLiftMm*.5,-45),
    pt(258,117,-87),pt(...A_CONTROL_DATUMS.driverSocket)
  ];
  // Distinct REAR exits from A07. These points indicate candidate cable
  // origins on the brown/intermediate layer, not guaranteed thermal feedthroughs.
  const first=aHeaterLocalToWorld(-13,12.5,-32.5,sample);
  const second=aHeaterLocalToWorld(-6,12.5,-32.5,sample);
  const sensor=aHeaterLocalToWorld(12,15,-32.5,sample);
  const heaterA=[first,pt(92,95,-55),pt(149,111,-72),pt(215,91,-20),
    pt(245,63,16),pt(...A_CONTROL_DATUMS.relayInterface)];
  const heaterB=[second,pt(105,100,-61),pt(153,118,-80),pt(224,99,-31),
    pt(265,69,10),pt(...A_CONTROL_DATUMS.powerReturnInterface)];
  const temperature=[sensor,pt(112,110,-56),pt(177,134,-96),
    pt(253,95,-76),pt(303,52,-23),pt(...A_CONTROL_DATUMS.temperatureServiceInterface)];
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
    heaterStartsBehindA07:r.endpoints.heaterFirst[2]<0&&r.endpoints.heaterSecond[2]<0,
    temperatureStartsBehindA07:r.endpoints.temperatureProbe[2]<0,
    powerAndSenseSeparate:dist(r.endpoints.heaterFirst,r.endpoints.temperatureProbe)>3,
    singleRelayCannotServeAsTemperatureController:!d.temperatureControllerIdentified,
    noFalseMainsPinoutCertification:!r.manufacturerPinoutVerified,
    fullElectricalAcceptance:false,
    supportsMovingSample:true,
    supportsOpticalParking:true
  };
  return Object.freeze(out);
}
