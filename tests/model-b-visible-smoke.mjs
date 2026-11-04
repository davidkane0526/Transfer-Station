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
 for(const id of ['B02','B03','B04','B05','B27','B34','B33','B24','B25','B28','B06','B07','B35','B08','B09','B36','B19','B21','B23'])
   assert(proof.includes(id),'B photo evidence ledger missing '+id);
 assert.equal(await page.locator('#sample-move').isEnabled(),true);
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
    'B22','B23','B24','B25','B26','B27','B28','B33','B34','B36']){
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
 await page.locator('#btn-b-archive').click();
 assert.match(await page.locator('#platform-caption').innerText(),/平台 A/);
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
