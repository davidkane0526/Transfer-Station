import assert from 'node:assert/strict';
import {auditPlatformAAssembly} from '../src/platform-a-assembly-audit.js';
const a=auditPlatformAAssembly();
assert.equal(a.photoConfirmedGlassClamp,false);
assert.equal(a.photoConfirmedMagneticBaseSku,false);
assert.equal(a.stageCenterGapMm,194);
assert.equal(a.currentFilmMinusSampleXmm,-194,
  'A05 currently points AWAY from the A07 sample stage; geometry cannot be called registered');
assert.deepEqual(a.tentativeFilmStageXInterval,[171.5,182.5],
  'Five-mm scene-only A16/A17 mounting reserve and finite A01 footprint restrict the plausible right-side fixture datum');
assert.equal(a.sceneOnlyCandidateIntervalExists,true);
assert.equal(a.candidateIntervalUsesUnverifiedA17Footprint,true);
assert.equal(a.candidateIntervalIsPhotoRegistration,false);
assert.equal(a.bracketLeftTipX,-164);
assert.equal(a.bracketReturnRightEdgeX,-151);
assert.equal(a.heaterLeftX,45.5);
assert.equal(a.optimisticResidualHorizontalGapMm,171.5);
assert.equal(a.mirroredReturnLeftX,-81);
assert.equal(a.mirroredReturnRightX,-68);
assert.equal(a.mirroredOrientationResidualGapMm,88.5);
assert.equal(a.bestOfTwoOrientationsResidualGapMm,88.5);
assert.equal(a.orientationFlipAloneCannotResolveReach,true);
assert.equal(a.sourceRulerMeasurementsAvailable,true);
assert.deepEqual(a.sampleTopAboveBoardMeasuredRangeMm,[87,93]);
assert.equal(a.sampleTopStackGeometryRulerCompatible,true);
assert.equal(a.absoluteFilmSampleCoordinatesPhotoRegistered,false);
assert.equal(a.orientationMeasuredFromPhoto,false);
assert.equal(a.verticalBracketBelowHeaterTopMm,17.2);
assert.equal(a.secondTwentyMmGoniometerCandidateAdded,true);
assert.equal(a.secondGoniometerActualSkuVerified,false);
assert.equal(a.nominalApproachEnvelopeRegistered,false);
assert.equal(a.clampMechanicalInterfaceClosed,false);
assert.equal(a.functionalTransferAccepted,false);
assert(a.missing.length>=5);
assert.throws(()=>auditPlatformAAssembly({bracketOverhangLeftMm:-1}),/Invalid/);
const correctedTestFixture=auditPlatformAAssembly({filmStageX:160,bracketOverhangLeftMm:60});
assert(correctedTestFixture.nominalApproachEnvelopeRegistered,
  'Auditor should recognize overlapping possible X envelopes without certifying real glass grip');
assert.equal(correctedTestFixture.functionalTransferAccepted,false);
const farRight=auditPlatformAAssembly({filmStageX:350});
assert(farRight.optimisticResidualHorizontalGapMm>0,
  'Brackets far to the RIGHT of A07 must be rejected; old one-sided test passed them');
assert.equal(farRight.nominalApproachEnvelopeRegistered,false);
const feasibleOnly=auditPlatformAAssembly({filmStageX:176});
assert.equal(feasibleOnly.nominalApproachEnvelopeRegistered,true,
  'A physically plausible candidate must be recognized as a pose feasibility calculation only');
assert.equal(feasibleOnly.functionalTransferAccepted,false,
  'A05C glass clamp and actual A17/A16 interface are still unverified even if X envelopes overlap');
console.log('V48 A ruler photo17/18 top height, three-layer sample stack and unregistered XY: PASS');
