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
      rotation:'A06 cylindrical rotation stage; exact GCM-11 SKU unseen',
      rotationDiameterCandidateMm:66,
      rotationDiameterPlausibleRangeMm:[55,75],
      rotationDiameterManufacturerVerified:false,
      rotationVendorCandidates:Object.freeze({
        GCM1101M:Object.freeze({
          manufacturer:'Daheng',overallWidthMm:92,fineAdjustmentDeg:4,
          resolutionArcMin:10,geometryApplied:false,
          assessment:'manufacturer width conflicts with 55–75mm ruler/photo diameter envelope'
        }),
        GCM1102M:Object.freeze({
          manufacturer:'Daheng',overallDiameterMm:66,heightMm:21,
          platformMm:[32,32],fineAdjustmentDeg:5,resolutionArcMin:10,
          geometryApplied:false,
          assessment:'Ø66×21mm envelope matches the reconstructed XY33mm stack; actual manufacturer model not confirmed'
        })
      }),
      angularMicrometerOnRight:false,
      shortRotationLockAtFront:true,
      separatedFromA02LinearLeftMicrometer:true,
      A02HasSecondLinearAxis:true,
      A06NoLongMicrometerUserConfirmed:true,
      sampleTopLayers:['dark lower support','wooden thermal insulator (user confirmed)','silver top plate'],
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
        // V86 evidence-ledger cleanup: photos194/195 resolved the old V48
        // layer attribution. The silver slot/front central control belongs
        // to A15, NOT the lower A17 magnetic base.
        sideSlotVisibleOnA17:false,
        silverSlotReassignedToA15:true,
        frontKnurledControlVisibleOnA17:false,
        lowerSideSwitchVisible:true,
        lowerPanelFastenersVisible:0,
        topCornerCounterboresVisible:0,
        photo23TopCornerCounterboresOnA15:true,
        exactSwitchDimensionsMeasured:false,
        magneticSwitchFunctionPhysicallyVerified:false,
        manufacturerSkuVerified:false,
        independentAVisualMatchToCatalog:true,
        modelCandidate:'CORZC PTDB65',
        modelCandidateConfidence:'envelope-and-side-switch-only',
        candidateEnvelopeMm:[65,65,20],
        candidateMagneticForceKg:32,
        candidateTopHolePattern:Object.freeze({M6:1,M4:8,M3:4,total:13}),
        candidateHolePatternAppliedToModel:false,
        comparisonToB_GCM420302MAllowed:false,
        note:'PTDB65 is comparison evidence only; A15 hides the actual A17 top face'
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
  sampleRotationMm=21,
  sampleTranslationMm=33,
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
    GCM1101MWidthMm:92,
    GCM1101MWithinPhotoDiameterEnvelope:92>=55&&92<=75,
    GCM1102MDiameterMm:66,
    GCM1102MHeightMm:21,
    GCM1102MDiameterMatchesPhotoFit:Math.abs(candidateRotaryDiameterMm-66)<.01,
    GCM1102MDirectSubstitutionTopAboveBoardMm:Number(
      (sampleBaseMm+21+sampleTranslationMm+sampleLowerMm+sampleInterlayerMm+sampleTopMm).toFixed(1)),
    GCM1102MDirectSubstitutionWithinRulerRange:
      (sampleBaseMm+21+sampleTranslationMm+sampleLowerMm+sampleInterlayerMm+sampleTopMm)>=ruler.min&&
      (sampleBaseMm+21+sampleTranslationMm+sampleLowerMm+sampleInterlayerMm+sampleTopMm)<=ruler.max,
    GCM1102MMinimumMissingStackHeightMm:Number(Math.max(0,ruler.min-
      (sampleBaseMm+21+sampleTranslationMm+sampleLowerMm+sampleInterlayerMm+sampleTopMm)).toFixed(1)),
    GCM1102MNominalMissingStackHeightMm:Number(Math.max(0,ruler.nominal-
      (sampleBaseMm+21+sampleTranslationMm+sampleLowerMm+sampleInterlayerMm+sampleTopMm)).toFixed(1)),
    A06VendorGeometryApplied:false,
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
