import {chromium} from 'playwright-core';
const browser=await chromium.launch({
  headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
  args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']
});
const page=await browser.newPage({viewport:{width:1600,height:950},deviceScaleFactor:1});
const fatal=[],assert=(cond,msg)=>{if(!cond)throw Error('QA: '+msg)};
page.on('pageerror',e=>fatal.push(String(e)));
page.on('console',m=>{if(m.type()==='error'&&!/favicon|Failed to load resource.*404/i.test(m.text()))fatal.push(m.text())});
page.on('response',r=>{if(r.status()>=400&&!/favicon\.ico/.test(r.url()))fatal.push('HTTP '+r.status()+' '+r.url())});
await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
await page.waitForSelector('#viewer canvas',{timeout:30000});
await page.waitForTimeout(2300);
assert(!(await page.locator('.css2d').count()),'never create floating labels outside selection');
const labelCount=await page.evaluate(()=>[...document.querySelectorAll('.dimension-bubble')].filter(x=>x.offsetParent!==null).length);
assert(labelCount===0,'selected dimensions must not show before selection');
await page.screenshot({path:'Transfer-Station-Preview-B.png',fullPage:true});
assert((await page.locator('#photo-ledger').textContent()).includes('B02'),'B magnetic-base proof absent');
assert((await page.locator('#photo-ledger').textContent()).includes('双轴手柄 X:-X / Y:+Z'),'B two orthogonal micrometer heads not shown');
await page.locator('#btn-film-stack').click();
await page.waitForTimeout(450);
await page.screenshot({path:'Transfer-Station-Film-Stack-B.png',fullPage:true});
await page.locator('#translate').fill('4');
await page.locator('#translate-depth').fill('6');
assert((await page.locator('#translate-value').textContent()).includes('4'),'first film axis broken');
assert((await page.locator('#translate-depth-value').textContent()).includes('6'),'second horizontal axis missing');
await page.locator('#translate').fill('0');
await page.locator('#translate-depth').fill('0');
await page.locator('#btn-iso').click();
await page.locator('#btn-sample-stack').click();
await page.waitForTimeout(450);
await page.screenshot({path:'Transfer-Station-Sample-Stack-B.png',fullPage:true});
await page.locator('#btn-iso').click();
// Inspect external vacuum hose and ceramic wires from the BACK.
// Hide the independent microscope for this specific close inspection only.
await page.locator('#btn-rear').click();
await page.locator('#group-list input[data-group="microscope"]').uncheck();
await page.waitForTimeout(350);
await page.screenshot({path:'Transfer-Station-Rear-Ports-B.png',fullPage:true});
await page.locator('#group-list input[data-group="microscope"]').check();
await page.locator('#btn-iso').click();
await page.locator('#btn-photo108').click();
await page.waitForTimeout(350);
await page.screenshot({path:'Transfer-Station-Photo108-magnet-front.png',fullPage:true});
await page.locator('#btn-photo109').click();
await page.waitForTimeout(350);
await page.screenshot({path:'Transfer-Station-Photo109-T25M-label.png',fullPage:true});
await page.locator('#btn-iso').click();
const partCountB=await page.locator('#group-list .group-row').count();
assert(partCountB>=6,'missing subsystem visibility groups');
// Rich BOM checks and click selection
await page.locator('#open-bom').click();
let all=await page.locator('#bom-body tr').count();
assert(all>=23,'B BOM omitted components '+all);
assert((await page.locator('#bom-summary').textContent()).includes('TWD'),'missing multi-currency subtotal');
await page.locator('#bom-sort').selectOption('maker');
assert(await page.locator('#bom-body tr').count()===all,'sorting changed row count');
await page.locator('#priced-only').check();
const priced=await page.locator('#bom-body tr').count();
assert(priced>2&&priced<all,'priced-only filter broken: '+priced);
await page.locator('#priced-only').uncheck();
await page.locator('#bom-query').fill('NFP');
assert(await page.locator('#bom-body tr').count()>=1,'model search not finding NFP-linked parts');
const nfpRow=page.locator('#bom-body tr').filter({has:page.locator('td').filter({hasText:/^B09$/})});
assert(await nfpRow.count()===1,'exact B09 item not uniquely searchable');
await nfpRow.click();
assert((await page.locator('#part-detail').textContent()).includes('NFP-1462C'),'table click did not select NFP');
assert((await page.locator('#interface-review-panel').textContent()).includes('B-CHUCK-FASTENERS'),'NFP joint-acceptance review missing');
assert((await page.locator('#interface-review-panel').textContent()).includes('有效螺纹深度'),'NFP thread-depth ambiguity must be visible');
assert((await page.locator('#selected-source-links a').count())>=2,'selected item lacks drawings links');
await page.waitForTimeout(350);
const dimensions=(await page.locator('#measurement-text').textContent());
assert(dimensions.includes('选中几何包络'),'selection dimension overlay not shown');
await page.locator('#toggle-labels').click();
await page.locator('#toggle-dim').click();
assert(!(await page.locator('#measurement-text').textContent()).includes('选中几何包络'),'dimension toggle did not hide selection');
await page.locator('#toggle-labels').click();
await page.locator('#toggle-dim').click();
await page.locator('#explode').fill('65');
await page.locator('#sample-move').fill('5');
await page.locator('#rotate-sample').fill('16');
await page.waitForTimeout(350);
assert((await page.locator('#sample-value').textContent()).includes('5'),'sample slider broken');
await page.screenshot({path:'Transfer-Station-Detail-B.png',fullPage:true});
// Vendor-NFP registration test uses an entirely synthetic bounding box.
// It tests orientation/datum code ONLY and must never be presented as genuine CAD.
const vertices=[[0,0,0],[167.5,0,0],[167.5,27.6,0],[0,27.6,0],
  [0,0,77.5],[167.5,0,77.5],[167.5,27.6,77.5],[0,27.6,77.5]];
