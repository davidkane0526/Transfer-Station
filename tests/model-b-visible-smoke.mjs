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
 assert.equal(vac.hosePart,'B40');
 assert.equal(vac.hoseWallMeshes,2,'Actual inner and outer hose walls required');
 assert.equal(vac.twoOpenPorts,true,
   'Both the pump suction inlet and B15 fitting must be REALLY bored');
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
 assert.equal(support.microscopeMountAudit?.boardBoltPatternAligned,false,
   'Face contact cannot pass as a valid B35 bolt hole registration');
 assert(support.microscopeMountAudit?.maxMismatchMm>14);
 assert.equal(support.microscopeMountAudit?.loadBearingFastenerJointAccepted,false);
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
 assert.match(boardDetail,/B35↔B16安装孔核对/);
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
 }
 await page.locator('#btn-b-archive').click();
 assert.match(await page.locator('#platform-caption').innerText(),/平台 A/);
 assert.match(await page.locator('#platform-caption').innerText(),/单一面包板/);
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
