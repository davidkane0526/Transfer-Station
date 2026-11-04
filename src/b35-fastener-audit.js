// V35: Candidate bolt-hole correspondence for the microscope foot on B35.
// This is NOT an OEM hole-pattern registration or a mounting approval.
// The 2 mm recesses in the photo-fit B35 mesh are decorative blind holes,
// not a representation of the through-tapped M6 holes on stock Thorlabs boards.
export function auditB35MicroscopeFasteners({
  boardCenterX=65,boardHalfGridX=100,boardHalfGridZ=125,boardPitchMm=25,
  microscopeCenterX=82,microscopeCenterZ=-112,
  footHoleOffsetMm=25,footHoleDiameterMm=4,
  boardBlindDepthMm=2,boardThicknessMm=12
}={}){
  const values=[boardCenterX,boardHalfGridX,boardHalfGridZ,boardPitchMm,
    microscopeCenterX,microscopeCenterZ,footHoleOffsetMm,footHoleDiameterMm,
    boardBlindDepthMm,boardThicknessMm];
  if(values.some(v=>!Number.isFinite(v))||boardPitchMm<=0||
     footHoleDiameterMm<=0||boardBlindDepthMm<=0||boardBlindDepthMm>=boardThicknessMm)
    throw new RangeError('Invalid B35/B16 candidate fastener datums');
  const grid=[];
  for(let dx=-boardHalfGridX;dx<=boardHalfGridX+.001;dx+=boardPitchMm)
    for(let dz=-boardHalfGridZ;dz<=boardHalfGridZ+.001;dz+=boardPitchMm)
      grid.push([boardCenterX+dx,dz]);
  const fasteners=[];
  for(const dx of [-footHoleOffsetMm,footHoleOffsetMm])
    for(const dz of [-footHoleOffsetMm,footHoleOffsetMm]){
      const x=microscopeCenterX+dx,z=microscopeCenterZ+dz;
      let best=Infinity,nearest=null;
      for(const [gx,gz] of grid){
        const error=Math.hypot(gx-x,gz-z);
        if(error<best){best=error;nearest=[gx,gz];}
      }
      fasteners.push({footWorldX:x,footWorldZ:z,
        nearestDecorativeHole:nearest,centerMismatchMm:best});
    }
  const maxMismatchMm=Math.max(...fasteners.map(f=>f.centerMismatchMm));
  return Object.freeze({
    footHasFourCandidateThroughBores:true,
    footBoreDiameterMm:footHoleDiameterMm,
    candidateFootHoleCount:fasteners.length,
    candidateHolePairs:fasteners,
    maxMismatchMm,
    faceSupportEstablishedOnly:true,
    holesAreDecorativeBlindRecesses:true,
    boardBlindDepthMm,boardThicknessMm,
    stockThorlabsM6ThroughTapsNotYetApplied:true,
    knownOEMBoardSku:false,
    boardAnchorThreadVerified:false,
    boardBoltPatternAligned:maxMismatchMm<=.25,
    loadBearingFastenerJointAccepted:false,
    missing:'Actual B35 SKU, hole grid origin, microscope foot clearance holes, bolt grade and full thread engagement'
  });
}
