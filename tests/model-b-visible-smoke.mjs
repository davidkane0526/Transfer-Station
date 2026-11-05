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
 await page.locator('#viewer canvas').waitFor();
 await page.waitForFunction(()=>document.querySelectorAll('#group-list .group-row').length>=7);
 assert.match(await page.locator('#platform-caption').innerText(),/平台 B.*145.*151/);
 assert.match(await page.locator('#photo-scope-note').innerText(),/PHUC-1/);
 const rect=await page.locator('#viewer canvas').boundingBox();
 assert(rect&&rect.width>=400&&rect.height>=400);
 for(const category of ['base','film','sample','heat','microscope','vacuum','external']){
   const toggle=page.locator('#group-list input[data-group="'+category+'"]');
   assert.equal(await toggle.count(),1,'B scene missing '+category);
   assert.equal(await toggle.isChecked(),true,'B scene category hidden '+category);
 }
 const proof=await page.locator('#photo-ledger').innerText();
 for(const id of ['B02','B03','B04','B05','B27','B34','B33','B24','B25','B28','B06','B07','B35','B08','B09','B36','B19','B21','B23','B37','B38','B39','B40'])
   assert(proof.includes(id),'B photo evidence ledger missing '+id);
 assert.equal(await page.locator('#sample-move').isEnabled(),true);
 const mountingB=await page.evaluate(()=>window.__mountingProbe?.());
 assert.equal(mountingB?.singleBreadboardInScene,true,
   'B must have one common optical table, B35 is not a second shared base');
 assert.equal(mountingB?.commonBase,'B01');
 assert.equal(mountingB?.B35IsAuxiliaryPlate,true);
 assert.equal(mountingB?.B35CandidateAnchorHeads,4);
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
 assert.equal(vac.geometryRevision,'V43_photo120_123_cylindrical_shell_same_side_rods_candidate');
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
 assert.equal(vac.hoseToPumpBoreDiametricGapMm,1.2);
 assert(vac.sourceCoordinateErrorMm<.01,
   'First long-hose node not coupled to moving B15 short hose outlet');
 assert(vac.pumpCoordinateErrorMm<.01,
   'Hose does not terminate at the VN-50 suction nozzle');
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
 assert.equal(splineEnvelope.posesChecked,9231);
 assert.equal(splineEnvelope.fullStrokeSplineGridPass,true,
   'Actual Catmull-Rom route must clear every heater/sensor harness over the full UI grid');
 console.log('V40 full Catmull-Rom clearance grid:',JSON.stringify(splineEnvelope));
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
 await externalToggle.uncheck();
 const disabledExternal=await page.evaluate(()=>window.__modelBViewProbe());
 assert.equal(disabledExternal.visibleExternalCount,0,
    'Turning external group OFF should hide all external scene meshes');
 await externalToggle.check();
 const restoredExternal=await page.evaluate(()=>window.__modelBViewProbe());
 assert.deepEqual(restoredExternal.hiddenExternalParts,[],
    'Turning external group ON must restore all B36 external assemblies');
 assert.match(await page.locator('#photo-ledger').innerText(),/B35/);
 // The black sample-side Thorlabs mounting board is independently
 // selectable; switching film-side profiles cannot delete it.
 assert.equal(await page.locator('#group-list input[data-group="base"]').isChecked(),true);
 await page.screenshot({path:'Transfer-Station-ModelB-Full-Assembly.png'});
 await page.locator('#btn-rear').click();
 await page.waitForTimeout(450);
 const rearVac=await page.evaluate(()=>window.__modelBVacuumProbe?.());
 assert.equal(rearVac?.passesBehindController,true,
   'Rear view must retain the B19-backside vacuum route');
 assert.equal(rearVac?.fullStrokeGridPass,true,
   'B40 must pass the complete 0.5mm × 1° UI-slider motion grid');
 assert.equal(rearVac?.envelopePosesChecked,9231);
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
 await page.locator('#btn-film-stack').click();
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:'Transfer-Station-V29-B-Post-Sleeve-Closeup.png'});
 // Avoid locator.screenshot's "element stability" wait: the WebGL
 // canvas renders continuously with OrbitControls damping. Capture the
 // SAME viewer rectangle from the page instead, without scrolling an
 // animating element into view for 12 seconds.
 const viewerBox=await page.locator('#viewer').boundingBox();
 assert(viewerBox&&viewerBox.width>300&&viewerBox.height>300,
   'Model B close-up viewer should be sized and visible');
 await page.screenshot({path:'Transfer-Station-V29-B-Film-Viewer.png',
   clip:{x:viewerBox.x,y:viewerBox.y,width:viewerBox.width,height:viewerBox.height},
   animations:'disabled',timeout:30000});
 await page.locator('#btn-home').click();
 await page.locator('#btn-sample-stack').click();
 const sampleBox=await page.locator('#viewer').boundingBox();
 assert(sampleBox&&sampleBox.width>=300&&sampleBox.height>=300);
 await page.screenshot({path:'Transfer-Station-V32-Black-Thorlabs-Sample-Board.png',
   clip:{x:sampleBox.x,y:sampleBox.y,width:sampleBox.width,height:sampleBox.height},
   animations:'disabled',timeout:30000});
 await page.locator('#btn-home').click();
 await page.locator('#btn-control-cabinet').click();
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
 await page.screenshot({path:'Transfer-Station-V33-Control-Cabinet-Interior.png',
   clip:{x:cabinetBox.x,y:cabinetBox.y,width:cabinetBox.width,height:cabinetBox.height},
   animations:'disabled',timeout:30000});
 await page.locator('#btn-home').click();
 await page.locator('#open-bom').click();
 const rows=await page.locator('#bom-body tr').allTextContents();
 for(const id of ['B01','B35','B02','B03','B04','B05','B06','B07','B08','B09',
    'B10','B11','B12','B14','B15','B16','B17','B18','B19','B20','B21',
    'B22','B23','B24','B25','B26','B27','B28','B33','B34','B36','B37','B38','B39','B40']){
   assert(rows.some(row=>row.trim().startsWith(id)),'B BOM lost '+id);
 }
 for(const wrong of ['B29','B30','B31','B32'])
   assert(!rows.some(row=>row.trim().startsWith(wrong)),
      'A 94/95/97 film arm wrongly merged into B '+wrong);
 await page.locator('#bom-query').fill('B24');
 const phuc=page.locator('#bom-body tr').filter({hasText:'B24'});
 assert.equal(await phuc.count(),1);
 await phuc.click();
 assert.match(await page.locator('#part-detail').innerText(),/PHUC-1/);
 assert.equal(await page.locator('#holder-geometric-qa').getAttribute('data-hole-spacing'),'33');
 await page.locator('#open-bom').click(); // Selecting a row closes the BOM panel
 await page.locator('#bom-query').fill('B34');
 const holder=page.locator('#bom-body tr').filter({hasText:'B34'});
 assert.equal(await holder.count(),1,'Black photo149 sleeve must have its own BOM row');
 await holder.click();
 assert.match(await page.locator('#part-detail').innerText(),/PHSH-2/);
 await page.locator('#open-bom').click();
 await page.locator('#bom-query').fill('B33');
 const square=page.locator('#bom-body tr').filter({hasText:'B33'});
 assert.equal(await square.count(),1,'Independent square clamp cannot disappear');
 await square.click();
 assert.match(await page.locator('#part-detail').innerText(),/方形夹块|方夹/);
 await page.locator('#open-bom').click();
 await page.locator('#bom-query').fill('B35');
 const board=page.locator('#bom-body tr').filter({hasText:'B35'});
 assert.equal(await board.count(),1,'Black Thorlabs sample board must be a separate BOM item');
 await board.click();
 const boardDetail=await page.locator('#part-detail').innerText();
 assert.match(boardDetail,/Thorlabs|THORLABS/);
 assert.match(boardDetail,/145|150/);
 assert.match(boardDetail,/B35↔B16孔系配准/);
 await page.locator('#open-bom').click();
 await page.locator('#bom-query').fill('B36');
 // B19/B21/B23 descriptions also say "inside B36", so a
 // substring text filter matches several rows. Check the row's
 // FIRST model ID instead of erroneously counting references.
 const cabinet=page.locator('#bom-body tr').filter({hasText:/^\s*B36\b/});
 assert.equal(await cabinet.count(),1,'Open steel control enclosure must be independent BOM item');
 await cabinet.click();
 const cabinetDetail=await page.locator('#part-detail').innerText();
 assert.match(cabinetDetail,/119/);
 assert.match(cabinetDetail,/B21|B23/);
 // V38 selected-only diameter labels: all four are explicitly
 // candidates and MUST be available without cluttering 3D view.
 for(const [id,pattern] of [
   ['B11',/Ø1\.4/],['B15',/Ø2\.84/],
   ['B40',/OD Ø7\.0 \/ ID Ø4\.4/],['B20',/Ø18\.0.*Ø8\.2/]
 ]){
   await page.locator('#open-bom').click();
   await page.locator('#bom-query').fill(id);
   const row=page.locator('#bom-body tr').filter({hasText:new RegExp('^\\s*'+id+'\\b')});
   assert.equal(await row.count(),1,'Suction BOM ID '+id+' missing');
   await row.click();
   assert.equal(await page.locator('#suction-dimensions').getAttribute('data-candidate'),'true');
   assert.match(await page.locator('#suction-dimensions').innerText(),pattern);
   if(id==='B40'||id==='B20'){
     assert.equal(await page.locator('#vacuum-interface-warning').getAttribute('data-status'),'unverified');
     const fitNote=await page.locator('#vacuum-interface-warning').innerText();
     assert.match(fitNote,/软管内径Ø4\.4/);
     assert.match(fitNote,/不能据此认定直接套接/);
     assert.match(fitNote,/1\.2 mm/);
   }
 }
 await page.locator('#btn-b-archive').click();
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
 assert.match(switchState.caption,/平台 A/);
 assert.match(await page.locator('#platform-caption').innerText(),/V51.*A17.*A05/);
 assert.equal(await page.locator('#a-physical-audit').isVisible(),true);
 assert.match(await page.locator('#a-physical-audit').innerText(),/171\.5/);
 assert.match(await page.locator('#film-drop-label').innerText(),/VC13M/);
 assert.match(await page.locator('#sample-move-label').innerText(),/T25M/);
 // A03 VC13M must move only its output plate; A04/A05 follow the
 // output, while A03 body and magnet remain fixed to their base.
 const aBefore=await page.evaluate(()=>window.__modelAKinematicProbe?.());
 assert(aBefore?.available,'A viewer kinematic witness missing');
 assert.equal(aBefore.a17CandidateHoleCount,0);
 assert.equal(aBefore.a17SideSlotCount,1);
 assert.equal(aBefore.a17FrontKnobCount,1);
 assert.equal(aBefore.a17TopCounterboreCount,0);
  assert.equal(aBefore.a15TopCounterboreCount,4);
  assert.equal(aBefore.a15RecessedHeadCount,4);
 assert.equal(aBefore.a17OemComparisonSku,null);
