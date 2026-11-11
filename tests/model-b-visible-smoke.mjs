import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';

const browser=await chromium.launch({
 headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
 args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader',
       '--enable-webgl','--enable-unsafe-swiftshader']
});
const page=await browser.newPage({viewport:{width:1600,height:950},deviceScaleFactor:1});
page.setDefaultTimeout(12000);
const failures=[];
page.on('pageerror',e=>failures.push(String(e)));
try{
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:20000});
 await page.locator('#viewer canvas').waitFor({timeout:20000});
 try{
   await page.waitForFunction(()=>document.querySelectorAll('#group-list .group-row').length>=7,
     null,{timeout:30000});
 }catch(e){
   const startup=await page.evaluate(()=>({
     title:document.title,
     readyState:document.readyState,
     canvasCount:document.querySelectorAll('#viewer canvas').length,
     groupRowCount:document.querySelectorAll('#group-list .group-row').length,
     caption:document.querySelector('#platform-caption')?.textContent??null,
     viewerChildren:document.querySelector('#viewer')?.children.length??null
   })).catch(()=>({evaluateFailed:true}));
   console.error('V121 viewer startup diagnostics:',JSON.stringify({startup,pageErrors:failures}));
   throw e;
 }
 assert.equal(await page.locator('#platform-caption').innerText(),'平台 B');
 assert.equal(await page.locator('#photo-scope-note').isHidden(),true);
 assert.equal(await page.locator('#b-photo-profile').isHidden(),true);
 assert.equal(await page.locator('#photo-crosscheck').isHidden(),true);
 const rect=await page.locator('#viewer canvas').boundingBox();
 assert(rect&&rect.width>=400&&rect.height>=400);
 // Capture a reviewable model BEFORE the long mechanical test suite.
 // Even a later failed assertion must not erase all visual evidence.
 await page.screenshot({
   path:'Transfer-Station-ModelB-Full-Assembly.png',
   animations:'disabled',timeout:30000
 });
 await page.locator('#btn-sample-stack').evaluate(el=>el.click());
 await page.waitForTimeout(300);
 const earlySampleBox=await page.locator('#viewer').boundingBox();
 assert(earlySampleBox&&earlySampleBox.width>=300&&earlySampleBox.height>=300);
 await page.screenshot({path:'Transfer-Station-V55-B-Crossed-Sample-XY.png',
   clip:{x:earlySampleBox.x,y:earlySampleBox.y,
     width:earlySampleBox.width,height:earlySampleBox.height},
   animations:'disabled',timeout:30000});
 await page.locator('#btn-home').evaluate(el=>el.click());
 for(const category of ['base','film','sample','heat','microscope','vacuum','external']){
   const toggle=page.locator('#group-list input[data-group="'+category+'"]');
   assert.equal(await toggle.count(),1,'B scene missing '+category);
   assert.equal(await toggle.isChecked(),true,'B scene category hidden '+category);
 }
 const proof=await page.locator('#photo-ledger').textContent();
 for(const id of ['B02','B03','B04','B05','B27','B34','B33','B24','B25','B28','B06','B07','B35','B08','B41','B09','B36','B19','B21','B23','B37','B38','B39','B40'])
   assert(proof.includes(id),'B photo evidence ledger missing '+id);
 assert.equal(await page.locator('#sample-move').isEnabled(),true);
 const mountingB=await page.evaluate(()=>window.__mountingProbe?.());
 assert.equal(mountingB?.singleBreadboardInScene,true,
   'B must have one common optical table, B35 is not a second shared base');
 assert.equal(mountingB?.commonBase,'B01');
 assert.equal(mountingB?.B35IsAuxiliaryPlate,true);
 assert.equal(mountingB?.B35CandidateAnchorHeads,4);
 const actuators=await page.evaluate(()=>window.__modelBActuatorProbe?.());
 assert(actuators?.available,'V54 rendered B actuator probe missing');
 assert.equal(actuators.B03.linearHandleCount,2,
   'B03 GCM-T25M2L must render TWO independent micrometer drums');
 assert.deepEqual(actuators.B03.axes,['X','Z'],
   'B03 crossed actuators must be perpendicular in the rendered scene');
 assert.deepEqual(actuators.B03.directions,['+Z','-X'],
   'B03 handles must face front (+Z) and left (-X) after the 180-degree installation');
 assert.equal(actuators.B08.linearHandleCount,0,
   'B08 GCM-1107M is rotation-only and has NO external operating handle');
 assert.equal(actuators.B08.rotaryLockHandleCount,0,
   'B08 must not contain a fabricated rotary lock/drive rod');
 const b08Bores=await page.evaluate(()=>window.__modelBRotaryTopBoreProbe?.());
 assert.equal(b08Bores?.available,true,'Missing actual B08 top face');
 assert.equal(b08Bores.nineBoreCount,9);
 assert.equal(b08Bores.allNineBoresOpen,true,
   'B41 bolt shafts must pass through OPEN rotary B08 top holes');
 assert.equal(b08Bores.metalBetweenBores,true,
   'B08 top face must not become empty when bores are cut');
 assert.equal(b08Bores.makerMountPatternVerified,true,
   'GCM-1107M OEM drawing identifies the nine M6 top tapped holes');
 assert.equal(b08Bores.topHolePitchMm,25);
 assert.equal(b08Bores.blindDepthCandidateMm,8);
 assert.equal(b08Bores.blindFloorIsSolid,true,
   'The M6 taps must not be represented as through-holes in a solid rotary top');
 assert.equal(b08Bores.baseMountBoreCount,4);
 assert.equal(b08Bores.baseMountPitchMm,50);
 assert.equal(b08Bores.baseClearanceDiaMm,6.8);
 assert.equal(b08Bores.baseCounterboreDiaMm,11.5);
 assert.equal(b08Bores.baseCounterboreDepthMm,16);
 assert.equal(b08Bores.baseBoreMeshes,2,
   'B08 must have independent through-clearance and counterbore layers');
 assert.equal(b08Bores.baseFourClearanceBoresOpen,true,
   'B08 four base clearance bores are still solid');
 assert.equal(b08Bores.baseFourCounterboresOpen,true,
   'B08 counterbores remain painted circles rather than true holes');
 assert.equal(b08Bores.baseFaceOrientationVerified,false,
   'OEM hole dimensions do not prove the installed counterbore entry face');
 assert.equal(b08Bores.oemThreadDepthVerified,false,
   'The 8mm tapping depth is a STEP proxy, not confirmed OEM thread depth');
 assert.equal(b08Bores.B41MountHeadCount,4);
 assert.equal(b08Bores.duplicateB41MountHeadsOnB08,0,
   'B41-to-B08 joint must NOT be represented by two overlapping sets of heads');
 assert(b08Bores.mountingMisalignmentMm<.02,
   'B41 screws must align with B08 upper deck nine-M6 holes');
 await page.locator('#rotate-sample').evaluate(el=>{
   el.value='37';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 const turnedB08=await page.evaluate(()=>window.__modelBRotaryTopBoreProbe?.());
 assert.equal(turnedB08.deckYawDeg,37,
   'B08 upper rotating disk MUST turn, not just the entire B41 top block');
 assert(turnedB08.mountingMisalignmentMm<.02,
   'B41 screws separate from B08 deck holes after rotary turns');
 assert.equal(turnedB08.allNineBoresOpen,true);
 await page.locator('#rotate-sample').evaluate(el=>{
   el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 assert.equal(actuators.B08.handles.length,0,
   'B08 rendered rotary body must have no protruding actuator');
 assert.equal(actuators.B41.linearHandleCount,1,
   'B41 lower crossed stage must render its own independent front micrometer');
 assert.deepEqual(actuators.B41.axes,['Z']);
 assert.deepEqual(actuators.B41.directions,['+Z'],
   'B41 second linear micrometer must face the operator/front (+Z)');
 assert.equal(actuators.B41.stageRole,'lower-Y');
 assert.equal(actuators.B09.stageRole,'upper-X');
 assert.equal(actuators.B41.stageBoundaryMarkerCount,0);
 assert.equal(actuators.B09.stageBoundaryMarkerCount,1,
   'Both photographed stages must have a visible demarcation at the B41/B09 mating face');
 assert.deepEqual(actuators.B41.modelOnlyAxisAnnotations,['lower-Y'],
   'The lower Y stage needs its own visible photo-review axis marker');
 assert.deepEqual(actuators.B09.modelOnlyAxisAnnotations,['upper-X'],
   'The upper NFP X stage needs its own distinct marker');
 assert.match(await page.locator('#axis-confidence-note').textContent(),/非实物铭牌/);
 assert.equal(await page.locator('#axis-confidence-note').isVisible(),false,
   'Engineering evidence legend belongs in hidden audit data, not the normal user UI');
 assert.equal(actuators.B41.fixedBaseHeightMm+actuators.B41.movingStageHeightMm,23);
 assert.equal(actuators.B09.fixedBaseHeightMm+actuators.B09.movingStageHeightMm,23);
 // Verify rendered B41/B09 screws are physically below travelling plates.
 for(const id of ['B41','B09']){
  assert.equal(actuators[id].recessedBaseHeadCount,4,
    id+' must retain four separate fixed-base fastener heads');
  assert.equal(actuators[id].belowBaseScrewEngagementMm,7,
    id+' mount fasteners must reach into the lower mating part');
  assert.equal(actuators[id].screwInterfacingHoleRegistrationVerified,false,
    id+' true mating threads/pitch remain unverified');
  assert(actuators[id].fixedBaseFastenerTopMm<11,
    id+' head must not protrude into moving layer');
  assert(actuators[id].movingUndersideToFastenerClearanceMm>=0.1,
    id+' mounting screw heads penetrate moving stage');
 }
 const finiteB=await page.evaluate(()=>window.__sceneFiniteGeometryProbe?.());
 assert.equal(finiteB.available,true);
 assert.equal(finiteB.invalidMeshes,0,'Rotary B tick meshes must not have NaN positions');
 assert.equal(finiteB.tickCount,180);
 assert(finiteB.minRadiusMm>46&&finiteB.maxRadiusMm<47.1);
 const photoB=await page.evaluate(()=>window.__photoEvidenceProbe?.('B41'));
 assert.deepEqual(photoB?.ids,['147']);
 assert.deepEqual(photoB?.embedded,['147'],
   'Real photo 147 must be committed as an image asset, not a dangling photo number');
 const photoFile=await page.request.get('http://127.0.0.1:8765/assets/photos/147.jpg');
 assert.equal(photoFile.status(),200);
 assert.match(photoFile.headers()['content-type']||'',/image\/jpeg/);
 assert.equal(actuators.B41.sideHoleRowsCandidate,null,
   'B41 must not inherit the NFP side-hole rows without a verified SKU');
 assert.equal(actuators.B41.B41TopFourM6MountPatternCandidate,true,
   'B41 may expose only the four candidate mating holes needed by B09');
 assert.equal(actuators.B09.linearHandleCount,1,
   'B09 NFP-1462C is a single-axis upper stage with one micrometer');
 assert.deepEqual(actuators.B09.axes,['X']);
 assert.deepEqual(actuators.B09.directions,['+X'],
   'B09 NFP micrometer must face right (+X)');
 assert(Math.abs(actuators.B09.worldPosition[1]-actuators.B41.worldPosition[1]-23)<.05,
   'B09 upper single-axis stage must sit directly on B41 lower stage');
 assert(Math.abs(actuators.B10.worldPosition[1]-actuators.B09.worldPosition[1]-23)<.05,
   'The insulation/heater stack must be above the B09 moving top, not at the old single-stage height');
 // Exercise the two independent sample axes and their carried upper stack.
 await page.locator('#sample-move').evaluate(el=>{el.value='5';el.dispatchEvent(new Event('input',{bubbles:true}));});
 let sampleX=await page.evaluate(()=>window.__modelBActuatorProbe?.());
 assert(Math.abs(sampleX.B09.singleCarriageLocalMm+5)<.05,
   'B09 X control must move the upper NFP carriage');
 assert(Math.abs(sampleX.B41.singleCarriageLocalMm)<.05,
   'B09 X control must not move the lower B41 carriage');
 assert(Math.abs(sampleX.B10.worldPosition[0]-actuators.B10.worldPosition[0]-5)<.05,
   'B09 X carriage must carry the heater stack');
 await page.locator('#sample-move').evaluate(el=>{el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.locator('#sample-move-depth').evaluate(el=>{el.value='4';el.dispatchEvent(new Event('input',{bubbles:true}));});
 const sampleZ=await page.evaluate(()=>window.__modelBActuatorProbe?.());
 assert(Math.abs(sampleZ.B41.singleCarriageLocalMm+4)<.05,
   'B41 front/back control must move its own lower carriage');
 assert(Math.abs(sampleZ.B09.worldPosition[2]-actuators.B09.worldPosition[2]-4)<.05,
   'B41 Z carriage must carry the upper B09 stage');
 assert(Math.abs(sampleZ.B10.worldPosition[2]-actuators.B10.worldPosition[2]-4)<.05,
   'B41 Z carriage must carry the heater/insulator stack');
 assert(Math.abs(sampleZ.B09.singleCarriageLocalMm)<.05,
   'B41 Z control must not move the independent B09 X carriage');
 await page.locator('#sample-move-depth').evaluate(el=>{el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));});
 // Exercise the two B03 carriages independently, then together.
 await page.locator('#translate').evaluate(el=>{el.value='5';el.dispatchEvent(new Event('input',{bubbles:true}));});
 const xOnly=await page.evaluate(()=>window.__modelBActuatorProbe?.());
 assert(Math.abs(xOnly.B03.xCarriageLocalMm+5)<.05);
 assert(Math.abs(xOnly.B03.depthCarriageLocalMm)<.05,
   'B03 X movement must not move the perpendicular carriage');
 await page.locator('#translate-depth').evaluate(el=>{el.value='4';el.dispatchEvent(new Event('input',{bubbles:true}));});
 const xyMoved=await page.evaluate(()=>window.__modelBActuatorProbe?.());
 assert(Math.abs(xyMoved.B03.xCarriageLocalMm+5)<.05);
 assert(Math.abs(xyMoved.B03.depthCarriageLocalMm+4)<.05,
   'B03 second-axis movement must be independent of X');
 await page.locator('#translate').evaluate(el=>{el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.locator('#translate-depth').evaluate(el=>{el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));});
  const support=await page.evaluate(()=>window.__modelBSupportProbe?.());
 assert(support?.available,'V34 full-system support probe missing');
 assert(Math.abs(support.boardSizeMm[0]-250)<0.1&&
        Math.abs(support.boardSizeMm[1]-12)<0.1&&
        Math.abs(support.boardSizeMm[2]-300)<0.1,
   'Render B35 board must cover 250x300mm and remain 12mm photo-fit thick');
 assert(Math.abs(support.microscopeFootBottomMm-support.boardTopMm)<0.1,
   'Microscope foot still floats or rests on lower silver tabletop, not B35');
 assert(Math.abs(support.rotaryFootBottomMm-support.boardTopMm)<0.1,
   'Rotary and microscope must share the SAME black Thorlabs support plane');
 assert.equal(support.microscopeFullyOnBlackBoard,true,
   'Microscope base footprint extends outside black board');
 assert.equal(support.rotaryFullyOnBlackBoard,true,
   'Rotary base footprint extends outside black board');
 assert.equal(support.originalThorlabsPartNumberConfirmed,false,
   'Photo does not confirm exact Thorlabs part number');
 const optics=await page.evaluate(()=>window.__modelBOpticsProbe?.());
 assert(optics?.available,'V50 B-specific MXFMS optics probe missing');
 assert.equal(optics.postDiameterMm,32,'MXFMS post diameter must use the manufacturer 32mm dimension');
 assert.equal(optics.postHeightMm,280,'MXFMS post height must use the manufacturer 280mm dimension');
 assert.equal(optics.coarseFocusKnobs,2,'Both coaxial coarse focus wheels must be visible');
 assert.equal(optics.fineFocusKnobs,2,'Both coaxial fine focus wheels must be visible');
 assert.equal(optics.cameraAdapterSections,2,'SDPTOP camera relay adapter stack is incomplete');
 assert.equal(optics.fiveHoleNosepiece,true,'MXFMS five-hole inward nosepiece is missing');
 assert.equal(optics.objectivePorts,5,'All five nosepiece positions must be represented');
 assert.equal(optics.installedObjectives,2,'Only the two photo-identified objective barrels should be installed');
 assert(optics.objectiveLabels.some(x=>x==='10x / 0.15 / DIC / WD10.8'),
   'Photo110 10x/0.15/DIC/WD10.8 objective marking missing');
 assert(optics.objectiveLabels.some(x=>x==='OptoSigma · model unknown'),
   'Separate OptoSigma objective must not be merged with the 10x objective');
 const nfpSide=await page.evaluate(()=>window.__modelBNfpSideHoleProbe?.());
 assert(nfpSide?.available,'V49 NFP photo25/26 side-hole probe missing');
 assert.equal(nfpSide.sideHoleCount,7,'NFP side face must show the photographed 3+4 hole rows');
 assert.equal(nfpSide.upperRowCount,3,'Three upper holes belong to the moving carriage');
 assert.equal(nfpSide.lowerRowCount,4,'Four lower holes belong to the fixed stage body');
 assert.equal(nfpSide.exactHoleCoordinatesMeasured,false);
 assert.equal(nfpSide.threadSizesVerified,false);
 const approach=await page.evaluate(()=>window.__modelBContactProbe?.());
 assert(approach?.available,'V36 actual-mesh contact probe missing');
 assert(Math.abs(approach.glassX[0]-18)<.1&&Math.abs(approach.glassX[1]-94)<.1,
   'Glass left/right boundaries must match revised edge-grip layout');
 assert(Math.abs(approach.stampX[0]-72)<.1&&Math.abs(approach.stampX[1]-92)<.1,
   'Stamp is not near RIGHT edge of real glass mesh');
 assert(Math.abs(approach.stampRightInsetMm-2)<.1,'Stamp should leave 2mm glass edge margin');
 assert(Math.abs(approach.stampCenterOffsetFromHeaterMm)<.1,
   'PDMS stamp must align with substrate center');
 assert(approach.clampToHeaterClearanceMm>=15,
   'Whole clamp body, not just abstract datum, must be entirely outside heater');
 const harness=await page.evaluate(()=>window.__modelBHeatingHarnessProbe?.());
 assert(harness?.available,'V36 heater controller wiring probe missing');
 assert.equal(harness.heatingLeads,2,'Heater must show TWO individually modelled leads');
 assert.equal(harness.temperatureFeedbackLeads,1,'Independent temperature-sensor sheath is missing');
 assert.equal(harness.realSideWallFeedthroughHole,true,
   'Cable must not pass through undrilled B36 metal side wall');
 assert.equal(harness.internalTerminationZoneExists,true);
 assert.equal(harness.controllerTerminalPinoutVerified,false,
   'Unidentified controller terminal pinout must never be marked verified');
 // V37: real photo120 is VN-50, not W-50. The suction path connects
 // the B11/B15 rear bore to the open pump INTAKE, never to B36.
 const vac=await page.evaluate(()=>window.__modelBVacuumProbe?.());
 assert(vac?.available,'V37 pump suction tube or diagnostic not mounted');
 assert.equal(vac.nameplateModel,'VN-50','Photo120 VN-50 must replace W-50');
 assert.equal(vac.photoConfirmed,true);
 assert.equal(vac.geometryRevision,'V53_VN50_G14_thread_datum_not_a_hose_spigot');
 assert.deepEqual(vac.pumpEnvelopeMm.map(v=>Math.round(v)),[200,150,110],
   'VN-50 candidate body must respect the 200×110×150mm family envelope');
 assert.equal(vac.pumpFeatures.basePlate,1);
 assert.equal(vac.pumpFeatures.mountingFeet,4,
   'VN-50 candidate mounting pattern must have four visible feet');
 assert.deepEqual(vac.pumpFeatures.mountingFootCenters,
   [[-81,10,-48],[-81,10,48],[61,10,-48],[61,10,48]],
   'Four VN-50 feet must be centered on the 142×96mm candidate pattern relative to the pump base');
 assert.deepEqual(vac.pumpFeatures.nameplateCenters,[[-10,50,44]],
   'VN-50 nameplate must sit on the visible curved side face');
 assert.deepEqual(vac.pumpFeatures.tieRodCenters,[[-10,30,39],[-10,70,39]],
   'Two tie rods must occupy different heights on the SAME visible side');
 assert.equal(vac.pumpFeatures.cylindricalHousing,1,
   'Photo120/123 require a horizontal cylindrical motor barrel, not a box');
 assert.equal(vac.pumpFeatures.housingBands,2);
 assert.equal(vac.pumpFeatures.headFins,6);
 assert.equal(vac.pumpFeatures.headBridges,1);
 assert.equal(vac.pumpFeatures.headBridgeSupports,2);
 assert.equal(vac.pumpFeatures.warningPlates,1);
 assert.equal(vac.pumpFeatures.warningSymbols,2);
 assert.equal(vac.pumpFeatures.nameplateTextLines,5);
 assert.equal(vac.pumpFeatures.fanGrilles,1);
 assert.equal(vac.pumpFeatures.fanApertures,8);
 assert.equal(vac.pumpFeatures.rodSupports,4,
   'Two side rails must be supported at both ends');
 assert.equal(vac.pumpFeatures.headFlanges,2);
 assert.equal(vac.pumpFeatures.headCaps,2);
 assert.equal(vac.pumpFeatures.topPorts,1);
 assert.equal(vac.pumpFeatures.filters,3);
 assert.equal(vac.pumpFeatures.topVents,12);
 assert.equal(vac.pumpFeatures.sideVents,18,
   'Side vents must remain outside the nameplate footprint');
 assert.equal(vac.pumpFeatures.motorHousing,1);
 assert.equal(vac.pumpFeatures.motorCore,1);
 assert.equal(vac.pumpFeatures.fanCover,1);
 assert.equal(vac.pumpFeatures.twinHeads,2,
   'VN-50 family imagery must be represented by two finned pump heads');
 assert.equal(vac.pumpFeatures.tieRods,2,
   'Photo120/123 must show two longitudinal metal tie rods');
 assert(vac.pumpFeatures.vents>=20,
   'Photo120/123 perforated motor housing details are missing');
 assert.equal(vac.hosePart,'B40');
 assert.equal(vac.hoseWallMeshes,2,'Actual inner and outer hose walls required');
 assert.equal(vac.twoOpenPorts,true,
   'Both the pump suction inlet and B15 fitting must be REALLY bored');
 assert.equal(vac.sealedVacuumCircuitVerified,false,
   'Open geometric bores do not establish real vacuum-tight seals');
 assert.equal(vac.directPumpHoseFitVerified,false);
 assert.equal(vac.pumpSideAdapterUnresolved,true);
 assert.equal(vac.hoseToPumpBoreDiametricGapMm,null);
 assert.equal(vac.pumpPortThreadCandidate,'G1/4');
 assert.equal(vac.pumpPortMajorDiameterMm,13.157);
 assert.equal(vac.pumpPortFemaleTapDrillCandidateMm,11.8);
 assert.equal(vac.pumpPortGenderVerified,false);
 assert(vac.sourceCoordinateErrorMm<.01,
   'First long-hose node not coupled to moving B15 short hose outlet');
 assert(vac.pumpCoordinateErrorMm<.01,
   'Hose endpoint must meet the VN-50 G1/4 family thread datum');
 assert.equal(vac.electricityCabinetNotVacuumDestination,true);
 assert.equal(vac.passesBehindController,true,
   'B40 must pass behind the B19 temperature controller, not over its front');
 assert.equal(vac.serviceLane,'B19 controller rear / B36 cabinet rear exterior · Y=70 mm');
 assert(vac.minimumHarnessClearanceMm>2);
 assert(vac.harnessClearancesMm.B37A>2&&vac.harnessClearancesMm.B37B>2&&vac.harnessClearancesMm.B38>2);
 assert(vac.cabinetClearanceMm>0,'B40 must clear all B36 enclosure walls');
 assert(vac.controllerClearanceMm>0,'B40 must clear the B19 panel body');
 assert(vac.microscopeClearanceMm>0,'B40 must clear the moving-side B16 microscope column');
 assert.equal(vac.actualInletThreadVerified,false);
 assert.equal(vac.actualSplineGeometryAvailable,true,
   'Rendered TubeGeometry centerlines must be available for spline clearance checks');
 const splineEnvelope=await page.evaluate(()=>
   window.__modelBVacuumSplineEnvelopeProbe?.());
 assert(splineEnvelope?.available,'Full Catmull-Rom envelope probe unavailable');
 assert.equal(splineEnvelope.posesChecked,2997);
 assert.deepEqual(splineEnvelope.sampleDepthShiftRangeMm,[-12.5,12.5],
   'Spline audit must include the added lower B41 axis');
 assert.equal(splineEnvelope.continuousBetweenSamplesProven,false,
   'Discrete Catmull-Rom pose sampling is not a continuous clearance proof');
 assert.equal(splineEnvelope.fullStrokeSplineGridPass,true,
   'Actual Catmull-Rom route must clear every heater/sensor harness over the full UI grid');
 console.log('V55 crossed XY / yaw Catmull-Rom sampled clearance grid:',JSON.stringify(splineEnvelope));
 for(const id of ['B37A','B37B','B38'])
   assert(splineEnvelope.minimumSurfaceClearanceMm[id]>2,
     'Full rendered spline grid clearance below 2mm for '+id);
 for(const id of ['B37A','B37B','B38'])
   assert(vac.actualSplineHarnessClearancesMm[id]>2,
     'Rendered Catmull-Rom B40 must clear '+id+' by >2mm');
 for(const [shift,angle] of [[-12.5,-90],[-12.5,90],[12.5,-90],[12.5,90]]){
   await page.locator('#sample-move').evaluate((el,v)=>{
     el.value=String(v);el.dispatchEvent(new Event('input',{bubbles:true}));
   },shift);
   await page.locator('#rotate-sample').evaluate((el,v)=>{
     el.value=String(v);el.dispatchEvent(new Event('input',{bubbles:true}));
   },angle);
   const corner=await page.evaluate(()=>window.__modelBVacuumProbe?.());
   assert(corner?.actualSplineGeometryAvailable,
     'Rendered hose/wire curves must remain available at the motion corner');
   for(const id of ['B37A','B37B','B38'])
     assert(corner.actualSplineHarnessClearancesMm[id]>2,
       'Rendered Catmull-Rom hose collides with '+id+' at shift='+shift+', angle='+angle);
 }
 await page.locator('#sample-move').evaluate(el=>{
   el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 await page.locator('#rotate-sample').evaluate(el=>{
   el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 // V55: with the upper X micrometer at zero, the missing lower Y axis
 // must carry the B15 fitting and first B40 knot together. Pump stays put.
 await page.locator('#sample-move-depth').evaluate(el=>{
   el.value='7';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 const depthVac=await page.evaluate(()=>window.__modelBVacuumProbe?.());
 assert(depthVac.sourceCoordinateErrorMm<.01,
   'B41 second axis moved the fitting but detached the first B40 hose waypoint');
 assert(depthVac.pumpCoordinateErrorMm<.01);
 assert(Math.abs(depthVac.dynamicRoute[0][2]-vac.dynamicRoute[0][2]-7)<.01,
   'B41 fore/aft travel must shift the first hose node by the same distance');
 await page.locator('#sample-move-depth').evaluate(el=>{
   el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 const prevRoute=vac.dynamicRoute;
 await page.locator('#sample-move').evaluate(el=>{
   el.value='6';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 await page.locator('#rotate-sample').evaluate(el=>{
   el.value='20';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 const shiftedVac=await page.evaluate(()=>window.__modelBVacuumProbe?.());
 assert(shiftedVac?.sourceCoordinateErrorMm<.01,
   'Vacuum hose first knot must move together with rotated sample');
 assert(shiftedVac?.pumpCoordinateErrorMm<.01,
   'VN-50 pump end must remain fixed through sample motion');
 assert.notDeepEqual(shiftedVac.dynamicRoute[0],prevRoute[0]);
 assert.deepEqual(shiftedVac.dynamicRoute.at(-1),prevRoute.at(-1));
 await page.locator('#rotate-sample').evaluate(el=>{
   el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 await page.locator('#sample-move').evaluate(el=>{
   el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 // The MOVABLE glass clamp descends 13mm until the PDMS reaches the
 // heater; the jaw must stay entirely OUTSIDE its footprint.
 await page.locator('#film-drop').evaluate(el=>{
   el.value='-13';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 const lowered=await page.evaluate(()=>window.__modelBContactProbe?.());
 assert(lowered?.clampFootprintOutsideHeater,
   'Glass clamp would strike heater during vertical descent');
 assert(Math.abs(lowered.stampToHeaterGapMm)<0.15,
   'PDMS, not the clamp, should be the first body to meet heater at contact height');
 // Extreme combined linear stage shifts must reset vertical approach
 // instead of permitting a displayed jaw/chuck collision.
 await page.locator('#translate').evaluate(el=>{
   el.value='12.5';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 await page.locator('#sample-move').evaluate(el=>{
   el.value='-12.5';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 assert.equal(await page.locator('#film-drop').inputValue(),'0',
   'Unsafe combined X offsets must block the lowering preview');
 await page.locator('#translate').evaluate(el=>{
   el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 await page.locator('#sample-move').evaluate(el=>{
   el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 assert.equal(support.microscopeFootFourTrueThroughBores,true,
   'V35 microscope foot has four actual candidate through-bores, not four screws on solid metal');
 assert.equal(support.microscopeMountAudit?.candidateFootHoleCount,4);
 assert.equal(support.microscopeMountAudit?.mountingCounterboreCount,4);
 assert.equal(support.microscopeMountAudit?.centralFifthCounterbore,false,
   'MB2530/M 250x300mm must not gain the central fifth counterbore');
 assert.equal(support.B16MountingScrewHeads,4,
   'B16 custom foot must show four candidate M6x20 mounting screws');
 assert.equal(support.NFPMicrometerOverallLengthCandidateMm,177.5,
   'NFP right-facing micrometer assembly must remain within the OEM overall-length envelope');
 assert.equal(support.NFPUpperPhotoSideHoleRowHeightMm,17.5,
   'NFP upper side-hole row must match the CAD/STEP z datum');
 assert.equal(support.microscopeMountAudit?.boardBoltPatternAligned,true,
   'New B16 four M6 candidate holes must be registered to B35 grid');
 assert.equal(support.microscopeMountAudit?.maxMismatchMm,0);
 assert.equal(support.microscopeMountAudit?.footBoreDiameterMm,6.5);
 assert.equal(support.microscopeMountAudit?.boardAnchorThreadVerified,false);
 assert.equal(support.microscopeMountAudit?.loadBearingFastenerJointAccepted,false,
   'A nominally aligned hole layout still does not qualify the OEM load-bearing mount');
 const externalToggle=page.locator('#group-list input[data-group="external"]');
 const initExternal=await page.evaluate(()=>window.__modelBViewProbe());
 assert.deepEqual(initExternal.hiddenExternalParts,[],
    'Checked external-category checkbox MUST NOT silently hide B36/B19/B21/B23');
 assert(initExternal.visibleExternalCount>=5,'B36 cabinet plus four associated external components required');
 // Trigger the checkbox's native click/change synchronously: repeated
 // WebGL frame requests can make Playwright's actionability wait time out
 // after the click has already fired and changed scene visibility.
 await externalToggle.evaluate(el=>el.click());
 assert.equal(await externalToggle.isChecked(),false,
   'External group checkbox must enter the unchecked state on click');
 const disabledExternal=await page.evaluate(()=>window.__modelBViewProbe());
 assert.equal(disabledExternal.visibleExternalCount,0,
    'Turning external group OFF should hide all external scene meshes');
 await externalToggle.evaluate(el=>el.click());
 assert.equal(await externalToggle.isChecked(),true,
   'External group checkbox must restore its checked state on click');
 const restoredExternal=await page.evaluate(()=>window.__modelBViewProbe());
 assert.deepEqual(restoredExternal.hiddenExternalParts,[],
    'Turning external group ON must restore all B36 external assemblies');
 assert.match(await page.locator('#photo-ledger').textContent(),/B35/);
 // The black sample-side Thorlabs mounting board is independently
 // selectable; switching film-side profiles cannot delete it.
 assert.equal(await page.locator('#group-list input[data-group="base"]').isChecked(),true);
 // V55 fast structural QA: omit nonessential Transfer-Station-ModelB-Full-Assembly.png screenshot.
 await page.locator('#btn-rear').evaluate(el=>el.click());
 await page.waitForTimeout(450);
 const rearVac=await page.evaluate(()=>window.__modelBVacuumProbe?.());
 assert.equal(rearVac?.passesBehindController,true,
   'Rear view must retain the B19-backside vacuum route');
 assert.equal(rearVac?.fullStrokeGridPass,true,
   'B40 must pass both independent 0.5mm × 1° sample-axis sweeps and combined XY corners');
 assert.equal(rearVac?.envelopePosesChecked,18795,
   'Route audit must include X, Y, and combined two-axis sample displacement');
 assert(rearVac?.minimumHarnessClearanceMm>2,
   'B40 must remain separated from the heater and sensor wiring');
 assert(rearVac?.envelopeMinimumClearancesMm?.harness>2,
   'Full sampled motion envelope must preserve hose-to-wire clearance');
 for(const id of ['B37A','B37B','B38'])
   assert(rearVac?.harnessClearancesMm?.[id]>2,
     'B40 nominal route must clear '+id);
 await page.screenshot({path:'Transfer-Station-V40-Vacuum-Rear-Route.png'});
 // The default view alone can mask small missing mechanics: explicitly
 // focus on the film arm and capture a second mandatory detail screenshot.
 await page.locator('#btn-film-stack').evaluate(el=>el.click());
 await page.evaluate(()=>window.scrollTo(0,0));
 // V55 fast structural QA: omit nonessential Transfer-Station-V29-B-Post-Sleeve-Closeup.png screenshot.
 // Avoid locator.screenshot's "element stability" wait: the WebGL
 // canvas renders continuously with OrbitControls damping. Capture the
 // SAME viewer rectangle from the page instead, without scrolling an
 // animating element into view for 12 seconds.
 const viewerBox=await page.locator('#viewer').boundingBox();
 assert(viewerBox&&viewerBox.width>300&&viewerBox.height>300,
   'Model B close-up viewer should be sized and visible');
 // V55 fast structural QA: omit nonessential Transfer-Station-V29-B-Film-Viewer.png screenshot.
 await page.locator('#btn-home').evaluate(el=>el.click());
 await page.locator('#btn-sample-stack').evaluate(el=>el.click());
 const sampleBox=await page.locator('#viewer').boundingBox();
 assert(sampleBox&&sampleBox.width>=300&&sampleBox.height>=300);
 // V55 fast structural QA: omit nonessential Transfer-Station-V32-Black-Thorlabs-Sample-Board.png screenshot.
 await page.locator('#btn-home').evaluate(el=>el.click());
 await page.locator('#btn-control-cabinet').evaluate(el=>el.click());
 await page.waitForTimeout(850); // OrbitControls damping + WebGL frame settle
 const cabinetProbe=await page.evaluate(()=>window.__modelBViewProbe());
 console.log('B36 CAD-visible camera projection:',JSON.stringify(cabinetProbe));
 assert(cabinetProbe.exists&&cabinetProbe.visible&&cabinetProbe.meshCount>=5,
   'Photo119 metal cabinet must be actual visible multi-mesh 3D scene assembly');
 assert(Math.abs(cabinetProbe.projectedCenter[0])<.7 &&
        Math.abs(cabinetProbe.projectedCenter[1])<.7 &&
        cabinetProbe.projectedCenter[2]<1,
   'B36 center must be in the central field of view of control-cabinet focus');
 await page.evaluate(()=>window.scrollTo(0,0));
 const cabinetBox=await page.locator('#viewer').boundingBox();
 assert(cabinetBox&&cabinetBox.width>=300&&cabinetBox.height>=300);
 // V55 fast structural QA: omit nonessential Transfer-Station-V33-Control-Cabinet-Interior.png screenshot.
 await page.locator('#btn-home').evaluate(el=>el.click());
 await page.locator('#open-bom').evaluate(el=>el.click());
 const rows=await page.locator('#bom-body tr').allTextContents();
 for(const id of ['B01','B35','B02','B03','B04','B05','B06','B07','B08','B09',
    'B10','B11','B12','B14','B15','B16','B17','B18','B19','B20','B21',
    'B22','B23','B24','B25','B26','B27','B28','B33','B34','B36','B37','B38','B39','B40']){
   assert(rows.some(row=>row.trim().startsWith(id)),'B BOM lost '+id);
 }
 for(const wrong of ['B29','B30','B31','B32'])
   assert(!rows.some(row=>row.trim().startsWith(wrong)),
      'A 94/95/97 film arm wrongly merged into B '+wrong);
 await page.locator('#bom-query').fill('B41');
 const b41PhotoRow=page.locator('#bom-body tr').filter({hasText:/^\s*B41\b/});
 assert.equal(await b41PhotoRow.count(),1,'B41 lower crossed stage must have a BOM row');
 assert.equal(await b41PhotoRow.locator('td.bom-photo-cell img').count(),1,
   'B41 BOM must display the real photograph, not just an evidence label');
 assert.match(await b41PhotoRow.locator('td.bom-photo-cell img').getAttribute('src'),/147\.jpg$/);
 await b41PhotoRow.locator('.bom-photo-tile').evaluate(el=>el.click());
 assert.equal(await page.locator('#source-photo-lightbox[open]').count(),1,
   'Clicking the BOM photo must open the original image overlay');
 await page.locator('.photo-lightbox-close').evaluate(el=>el.click());
 await b41PhotoRow.evaluate(el=>el.click());
 assert.match(await page.locator('#photo-evidence-gallery').innerText(),/照片 147/);
 assert.equal(await page.locator('#photo-evidence-gallery img').count(),1,
   'Selecting the B41 stage via BOM must display its photographed evidence');
 await page.locator('#open-bom').evaluate(el=>el.click());
 await page.locator('#bom-query').fill('B24');
 const phuc=page.locator('#bom-body tr').filter({hasText:'B24'});
 assert.equal(await phuc.count(),1);
 await phuc.evaluate(el=>el.click());
 assert.match(await page.locator('#part-detail').innerText(),/PHUC-1/);
 assert.equal(await page.locator('#holder-geometric-qa').getAttribute('data-hole-spacing'),'33');
 await page.locator('#open-bom').evaluate(el=>el.click()); // Selecting a row closes the BOM panel
 await page.locator('#bom-query').fill('B34');
 const holder=page.locator('#bom-body tr').filter({hasText:'B34'});
 assert.equal(await holder.count(),1,'Black photo149 sleeve must have its own BOM row');
 await holder.evaluate(el=>el.click());
 assert.match(await page.locator('#part-detail').innerText(),/PHSH-2/);
 await page.locator('#open-bom').evaluate(el=>el.click());
 await page.locator('#bom-query').fill('B33');
 const square=page.locator('#bom-body tr').filter({hasText:'B33'});
 assert.equal(await square.count(),1,'Independent square clamp cannot disappear');
 await square.evaluate(el=>el.click());
 assert.match(await page.locator('#part-detail').innerText(),/方形夹块|方夹/);
 await page.locator('#open-bom').evaluate(el=>el.click());
 await page.locator('#bom-query').fill('B35');
 const board=page.locator('#bom-body tr').filter({hasText:'B35'});
 assert.equal(await board.count(),1,'Black Thorlabs sample board must be a separate BOM item');
 await board.evaluate(el=>el.click());
 const boardDetail=await page.locator('#part-detail').innerText();
 assert.match(boardDetail,/Thorlabs|THORLABS/);
 assert(!/证据等级|四孔整体配准|候选矩阵|尚需确认/.test(boardDetail),
   'Visible part detail must not expose engineering audit prose');
 assert(boardDetail.length<650,'Visible part detail must stay compact');
 assert(!/^ID$/m.test(boardDetail),'Visible part card must omit internal ID');
 assert(!/^安装$/m.test(boardDetail),'Visible part card must omit installation audit text');
 const boardEngineering=await page.locator('#part-detail-engineering').textContent();
 assert.match(boardEngineering,/B35↔B16孔系配准/);
 assert.match(boardEngineering,/120个候选网格孔已按全厚贯通孔建模/,
   'B35 engineering data must retain the full-hole audit without exposing it in the user panel');
 assert.equal(await page.locator('#part-detail-engineering').isVisible(),false);
 const fourHoleFit=page.locator('#b08-b35-mount-fit');
 assert.equal(await fourHoleFit.getAttribute('data-direct-fit'),'false',
   'Touching B08 and B35 faces does not prove mounting bores line up');
 assert.equal(Number(await fourHoleFit.getAttribute('data-mismatch-mm')),13.657);
 assert.equal(Number(await fourHoleFit.getAttribute('data-minimum-rigid-translation-mm')),13.657);
 assert.match(await fourHoleFit.innerText(),/四孔整体配准校核/);
 assert.match(await fourHoleFit.innerText(),/X=87\.5, Z=-12\.5/);
 assert.match(await fourHoleFit.innerText(),/X=87\.5, Z=12\.5/);
 assert.match(await fourHoleFit.innerText(),/不会自动移动旋转台/,
   'A mathematical hole-fit alternative cannot be silently installed in the visible model');
 await page.locator('#open-bom').evaluate(el=>el.click());
 await page.locator('#bom-query').fill('B36');
 // B19/B21/B23 descriptions also say "inside B36", so a
 // substring text filter matches several rows. Check the row's
 // FIRST model ID instead of erroneously counting references.
 const cabinet=page.locator('#bom-body tr').filter({hasText:/^\s*B36\b/});
 assert.equal(await cabinet.count(),1,'Open steel control enclosure must be independent BOM item');
 await cabinet.evaluate(el=>el.click());
 const cabinetDetail=await page.locator('#part-detail').innerText();
 assert(!/照片119|尚未|待核|候选矩阵/.test(cabinetDetail),
   'Cabinet user card must stay free of research notes');
 // V38 selected-only diameter labels: all four are explicitly
 // candidates and MUST be available without cluttering 3D view.
 for(const [id,pattern] of [
   ['B11',/Ø1\.4/],['B15',/Ø2\.84/],
   ['B40',/OD Ø7\.0 \/ ID Ø4\.4/],['B20',/G1\/4.*Ø13\.157.*P1\.337/]
 ]){
   await page.locator('#open-bom').evaluate(el=>el.click());
   await page.locator('#bom-query').fill(id);
   const row=page.locator('#bom-body tr').filter({hasText:new RegExp('^\\s*'+id+'\\b')});
   assert.equal(await row.count(),1,'Suction BOM ID '+id+' missing');
   await row.evaluate(el=>el.click());
   assert.equal(await page.locator('#suction-dimensions').getAttribute('data-candidate'),'true');
   assert.match(await page.locator('#suction-dimensions').innerText(),pattern);
   if(id==='B40'||id==='B20'){
     assert.equal(await page.locator('#vacuum-interface-warning').getAttribute('data-status'),'unverified');
     const fitNote=await page.locator('#vacuum-interface-warning').innerText();
     assert.match(fitNote,/软管内径Ø4\.4/);
     assert.match(fitNote,/不能把G1\/4螺纹直径当作软管倒刺直径/);
     assert.match(fitNote,/转接件型号和密封方式未确认/);
   }
 }
 await page.locator('#btn-b-archive').evaluate(el=>el.click());
 await page.waitForTimeout(100);
 const switchState=await page.evaluate(()=>({
   ...window.__activePlatformProbe?.(),
   caption:document.querySelector('#platform-caption')?.textContent,
   archiveButtonHandler:typeof document.querySelector('#btn-b-archive')?.onclick,
   bProfileHidden:document.querySelector('#b-photo-profile')?.hidden,
   aAuditHidden:document.querySelector('#a-physical-audit')?.hidden
 }));
 console.log('V51 platform switch diagnostic:',JSON.stringify(switchState));
 assert.deepEqual(failures,[],'Browser runtime error while switching from B to A: '+failures.join(' | '));
 assert.equal(switchState.platform,'A','Archive button did not switch the active scene to platform A');
 assert.equal(switchState.caption,'平台 A · 工作位');
 assert.equal(await page.locator('#platform-caption').innerText(),'平台 A · 工作位');
 assert.equal(await page.locator('#a-pose-selector').isHidden(),true,
   'Platform A photo/reference selector is internal QA only');
 assert.equal(await page.locator('#photo-crosscheck').isHidden(),true,
   'Platform A photo comparison controls must not appear in user UI');
 assert.equal(await page.locator('#btn-photo108').isHidden(),true,
   'Platform A must not expose B photo108 shortcut');
 assert.equal(await page.locator('#btn-photo109').isHidden(),true,
   'Platform A must not expose B photo109 shortcut');
 assert.equal(await page.locator('#btn-control-cabinet').isHidden(),true,
   'Platform A must not expose the B control-cabinet inspection shortcut');
 assert.equal(await page.locator('#b-photo-profile').isHidden(),true);
 assert.equal(await page.locator('#btn-a-working-pose').getAttribute('aria-pressed'),'true');
 // V133: the added A21 mount must be an actual grounded support chain,
 // and LED/heater/temperature cable routes must not merge into one tube.
 // V135: inspect real geometry parts, not a blue dot painted onto a solid.
 const thermalA=await page.evaluate(()=>window.__modelAThermalFunctionalProbe?.());
 assert.equal(thermalA?.available,true,'A07 functional thermal/vacuum structure not rendered');
 assert.equal(thermalA.realTopBoreCount,1);
 // V136 user-confirmed topology, verified from ACTUAL Three.js scene
 // parts, not hard-coded product-list text or a drawing caption.
 assert.equal(thermalA.woodInsulationSeparatePart,true);
 assert.equal(thermalA.woodConfirmedMaterial,'wood');
 assert.equal(thermalA.darkLowerSupportSeparatePart,true);
 assert.equal(thermalA.vacuumDuctFixedInMetal,true);
 assert.equal(thermalA.rigidVacuumDuctPartId,'A07');
 assert.equal(thermalA.fixedInnerDuctCount,1);
 assert.deepEqual(thermalA.innerDuctLocalPosition,[0,23,0]);
 assert.deepEqual(thermalA.strataExplodeOffsetsMm,{
   lower:0,wood:18,heater:34,sensor:38,metal:68,suctionFitting:68,sample:92
 });
 // All assembled levels must meet the true wood/metal sandwich.
 const heights=thermalA.strataMeshWorldHeights;
 assert(Math.abs(heights.A32[1]-heights.A31[0])<.01,
   'Wood must physically rest on the separate black support');
 assert(heights.A26[0]>heights.A31[1],
   'Heater must be above wood, not inside wooden or lower layer');
 assert(heights.A27[0]>=heights.A26[1],
   'Temperature tip must remain between heater surface and upper metal');
 assert.equal(thermalA.heaterElementCount,1);
 assert.equal(thermalA.heaterTerminalCount,2);
 assert.equal(thermalA.sensorJunctionCount,1);
 assert.equal(thermalA.hollowFittingCount,1);
 assert.equal(thermalA.hoseMeshCount,2);
 assert.deepEqual(thermalA.rearElectricalPorts,['heaterA','heaterB','temperature']);
 assert.deepEqual(thermalA.heaterPocketMm,[38.6,38.6,5.4]);
 assert.equal(thermalA.topAboveBoardMm,90);
 assert.equal(thermalA.separateVacuumServicePort,true);
 assert.equal(thermalA.identifiedPumpModel,false);
 assert.equal(thermalA.actualVacuumFunctionalCertification,false);
 assert.equal(await page.locator('#toggle-a-thermal').isHidden(),false,
  'A07 cutaway control must be available in A only');
  const controlA0=await page.evaluate(()=>window.__modelAControlInterfaceProbe?.());
 assert.equal(controlA0?.available,true,'V133 A control interface probe absent');
 assert.equal(controlA0.allComponentsPresent,true);
 assert.equal(controlA0.postCount,1);
 assert.equal(controlA0.ringCount,1,'A11 must not duplicate the A21 mounting ring');
 assert.equal(controlA0.carrierLockScrewCount,1,'A21 collar needs a lock screw');
 assert.equal(controlA0.ringRadialClampScrewCount,1,'A21 LED ring needs a clamp screw');
 assert(controlA0.bridgeLugAabbOverlapMm3>10,'A21 bridge and lug cannot merely be tangent');
 assert.equal(controlA0.mountingFootBores,4);
 assert.equal(controlA0.mountingAnchorHeads,4);
 assert.deepEqual(controlA0.mountedSupportWorldXZ,[187.5,-87.5]);
 assert.equal(controlA0.supportFootBoardGapMm,0,'A21 foot must touch the A01 board top');
 assert.equal(controlA0.ledMountConcentricWithLamp,true,'A21 ring must physically wrap the A11 light housing');
 assert.equal(controlA0.ledDriverPortDistanceMm,1,'LED cable must engage A12 rear connector envelope');
 assert.equal(controlA0.sensorPortDistanceMm,0,'A24 must terminate at the A25 service port');
 assert.deepEqual(controlA0.heaterPortDistancesMm,[2,2],
   'Both heater leads must reach real modelled A13 service socket envelopes');
 assert.deepEqual(controlA0.sampleRearPortStartDistancesMm,[1.5,1.5,1.5],
   'Three A07 cable starts must coincide with their rear strain reliefs');
 for(const role of ['led','heaterA','heaterB','temperature']){
   assert(controlA0.routeMeshEndpoints[role],
     'Cable mesh must expose its ACTUAL tube-curve endpoints for '+role);
 }
 assert.deepEqual(controlA0.routeMeshEndpoints.led.end,controlA0.routeEndpoints.ledDriver);
 assert.deepEqual(controlA0.routeMeshEndpoints.heaterA.start,controlA0.routeEndpoints.heaterFirst);
 assert.deepEqual(controlA0.routeMeshEndpoints.heaterB.start,controlA0.routeEndpoints.heaterSecond);
 assert.deepEqual(controlA0.routeMeshEndpoints.temperature.start,controlA0.routeEndpoints.temperatureProbe);
 assert.equal(controlA0.ringLiftMm,18,'A21 upper ring must follow optical parking');
 assert.deepEqual(controlA0.a07RearServiceRoles,['heaterA','heaterB','temperature']);
 assert.equal(controlA0.driverLEDPort,true);
 assert.equal(controlA0.sensorFeedbackPort,true);
 assert.deepEqual(controlA0.harnessRoles,{
   A22:['led'],A23:['heaterA','heaterB'],A24:['temperature']});
 assert.equal(controlA0.routeQa.ledEndsAtDriverSocket,true);
 assert.equal(controlA0.routeQa.fullElectricalAcceptance,false,
   'Do not claim actual heater/controller pinout without photo evidence');
 assert.equal(controlA0.temperatureControllerIdentified,false);
 // The heater and sensor start points follow sample X while their
 // service ends remain fixed. LED's separate optic lift is independent.
 await page.locator('#sample-move').evaluate(el=>{
   el.value='4';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 const controlAMove=await page.evaluate(()=>window.__modelAControlInterfaceProbe?.());
 assert.equal(controlAMove.routeEndpoints.heaterFirst[0]-controlA0.routeEndpoints.heaterFirst[0],4);
 assert.equal(controlAMove.routeEndpoints.temperatureProbe[0]-controlA0.routeEndpoints.temperatureProbe[0],4);
 assert.equal(controlAMove.routeMeshEndpoints.heaterA.start[0]-
   controlA0.routeMeshEndpoints.heaterA.start[0],4,
   'ACTUAL rendered heater cable mesh must move with the sample');
 assert.equal(controlAMove.routeMeshEndpoints.temperature.start[0]-
   controlA0.routeMeshEndpoints.temperature.start[0],4,
   'ACTUAL rendered temperature cable mesh must move with the sample');
 assert.deepEqual(controlAMove.routeMeshEndpoints.led.end,controlA0.routeMeshEndpoints.led.end);
 assert.deepEqual(controlAMove.routeEndpoints.heaterRelayEnvelope,
   controlA0.routeEndpoints.heaterRelayEnvelope);
 assert.deepEqual(controlAMove.routeEndpoints.ledDriver,controlA0.routeEndpoints.ledDriver);
 await page.locator('#sample-move').evaluate(el=>{
   el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 assert.equal(await page.locator('#btn-a-working-pose').isHidden(),true,
   'Internal A pose control must stay hidden from the user UI');
 const installedTruth=await page.evaluate(()=>window.__platformAPhotoTruthProbe?.());
 assert.equal(installedTruth?.photoMode,false);
 assert.equal(installedTruth.filmBranchInstalledYawDeg,180,
   'Complete film branch must be yawed 180°, not only the end bracket');
 assert.equal(installedTruth.transferFacingInstalledPose,true);
 assert.equal(installedTruth.bracketMirroredFromPhoto,false,
   'V79 must preserve one physical bracket definition and rotate the rigid chain');
 assert.equal(installedTruth.fabricatedClampVisible,true);
 assert.equal(installedTruth.unphotographedGlassVisible,true,
   'Glass is a required transfer component even when transparent in the reference photo');
 assert.equal(installedTruth.actualClampManufacturerConfirmed,false);
 const installedClamp=await page.evaluate(()=>window.__platformABareClampProbe?.());
 assert.equal(installedClamp?.available,true);
 assert.equal(installedClamp.visibleGlass,true);
 assert.equal(installedClamp.visibleClamp,true);
 assert.equal(installedClamp.visibleWingScrewCount,2);
 assert.equal(installedClamp.visibleWingEarCount,4);
 assert.equal(installedClamp.wingEarTiltDegCandidate,33.2);
 assert.equal(installedClamp.shaftCount,2);
 assert.equal(installedClamp.actualFootBores,2,
   'Photo 5 requires two real vertical wing-screw bores in the folded foot');
 assert.equal(installedClamp.screwAxesVertical,true);
 assert.equal(installedClamp.screwPairLineParallelGlassShortEdge,true);
 assert.equal(installedClamp.screwPitchAcrossGlassShortEdgeMm,13);
 assert.equal(installedClamp.screwBladeEngaged,true);
 assert.equal(installedClamp.screwGlassOverlapMm3,0);
 assert.equal(installedClamp.photo5VerticalWingScrewTopologyApplied,true);
 assert.equal(installedClamp.glassUpperFootGapMm,0);
 assert.equal(installedClamp.glassLowerBladeGapMm,0);
 assert.equal(installedClamp.installedYawDeg,180);
 assert.equal(installedClamp.stampToSampleCenterXmm,0,
   'Rigid 180° installation must place PDMS over A07 sample centre');
 assert.equal(installedClamp.actualWingNutOEMVerified,false);
 assert.equal(await page.locator('#film-drop').isEnabled(),true,
   'Installed A with required glass/PDMS must expose geometry-only VC13 descent');
 // Capture evidence-view geometry after real THREE.js frames, not mock images.
 // Views are approximate camera orientations, NOT pixel-registered metrology.
 const photoShot=async(filename,buttonId)=>{
   await page.locator(buttonId).evaluate(el=>el.click());
   await page.waitForTimeout(220);
   const box=await page.locator('#viewer').boundingBox();
   assert(box&&box.width>=300&&box.height>=300);
   await page.screenshot({path:filename,
     clip:{x:box.x,y:box.y,width:box.width,height:box.height},
     animations:'disabled',timeout:30000});
 };
 // V136: inspect the literal explosion order and capture a real 3D view.
 await page.locator('#explode').evaluate(el=>{
   el.value='100';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 const explodedA=await page.evaluate(()=>window.__modelAThermalFunctionalProbe?.());
 const ex=explodedA.strataMeshWorldHeights;
 assert(ex.A32[1]<ex.A31[0]&&ex.A31[1]<ex.A26[0]&&
   ex.A26[1]<ex.A27[0]&&ex.A27[1]<ex.A07[0],
   'V136 exploded order must be lower→wood→heater→probe→metal');
 assert.equal(explodedA.currentExplodePercent,100);
 assert.deepEqual(explodedA.innerDuctLocalPosition,thermalA.innerDuctLocalPosition,
   'Internal vacuum duct is fixed in upper metal and cannot move independently');
 assert.equal(explodedA.externalHoseVisible,false,
   'Flexible external hose should not stretch through an exploded assembly');
 await photoShot('Transfer-Station-A-V136-Wood-Heater-Metal-Exploded.png','#btn-sample-stack');
 await page.locator('#explode').evaluate(el=>{
   el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 assert.equal((await page.evaluate(()=>window.__modelAThermalFunctionalProbe?.())).currentExplodePercent,0);
 await photoShot('Transfer-Station-A-V137-XY-Rotary-Lock.png','#btn-sample-stack');
 await photoShot('Transfer-Station-A-V133-Control-Routes.png','#btn-iso');
 await page.locator('#toggle-a-thermal').evaluate(el=>el.click());
 assert.equal((await page.evaluate(()=>window.__modelAThermalFunctionalProbe?.())).cutawayEnabled,true);
 await photoShot('Transfer-Station-A-V135-Heater-Cutaway.png','#btn-sample-stack');
 await page.locator('#toggle-a-thermal').evaluate(el=>el.click());
 assert.equal((await page.evaluate(()=>window.__modelAThermalFunctionalProbe?.())).cutawayEnabled,false);
  await photoShot('Transfer-Station-A-Photo191-Overview.png','#btn-iso');
 await photoShot('Transfer-Station-A-Photo192-Side.png','#btn-rear');
 await photoShot('Transfer-Station-A-Photo193-Front.png','#btn-front');
 await photoShot('Transfer-Station-A-Photo194-FilmUpper.png','#btn-photo94');
 await photoShot('Transfer-Station-A-Photo195-FilmLower.png','#btn-photo97');
 await photoShot('Transfer-Station-A-Photo196-G40.png','#btn-photo196');
 // V95: dedicated closeups are mandatory because general photo views can
 // crop the exact component being modified.
 assert.equal(await page.evaluate(()=>window.__focusA05MovingAudit?.()),true);
 await page.waitForTimeout(220);
 const a05Moving=await page.evaluate(()=>window.__A05MovingCloseupProbe?.());
 console.log('V117 A05 moving-side closeup QA:',JSON.stringify(a05Moving));
 assert.equal(a05Moving?.available,true);
 assert.equal(a05Moving.mode,'moving');
 assert.equal(a05Moving.selectedVisibilityScore,3,
   'Clamp audit must directly expose the lower clamp blade and both screw heads');
 assert.equal(a05Moving.pressureRay.clear,true);
 assert.equal(a05Moving.pressureRay.firstPart,'A05C');
 assert(a05Moving.screwHeadRays.every(x=>x.clear));
 assert(a05Moving.screwHeadRays.every(x=>x.firstPart==='A05CS'));
 assert(Math.abs(a05Moving.projection.centerX)<.25&&Math.abs(a05Moving.projection.centerY)<.25);
 {
   const box=await page.locator('#viewer').boundingBox();assert(box);
   await page.screenshot({path:'Transfer-Station-A-V117-A05-Moving-Clamp-Closeup.png',
     clip:{x:box.x,y:box.y,width:box.width,height:box.height},
     animations:'disabled',timeout:30000});
 }

 assert.equal(await page.evaluate(()=>window.__focusA05FixedAudit?.()),true);
 await page.waitForTimeout(220);
 const a05Fixed=await page.evaluate(()=>window.__A05FixedCloseupProbe?.());
 console.log('V117 A05 fixed-side closeup QA:',JSON.stringify(a05Fixed));
 assert.equal(a05Fixed?.available,true);
 assert.equal(a05Fixed.mode,'fixed');
 assert.equal(a05Fixed.selectedVisibilityScore,2,
   'Upper-clamp audit must directly expose the folded foot and installed glass edge');
 assert.equal(a05Fixed.fixedJawRay.clear,true);
 assert.equal(a05Fixed.fixedJawRay.firstPart,'A05');
 assert.equal(a05Fixed.glassEdgeRay.clear,true);
 assert.equal(a05Fixed.glassEdgeRay.firstPart,'A05G');
 assert(Math.abs(a05Fixed.projection.centerX)<.25&&Math.abs(a05Fixed.projection.centerY)<.25);
 {
   const box=await page.locator('#viewer').boundingBox();assert(box);
   await page.screenshot({path:'Transfer-Station-A-V117-A05-Fixed-Jaw-Closeup.png',
     clip:{x:box.x,y:box.y,width:box.width,height:box.height},
     animations:'disabled',timeout:30000});
 }
 assert.equal(await page.evaluate(()=>window.__focusA11NoGhostAudit?.()),true);
 await page.waitForTimeout(180);
 const a11Ghost=await page.evaluate(()=>window.__A11NoGhostCloseupProbe?.());
 console.log('V132 A11 no-ghost closeup QA:',JSON.stringify(a11Ghost));
 assert.equal(a11Ghost?.available,true);
 assert.equal(a11Ghost.noDuplicateDecorativeEmitterDiscs,true);
 assert.equal(a11Ghost.floatingDecorativeDiscCount,0);
 assert.equal(a11Ghost.selectedVisibilityScore,2,
   'A11 closeup must expose the real MWWHL4 body and its electrical lead with no floating decorative discs');
 assert.equal(a11Ghost.bodyVisible,true);
 assert.equal(a11Ghost.cableVisible,true);
 assert(Math.abs(a11Ghost.projection.centerX)<.28&&Math.abs(a11Ghost.projection.centerY)<.28);
 {
   const box=await page.locator('#viewer').boundingBox();assert(box);
   await page.screenshot({path:'Transfer-Station-A-V132-A11-No-Ghost-Closeup.png',
     clip:{x:box.x,y:box.y,width:box.width,height:box.height},
     animations:'disabled',timeout:30000});
 }

 assert.equal(await page.evaluate(()=>window.__focusA15NoGhostAudit?.()),true);
 await page.waitForTimeout(180);
 const a15Ghost=await page.evaluate(()=>window.__A15NoGhostCloseupProbe?.());
 console.log('V132 A15 no-ghost closeup QA:',JSON.stringify(a15Ghost));
 assert.equal(a15Ghost?.available,true);
 assert.equal(a15Ghost.handleCount,2);
 assert.equal(a15Ghost.stemCount,2);
 assert.equal(a15Ghost.collarCount,2);
 assert.equal(a15Ghost.supportCount,2);
 assert.deepEqual(a15Ghost.handleAxes,['X','depth']);
 assert.equal(a15Ghost.noDuplicateDecorativeStageActuators,true);
 assert.equal(a15Ghost.actuatorChainsContinuous,true,
   'A15 must retain two continuous support-spindle-collar-drum chains');
 assert.equal(a15Ghost.visibleHandleCount,2);
 assert.equal(a15Ghost.selectedVisibilityScore,2,
   'A15 closeup must show both real orthogonal micrometer drums and no detached third knob');
 assert(Math.abs(a15Ghost.projection.centerX)<.28&&Math.abs(a15Ghost.projection.centerY)<.28);
 {
   const box=await page.locator('#viewer').boundingBox();assert(box);
   await page.screenshot({path:'Transfer-Station-A-V132-A15-No-Ghost-Closeup.png',
     clip:{x:box.x,y:box.y,width:box.width,height:box.height},
     animations:'disabled',timeout:30000});
 }

 assert.equal(await page.evaluate(()=>window.__focusAFilmWorkingAudit?.()),true);
 await page.waitForTimeout(180);
 const aFilmWorking=await page.evaluate(()=>window.__AFilmWorkingCloseupProbe?.());
 console.log('V132 A working film-stack closeup QA:',JSON.stringify(aFilmWorking));
 assert.equal(aFilmWorking?.available,true);
 assert.equal(aFilmWorking.mode,'working');
 assert.equal(aFilmWorking.upperDriveLocalDirection,'+X');
 assert.equal(aFilmWorking.lowerDriveLocalDirection,'-X');
 assert.equal(aFilmWorking.oldFrontFacingDepthDriveRejected,true);
 assert.equal(aFilmWorking.knobsOnOppositeSides,true,
   'Working Platform A must show upper/lower angular micrometers on opposite sides');
 assert(aFilmWorking.upperKnobNdcX<0&&aFilmWorking.lowerKnobNdcX>0,
   'Working front view must keep upper G40 knob left and lower goniometer knob right');
 assert.equal(aFilmWorking.A15HandleCount,2);
 assert.deepEqual(aFilmWorking.A15HandleAxes,['X','depth']);
 assert.equal(aFilmWorking.A15DuplicateDecorativeActuators,true);
 assert(Math.abs(aFilmWorking.projection.centerX)<.28&&Math.abs(aFilmWorking.projection.centerY)<.28);
 {
   const box=await page.locator('#viewer').boundingBox();assert(box);
   await page.screenshot({path:'Transfer-Station-A-V132-Film-Stack-Working-Closeup.png',
     clip:{x:box.x,y:box.y,width:box.width,height:box.height},
     animations:'disabled',timeout:30000});
 }

  assert.equal(await page.evaluate(()=>window.__focusA17FrontAudit?.()),true);
 await page.waitForTimeout(220);
 const a17View=await page.evaluate(()=>window.__A17CloseupProbe?.());
 console.log('V96 A17 dedicated closeup QA:',JSON.stringify(a17View));
 assert.equal(a17View?.available,true);
 assert(Math.abs(a17View.projection.centerX)<.28&&Math.abs(a17View.projection.centerY)<.28,
   'A17 front must actually be centered in its dedicated audit frame');
 assert(a17View.projection.width>.30&&a17View.projection.height>.18,
   'A17 magnetic base must occupy a meaningful fraction of the audit frame');
 assert.equal(a17View.plaqueRay.clear,true,'A17 front plaque must not be hidden by the T25M handle');
 assert.equal(a17View.switchRay.clear,true,'A17 silver switch must not be hidden by the T25M handle');
 {
   const box=await page.locator('#viewer').boundingBox();assert(box);
   await page.screenshot({path:'Transfer-Station-A-V96-A17-Front-Closeup.png',
     clip:{x:box.x,y:box.y,width:box.width,height:box.height},
     animations:'disabled',timeout:30000});
 }
 assert.equal(await page.evaluate(()=>window.__focusA18OpticalAudit?.()),true);
 await page.waitForTimeout(220);
 const a18Optical=await page.evaluate(()=>window.__A18OpticalCloseupProbe?.());
 console.log('V106 A18 optical closeup QA:',JSON.stringify(a18Optical));
 assert.equal(a18Optical?.available,true);
 assert.equal(a18Optical.mode,'optical');
 assert.equal(a18Optical.selectedVisibilityScore,4,
   'A18 optical audit must find one view with body, both coarse wheels and A19 turret all directly visible');
 assert(Math.abs(a18Optical.projection.centerX)<.28&&Math.abs(a18Optical.projection.centerY)<.28,
   'A18/A19 optical chain must be centered in its dedicated optical audit frame');
 assert(a18Optical.projection.width>.30&&a18Optical.projection.height>.28,
   'A18/A19 optical chain must occupy a meaningful fraction of the audit frame');
 assert(a18Optical.projection.width<1.65&&a18Optical.projection.height<1.65,
   'A18 optical audit must fit the complete target instead of cropping it off-screen');
 assert(a18Optical.fitScale>=1,'A18 audit framing scale must be reported');
 assert.equal(a18Optical.bodyRay.clear,true);
 assert.equal(a18Optical.leftCoarseRay.clear,true);
 assert.equal(a18Optical.rightCoarseRay.clear,true);
 assert.equal(a18Optical.turretRay.clear,true,
   'A19 turret must be directly inspectable in the lower/front optical audit view');
 assert.equal(a18Optical.A11IsSeparatePart,true,
   'MWWHL4 illumination head must remain explicitly separate from A18 focus controls');
 assert.equal(a18Optical.A11OEMHousingLengthMm,60.1);
 assert.equal(a18Optical.A11OEMHousingDiameterMm,30.5);
 assert.equal(a18Optical.A18FocusControlCount,4,
   'A18 focus controls are two coarse + two fine knobs; A11 must never be counted as one');
 {
   const box=await page.locator('#viewer').boundingBox();assert(box);
   await page.screenshot({path:'Transfer-Station-A-V106-A18-Optical-Closeup.png',
     clip:{x:box.x,y:box.y,width:box.width,height:box.height},
     animations:'disabled',timeout:30000});
 }
 assert.equal(await page.evaluate(()=>window.__focusA18SupportAudit?.()),true);
 await page.waitForTimeout(220);
 const a18Support=await page.evaluate(()=>window.__A18SupportCloseupProbe?.());
 console.log('V106 A18 support closeup QA:',JSON.stringify(a18Support));
 assert.equal(a18Support?.available,true);
 assert.equal(a18Support.mode,'support');
 assert.equal(a18Support.selectedVisibilityScore,2,
   'A18 support audit must find one rear/oblique view with both A18 housing and A10 boom directly visible');
 assert(Math.abs(a18Support.projection.centerX)<.30&&Math.abs(a18Support.projection.centerY)<.30,
   'A18/A10 support pair must be centered in its dedicated support audit frame');
 assert(a18Support.projection.width>.22&&a18Support.projection.height>.18,
   'A18/A10 support pair must occupy a meaningful fraction of the audit frame');
 assert.equal(a18Support.bodyRay.clear,true);
 assert.equal(a18Support.supportBoomRay.clear,true,
   'A10-to-A18 support boom must be directly inspectable from the rear/oblique audit view');
 assert(a18Support.supportBoomRay.sample,
   'Support audit must report which exposed A10 surface was actually visible');
 assert.equal(a18Support.supportBoomRay.firstPart,'A10',
   'The first opaque hit for the exposed support surface must remain A10 itself');
 assert.equal(a18Support.A11IsSeparatePart,true);
 assert.equal(a18Support.A18FocusControlCount,4);
 {
   const box=await page.locator('#viewer').boundingBox();assert(box);
   await page.screenshot({path:'Transfer-Station-A-V106-A18-Support-Closeup.png',
     clip:{x:box.x,y:box.y,width:box.width,height:box.height},
     animations:'disabled',timeout:30000});
 }
 // V111 hidden MGZ30-family topology study: compare a direct-post-clamp
 // architecture without changing the installed/photo-fit default.
 assert.equal(await page.evaluate(()=>window.__focusA18MGZ30FamilyStudy?.()),true);
 await page.waitForTimeout(220);
 const mgzStudy=await page.evaluate(()=>window.__A18MGZ30FamilyStudyProbe?.());
 console.log('V111 A18 MGZ30-family topology study:',JSON.stringify(mgzStudy));
 assert.equal(mgzStudy?.available,true);
 assert.equal(mgzStudy.studyVisible,true);
 assert.equal(mgzStudy.installedByDefault,false,
   'MGZ30 family study must never silently replace the installed photo-fit geometry');
 assert.equal(mgzStudy.exactVendorGeometry,false);
 assert.equal(mgzStudy.photoFitMainBodyEnvelopeRetained,true);
 assert.equal(mgzStudy.vendorDirectPostDiameterMm,38.1);
 assert.equal(mgzStudy.currentScenePostDiameterMm,26);
 assert.equal(mgzStudy.postDiameterConflictMm,12.1,
   'The vendor Ø38.1mm post requirement must remain visibly incompatible with the unmeasured Ø26 scene post');
 assert.equal(mgzStudy.ringCenterToCurrentPostCenterXZmm,0);
 assert.equal(mgzStudy.bodyBridgeAabbConnected,true);
 assert.equal(mgzStudy.bridgeRingAabbConnected,true);
 assert.equal(mgzStudy.currentSeparateBoomVisible,false,
   'Study mode must replace, not double-count, the current separate A10 boom');
 assert.equal(mgzStudy.currentPhotoFitBodyVisible,false);
 assert(Math.abs(mgzStudy.projection.centerX)<.35&&Math.abs(mgzStudy.projection.centerY)<.35);
 {
   const box=await page.locator('#viewer').boundingBox();assert(box);
   await page.screenshot({path:'Transfer-Station-A-V111-MGZ30-Family-Topology-Study.png',
     clip:{x:box.x,y:box.y,width:box.width,height:box.height},
     animations:'disabled',timeout:30000});
 }
 assert.equal(await page.evaluate(()=>window.__setA18MGZ30FamilyStudy?.(false)),true);
 const mgzRestored=await page.evaluate(()=>window.__A18MGZ30FamilyStudyProbe?.());
 assert.equal(mgzRestored.studyVisible,false);
 assert.equal(mgzRestored.currentSeparateBoomVisible,true);
 assert.equal(mgzRestored.currentPhotoFitBodyVisible,true);

 // V130: user establishes photo 1 as the canonical installed orientation.
 // Photos 2 and 3 are views captured after rotating the mechanism; they are
 // side-topology evidence and must not be used to flip/mirror the physical model.
 await photoShot('Transfer-Station-A-20261108-MonitorFront.png','#btn-a-photo-monitor-front');
 const f1=await page.evaluate(()=>window.__a20261108PhotoViewProbe?.());
 assert.equal(f1?.available,true,'Photo 1 canonical viewing command failed');
 assert.equal(f1.mode,'monitorBehind');
 assert.equal(f1.evidenceRole,'canonical-orientation-anchor');
 assert.equal(f1.sourceHardwareRotated,false);
 assert.equal(f1.photoConstraints.canonicalOrientationSource,'photo-1');
 assert.equal(f1.photoConstraints.photo1DefinesInstalledHandedness,true);
 assert.equal(f1.photoConstraints.canonicalInstalledYawDeg,180);
 assert.equal(f1.photoConstraints.photoReferenceAndWorkingOrientationMustMatch,true);
 assert(f1.actualA04XKnobRelativeNdc<0,
   'Photo1 canonical front: upper G40 micrometer must project to screen-left as in the user photo');
 assert(f1.actualA04LowerOppositeXKnobRelativeNdc>0,
   'Lower angular micrometer must project to the opposite side, not appear end-on as a front circular knob');
 assert.equal(f1.lowerG40DriveDirection,'-X');
 assert.equal(f1.oldFrontFacingDepthDriveRejected,true);
 assert.equal(f1.cameraFittedToActualLensAndMonitor,false);
 for(const x of [
   f1.actualA15XKnobRelativeNdc,f1.actualA15ZKnobRelativeNdc,
   f1.actualA04XKnobRelativeNdc,f1.actualA04LowerOppositeXKnobRelativeNdc,
   f1.actualA05LegRelativeNdc
 ]) assert(Number.isFinite(x),'Photo1 projected model datum must be finite');
 const count=f1.scenePartCount;

 await photoShot('Transfer-Station-A-20261108-MonitorLeft.png','#btn-a-photo-monitor-side');
 const f2=await page.evaluate(()=>window.__a20261108PhotoViewProbe?.());
 assert.equal(f2?.available,true,'Photo 2 rotated-side viewing command failed');
 assert.equal(f2.mode,'monitorLeft');
 assert.equal(f2.evidenceRole,'rotated-side-topology-only');
 assert.equal(f2.sourceHardwareRotated,true);
 assert.equal(f2.photoConstraints.photo2HardwareRotatedForSideView,true);
 assert.equal(f2.photoConstraints.sideViewsMayConstrainTopologyButNotCanonicalScreenDirection,true);
 assert.equal(f2.photoConstraints.sideHardwareYawExactlyVerified,false);
 assert(f2.actualA04XKnobRelativeNdc>0,
   'Photo2 rotated side: upper G40 micrometer must project to screen-right');
 assert.equal(f2.scenePartCount,count,'Photo2 evidence view must not replace model geometry');

 await photoShot('Transfer-Station-A-20261108-MonitorRight.png','#btn-a-photo-monitor-opposite');
 const f3=await page.evaluate(()=>window.__a20261108PhotoViewProbe?.());
 assert.equal(f3?.available,true,'Photo 3 rotated-side viewing command failed');
 assert.equal(f3.mode,'monitorRight');
 assert.equal(f3.evidenceRole,'rotated-side-topology-only');
 assert.equal(f3.sourceHardwareRotated,true);
 assert.equal(f3.photoConstraints.photo3HardwareRotatedForSideView,true);
 assert.equal(f3.photoConstraints.sideViewsMayConstrainTopologyButNotCanonicalScreenDirection,true);
 assert(f3.actualA04XKnobRelativeNdc>0,
   'Photo3 rotated side: upper G40 micrometer must project to screen-right');
 assert.equal(f3.scenePartCount,count,'Photo3 evidence view must not replace model geometry');
 assert.notDeepEqual(f2.cameraWorldPosition,f3.cameraWorldPosition,
   'Photo2 and photo3 side evidence must use distinct inspection viewpoints');
 // Switch explicitly to hypothesis only for the EXISTING transfer tests.
 await page.locator('#btn-a-working-pose').evaluate(el=>el.click());
 assert.equal(await page.locator('#btn-a-working-pose').getAttribute('aria-pressed'),'true');
 assert.equal(await page.locator('#film-drop').isEnabled(),true,
   'Only explicitly selected transfer hypothesis may run the kinematic preview');
 const finiteA=await page.evaluate(()=>window.__sceneFiniteGeometryProbe?.());
 assert.equal(finiteA.available,true);
 assert.equal(finiteA.invalidMeshes,0,'Rotary A tick meshes must not have NaN positions');
 assert.equal(finiteA.tickCount,180);
 assert(finiteA.minRadiusMm>31&&finiteA.maxRadiusMm<32.1);
 const detailsA=await page.evaluate(()=>window.__platformADetailTopologyProbe?.());
 assert.equal(detailsA.available,true);
 assert.equal(detailsA.ghostVerticalKnurlGroups,0,'A03 must not contain floating second micrometer');
 assert.equal(detailsA.duplicateGoniometerKnurlGroups,0,'A04 must not contain duplicated shaft');
 assert.deepEqual(detailsA.nominalTubeCollarHeightsMm,[2,12,20]);
 assert.equal(detailsA.verticalNameplateMounted,true);
 const aDefault=await page.evaluate(()=>window.__platformAWorkingPoseProbe?.());
 assert.equal(aDefault.mode,'installed180');
 assert.equal(aDefault.a15Vc13CatalogReferenceHeightMm,126);
 assert.equal(aDefault.a15Vc13LowerPoseHeightMm,119.5);
 assert.equal(aDefault.a15Vc13InstalledOrderMatchesGCM901602,false);
 assert(Math.abs(aDefault.bracketVerticalLegMm-85.3)<1e-6,'V137 derived bracket leg within geometric tolerance');
 const angled=await page.evaluate(()=>window.__modelAObjectiveOrientationProbe?.());
 assert.equal(angled.available,true,'A19 independent objective pivots must be visible');
 assert.equal(angled.independentObjectivePivots,true);
 assert.equal(angled.left.axisTiltDeg,-22.5,
   'Photo191-193 outboard objective must NOT be parallel to central barrel');
 assert.equal(angled.center.axisTiltDeg,0);
 assert.equal(angled.left.barrelAndLensSamePivot,true);
 assert.equal(angled.center.barrelAndLensSamePivot,true);
 assert.equal(angled.actualTurretIndexAnglesVerified,false);
 const aFrame=await page.evaluate(()=>window.__platformAFramingProbe?.());
 assert.equal(aFrame.available,true,'A full-system optical view probe missing');
 assert.equal(aFrame.topVisible,true,'A camera and optical cable clipped from default ISO view');
 assert.equal(aFrame.boardVisible,true,'A main breadboard clipped from default ISO view');
 assert(aFrame.topWorldYmm>=390,'A optical/camera cable top is missing from the scene');
 assert.equal(aDefault.actualStagePosePhotoRegistered,false);
 assert.equal(aDefault.A05CClampSkuVerified,false);
 assert.equal(aDefault.footprintGapMm,50.25);
 assert.equal(aDefault.stampCenterX,78);
 assert.equal(aDefault.stampCenterZ,0);
 assert.equal(aDefault.initialVerticalStampGapMm,13);
 assert.equal(aDefault.opticalParkingLiftMm,18);
 assert.equal(aDefault.opticalParkingMechanismVerified,false);
 assert.equal(aDefault.clampHeaterClearanceMm,7.5);
 const opticsRaised=await page.evaluate(()=>window.__modelAOpticalClearanceProbe?.());
 assert.equal(opticsRaised?.available,true);
 assert.equal(opticsRaised.coherentOpticOffsets,true,
   'A18/A19/A08/A09/A14/A20 and A10 sliding BOOM must move together');
 assert.equal(opticsRaised.supportBoomMovesWhilePostFixed,true,
   'Optics follow raised support bracket, while A10 breadboard post/foot stay fixed');
 assert.equal(opticsRaised.supportBoomRealPostBore,true,
   'A10 boom must have actual through-bore clearing the fixed microscope post');
 assert.equal(opticsRaised.supportBoomNearbySolidMetal,true,
   'Boom must retain metal around the candidate Ø26.6 post-bore');
  assert.equal(opticsRaised.boomLengthCandidateMm,86);
  assert.equal(opticsRaised.boomHousingFrontGapMm,0,
    'A10 boom must meet the A18 rear mounting face, not float');
  assert.equal(opticsRaised.boomHousingOverlapMm3,0,
    'A10 boom must not enter the solid A18 microscope housing');
  assert(opticsRaised.boomHousingMatingFaceAreaMm2>=800,
    'A10 joint must be a physical face, not a zero-area contact');
 assert.equal(opticsRaised.supportBoomCandidatePostBoreDiameterMm,26.6);
 assert.equal(opticsRaised.actualParkingLiftMm,18);
 assert.equal(opticsRaised.opticPartIds.length,7);
 assert.equal(opticsRaised.currentBroadphaseCollisions.length,0,
   'Raised glass must not intersect either parked microscope objective');
 assert.equal(opticsRaised.planarOverlapExists,true,
   'The optical collision test must not pass by moving objectives sideways');
 assert(opticsRaised.verticalGapMm>3,
   'Raised slide needs conservative positive clearance to objective nose');
 assert(opticsRaised.withoutParkingGapMm<0,
   'QA must expose historic unparked optics/glass conflict');
 assert.equal(opticsRaised.OEMFocusStrokeVerified,false);
 assert.equal(opticsRaised.physicalCollisionCertification,false);
 const aContactBefore=await page.evaluate(()=>window.__modelAContactProbe?.());
 assert.equal(aContactBefore?.available,true);
 assert.equal(aContactBefore.clampOutsideHeater,true);
 assert.equal(aContactBefore.installedClampBoundsExcludeHiddenStudy,true);
 assert(aContactBefore.clampToHeaterEdgeMm>7&&aContactBefore.clampToHeaterEdgeMm<9,
   'Installed 28mm clamp should retain the nominal ~7–8mm X clearance to A07');
 assert(aContactBefore.hiddenStudyInflationXmm>15,
   'Hidden 60mm GCM-1302M study should be demonstrably larger than the installed photo-fit clamp');
 assert(aContactBefore.clampToHeaterEdgeIncludingHiddenStudyMm<0,
   'Diagnostic full-subtree bounds should expose why the old collision test falsely failed');
 assert.equal(aContactBefore.stampFullyInsideChipXY,true);
 assert.equal(aContactBefore.stampRightInsetMm,4);
 assert.equal(aContactBefore.sampleChipTopWorldYmm,111.4);
 assert.equal(aContactBefore.pdmsToChipGapMm,13);
  // V130: photo-5 vertical clamp chain must be mechanically coherent.
  const aClampChain=await page.evaluate(()=>window.__modelAClampChainProbe?.());
  assert.equal(aClampChain?.available,true,'A05 photo-5 clamp mesh chain probe absent');
  assert.equal(aClampChain.pose,'installed180');
  assert.equal(aClampChain.clampRendered,true);
  assert.equal(aClampChain.glassRendered,true);
  assert.equal(aClampChain.glassUpperFootGapMm,0);
  assert.equal(aClampChain.glassLowerBladeGapMm,0);
  assert(aClampChain.screwBladeOverlapMm3>0);
  assert.equal(aClampChain.screwGlassOverlapMm3,0);
  assert.equal(aClampChain.screwAxis,'scene-Y / vertical');
  assert.equal(aClampChain.screwPairLine,'scene-Z / glass short edge');
  assert.equal(aClampChain.screwPitchAcrossGlassShortEdgeMm,13);
  assert.equal(aClampChain.installedFilmBranchYawDeg,180);
  assert.equal(aClampChain.stampToSampleCenterXmm,0);
  assert.equal(aClampChain.stampToSampleCenterZmm,0);
  assert.equal(aClampChain.photoClampGeometricallyCoherent,true);
  assert.equal(aClampChain.physicalTransferAssemblyAccepted,false);
  const clampAgain=await page.evaluate(()=>window.__platformABareClampProbe?.());
  assert.equal(clampAgain.visibleGlass,true);
  assert.equal(clampAgain.visibleClamp,true);
  assert.equal(clampAgain.screwAxesVertical,true);
  assert.equal(clampAgain.screwPairLineParallelGlassShortEdge,true);
 // Screenshot-level checks: previously visible detached or
 // clipping assemblies are tested using actual world-space meshes.
 const dA=await page.evaluate(()=>window.__modelADetailMountProbe?.());
 assert.equal(dA?.available,true,'Missing A detail mount mesh probe');
 assert.equal(dA.pose,'installed180');
 assert.equal(dA.lampOEMDiameterMm,30.5);
 assert.equal(dA.lampOEMLengthMm,60.1);
 assert.equal(dA.lampSM1ThreadDepthMm,6);
 assert.equal(dA.lampCandidateRingPresent,true);
 // V133 single ring relocated to mounted A21 assembly, its real AABB gap
 // differs from the V89 decorative A11 attachment. Avoid pinning an old
 // unattached mesh coordinate as the only acceptable installation.
 assert(dA.lampRingToA18BodyGapMm>=30,
   'Mounted A21 ring must keep clearance from the A18 head');
 assert.equal(dA.lampRingRightFocusOverlapMm3,0,
   'V89 SM1RC-style ring must not occupy right focus-control volume');
 assert.equal(dA.lampBodyRightFocusOverlapMm3,0,
   'V89 MWWHL4 body must not occupy right focus-control volume');
 assert.equal(dA.lampMountingMethodVerified,false,
   'Collision-free placement does not prove the real A11 mounting hardware');
 assert.equal(dA.lampPhotoPlacementOffsetFromOpticalAxisMm,96);
 assert.equal(dA.lampPlacementOffsetMeasured,false);
 assert.equal(dA.lampCollisionFreePlacementCandidate,true);
 assert.equal(dA.lampPlacementShiftFromV87Mm,46);
 assert.equal(dA.lampElectricalCablePresent,true);
 assert.equal(dA.A11NoDuplicateDecorativeEmitterDiscs,true,
   'A11 must not recreate the floating decorative emitter discs from user Fig.2');
 assert.equal(dA.A15NoDuplicateDecorativeStageActuators,true,
   'A15 must not recreate detached decorative micrometer knobs from user Fig.3');
 assert.equal(dA.inventedLampGooseneckPresent,false,
   'Old invented MWWHL4 mechanical gooseneck must stay deleted');
 assert.equal(dA.unsupportedA18HorizontalTubePresent,false,
   'Old unexplained 160mm A18 black horizontal tube must stay deleted');
 assert.equal(dA.A18VendorIdentificationPending,true);
 assert.equal(dA.A18BodySegmentCount,3,
   'A18 must be a stepped photo-constrained body, not one oversized black box');
 assert.equal(dA.A18MaxBodyWidthMm,84);
 assert.equal(dA.A18FocusHubCount,2);
 assert.equal(dA.A18CoarseKnobCount,2);
 assert.equal(dA.A18FineKnobCount,2);
 assert.equal(dA.A18FocusChainsContinuous,true,
   'Both A18 focus controls must form body→hub→coarse→fine continuous chains');
 assert.deepEqual(dA.A18FocusChainGapsMm,{'-1':[0,0,0],'1':[0,0,0]});
 assert.equal(dA.A18PhotoBodyCenterOffsetFromOpticalAxisMm,24);
 assert.equal(dA.A18PhotoBodyCenterOffsetMeasured,false);
 assert.equal(dA.A18BodyCenteredOnOpticalAxis,false);
 assert.equal(dA.A18OpticalAxisLocalXmm,0);
 assert.equal(dA.A18BodyLeftEdgeLocalXmm,-18);
 assert(Math.abs(dA.A18OpticalAxisFractionFromBodyLeft-(18/84))<1e-6,
   'Photo191/193 optical axis must sit near the left fifth of the A18 body, not at center');
 assert.equal(dA.A18ActualBodyToTopOpticalOffsetMm,24,
   'WebGL geometry itself—not only metadata—must offset the A18 body 24mm from top optical axis');
 assert.equal(dA.A18ActualBodyToBottomOpticalOffsetMm,24,
   'Bottom nosepiece interface must remain on optical axis while A18 body is offset');
 assert.equal(dA.A18ActualBodyToTurretOffsetMm,24,
   'A19 turret must stay on optical axis rather than following the housing center');
 assert.equal(dA.A18TopOpticalCenterWorldX,dA.A18BottomOpticalCenterWorldX);
 assert.equal(dA.A18TopOpticalCenterWorldX,dA.A19TurretCenterWorldX);
 assert.equal(dA.A18MGZ30CandidateOnly,true,
   'MGZ30 remains topology comparison only; no auto-identification');
 assert.equal(dA.A18MGZ30VendorTravelMm,30);
 assert.equal(dA.A18MGZ30VendorPostDiameterMm,38.1);
 assert.equal(dA.A18MGZ30VendorTurretPorts,5);
 assert.equal(dA.A18MGZ30VendorTurretThread,'M26×36 TPI');
 assert.equal(dA.A18MGZ30SupportsSM1SM2,true);
 assert.equal(dA.A18MGZ30GeometryApplied,false,
   'MGZ30 vendor geometry cannot replace the photo-constrained A18 before identity is verified');
 assert.equal(dA.A18MGZ30CandidatePriority,'primary');
 assert.equal(dA.A18MGZ30BlackEnclosedFinishMatch,true);
 assert.equal(dA.A18MGZ30ThorlabsEcosystemMatch,true);
 assert.equal(dA.A18MGZ30VendorDrawingPostDiameterMm,38);
 assert.deepEqual(dA.A18MGZ30VendorDrawingMaxEnvelopeDimensionsSeenMm,[291.7,130,100.2]);
 assert.equal(dA.A18MGZ30VendorDrawingAxisMappingApplied,false);
 assert.equal(dA.A18MGZ30IntegralRearPostClampHousing,true);
 assert.equal(dA.A18MGZ30DirectPostMountNoSeparateBoom,true);
 assert.equal(dA.A18MGZ30CandidateWouldReclassifyA10BoomIntoA18,true);
 assert.equal(dA.A18MGZ30DirectIdentityRequiresPost38AndIntegralRearHousingEvidence,true);
 assert.equal(dA.A18CurrentA10A18ComponentBoundaryVerified,false);
 assert.equal(dA.A18CurrentA10BoomCouldBeFocusBlockRearHousing,true);
 assert.equal(dA.A18CurrentSeparateA10BoomMayDoubleCountMGZ30Housing,true);
 assert.equal(dA.A18A10BoomMayBeProcuredSeparately,false);
 assert.equal(dA.A10A18ComponentBoundaryVerified,false);
 assert.equal(dA.A10BoomMustNotBeProcuredSeparatelyUntilBoundaryResolved,true);
 assert.equal(dA.A10PostDiameterCandidateMm,26);
 assert.equal(dA.A10PostDiameterMeasured,false);
 assert.equal(dA.A18BXFMFCandidateOnly,true);
 assert.equal(dA.A18BXFMFVendorFrameWidthMm,84);
 assert.equal(dA.A18BXFMFVendorPillarMountHoleMm,32);
 assert.equal(dA.A18BXFMFVendorFocusTravelMm,30);
 assert.equal(dA.A18BXFMFVendorWeightKg,1.9);
 assert.equal(dA.A18BXFMFRearBoltMount,'4-M8 depth8');
 assert.equal(dA.A18BXFMFPhotoTopologyMatch,'medium');
 assert.equal(dA.A18BXFMFCandidatePriority,'secondary');
 assert.equal(dA.A18BXFMFOpenSilverCastingVisualMismatch,true);
 assert.equal(dA.A18BXFMFGeometryApplied,false,
   'BXFM-F vendor geometry cannot replace the photo-constrained A18 before identity is verified');
 assert.equal(dA.A18BXFMFWidth84MatchesCurrentPhotoFit,true);
 assert.equal(dA.A18BXFMFWidthMatchProvesIdentity,false,
   '84mm width coincidence is supporting evidence, never model identification');
 assert.equal(dA.A18Boli76x25Candidates.length,3);
 assert(dA.A18Boli76x25Candidates.every(c=>c.postDiameterMm===25&&c.holderDiameterMm===76));
 assert.equal(dA.A18Boli76x25Candidates.find(c=>c.sku==='SA02041502').centerDistanceMm,156);
 assert.equal(dA.A18Boli76x25Candidates.find(c=>c.sku==='SA08041102').centerDistanceMm,140);
 assert.equal(dA.A18BoliFocusRackGeometryApplied,false,
   '25mm-post rack candidates are comparison evidence only');
 assert.equal(dA.A18Boli76RingDirectIdentityRejected,true,
   'Exposed 76mm E-arm topology is absent from photos191-193');
 assert.match(dA.A18Boli76RingRejectionReason,/76mm annular E-arm/);
 assert.equal(dA.A18CurrentScenePostDiameterMm,26);
 assert.equal(dA.A18CurrentScenePostDiameterMeasured,false,
   'Current Ø26 A10 post is a scene fit, not a physical ruler measurement');
 assert.equal(dA.A18CurrentScenePostToOpticalAxisMm,112);
 assert.equal(dA.A18CurrentScenePostToOpticalAxisMeasured,false,
   'Current 112mm post-to-axis distance is not allowed to hard-reject a vendor candidate');
 assert.equal(dA.A18Visible76mmScopeRingConfirmed,false);
 assert.equal(dA.A18FullFivePortTurretConfirmed,false);
 assert.match(dA.A18VendorCandidateDecision,/MGZ30 primary.*conditional/i);
 assert.match(dA.A18VendorCandidateDecision,/A10\/A18 rear-housing boundary/);
 assert.match(dA.A18VendorCandidateDecision,/BXFM-F secondary/);
 assert.match(dA.A18VendorCandidateDecision,/76mm E-arm direct identity rejected/);
 assert.match(dA.A18VendorCandidateDecision,/none confirmed/);
 assert.equal(dA.A18MCTLMP2DirectIdentityRejected,true);
 assert.deepEqual(dA.A18MCTLMP2VendorEnvelopeMm,[211.5,130,58.8]);
 // V84: the same candidate boundary must be visible to a user selecting A18,
 // not hidden only in QA metadata or markdown documentation.
 await page.locator('#open-bom').evaluate(el=>el.click());
 await page.locator('#bom-query').fill('A18');
 const a18Row=page.locator('#bom-body tr').filter({hasText:/^\s*A18\b/});
 assert.equal(await a18Row.count(),1);
 await a18Row.evaluate(el=>el.click());
 const a18VendorCard=page.locator('#a18-vendor-comparison');
 assert.equal(await a18VendorCard.isVisible(),false,'A18 candidate matrix is engineering data, not primary user UI');
 assert.equal(await a18VendorCard.getAttribute('data-confirmed'),'false');
 assert.equal(await a18VendorCard.getAttribute('data-mgz30-applied'),'false');
 assert.equal(await a18VendorCard.getAttribute('data-bxfmf-applied'),'false');
 assert.equal(await a18VendorCard.getAttribute('data-boli-applied'),'false');
 assert.equal(await a18VendorCard.getAttribute('data-boli76-direct-rejected'),'true');
 const a18VendorText=await a18VendorCard.innerText();
 assert.match(a18VendorText,/MGZ30 \/ T-Scope（主候选）/);
 assert.match(a18VendorText,/立柱夹持壳体/);
 assert.match(a18VendorText,/A10横臂/);
 assert.match(a18VendorText,/禁止作为独立已确认采购件/);
 assert.match(a18VendorText,/实拍几何纠错/);
 assert.match(a18VendorText,/24mm/);
 assert.match(a18VendorText,/BXFM-F（次候选）/);
 assert.match(a18VendorText,/84mm/);
 assert.match(a18VendorText,/Ø32H8/);
 assert.match(a18VendorText,/MGZ30 \/ T-Scope/);
 assert.match(a18VendorText,/SA02041502/);
 assert.match(a18VendorText,/SA08041102/);
 assert.match(a18VendorText,/不再作为A18直接身份/);
 assert.match(a18VendorText,/不能作为型号证明/);
 await page.locator('#bom-query').evaluate(el=>{el.value='';el.dispatchEvent(new Event('input',{bubbles:true}));});
 assert.equal(dA.A15LinearHandleCount,2);
 assert.equal(dA.A15StemCount,2);
 assert.equal(dA.A15CollarCount,2);
 assert.equal(dA.A15SupportCount,2);
 assert.equal(dA.A15ActuatorChainsContinuous,true,
   'Both A15 T25M handles must form support→stem→collar→drum contact chains');
 assert.deepEqual(dA.A15ActuatorChainGapsMm,{X:[0,0,0],depth:[0,0,0]});
 assert.equal(dA.A15FloatingCentralControlCount,0,
   'Persistent floating A15 central cylinder must never return');
 assert.equal(dA.clampScrewCount,2);
 assert.equal(dA.clampScrewAxesVertical,true);
 assert.equal(dA.clampScrewPairLineParallelShortEdge,true);
 assert.equal(dA.clampScrewPitchAcrossShortEdgeMm,13);
 assert.equal(dA.g40DrumBendOverlapVolumeAabbMm3,0);
 assert(dA.sampleMicrometerStemDrumEngagementMm>=2.9,
   'A02 X stage stem must remain engaged with its own linear knob');
 assert.deepEqual(dA.A03TonguePlateOverlapMm,[6.5,6.5],
   'VC13M two guide tongues still require real overlap');
 assert.equal(dA.physicalPhotoFitCertified,false);
 // A02 and A15 are DIFFERENT physical stages and must use different
 // sliders. Previously the sample A02 top moved with filmShift instead.
 // V137 user correction: A02 has two orthogonal linearly driven carriages.
 const xy0=await page.evaluate(()=>window.__modelASampleXYProbe?.());
 assert.equal(xy0.available,true);
 assert.equal(xy0.xyNominalThicknessMm,33);
 assert.deepEqual(xy0.xyStackMm,[11,11,11]);
 assert.deepEqual(xy0.xyAxes,['X','Y']);
 assert.equal(xy0.linearDrumCount,2);
 assert.equal(xy0.linearStemCount,2);
 assert.deepEqual(xy0.drumLocalAxes.sort(),['X','depth']);
 assert.equal(xy0.rotaryLinearHandleCount,0,
   'Rotary A06 must have no linear-stage micrometer or second long knob');
 assert.equal(xy0.rotaryLockCount,1,
   'A06 must retain only one short user-confirmed lock lever');
 assert.equal(xy0.rotaryHeightMm,21);
 assert.equal(xy0.rulerStackAboveBoardMm,90);
 assert.equal(xy0.xCarriageMm,0);
 assert.equal(xy0.yCarriageMm,0);
 assert.equal(xy0.bottomHousingYawDeg,0);
 await page.locator('#sample-move-depth').evaluate(el=>{
   el.value='5';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 const xyDepth=await page.evaluate(()=>window.__modelASampleXYProbe?.());
 assert.equal(xyDepth.xCarriageMm,0);
 assert.equal(xyDepth.yCarriageMm,5);
 assert.equal(xyDepth.heaterWorldZmm-xy0.heaterWorldZmm,5,
   'The second stage must ACTUALLY translate the A07 heater, not merely add a cosmetic drum');
 await page.locator('#sample-move-depth').evaluate(el=>{
   el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 await page.locator('#rotate-sample').evaluate(el=>{
   el.value='3';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 const xyTurn=await page.evaluate(()=>window.__modelASampleXYProbe?.());
 assert.equal(xyTurn.bottomHousingYawDeg,0,
   'A06 stationary housing and lock lever must not rotate with its deck');
 assert.equal(xyTurn.rotaryDeckYawDeg,3,
   'A06 rotating disk must turn independently of the lock seat');
 await page.locator('#rotate-sample').evaluate(el=>{
   el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 const aZero=await page.evaluate(()=>window.__modelAKinematicProbe?.());
 assert.equal(aZero.A02SampleCarriageLocalXmm,0);
 assert.equal(aZero.A15FilmCarriageLocalXmm,0);
 await page.locator('#sample-move').evaluate(el=>{
   el.value='4';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 const aSampleOnly=await page.evaluate(()=>window.__modelAKinematicProbe?.());
 assert.equal(aSampleOnly.A02SampleCarriageLocalXmm,4,
   'A02 physical sample slide must follow its own sample X input');
 assert.equal(aSampleOnly.A15FilmCarriageLocalXmm,0,
   'Sample X must not move the separate film-stage X carriage');
 assert.equal(aSampleOnly.sampleHeaterWorldXmm-aZero.sampleHeaterWorldXmm,4,
   'A07 heater must ride on the actual A02 sample carriage');
 await page.locator('#translate').evaluate(el=>{
   el.value='5';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 const aIndependent=await page.evaluate(()=>window.__modelAKinematicProbe?.());
 assert.equal(aIndependent.A02SampleCarriageLocalXmm,4,
   'Film X cannot move the independent sample carriage');
 assert.equal(aIndependent.A15FilmCarriageLocalXmm,5,
   'Film X must move the A15 carriage');
 await page.locator('#sample-move').evaluate(el=>{
   el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 await page.locator('#translate').evaluate(el=>{
   el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 await page.locator('#open-bom').evaluate(el=>el.click());
 const aChipRow=page.locator('#bom-body tr').filter({hasText:/^\s*A07W\b/});
 assert.equal(await aChipRow.count(),1,
   'A07W sample chip must be a distinct BOM/scene/STEP part, not hidden in A07 metal');
 await page.locator('#close-bom').evaluate(el=>el.click());
 assert.equal(aContactBefore.clampFastenerProxyCount,2);
 assert.equal(aContactBefore.dimensionsForFabricationValidated,false);
 const aComplete=await page.evaluate(()=>window.__platformACompletenessProbe?.());
 assert.equal(aComplete?.available,true,
   'Platform A must model A05C clamp and A05G glass as separate scene components');
 assert.equal(aComplete.separateClampAndGlassParts,true);
 assert.equal(aComplete.clampProxyUnverified,true);
 assert.equal(aComplete.actualClampOEMConfirmed,false);
 assert.deepEqual(aComplete.glassSizeMm,[76,26,1]);
 assert.equal(aComplete.stampRightMarginMm,4);
 assert.equal(aComplete.stampAtRightEdge,true);
 assert.equal(aComplete.glassRequiredForTransfer,true);
 assert.equal(aComplete.glassVisibleInCurrentPose,true);
 assert.equal(aComplete.installedPoseGlassVisible,true);
 assert.equal(aComplete.photoReferenceGlassHidden,false);
 assert.equal(aComplete.screwAxisVertical,true);
 assert.equal(aComplete.screwPairLineParallelGlassShortEdge,true);
 assert.equal(aComplete.photo5VerticalWingScrewTopologyApplied,true);
 assert.equal(aComplete.gcm13FamilyTopologyApplied,false);
 assert.equal(aComplete.gcm13ExactSkuGeometryApplied,false);
 await page.locator('#open-bom').evaluate(el=>el.click());
 await page.locator('#bom-query').fill('A05C');
 const aClampRow=page.locator('#bom-body tr').filter({hasText:/^\s*A05C\b/});
 assert.equal(await aClampRow.count(),1);
 await page.locator('#bom-query').fill('A05CS');
 const screwRow=page.locator('#bom-body tr').filter({hasText:/^\s*A05CS\b/});
 assert.equal(await screwRow.count(),1);
 assert.match(await screwRow.innerText(),/2枚|2 枚/);
 await page.locator('#bom-query').fill('A05C');
 assert.match(await aClampRow.locator('.bom-photo-tile img').getAttribute('src'),/194\.webp$/);
 await aClampRow.evaluate(el=>el.click());
 assert.match(await page.locator('#part-detail').innerText(),/玻片下夹片 \/ 夹持界面/);
 const a05cVendorCard=page.locator('#a05c-vendor-comparison');
 assert.equal(await a05cVendorCard.getAttribute('data-confirmed'),'false');
 assert.equal(await a05cVendorCard.getAttribute('data-gcm13-applied'),'false');
 assert.equal(await a05cVendorCard.getAttribute('data-gcm13-topology-applied'),'false');
 assert.equal(await a05cVendorCard.getAttribute('data-gcm13-exact-sku-applied'),'false');
 assert.match(await a05cVendorCard.innerText(),/GCM-1302M/);
 await page.locator('#bom-query').evaluate(el=>{el.value='';el.dispatchEvent(new Event('input',{bubbles:true}));});
 const photoA=await page.evaluate(()=>window.__photoEvidenceProbe?.('A05C'));
 assert.deepEqual(photoA?.embedded,['194','196']);
 assert.equal(await page.locator('#film-drop-label').innerText(),'玻片 Z');
 assert.equal(await page.locator('#sample-move-label').innerText(),'样品 X');
 assert.equal(await page.locator('#sample-move-depth-label').innerText(),'样品 Y');

 const mechA=await page.evaluate(()=>window.__modelAPhoto194Probe?.());
 assert.equal(mechA.available,true);
 assert.equal(mechA.installedFilmBranchYawDeg,180);
 assert.equal(mechA.wingFastenerCount,2);

 const foot=await page.evaluate(()=>window.__modelA05FootBoreProbe?.());
 assert.equal(foot.available,true);
 assert.equal(foot.verticalClampBoresPresent,true);
 assert.equal(foot.boreCount,2);
 assert.equal(foot.shaftCount,2);
 assert.equal(foot.shaftAxesVertical,true);
 assert.equal(foot.screwPairLineParallelGlassShortEdge,true);
 assert.equal(foot.screwPitchAcrossGlassShortEdgeMm,13);
 assert.equal(foot.shaftsEngageLowerBlade,true);
 assert.equal(foot.independentFastenerPart,true);
 assert.equal(foot.actualOEMThreadsVerified,false);

 const clampTopology=await page.evaluate(()=>window.__platformABareClampProbe?.());
 assert.equal(clampTopology.gcm13FamilyTopologyApplied,false);
 assert.equal(clampTopology.photo5VerticalWingScrewTopologyApplied,true);

 const photoAxis=await page.evaluate(()=>window.__modelA05PhotoEvidenceProbe?.());
 assert.equal(photoAxis?.available,true);
 assert.equal(photoAxis.pose,'installed180');
 assert.equal(photoAxis.visibleWingEarCount,4);
 assert.equal(photoAxis.wingEarTiltDegCandidate,33.2);
 assert.equal(photoAxis.fastenerShaftAxis,'Y / vertical through folded foot');
 assert.equal(photoAxis.actualShaftGeometryVertical,true);
 assert.equal(photoAxis.fastenerPairLineAxis,'Z / parallel to glass 26mm short edge');
 assert.equal(photoAxis.actualPairLineParallelShortEdge,true);
 assert.equal(photoAxis.screwPitchAcrossGlassShortEdgeMm,13);
 assert.equal(photoAxis.fastenerGlassCollisionCount,0);
 assert.equal(photoAxis.glassCandidateVisible,true);
 assert.equal(photoAxis.clampBladeVisible,true);
 assert.equal(photoAxis.verticalFootBoreCount,2);
 assert.equal(photoAxis.completeFilmBranchYawDeg,180);
 assert.equal(photoAxis.photo1CanonicalOrientation,true);
 assert.equal(photoAxis.photo23AreRotatedSideViews,true);
 assert.equal(photoAxis.photo5ShowsVerticalWingScrews,true);
 assert.equal(photoAxis.GCM13FamilyFunctionalMatch,false);
 assert.equal(photoAxis.GCM13FamilyTopologyApplied,false);
 assert.equal(photoAxis.GCM13ExactSkuGeometryApplied,false);
 assert.equal(photoAxis.GCM13GeometryApplied,false);
 assert.equal(photoAxis.GCM1302VendorStudyAvailable,true);
 assert.equal(photoAxis.GCM1302VendorStudyInstalled,false);
 assert.equal(photoAxis.GCM1302VendorStudyExactGeometry,false);
 assert.equal(photoAxis.GCM1302StudyFixedBodyCount,1);
 assert.equal(photoAxis.GCM1302StudyMovingJawCount,1);
 assert.equal(photoAxis.GCM1302StudyAdjustmentScrewCount,2);
 assert.equal(photoAxis.currentGripLengthMmCandidate,28);
 assert.equal(photoAxis.glassClampOEMVerified,false);

 // V115 internal-only manufacturer silhouette review. This never adds a
 // normal UI control: CI temporarily swaps the photo-fit clamp for the
 // GCM-1302M family study, captures it, then restores the user model.
 assert.equal(await page.evaluate(()=>window.__focusA05VendorStudyAudit?.()),true);
 await page.waitForTimeout(180);
 const g1302Study=await page.evaluate(()=>window.__A05VendorStudyProbe?.());
 console.log('V115 A05 GCM-1302M vendor study:',JSON.stringify(g1302Study));
 assert.equal(g1302Study?.available,true);
 assert.equal(g1302Study.visible,true);
 assert.deepEqual(g1302Study.vendorEnvelopeLHDmm,[60,24,26]);
 assert.equal(g1302Study.vendorMovingJawThicknessMm,7);
 assert.equal(g1302Study.vendorAdjustmentExtensionMm,29);
 assert.equal(g1302Study.vendorMountThread,'M6');
 assert.equal(g1302Study.maxPlateThicknessMm,5);
 assert.equal(g1302Study.fixedBodyCount,1);
 assert.equal(g1302Study.movingJawCount,1);
 assert.equal(g1302Study.adjustmentScrewCount,2);
 assert.equal(g1302Study.handKnobCount,2);
 assert.equal(g1302Study.installedByDefault,false);
 assert.equal(g1302Study.exactVendorGeometry,false);
 assert.equal(g1302Study.screwPitchDimensionedByVendor,false);
 assert(Math.abs(g1302Study.projection.centerX)<.25&&Math.abs(g1302Study.projection.centerY)<.25,
   'GCM-1302M study must be centered in its audit frame');
 {
   const box=await page.locator('#viewer').boundingBox();assert(box);
   await page.screenshot({path:'Transfer-Station-A-V115-GCM1302M-Vendor-Study.png',
     clip:{x:box.x,y:box.y,width:box.width,height:box.height},
     animations:'disabled',timeout:30000});
 }
 assert.equal(await page.evaluate(()=>window.__restoreA05VendorStudyAudit?.()),true);
 const g1302Restored=await page.evaluate(()=>window.__A05VendorStudyProbe?.());
 assert.equal(g1302Restored.visible,false,'Vendor study must disappear after CI capture');

 assert.equal(mechA.outwardFootCount,1,'Photo194/196 L bracket needs one outward foot');
 assert.equal(mechA.fastenerThreadVerified,false);
 const guideBefore=await page.evaluate(()=>window.__modelAVerticalGuideProbe?.());
 assert.equal(guideBefore?.available,true,'A03 must have real telescoping guides, not floating raised output');
 assert.equal(guideBefore.stationaryGuideCount,2);
 assert.equal(guideBefore.movingTongueCount,2);
 assert.equal(guideBefore.tonguesTouchMovingPlate,true);
 assert.equal(guideBefore.actualTravelInGuideEnvelope,true);
 assert.equal(guideBefore.outputLiftMm,13);
 assert.equal(guideBefore.vendorModel,'Daheng GCM-VC13M');
 assert.deepEqual(guideBefore.vendorPlatformMm,[65,65]);
 assert.equal(guideBefore.vendorTravelMm,13);
 assert.equal(guideBefore.vendorBearingType,'crossed-roller');
 assert.equal(guideBefore.vendorSideTowerCount,2,
   'VC13M must show the two open-frame uprights visible in vendor imagery');
 assert.equal(guideBefore.centralDriveStemCount,1,
   'VC13M must use one central vertical micrometer, not an external floating control');
 assert.equal(guideBefore.legacySolidWallCount,0,
   'The old tall solid-wall VC13 surrogate must never return');
 assert.equal(guideBefore.vendorOpenFrameTopologyApplied,true);
 assert.equal(guideBefore.manufacturerGuideProfileVerified,false);
 const aBefore=await page.evaluate(()=>window.__modelAKinematicProbe?.());
 assert(aBefore?.available,'A viewer kinematic witness missing');
 assert.equal(aBefore.a17CandidateHoleCount,0,
   'A17 must not inherit B02/GCM-420302M 13-hole pattern without A17 top-side evidence');
 assert.equal(aBefore.a17PhotographedSkuVerified,false,
   'A17 manufacturer SKU remains unidentified');
 assert.equal(aBefore.a17OemPrimaryCandidateFamily,'Oeabt MBS-65B/C');
 assert.equal(aBefore.a17OemComparisonSku,'Oeabt MBS-65B/C family',
   'Photo194 front plaque + left silver switch should promote the Oeabt 65mm family');
 assert.equal(aBefore.a17OemCandidate,'MBS-65B / MBS-65C');
 assert.match(aBefore.a17OemVisualMatchConfidence,/family-high/);
 assert.deepEqual(aBefore.a17CandidateEnvelopeMm,[65.2,65.2,20]);
 assert.deepEqual(aBefore.a17CurrentModelEnvelopeMm,[65,65,20],
   'Do not silently expand the photo-fit model by 0.2mm before physical measurement');
 assert.equal(aBefore.a17CandidateHoldingForceN,132);
 assert.equal(aBefore.a17CurrentProductPageHoldingForceN,132);
 assert.equal(aBefore.a17HistoricalCatalogHoldingForceN,158);
 assert.equal(aBefore.a17HoldingForceSpecConflict,true);
 assert.match(aBefore.a17HoldingForceCurrentSource,/current MBS-65 product page/);
 assert.match(aBefore.a17HoldingForceHistoricalSource,/2024\/2025/);
 assert.equal(aBefore.a17A15BottomMountPatternVerified,false);
 assert.equal(aBefore.a17GCM901604FourM6CannotProveA15ToA17Interface,true);
 assert.equal(aBefore.a17BvsCMechanicalDiscriminationClosed,false);
 assert.deepEqual(aBefore.a17DahengStandardA15MountPatternCandidate,{clearanceHoleDiameterMm:7,counterboreDiameterMm:11,pitchMm:[50,50],fastener:'M6',source:'GCM-901604M standard combination drawing'});
 assert.equal(aBefore.a17MBS65BHas25mmM6Grid,true);
 assert.equal(aBefore.a17MBS65BContains50x50FourM6Subset,true);
 assert.equal(aBefore.a17MBS65COnlyOneM6,true);
 assert.match(aBefore.a17MBS65BConditionalInterfacePriority,/preferred-if-real-A15/);
 assert.equal(aBefore.a17ConditionalInterfaceCompatibilityDoesNotProveIdentity,true);
 assert.equal(aBefore.a17FrontLabelPlaqueCount,1,
   'Photo194 visible front label plaque must be actual WebGL geometry');
 assert.equal(aBefore.a17FrontLabelTextReadable,false,
   'The tiny public preview cannot justify inventing the plaque brand text');
 assert.equal(aBefore.a17ExactVariantVerified,false,
   'Hidden top face prevents distinguishing MBS-65B from MBS-65C');
 assert.equal(aBefore.a17SecondaryCandidates.length,2);
 assert(aBefore.a17SecondaryCandidates.some(x=>x.sku==='PTDB65'));
 assert(aBefore.a17SecondaryCandidates.some(x=>x.sku==='MB65'));
 assert.equal(aBefore.a17CandidateTopHolePatternModelled,false,
   'MBS-65B/C candidate top patterns must NOT be copied while A15 hides A17 top');
 assert.deepEqual(aBefore.a17CandidateTopHoleVariants.MBS65B,{M4:4,M6:9});
 assert.deepEqual(aBefore.a17CandidateTopHoleVariants.MBS65C,{M4:12,M6:1});
 assert.equal(aBefore.a17SideSlotCount,0,'Photo194 silver slot is on A15, not A17');
 assert.equal(aBefore.a17FrontKnobCount,0,'A17 has no duplicate A15 slot knob');
 assert.equal(aBefore.a17TopCounterboreCount,0);
  assert.equal(aBefore.a15TopCounterboreCount,4);
  assert.equal(aBefore.a15RecessedHeadCount,4);
 // The catalogue comparison is intentionally recorded as a candidate, not a confirmed SKU.
assert.equal(aBefore.g40WorldBaseY-aBefore.lowerGoniometerWorldBaseY,20,
  'Photo94 requires two vertically stacked distinct 20mm goniometer modules');
 assert.equal(aBefore.lowerGoniometerOemCandidate,'Daheng GCM-G40M40L');
 assert.equal(aBefore.lowerGoniometerOemCandidateConfirmed,false,
   'Vendor-paired G40M40L is not a readable photo identification');
 assert.equal(aBefore.lowerGoniometerVendorRotationCenterMm,40);
 assert.equal(aBefore.lowerGoniometerVendorTravelDeg,7);
 assert.equal(aBefore.a17PhotographedSkuVerified,false);
 assert.equal(aBefore.bMagnetPhotographedSkuVerified,true);
 assert.equal(aBefore.bMagnetSkuMustNotBeAttributedToA,true);
 assert.deepEqual(aBefore.sampleLayersMm,[9,7,12]);
 assert.equal(aBefore.sampleRotaryDiameterMm,66);
 assert.deepEqual(aBefore.sampleRotaryVendorCandidates,
   ['Daheng GCM-1102M','Daheng GCM-1101M']);
 assert.equal(aBefore.sampleRotaryVendorGeometryApplied,true,
   'V137 adopted 21mm as a HEIGHT CANDIDATE, not a verified rotary SKU');
 assert.equal(aBefore.sampleRotaryGCM1101VendorWidthMm,92);
 assert.equal(aBefore.sampleRotaryGCM1101RejectedByPhotoDiameterEnvelope,true);
 assert.equal(aBefore.sampleRotaryGCM1102VendorDiameterMm,66);
 assert.equal(aBefore.sampleRotaryGCM1102VendorHeightMm,21);
 assert.deepEqual(aBefore.sampleRotaryGCM1102VendorPlatformMm,[32,32]);
 assert.equal(aBefore.sampleRotaryGCM1102DiameterMatchesPhotoFit,true);
 assert.equal(aBefore.sampleRotaryGCM1102DirectSubstitutionSampleTopAboveBoardMm,90);
 assert.equal(aBefore.sampleRotaryGCM1102DirectSubstitutionWithinRulerRange,true);
 assert.equal(aBefore.sampleRotaryGCM1102MinimumMissingStackHeightMm,0);
 assert.equal(aBefore.sampleRotaryGCM1102MaximumMissingStackHeightMm,0);
 assert.equal(aBefore.sampleRotaryGCM1102RulerMidpointMissingStackHeightMm,0);
 assert.equal(aBefore.sampleRotaryGCM1102ExactSceneReplacementHeightLossMm,0);
 assert.deepEqual(aBefore.sampleRotaryGCM1102CurrentSceneStackBreakdownMm,
   {A16:8,A06:21,A02:33,A07:28,total:90});
 assert.deepEqual(aBefore.sampleRotaryGCM1102VendorReplacementStackBreakdownMm,
   {A16:8,A06:21,A02:33,A07:28,total:90});
 assert.equal(aBefore.sampleRotaryGCM1102A16IndependentBaseAlreadyIncludedInBothStacks,true);
 assert.equal(aBefore.sampleRotaryGCM1102A16CannotExplainReplacementHeightLoss,true);
 assert.equal(aBefore.sampleRotaryGCM1102Standard12mmAdapterIdentified,false);
 assert.match(aBefore.sampleRotaryGCM1102CandidatePriority,/height-compatible-with-two-axis/);

 assert.equal(await page.evaluate(()=>window.__focusA06VendorStudyAudit?.()),true);
 await page.waitForTimeout(180);
 const g1102Study=await page.evaluate(()=>window.__A06VendorStudyProbe?.());
 console.log('V116 A06 GCM-1102M height-conflict study:',JSON.stringify(g1102Study));
 assert.equal(g1102Study?.available,true);
 assert.equal(g1102Study.visible,true);
 assert.equal(g1102Study.vendorDiameterMm,66);
 assert.equal(g1102Study.vendorHeightMm,21);
 assert.deepEqual(g1102Study.vendorPlatformMm,[32,32]);
 assert.equal(g1102Study.nominalGapToA02Mm,0);
 assert.deepEqual(g1102Study.rulerAllowedMissingLayerRangeMm,[0,0]);
 assert.equal(g1102Study.unknownSpacerGeometryModelled,false,
   'Do not invent a spacer merely to make the GCM-1102M candidate fit');
 assert.equal(g1102Study.bodyCount,1);
 assert.equal(g1102Study.topPlatformCount,1);
 assert.equal(g1102Study.installedByDefault,false);
 assert.equal(g1102Study.exactVendorGeometry,false);
 assert(Math.abs(g1102Study.actualGapToA02Mm)<.05,
   'Two-axis A02 must meet the 21mm candidate rotary without a fabricated spacer');
 {
   const box=await page.locator('#viewer').boundingBox();assert(box);
   await page.screenshot({path:'Transfer-Station-A-V116-GCM1102M-Height-Conflict-Study.png',
     clip:{x:box.x,y:box.y,width:box.width,height:box.height},
     animations:'disabled',timeout:30000});
 }
 assert.equal(await page.evaluate(()=>window.__restoreA06VendorStudyAudit?.()),true);
 const g1102Restored=await page.evaluate(()=>window.__A06VendorStudyProbe?.());
 assert.equal(g1102Restored.visible,false,'GCM-1102M study must not leak into normal scene');

 await page.locator('#open-bom').evaluate(el=>el.click());
 await page.locator('#bom-query').fill('A06');
 const a06Row=page.locator('#bom-body tr').filter({hasText:/^\s*A06\b/});
 assert.equal(await a06Row.count(),1);
 await a06Row.evaluate(el=>el.click());
 const a06Conflict=page.locator('#a06-vendor-conflict');
 assert.equal(await a06Conflict.isVisible(),false,'A06 stack conflict belongs in hidden engineering data');
 assert.equal(await a06Conflict.getAttribute('data-gcm1102-applied'),'true');
 assert.equal(await a06Conflict.getAttribute('data-diameter-match'),'true');
 assert.equal(await a06Conflict.getAttribute('data-direct-height-fit'),'true');
 const a06ConflictText=await a06Conflict.innerText();
 assert.match(a06ConflictText,/GCM-1102M/);
 assert.match(a06ConflictText,/90mm/);
 assert.match(a06ConflictText,/87–93mm/);
 assert.match(a06ConflictText,/双轴/);
 await page.locator('#bom-query').evaluate(el=>{el.value='';el.dispatchEvent(new Event('input',{bubbles:true}));});
 assert.equal(aBefore.sampleRotaryRightAngularMicrometerCount,0);
 assert.equal(aBefore.sampleRotaryShortFrontLockCount,1);
 assert.equal(aBefore.sampleTopAboveBoardMm,90);
 assert.equal(aBefore.sampleRulerWithinTolerance,true);
 assert.deepEqual(aBefore.samplePhotoRulerSource,['17','18']);
 assert.equal(aBefore.a10CandidateBoltHeadCount,4,
   'A10 cannot draw screw heads without four actual support bores');
 assert.equal(aBefore.a10ActualFootBoresOpen,true,
   'A10 foot mesh still blocks the nominal four screw axes');
 assert.equal(aBefore.a10ActualManufacturerAnchorVerified,false);
 assert.equal(aBefore.vStageMovingPlateOffsetY,13,
   'A initial viewer pose starts from proposed raised +13mm, not static STEP bottom');
 // V55 fast structural QA: omit nonessential Transfer-Station-V46-A-VC13M-Raised.png screenshot.
 assert.equal(aBefore.knownProxyGeometryCollisionFree,false);
 await page.locator('#film-drop').evaluate(el=>{
   el.value='-6';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 const opticsMid=await page.evaluate(()=>window.__modelAOpticalClearanceProbe?.());
 assert.equal(opticsMid?.currentBroadphaseCollisions.length,0);
 assert.equal(opticsMid?.coherentOpticOffsets,true);
 assert.equal(opticsMid.supportBoomRealPostBore,true);
 assert(opticsMid.verticalGapMm>opticsRaised.verticalGapMm,
   'Clearance grows as the film descends beneath retracted objectives');
 const guideMid=await page.evaluate(()=>window.__modelAVerticalGuideProbe?.());
 assert.equal(guideMid.outputLiftMm,7,'A03 guides must follow moving output at mid stroke');
 assert.equal(guideMid.actualTravelInGuideEnvelope,true);
 const aAfter=await page.evaluate(()=>window.__modelAKinematicProbe?.());
 assert.equal(aAfter.filmDropMm,6);
 assert.equal(aAfter.vStageStationaryBaseWorldY,aBefore.vStageStationaryBaseWorldY,
   'A03 fixed body MUST remain on A15, not move into the magnet');
 assert.equal(aAfter.vStageMovingPlateOffsetY,7,
   'A03 output descends 6mm from raised +13mm and remains above fixed upright');
 assert.equal(aAfter.lowerGoniometerWorldBaseY,aBefore.lowerGoniometerWorldBaseY-6,
   'Lower photo94 G40 module must descend with VC13M');
 assert.equal(aAfter.g40WorldBaseY,aBefore.g40WorldBaseY-6,
   'A04 must descend with the VC13M output');
 assert.equal(aAfter.bracketWorldBaseY,aBefore.bracketWorldBaseY-6,
   'A05 cannot be left floating above its moving support');
 assert.equal(aAfter.glassClampedAndReachable,false,
   'Functional transfer must remain explicitly unverified');
 // V55 fast structural QA: omit nonessential Transfer-Station-V46-A-VC13M-Lowered.png screenshot.
 // Verify actual (not merely analytical) PDMS-to-chip contact at full
 // VC13M travel. The glass carrier must stay off the heater.
 await page.locator('#film-drop').evaluate(el=>{
   el.value='-13';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 const opticsLower=await page.evaluate(()=>window.__modelAOpticalClearanceProbe?.());
 assert.equal(opticsLower?.currentBroadphaseCollisions.length,0);
 assert.equal(opticsLower?.coherentOpticOffsets,true);
 assert.equal(opticsLower.supportBoomRealPostBore,true);
  assert.equal(opticsLower.boomHousingFrontGapMm,0);
  assert.equal(opticsLower.boomHousingOverlapMm3,0,
    'A10 boom must remain flush when A05 glass is lowered');
 assert(opticsLower.verticalGapMm>opticsMid.verticalGapMm);
 const guideLower=await page.evaluate(()=>window.__modelAVerticalGuideProbe?.());
 assert.equal(guideLower.outputLiftMm,0);
 assert.equal(guideLower.actualTravelInGuideEnvelope,true);
 const fullA=await page.evaluate(()=>window.__modelAContactProbe?.());
 assert.equal((await page.evaluate(()=>window.__modelAClampChainProbe?.()))
    .photoClampGeometricallyCoherent,true,
    'A05 side clamp must remain coherent throughout the 13mm film lowering stroke');
  assert.equal(fullA.pdmsToChipGapMm,0,
   'V58 at -13mm PDMS must touch the A07 sample chip surface exactly');
 assert.equal(fullA.clampOutsideHeater,true);
 assert.equal(fullA.stampFullyInsideChipXY,true);
 await page.screenshot({path:'Transfer-Station-V58-A-Candidate-Transfer-Contact.png'});
 await page.locator('#film-drop').evaluate(el=>{
   el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 // The A06 rotary stage creates an enlarged heater-envelope footprint.
 // A hazardous offset combination must reset the vertical descent.
 await page.locator('#translate').evaluate(el=>{
   el.value='12.5';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 await page.locator('#sample-move').evaluate(el=>{
   el.value='-12.5';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 await page.locator('#rotate-sample').evaluate(el=>{
   el.value='45';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 const unsafeA=await page.evaluate(()=>window.__platformAWorkingPoseProbe?.());
 assert.equal(unsafeA.candidateCanLower,false);
 await page.locator('#film-drop').evaluate(el=>{
   el.value='-5';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 assert.equal((await page.evaluate(()=>window.__modelAKinematicProbe?.())).filmDropMm,0,
   'Unsafe A tilt/translation must reset a downward VC13 request');
 for(const id of ['translate','sample-move','rotate-sample']){
   await page.locator('#'+id).evaluate(el=>{
     el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));
   });
 }
 // Show the historical photo94 orientation separately without deleting
 // required transfer hardware from the model.
 await page.locator('#btn-a-photo-pose').evaluate(el=>el.click());
 const aPhoto=await page.evaluate(()=>window.__platformACompletenessProbe?.());
 assert.equal(aPhoto.aPose,'photo-reference');
 assert.equal(aPhoto.localSheetHandedness,'left');
 assert.equal(aPhoto.installedFilmYawDeg,180);
 assert.equal(aPhoto.photoAndWorkingSharePhysicalOrientation,true);
 assert(Math.abs(aPhoto.sheetLegLengthMm-85.3)<1e-6,'V137 derived bracket leg within geometric tolerance');
 assert.equal(aPhoto.glassRequiredForTransfer,true);
 assert.equal(aPhoto.glassVisibleInCurrentPose,false,
   'User photo reference must not render the absent glass/PDMS');
 assert.equal(aPhoto.photoReferenceGlassHidden,true);
 assert.equal(aPhoto.installedPoseGlassVisible,false);
 const photographed=await page.evaluate(()=>window.__modelA05PhotoEvidenceProbe?.());
 assert.equal(photographed.pose,'photo-reference');
 assert.equal(photographed.fastenerShaftAxis,'Y / vertical through folded foot');
 assert.equal(photographed.actualShaftGeometryVertical,true);
 assert.equal(photographed.fastenerPairLineAxis,'Z / parallel to glass 26mm short edge');
 assert.equal(photographed.screwPitchAcrossGlassShortEdgeMm,13);
 assert.equal(photographed.glassCandidateVisible,false,
   'Photo-reference view must hide A05G while retaining the clamp hardware');
 assert.equal(photographed.clampBladeVisible,true);
 assert.equal(photographed.verticalFootBoreCount,2);
 assert.equal(await page.locator('#a-physical-audit').isHidden(),true,
   'Photo-reference engineering status must remain outside the normal UI');
 assert.equal(await page.locator('#btn-a-photo-pose').getAttribute('aria-pressed'),'true');
 assert.equal(await page.locator('#film-drop-label').innerText(),'照片参考');
 assert.equal(await page.locator('#film-drop').isDisabled(),true,
   'Reference orientation is comparison-only and cannot run the transfer stroke');
 assert.equal(await page.locator('#translate').isDisabled(),true,
   'Photo-reference must freeze film-stage X motion');
 assert.equal(await page.locator('#translate-depth').isDisabled(),true,
   'Photo-reference must freeze film-stage Y motion');
 assert.match(await page.locator('#stack-note').innerText(),/空载，无玻片\/PDMS/);
 assert.equal(await page.evaluate(()=>window.__focusA05Photo5EmptyAudit?.()),true);
 await page.waitForTimeout(180);
 const photo5Empty=await page.evaluate(()=>window.__A05Photo5EmptyProbe?.());
 assert.equal(photo5Empty?.available,true);
 assert.equal(photo5Empty.photoReference,true);
 assert.equal(photo5Empty.glassRendered,false);
 assert.equal(photo5Empty.clampRendered,true);
 assert.equal(photo5Empty.screwsRendered,true);
 assert.equal(photo5Empty.wingEarCount,4);
 assert.equal(photo5Empty.selectedVisibilityScore,4,
   'Photo5 empty-clamp audit must directly expose upper foot, lower blade and both wing-screw heads');
 assert(photo5Empty.selectedElevationDeg<=27,
   'Photo5 closeup must remain a low oblique view instead of drifting back to top-down');
 assert.equal(photo5Empty.fixedRay.clear,true);
 assert.equal(photo5Empty.pressureRay.clear,true);
 assert(photo5Empty.screwHeadRays.every(x=>x.clear));
 assert(Math.abs(photo5Empty.projection.centerX)<.25&&Math.abs(photo5Empty.projection.centerY)<.25);
 {
   const box=await page.locator('#viewer').boundingBox();assert(box);
   await page.screenshot({path:'Transfer-Station-A-V131-Photo5-Empty-Clamp-Closeup.png',
     clip:{x:box.x,y:box.y,width:box.width,height:box.height},
     animations:'disabled',timeout:30000});
 }
 await page.locator('#btn-front').evaluate(el=>el.click());
 await page.screenshot({path:'Transfer-Station-V79-A-Photo-Reference.png'});
 await page.locator('#btn-iso').evaluate(el=>el.click());
 await page.locator('#btn-a-working-pose').evaluate(el=>el.click());
 assert.equal(await page.locator('#film-drop-label').innerText(),'玻片 Z');
 assert.equal(await page.locator('#translate').isEnabled(),true);
 assert.equal(await page.locator('#translate-depth').isEnabled(),true);
 assert.match(await page.locator('#stack-note').innerText(),/玻片\/PDMS/);
 assert.equal((await page.evaluate(()=>window.__platformACompletenessProbe?.())).aPose,'installed180');
 const resumedComplete=await page.evaluate(()=>window.__platformACompletenessProbe?.());
 assert.equal(resumedComplete.glassVisibleInCurrentPose,true);
 assert.equal(resumedComplete.installedPoseGlassVisible,true);
 const resumed=await page.evaluate(()=>window.__modelA05PhotoEvidenceProbe?.());
 assert.equal(resumed.glassCandidateVisible,true);
 assert.equal(resumed.clampBladeVisible,true);
 assert.equal(resumed.completeFilmBranchYawDeg,180);
 const front194=await page.evaluate(()=>window.__platformAStageFrontProbe?.());
 assert.equal(front194?.available,true);
 assert.equal(front194?.frontPlateAboveMagnet,true);
 assert.equal(front194?.frontPlateFollowsA15X,true);
 assert.equal(front194?.A15FrontKnobCount,0,
   'Unconnected A15 central cylinder must remain deleted');
 assert.equal(front194?.A15FrontScrewCount,2);
 assert.equal(front194?.A17LowerLeverCount,1);
 assert.equal(front194?.noDuplicateA17Slot,true);
 const mountA=await page.evaluate(()=>window.__mountingProbe?.());
 assert.equal(mountA?.singleBreadboardInScene,true);
 assert.equal(mountA?.commonBase,'A01');
 assert.equal(mountA?.A17TouchesA01,true);
 assert.equal(mountA?.A15OnA17,true);
 assert.equal(mountA?.A16CandidateAnchorHeads,4);
 assert.equal(mountA?.A17OEMIdentityVerified,false);
  const evidenceA=await page.locator('#photo-ledger').textContent();
 assert.match(evidenceA,/A15/);
 assert.match(evidenceA,/A16/,'Photo137/161 mounting base must be in A stack');
 await page.screenshot({path:'Transfer-Station-ModelA-5306M-Base.png'});
 // V66 user screenshot came from frontal side view, not the default ISO.
 // Save a matching angle for regression review of VC13 guides/objectives.
 await page.locator('#btn-front').evaluate(el=>el.click());
 await page.screenshot({path:'Transfer-Station-V66-A-Front-Assembly.png'});
 await page.locator('#btn-iso').evaluate(el=>el.click());
 await page.locator('#open-bom').evaluate(el=>el.click());
 const arows=await page.locator('#bom-body tr').allTextContents();
 assert(arows.some(r=>r.trim().startsWith('A16')&&r.includes('GCM-5306M')),
   'A mounting base A16 missing from BOM');
 await page.locator('#close-bom').evaluate(el=>el.click());
 await page.locator('#show-b').evaluate(el=>el.click());
 assert.equal(await page.locator('#platform-caption').innerText(),'平台 B');
 assert.deepEqual(failures,[],'Browser errors: '+failures.join('; '));
 console.log('V28 B full model, PHUC-1, GCM-1302M, second rod, A/B separation: PASS');
}finally{await browser.close()}