const faces=[[0,1,2],[0,2,3],[4,6,5],[4,7,6],
  [0,4,5],[0,5,1],[1,5,6],[1,6,2],
  [2,6,7],[2,7,3],[3,7,4],[3,4,0]];
const synth='solid synthetic_dimension_fixture\n'+faces.map(ids=>
  'facet normal 0 0 1\nouter loop\n'+ids.map(id=>
     'vertex '+vertices[id].join(' ')).join('\n')+
  '\nendloop\nendfacet\n').join('')+'endsolid synthetic_dimension_fixture';
await page.locator('#cad-profile').selectOption('nfp1462c');
await page.locator('#cad-file').setInputFiles({
  name:'synthetic_bbox_not_vendor.stl',mimeType:'model/stl',buffer:Buffer.from(synth)
});
await page.waitForFunction(()=>document.getElementById('import-status').textContent.includes('synthetic_bbox_not_vendor.stl'));
assert((await page.locator('#import-status').textContent()).includes('nfp1462c'),
  'NFP specific native-axis/datum import profile broken');
assert(await page.locator('#restore-cad').isEnabled(),'OEM import must be reversible');
assert(await page.locator('#sample-move').isDisabled(),
  'Unsegmented native NFP shell must not falsely animate the carriage');
assert(await page.locator('#cad-motion-note').isVisible(),
  'Static OEM shell limitation must be disclosed in the interface');
assert((await page.locator('#sample-value').textContent()).includes('0'),
  'Import must reset sample translation to its reference position');
// The viewer was previously rotated 16 degrees. Its displayed measurement
// is a WORLD-AXIS AABB, not the manufacturer mesh's unrotated local envelope.
// Account for this 16-degree transform rather than conflating coordinate bases.
const projectedBounds=yawDeg=>{
 const t=yawDeg*Math.PI/180;
 const x=167.5*Math.abs(Math.cos(t))+77.5*Math.abs(Math.sin(t));
 const z=167.5*Math.abs(Math.sin(t))+77.5*Math.abs(Math.cos(t));
 return [x,27.6,z].map(n=>n.toFixed(1)).join(' × ');
};
const nativeBounds=await page.locator('#measurement-text').textContent();
assert(nativeBounds.includes(projectedBounds(16)),
  'OEM mesh world AABB must reflect 16-degree stage rotation without hidden proxy: '+nativeBounds);
