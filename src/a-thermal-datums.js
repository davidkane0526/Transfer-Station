// V136. Platform A separated wood / heater / metal with rigid internal suction duct.
// WebGL X lateral, Y vertical, Z front/back; A07 starts at world Y=81.2.
export const A_THERMAL=Object.freeze({
 chuckWidthMm:65,chuckDepthMm:65,localOriginY:81.2,
 lowerHeightMm:9,intermediateHeightMm:7,upperHeightMm:12,
 upperStartLocalY:16,topLocalY:28,
 pocketWidthMm:38.6,pocketDepthMm:38.6,pocketHeightMm:5.4,
 heaterSizeMm:[38,5,38],heaterCenterLocalY:18.7,
 suctionTopDiameterMm:1.4,suctionDuctDiameterMm:2.2,
 suctionDuctLocalY:23.5,
 suctionRearLocal:[0,23.5,-32.5],suctionFittingTailLocal:[0,23.5,-43.5],
 heaterLeadsLocal:[[10,18.2,-32.5],[16,18.2,-32.5]],
 temperatureContactLocal:[-10,21.1,0],temperatureRearLocal:[-10,21.1,-32.5],
 heaterAndProbeAreCandidates:true,intermediateLayerUserConfirmedMaterial:'wood',
 metalAndWoodSeparateParts:true,internalDuctFixedToMetal:true,
 vacuumCandidateAngleLimitDeg:5,installedVacuumPumpIdentityVerified:false
});
const p=(x,y,z)=>[+x.toFixed(3),+y.toFixed(3),+z.toFixed(3)];
export function aThermalPoseLocalToWorld([x,y,z],{sampleShiftMm=0,sampleAngleDeg=0}={}){
 if(![x,y,z,sampleShiftMm,sampleAngleDeg].every(Number.isFinite))throw new TypeError('Invalid A sample pose');
 if(Math.abs(sampleShiftMm)>12.5||Math.abs(sampleAngleDeg)>180)throw new RangeError('Unsupported sample-stage candidate pose');
 const a=sampleAngleDeg*Math.PI/180,c=Math.cos(a),s=Math.sin(a),shift=sampleShiftMm+x;
 return p(78+c*shift+s*z,81.2+y,-s*shift+c*z);
}
export function aVacuumRoute(options={}){
 const path=[
 aThermalPoseLocalToWorld(A_THERMAL.suctionFittingTailLocal,options),
 aThermalPoseLocalToWorld([0,26,-55],options),
 aThermalPoseLocalToWorld([38,32,-75],options),
 [167,88,-169],[285,72,-210],[350,68,-190]];
 if(path.some(point=>point.some(x=>!Number.isFinite(x))))throw new Error('Invalid vacuum route');
 return {path,innerDiameterCandidateMm:4.4,outerDiameterCandidateMm:7,
  source:'A28 suction outlet',destination:'A30 external vacuum source service interface',
  realPumpIdentified:false,installedPhysicallyVerified:false,
  withinCandidateAngularTravel:Math.abs(options.sampleAngleDeg??0)<=A_THERMAL.vacuumCandidateAngleLimitDeg};
}
export function auditAThermalTopology(){
 const d=A_THERMAL;
 return {stackHeightMm:d.lowerHeightMm+d.intermediateHeightMm+d.upperHeightMm,
  sampleTopAboveBoardMm:8+33.2+20+28,
  heaterFitsPocket:d.heaterSizeMm[0]<d.pocketWidthMm&&d.heaterSizeMm[1]<=d.pocketHeightMm&&d.heaterSizeMm[2]<d.pocketDepthMm,
  ductClearsHeater:d.suctionDuctLocalY-d.suctionDuctDiameterMm/2>d.upperStartLocalY+d.pocketHeightMm,
  suctionExitBehindChuck:d.suctionRearLocal[2]===-d.chuckDepthMm/2,
  rearHeaterCount:d.heaterLeadsLocal.length,
  separateTemperatureContact:d.temperatureContactLocal[0]!==d.heaterLeadsLocal[0][0],
  vacuumBoreThroughTop:true,actualEquipmentElectricalReady:false,
  woodMaterialUserConfirmed:d.intermediateLayerUserConfirmedMaterial==='wood',
  woodAndMetalAreSeparateParts:d.metalAndWoodSeparateParts,
  internalVacuumDuctRigidInMetal:d.internalDuctFixedToMetal,
  heaterNominallySandwichedAboveWood:16.2>=16&&21.2<28};
}