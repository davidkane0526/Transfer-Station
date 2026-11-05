// V53: model the VN-50 family G1/4 thread reference, not the legacy Ø18/Ø8.2 spigot proxy.
// Only VN-50 nameplate items are photo-confirmed.
// Manufacturer source: https://www.youchengzhixin.com/blog/yczx-oil-free-piston-vacuum-pumps-clean-quiet-compact-power-delivered-on-time
// Parallel thread reference ISO 228-1: G1/4 = 13.157mm, 19 TPI, 55deg.
export const VN50_FAMILY_PORT=Object.freeze({
  cataloguedModel:'VN-50',
  claimedFamilyPort:'G1/4',
  threadStandard:'ISO 228-1 (BSPP)',
  threadForm:'parallel',
  basicMajorDiameterMm:13.157,
  pitchMm:1.337,
  threadsPerInch:19,
  flankAngleDeg:55,
  requiresFaceSealOrOring:true,
  femaleTapDrillCandidateMm:11.8,
  portGenderCandidate:'female (installation-manual hint only)',
  manualSealInstruction:'A related family manual mentions PTFE tape on fitting threads; confirm whether the specimen is BSPP G1/4 or a tapered variant before ordering',
  possibleThreadVariant:'R1/4 cannot be excluded until pitch, taper and port seat are measured',
  pumpPortGenderVerified:false,
  photographedSpecimenMatchVerified:false,
  suctionVsExhaustPortVerified:false,
  matingAdapterSkuVerified:false,
  catalogMountPatternMm:[142,96],
  alternateCatalogMountPatternMm:[110,95],
  catalogSource:'https://www.youchengzhixin.com/blog/yczx-oil-free-piston-vacuum-pumps-clean-quiet-compact-power-delivered-on-time'
});

export const VACUUM_DIMS=Object.freeze({
 B11:{name:'中心吸附孔',nominal:'Ø1.4 mm',odMm:1.4,idMm:null,verified:false},
 B15:{name:'后侧真空接头',nominal:'OD Ø6.0 / 通孔 Ø2.84 mm；长度13 mm',
   odMm:6,idMm:2.84,lengthMm:13,verified:false},
 B40:{name:'连续负压软管',nominal:'OD Ø7.0 / ID Ø4.4 mm',
   odMm:7,idMm:4.4,verified:false},
 B20:{name:'VN-50吸入口（候选朝向）',nominal:'接头 OD Ø18.0 / 中心孔 Ø8.2 mm',
   odMm:18,idMm:8.2,threadCandidate:'G1/4（同系列资料，不是实测）',verified:false}
});
export function suctionDimension(id){
 if(id==='B15T')id='B40';
 if(id==='B20I')id='B20';
 return VACUUM_DIMS[id]||null;
}
export function auditVacuumInterfaceFit(){
 const d=VACUUM_DIMS;
 // The heater-side values are still candidate geometry, not a measured hose fit.
 const warmEndExpansionPct=100*(d.B15.odMm/d.B40.idMm-1);
 return Object.freeze({
   status:'unverified',
   candidateGeometryOnly:true,
   heaterEnd:{
     fittingOdMm:d.B15.odMm,hoseIdMm:d.B40.idMm,
     nominalHoseExpansionPct:Number(warmEndExpansionPct.toFixed(1)),
     directFitVerified:false,
     materialStretchAndClampNeeded:true
   },
   pumpEnd:{
     threadCandidate:VN50_FAMILY_PORT.claimedFamilyPort,
     threadStandard:VN50_FAMILY_PORT.threadStandard,
     threadMajorDiameterMm:VN50_FAMILY_PORT.basicMajorDiameterMm,
     pitchMm:VN50_FAMILY_PORT.pitchMm,
     threadsPerInch:VN50_FAMILY_PORT.threadsPerInch,
     femaleTapDrillCandidateMm:VN50_FAMILY_PORT.femaleTapDrillCandidateMm,
     portGenderCandidate:VN50_FAMILY_PORT.portGenderCandidate,
     portGenderVerified:VN50_FAMILY_PORT.pumpPortGenderVerified,
     portPositionVerified:VN50_FAMILY_PORT.suctionVsExhaustPortVerified,
     hoseIdMm:d.B40.idMm,hoseOdMm:d.B40.odMm,
     directFitVerified:false,
     matchingAdapterOrFittingUnresolved:true,
     adapterRequirement:'G1/4-compatible male fitting to a hose outlet selected from the measured tube OD; fitting SKU and sealing method unresolved',
     directHoseInsertionIntoThreadPortIsNotAValidJoint:true,
     openBoreDiametricGapMm:null
   },
   pumpFamilyThreadReference:VN50_FAMILY_PORT,
   measuredPumpPortDiameterMm:null,
   measuredPumpPortPitchMm:null,
   standardThreadNotHoseBarb:true,
   cannotInferHoseBarbDiameterFromGQuarter:true,
   sealedVacuumCircuitVerified:false,
   visualCenterlineConnectionOnly:true,
   fittingSkuVerified:false
 });
}
export function auditSuctionDimensions(){
 const d=VACUUM_DIMS;
 if(d.B15.idMm<=0||d.B40.idMm<=0||d.B40.idMm>=d.B40.odMm||
    d.B20.threadMajorDiameterMm!==13.157||d.B20.pitchMm!==1.337)throw Error('Invalid suction geometry or VN-50 thread datum');
 return {
   vacuumSourceCount:1,
   knownSuctionPortCount:1,
   allDiameterLabelsCandidate:Object.values(d).every(x=>x.verified===false),
   hoseWallThicknessMm:(d.B40.odMm-d.B40.idMm)/2,
   pumpInletThreadConfirmed:false,
   familyCatalogueThreadIdentified:VN50_FAMILY_PORT.claimedFamilyPort,
   pumpPortMajorDiameterMm:VN50_FAMILY_PORT.basicMajorDiameterMm,
   pumpPortPitchMm:VN50_FAMILY_PORT.pitchMm,
   pumpPortFemaleTapDrillCandidateMm:VN50_FAMILY_PORT.femaleTapDrillCandidateMm,
   physicalPortMatchingNotVerified:!VN50_FAMILY_PORT.photographedSpecimenMatchVerified,
   mechanicalAdapterConfirmed:false,
   sealedVacuumCircuitVerified:false,
   ids:Object.keys(d)
 };
}
