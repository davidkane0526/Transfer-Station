// V51: re-register the Thorlabs local board from its OEM hole phase.
// MB2530/M is a high-confidence comparison candidate, not a confirmed SKU.
// The model retains 12mm photo-fit thickness; the official candidate is 12.7mm.
const round=(v)=>Math.round(v*1000)/1000;
const range=(min,max,step)=>{
  const out=[];
  for(let v=min;v<=max+1e-6;v+=step)out.push(round(v));
  return out;
};
const onGrid=(v,pitch,origin=0,tol=.01)=>{
  const n=(v-origin)/pitch;
  return Math.abs(n-Math.round(n))*pitch<=tol;
};
export function auditB35MicroscopeFasteners({
  boardCenterX=75,boardCenterZ=0,
  boardWidthMm=250,boardDepthMm=300,boardThicknessMm=12,
  boardPitchMm=25,boardEdgeOffsetMm=12.5,
  boardMountingHoleInsetMm=25,
  microscopeCenterX=87.5,microscopeCenterZ=-112.5,
  footHoleOffsetMm=25,footHoleDiameterMm=6.5,
  threadPilotDiameterMm=5,threadPilotDepthMm=12,
  baseBoardGridPitchMm=25,baseBoardGridOriginX=0,baseBoardGridOriginZ=0
}={}){
  const values=[boardCenterX,boardCenterZ,boardWidthMm,boardDepthMm,boardThicknessMm,
    boardPitchMm,boardEdgeOffsetMm,boardMountingHoleInsetMm,microscopeCenterX,
    microscopeCenterZ,footHoleOffsetMm,footHoleDiameterMm,threadPilotDiameterMm,
    threadPilotDepthMm,baseBoardGridPitchMm,baseBoardGridOriginX,baseBoardGridOriginZ];
  if(!values.every(Number.isFinite)||boardWidthMm<=0||boardDepthMm<=0||
    boardPitchMm<=0||baseBoardGridPitchMm<=0||footHoleOffsetMm<=0||
    boardEdgeOffsetMm<=0||boardMountingHoleInsetMm<=0)
    throw new RangeError('B35/B16 registration dimensions must be finite and positive');
  if(boardEdgeOffsetMm*2>=boardWidthMm||boardEdgeOffsetMm*2>=boardDepthMm)
    throw new RangeError('B35 edge offset leaves no usable hole grid');
  const gridX=range(-boardWidthMm/2+boardEdgeOffsetMm,
    boardWidthMm/2-boardEdgeOffsetMm,boardPitchMm).map(x=>round(boardCenterX+x));
  const gridZ=range(-boardDepthMm/2+boardEdgeOffsetMm,
    boardDepthMm/2-boardEdgeOffsetMm,boardPitchMm).map(z=>round(boardCenterZ+z));
  const grid=[];
  for(const x of gridX)for(const z of gridZ)grid.push({x,z});
  const footWorldX=[microscopeCenterX-footHoleOffsetMm,microscopeCenterX+footHoleOffsetMm];
  const footWorldZ=[microscopeCenterZ-footHoleOffsetMm,microscopeCenterZ+footHoleOffsetMm];
  const nearest=(x,z)=>{
    let best=null;
    for(const q of grid){
      const mismatch=Math.hypot(x-q.x,z-q.z);
      if(!best||mismatch<best.mismatch)best={x:q.x,z:q.z,mismatch};
    }
    return best;
  };
  const candidateHolePairs=[];
  for(const x of footWorldX)for(const z of footWorldZ){
    const n=nearest(x,z);
    candidateHolePairs.push({footWorldX:x,footWorldZ:z,
      gridWorldX:n.x,gridWorldZ:n.z,mismatchMm:round(n.mismatch)});
  }
  const maxMismatchMm=round(Math.max(...candidateHolePairs.map(x=>x.mismatchMm)));
  const insetX=boardWidthMm/2-boardMountingHoleInsetMm;
  const insetZ=boardDepthMm/2-boardMountingHoleInsetMm;
  const boardAnchorHolePositionsWorldMm=[
    [round(boardCenterX-insetX),round(boardCenterZ-insetZ)],
    [round(boardCenterX-insetX),round(boardCenterZ+insetZ)],
    [round(boardCenterX+insetX),round(boardCenterZ-insetZ)],
    [round(boardCenterX+insetX),round(boardCenterZ+insetZ)]
  ];
  const boardAnchorsAlignToB01CandidateGrid=boardAnchorHolePositionsWorldMm.every(([x,z])=>
    onGrid(x,baseBoardGridPitchMm,baseBoardGridOriginX)&&
    onGrid(z,baseBoardGridPitchMm,baseBoardGridOriginZ));
  const registered=maxMismatchMm<.01;
  return {
    boardSkuCandidate:'Thorlabs MB2530/M',
    boardSkuConfirmed:false,
    boardCenterWorldMm:[round(boardCenterX),round(boardCenterZ)],
    boardSizePhotoFitMm:[round(boardWidthMm),round(boardDepthMm),round(boardThicknessMm)],
    officialCandidateThicknessMm:12.7,
    gridHoleCount:grid.length,
    gridHolePitchMm:round(boardPitchMm),
    gridEdgeOffsetMm:round(boardEdgeOffsetMm),
    gridTapDrillDiameterMm:round(threadPilotDiameterMm),
    gridThrough:true,
    gridThreadRepresentation:'M6 through-tapped OEM pattern represented by Ø5mm tap-drill bores; threads not modelled',
    mountingHoleCount:4,
    mountingCounterboreCount:4,
    centralFifthCounterbore:false,
    mountingHolePattern:'four corner counterbores only',
    mountingHoleInsetMm:round(boardMountingHoleInsetMm),
    mountingHoleClearanceDiameterMm:6.5,
    mountingHoleCounterboreDiameterMm:11,
    mountingHoleCounterboreDepthMm:3.5,
    boardAnchorHolePositionsWorldMm,
    boardAnchorsAlignToB01CandidateGrid,
    candidateFootHoleCount:4,
    footHasFourCandidateThroughBores:true,
    footBoreDiameterMm:round(footHoleDiameterMm),
    footCenterWorldMm:[round(microscopeCenterX),round(microscopeCenterZ)],
    footHolePositionsWorldMm:candidateHolePairs.map(x=>[x.footWorldX,x.footWorldZ]),
    candidateHolePairs,
    maxMismatchMm,
    nominalGridRegistered:registered,
    boardBoltPatternAligned:registered&&boardAnchorsAlignToB01CandidateGrid,
    proposedThreadPilotDiameterMm:round(threadPilotDiameterMm),
    proposedThreadPilotDepthMm:round(threadPilotDepthMm),
    holesAreDecorativeBlindRecesses:false,
    boardThreadedFixingVerified:false,
    boardAnchorThreadVerified:false,
    loadedJointAccepted:false,
    loadBearingFastenerJointAccepted:false,
    footFastenerTypeCandidate:'M6×18 socket-head screws',
    boardAnchorFastenerTypeCandidate:'M6×20 low-head screws',
    photoFitOriginalFootCenterWorldMm:[82,-112],
    oldV45FootCenterWorldMm:[90,-100],
    microscopePostShiftFromPhotoFitMm:{x:5.5,z:-.5},
    microscopePostShiftFromV45Mm:{x:-2.5,z:-12.5},
    missing:[
      'Confirm the MB2530/M label or exact Thorlabs SKU on the physical B35 plate',
      'Measure the physical B35 thickness; model retains 12mm photo-fit while MB2530/M is 12.7mm',
      'Confirm B01 tapped-hole thread, usable depth and the four anchor-hole positions on the actual board',
      'Confirm B16 custom foot dimensions, screw grade, length and tightening torque',
      'Verify the loaded microscope joint and optical-axis position physically'
    ]
  };
}