assert.equal(aBefore.g40WorldBaseY-aBefore.lowerGoniometerWorldBaseY,20,
  'Photo94 requires two vertically stacked distinct 20mm goniometer modules');
 assert.equal(aBefore.a17PhotographedSkuVerified,false);
 assert.equal(aBefore.bMagnetPhotographedSkuVerified,true);
 assert.equal(aBefore.bMagnetSkuMustNotBeAttributedToA,true);
 assert.deepEqual(aBefore.sampleLayersMm,[9,7,12]);
 assert.equal(aBefore.sampleRotaryDiameterMm,66);
 assert.equal(aBefore.sampleRotaryRightAngularMicrometerCount,1);
 assert.equal(aBefore.sampleRotaryShortFrontLockCount,1);
 assert.equal(aBefore.sampleTopAboveBoardMm,89.2);
 assert.equal(aBefore.sampleRulerWithinTolerance,true);
 assert.deepEqual(aBefore.samplePhotoRulerSource,['17','18']);
 assert.equal(aBefore.a10CandidateBoltHeadCount,4,
   'A10 cannot draw screw heads without four actual support bores');
 assert.equal(aBefore.a10ActualFootBoresOpen,true,
   'A10 foot mesh still blocks the nominal four screw axes');
 assert.equal(aBefore.a10ActualManufacturerAnchorVerified,false);
 assert.equal(aBefore.vStageMovingPlateOffsetY,13,
   'A initial viewer pose starts from proposed raised +13mm, not static STEP bottom');
 await page.screenshot({path:'Transfer-Station-V46-A-VC13M-Raised.png'});
 assert.equal(aBefore.knownProxyGeometryCollisionFree,false);
 await page.locator('#film-drop').evaluate(el=>{
   el.value='-6';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
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
 await page.screenshot({path:'Transfer-Station-V46-A-VC13M-Lowered.png'});
 await page.locator('#film-drop').evaluate(el=>{
   el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 const mountA=await page.evaluate(()=>window.__mountingProbe?.());
 assert.equal(mountA?.singleBreadboardInScene,true);
 assert.equal(mountA?.commonBase,'A01');
 assert.equal(mountA?.A17TouchesA01,true);
 assert.equal(mountA?.A15OnA17,true);
 assert.equal(mountA?.A16CandidateAnchorHeads,4);
 assert.equal(mountA?.A17OEMIdentityVerified,false);
  const evidenceA=await page.locator('#photo-ledger').innerText();
 assert.match(evidenceA,/A15/);
 assert.match(evidenceA,/A16/,'Photo137/161 mounting base must be in A stack');
 await page.screenshot({path:'Transfer-Station-ModelA-5306M-Base.png'});
 await page.locator('#open-bom').click();
 const arows=await page.locator('#bom-body tr').allTextContents();
 assert(arows.some(r=>r.trim().startsWith('A16')&&r.includes('GCM-5306M')),
   'A mounting base A16 missing from BOM');
 await page.locator('#close-bom').click();
 await page.locator('#show-b').click();
 assert.match(await page.locator('#platform-caption').innerText(),/PHUC-1/);
 assert.deepEqual(failures,[],'Browser errors: '+failures.join('; '));
 console.log('V28 B full model, PHUC-1, GCM-1302M, second rod, A/B separation: PASS');
}finally{await browser.close()}
