// V45: nominal B16/B35 hole registration only, not a certified OEM joint.
// The visible B35 board has not been positively identified as MB2530/M.
// Guesstimated 25 mm hole coordinates can be aligned, but not passed as measurements.
export function auditB35MicroscopeFasteners({
  boardCenterX=65,boardHalfGridX=100,boardHalfGridZ=125,boardPitchMm=25,
  microscopeCenterX=90,microscopeCenterZ=-100,
  footHoleOffsetMm=25,footHoleDiameterMm=6.5,
  boardBlindDepthMm=2,boardThicknessMm=12,
  proposedThreadPilotDiameterMm=5,proposedThreadPilotDepthMm=6
}={}){
  const values=[boardCenterX,boardHalfGridX,boardHalfGridZ,boardPitchMm,
    microscopeCenterX,microscopeCenterZ,footHoleOffsetMm,footHoleDiameterMm,
    boardBlindDepthMm,boardThicknessMm,proposedThreadPilotDiameterMm,proposedThreadPilotDepthMm];
  if(values.some(v=>!Number.isFinite(v))||boardPitchMm<=0||
    footHoleDiameterMm<=0||boardBlindDepthMm<=0||
    boardBlindDepthMm>=boardThicknessMm||
    proposedThreadPilotDepthMm<=boardBlindDepthMm||
    proposedThreadPilotDepthMm>=boardThicknessMm||
    proposedThreadPilotDiameterMm>=footHoleDiameterMm)
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
        nearestCandidateGridHole:nearest,centerMismatchMm:best});
    }
  const maxMismatchMm=Math.max(...fasteners.map(f=>f.centerMismatchMm));
  return Object.freeze({
    footHasFourCandidateThroughBores:true,
    footBoreDiameterMm:footHoleDiameterMm,
    candidateFootHoleCount:fasteners.length,
    candidateHolePairs:fasteners,
    maxMismatchMm,
    nominalGridRegistered:maxMismatchMm<=.25,
    proposedM6ClearanceDiameterMm:footHoleDiameterMm,
    proposedThreadPilotDiameterMm,proposedThreadPilotDepthMm,
    candidateThreadPilotCount:fasteners.length,
    faceSupportEstablishedOnly:true,
    holesAreDecorativeBlindRecesses:true, // remaining grid holes
    boardBlindDepthMm,boardThicknessMm,
    stockThorlabsM6ThroughTapsNotYetApplied:true,
    knownOEMBoardSku:false,
    boardAnchorThreadVerified:false,
    boardBoltPatternAligned:maxMismatchMm<=.25,
    opticalAxisKeptAtWorldX:82,
    microscopePostShiftFromV44Mm:{x:microscopeCenterX-82,z:microscopeCenterZ-(-112)},
    loadBearingFastenerJointAccepted:false,
    missing:'Real B35 SKU and origin, B16 OEM foot fastener pitch, M6 tapped depth, bolt strength and thread engagement'
  });
}