// A wholly synthetic local JSON file proves that private extracted candidates
// can populate a point field without being mistaken for an OEM-verified hole.
const qaFeatures={
 source:{preset:'nfp1462c',units:'mm'},
 candidate_features:[
  {center_mm:[10,0,0],radius_mm:3.25,full_circle_candidate:true,horizontal_plane_candidate:true},
  {center_mm:[35,0,0],radius_mm:3.25,full_circle_candidate:true,horizontal_plane_candidate:true},
  {center_mm:[10,0,20],radius_mm:3.25,full_circle_candidate:true,horizontal_plane_candidate:true},
  {center_mm:[999,0,999],radius_mm:40,full_circle_candidate:false,horizontal_plane_candidate:true}
 ]
};
await page.locator('#cad-features-file').setInputFiles({
 name:'synthetic_feature_candidates_not_oem.json',mimeType:'application/json',
 buffer:Buffer.from(JSON.stringify(qaFeatures))
});
await page.waitForFunction(()=>document.getElementById('cad-feature-status').textContent.includes('显示 3 项'));
assert(await page.locator('#cad-feature-list option').count()===4,
 'Only complete horizontal candidate circles must populate the local feature list');
await page.locator('#cad-feature-list').selectOption('0');
await page.locator('#cad-feature-slot').selectOption('1');
await page.locator('#use-cad-feature').click();
assert((await page.locator('#cad-src-1').inputValue())==='10,0',
 'Local STEP-derived candidate did not populate X/Z source landmark');
assert((await page.locator('#cad-feature-status').textContent()).includes('尚未'),
 'UI must not claim the CAD circle is a physically accepted hole');

// Point-matching QA uses entirely synthetic landmark coordinates. It must
// preserve native scale, reject a false pitch and label all outcomes as PREVIEW.
await page.locator('#cad-src-1').fill('10,0');
await page.locator('#cad-dst-1').fill('7,10');
await page.locator('#cad-src-2').fill('35,0');
await page.locator('#cad-dst-2').fill('7,-15');
await page.locator('#cad-src-3').fill('10,20');
await page.locator('#cad-dst-3').fill('27,10');
await page.locator('#fit-cad-landmarks').click();
let matchStatus=await page.locator('#cad-registration-status').textContent();
assert(matchStatus.includes('3 对点')&&matchStatus.includes('90.000°')&&matchStatus.includes('0.000 mm'),
 'Rigid landmark registration did not compute expected +90 degree yaw: '+matchStatus);
assert(matchStatus.includes('不是机械公差验收'),'Registration may not imply physical acceptance');
await page.locator('#cad-dst-2').fill('7,-14');
await page.locator('#fit-cad-landmarks').click();
matchStatus=await page.locator('#cad-registration-status').textContent();
assert(matchStatus.includes('配准未应用')&&matchStatus.includes('距离不一致'),
 'Landmark input with false 1mm hole spacing was not rejected: '+matchStatus);
// Restore the original manual yaw path; landmark state should be explicitly
// cleared, and the existing world AABB regression remains meaningful.
// Toggling hole guides must not reveal hidden OEM-replaced proxy geometry.
await page.locator('#toggle-holes').click();
await page.locator('#toggle-holes').click();
await page.locator('#cad-offset-x').fill('2.5');
await page.locator('#cad-offset-z').fill('-1');
await page.locator('#cad-yaw').fill('5');
await page.locator('#apply-cad-alignment').click();
assert((await page.locator('#import-status').textContent()).includes('已应用本地显示配准'),
  'Imported vendor mesh alignment controls broken');
assert((await page.locator('#measurement-text').textContent()).includes(projectedBounds(21)),
  'OEM world AABB must reflect 16-degree parent + 5-degree local yaw without hidden proxy guides');
