// V48: direct review of newly attached original ruler JPGs.
// Coordinates refer to SOURCE photograph measurements, not invented
// global WebGL axes. These photos have NOT been added to the public repo.
// Some pictures belong to another (B) apparatus. Never transfer their
// manufacturer's name, mechanical arm or black Thorlabs board to A.
//
// Confidence: maker_verified = readable manufacturer label/official sheet,
// ruler_estimate = ticks visibly aligned with a nearby physical edge,
// scene_fit = candidate interpolation subject to perspective/parallax,
// unverified = no direct evidence.
export const V48_RULER_EVIDENCE=Object.freeze({
  A:Object.freeze({
    group:'A',
    sourceFiles:['17','18','19','20','21','22','23','24','32','41','71','72','75'],
    sampleTopHeightAboveBreadboardMm:Object.freeze({
      min:87,max:93,nominal:90,
      photos:['17','18'],
      evidence:'vertical ruler is placed alongside silver sample stack; top metal plane by ~9cm tick, breadboard plane near ruler zero',
      confidence:'ruler_estimate',
      perspectiveAndRulerFootErrorMm:3
    }),
    sampleTopWidthMm:Object.freeze({
      min:61,max:69,nominal:65,
      photos:['19','20','21'],
      evidence:'horizontal ruler across silver top; projected edge separation about 6.5cm',
      confidence:'ruler_estimate'
    }),
    sampleAssembly:Object.freeze({
      base:'A16 GCM-5306M mounting base, 112x70x8 mm (NOT rotation stage)',
      basePhoto:'17 (upside-down GCM-5306M label), 18',
      rotation:'A06 cylindrical goniometric rotation stage; exact GCM-11 SKU unseen',
      rotationDiameterCandidateMm:66,
      rotationDiameterPlausibleRangeMm:[55,75],
      rotationDiameterManufacturerVerified:false,
      angularMicrometerOnRight:true,
      shortRotationLockAtFront:true,
      separatedFromA02LinearLeftMicrometer:true,
      sampleTopLayers:['dark lower support','gold/bronze-colored intermediate layer (material unknown)','silver top plate'],
      photoLayerEvidence:['17','18','20','21'],
      nominalLayerThicknessMm:[9,7,12],
      candidateTotalThicknessMm:28,
      actualLayerInterfacesMeasured:false
    }),
    filmAssembly:Object.freeze({
      sourceFiles:['22','23','24','32','75'],
      largeUpright:'GCM-VC13M',
      top:['unmarked lower goniometer A04L','marked GCM-G40M60L A04','thin bent bracket A05'],
      topModelPreserved:true,
      magneticFootModelConfirmed:false,
      photoOf420302MNameplateInThisGroup:false,
      A17:Object.freeze({
        sideSlotVisible:true,frontKnurledControlVisible:true,
        lowerPanelFastenersVisible:2,topCornerCounterboresVisible:0,
        photo23TopCornerCounterboresOnA15:true,
        exactSlotDimensionsMeasured:false,controlFunctionIdentified:false,
        magneticSwitchIdentified:false,manufacturerSkuVerified:false,
        independentAVisualMatchToCatalog:true,
        modelCandidate:'GCM-420302M',
        modelCandidateConfidence:'high_visual_match_only',
        candidateTopHolePattern:Object.freeze({M6:5,M4:4,M3:4,total:13,source:'Daheng GCM-42 catalogue',measuredOnA17:false}),
        candidateHolePatternAppliedToModel:true,
        comparisonToB_GCM420302MAllowed:false
      }),
      filmToSampleCommonXYCoordinatesMeasured:false
    })
  }),
  B:Object.freeze({
    group:'B',
    sourceFiles:['25','26','27','28','29','30','31'],
    magneticBase:Object.freeze({
      sku:'GCM-420302M',
      readableLabelPhoto:'31',
      manufacturerNominalMm:[65,65,20],
      makerVerified:true
    }),
    blackLocalOpticalBoard:Object.freeze({
      photos:['25','26','27','30','31'],
      brand:'Thorlabs',
      separateFromSilverSharedBoard:true,
      actualMountingPlateSkuVerified:false
    }),
    nfpSideHoles:Object.freeze({
      photos:['25','26'],model:'NFP-1462C',
      nominalStageSizeMm:[65,65],nominalThicknessMm:23,
      fixedLowerRowCount:4,movingUpperRowCount:3,total:7,
      exactCoordinatesMeasured:false,diametersMeasured:false,threadsVerified:false
    }),
    arm:Object.freeze({
      photo:'29',
      namedClamp:'Zolix PHUC-1',
      claimForPlatformA:false,
      note:'The ruler and rods in B photo29 must not alter A05 thin bent bracket'
    })
  })
});
export function auditV48RulerRegistration({
  sampleBoardTopMm=20,
  sampleBaseMm=8,
  sampleRotationMm=33.2,
  sampleTranslationMm=20,
  sampleLowerMm=9,
  sampleInterlayerMm=7,
  sampleTopMm=12,
  candidateRotaryDiameterMm=66
}={}){
  const values=[sampleBoardTopMm,sampleBaseMm,sampleRotationMm,
    sampleTranslationMm,sampleLowerMm,sampleInterlayerMm,
    sampleTopMm,candidateRotaryDiameterMm];
  if(values.some(v=>!Number.isFinite(v)||v<=0))throw new RangeError('All V48 dimensions must be positive');
  const topGlobalMm=values.slice(0,7).reduce((a,b)=>a+b,0);
  const aboveBoardMm=topGlobalMm-sampleBoardTopMm;
  const ruler=V48_RULER_EVIDENCE.A.sampleTopHeightAboveBreadboardMm;
  return Object.freeze({
    sampleTopGlobalMm:Number(topGlobalMm.toFixed(1)),
    sampleTopHeightAboveBreadboardMm:Number(aboveBoardMm.toFixed(1)),
    photoHeightMinMm:ruler.min,photoHeightMaxMm:ruler.max,
    sampleTopWithinVisibleRulerRange:aboveBoardMm>=ruler.min&&aboveBoardMm<=ruler.max,
    rotaryDiameterMm:candidateRotaryDiameterMm,
    plausibleRotationSize:candidateRotaryDiameterMm>=55&&candidateRotaryDiameterMm<=75,
    sampleTopPlateNominalMm:65,
    sampleLayerHeightsMm:[sampleLowerMm,sampleInterlayerMm,sampleTopMm],
    bMagnetNamedButAMagnetUnknown:
      V48_RULER_EVIDENCE.B.magneticBase.makerVerified===true&&
      V48_RULER_EVIDENCE.A.filmAssembly.magneticFootModelConfirmed===false,
    knownGlassToSampleContact:false,
    exactOpticalAxisRegistered:false,
    certifiedForMachining:false
  });
}
