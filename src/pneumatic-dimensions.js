// V38: deliberately distinguish nominal MODEL diameters from physical
// metrology. Only VN-50 nameplate items are photo-confirmed.
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
 return VACUUM_DIMS[id]||null;
}
export function auditSuctionDimensions(){
 const d=VACUUM_DIMS;
 if(d.B15.idMm<=0||d.B40.idMm<=0||d.B40.idMm>=d.B40.odMm||
    d.B20.idMm>=d.B20.odMm)throw Error('Invalid suction geometry');
 return {
   vacuumSourceCount:1,
   knownSuctionPortCount:1,
   allDiameterLabelsCandidate:Object.values(d).every(x=>x.verified===false),
   hoseWallThicknessMm:(d.B40.odMm-d.B40.idMm)/2,
   pumpInletThreadConfirmed:false,
   ids:Object.keys(d)
 };
}