await page.locator('#restore-cad').click();
assert(await page.locator('#restore-cad').isDisabled(),'Restore should remove imported geometry');
assert(await page.locator('#sample-move').isEnabled(),'Candidate sample travel should return after restore');
assert(await page.locator('#cad-motion-note').isHidden(),'Native shell warning should clear after restore');
assert(!(await page.locator('#measurement-text').textContent()).includes(projectedBounds(21)),
  'Restored proxy must not retain rotated native STL measurement bounds');
await page.locator('#sample-move').fill('3');
assert((await page.locator('#sample-value').textContent()).includes('3'),
  'Restored candidate carriage must still translate');
await page.locator('#sample-move').fill('0');
await page.locator('#cad-profile').selectOption('center');
// A small fabricated local STL is used only for testing the replacement control.
// This exercise is not a vendor CAD or real manufactured component.
const tetra='solid fixture\n'+[
 [[0,0,0],[8,0,0],[0,8,0]],
 [[0,0,0],[8,0,0],[0,0,8]],
 [[0,0,0],[0,8,0],[0,0,8]],
 [[8,0,0],[0,8,0],[0,0,8]]
].map(v=>'facet normal 0 0 1\nouter loop\n'+v.map(p=>'vertex '+p.join(' ')).join('\n')+'\nendloop\nendfacet\n').join('')+'endsolid fixture';
await page.locator('#cad-file').setInputFiles({name:'qa_fixture.stl',mimeType:'model/stl',buffer:Buffer.from(tetra)});
await page.waitForFunction(()=>document.getElementById('import-status').textContent.includes('qa_fixture.stl'),{timeout:9000});
assert((await page.locator('#import-status').textContent()).includes('qa_fixture.stl'),'local STL import did not complete');
// Any unsegmented replacement of B09 (including a synthetic fixture) keeps
// sample travel disabled. Restore the candidate before exercising travel.
assert(await page.locator('#sample-move').isDisabled(),
  'Unsegmented B09 fixture should not re-enable impossible native motion');
await page.locator('#restore-cad').click();
assert(await page.locator('#sample-move').isEnabled(),
  'Fixture restoration must re-enable proxy travel before platform switching');
// Verify A's corrected base-stage relation and BOM
await page.locator('#explode').fill('0');
await page.locator('#sample-move').fill('0');
await page.locator('#rotate-sample').fill('0');
await page.locator('#show-a').click();
await page.waitForTimeout(600);
assert((await page.locator('#platform-caption').textContent()).includes('平台 A'),'switch to A failed');
const aProof=await page.locator('#photo-ledger').textContent();
assert(aProof.includes('A15')&&aProof.includes('A02'),'A needs two physically separate T25M units');
assert(aProof.includes('双轴手柄 X:+X / Y:+Z'),'A15 second orthogonal micrometer absent');
assert(aProof.includes('94.jpg')&&aProof.includes('100.jpg'),'A actuator photo evidence missing');
await page.locator('#btn-film-stack').click();
await page.waitForTimeout(450);
await page.screenshot({path:'Transfer-Station-Film-Stack-A.png',fullPage:true});
await page.locator('#btn-sample-stack').click();
await page.waitForTimeout(450);
await page.screenshot({path:'Transfer-Station-Sample-Stack-A.png',fullPage:true});
await page.locator('#btn-iso').click();
const stale=await page.locator('#viewer').evaluate(el=>(el.innerText||'').includes('NFP-1462C'));
assert(!stale,'old platform B CSS2D part label is still visible after A switch');
await page.locator('#open-bom').click();
const aRows=await page.locator('#bom-body tr').count();
assert(aRows>=14,'A BOM missing revised parts');
await page.locator('#close-bom').click();
await page.screenshot({path:'Transfer-Station-Preview-A.png',fullPage:true});
if(fatal.length){console.error(fatal.slice(0,12));throw Error('Browser errors: '+fatal.join(' | '))}
console.log(JSON.stringify({ok:true,B_subsystems:partCountB,B_BOM:all,B_priced:priced,A_BOM:aRows,selectedDim:dimensions}));
await browser.close();