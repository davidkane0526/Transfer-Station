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
// USER CURRENT PHOTOGRAPHS: B default is the photo-matched stage chain,
// NOT the old speculative PHCP/PHSP metal bar.
assert((await page.locator('#platform-caption').textContent()).includes('本次94/95/97实物对照'),
 'The B default has not changed from the incorrect old PHCP beam');
assert((await page.locator('#photo-ledger').textContent()).includes('GCM-VC13M'));
assert((await page.locator('#photo-ledger').textContent()).includes('GCM-G40M60L'));
assert((await page.locator('#photo-ledger').textContent()).includes('B29'),
 'Photographed bottom pad must NOT borrow an unverified GCM-420302M magnetic SKU');
assert(!(await page.locator('#photo-ledger').textContent()).includes('B02'),
 'Archive B02 must not show in the new photo variant');
await page.screenshot({path:'Transfer-Station-V27-User-Photo-B-Overview.png',fullPage:true});
await page.locator('#btn-photo94').click();
await page.waitForTimeout(500);
await page.screenshot({path:'Transfer-Station-V27-User-Photo94-Closeup-B.png',fullPage:true});
await page.locator('#open-bom').click();
const photoRows=await page.locator('#bom-body tr').allTextContents();
assert(photoRows.some(t=>t.includes('B29'))&&photoRows.some(t=>t.includes('B32')),
 'User photo mode BOM is missing the visible bottom foot or bent L connector');
assert(photoRows.every(t=>!/^B02\b|^B24\b/.test(t.trim())),
 'Photo mode BOM must not count archived magnetic base or PHCP as purchase parts');
await page.locator('#bom-query').fill('B32');
await page.locator('#bom-body tr').filter({hasText:'B32'}).click();
assert((await page.locator('#photo-94-mechanics').getAttribute('data-folded'))==='true',
 'The B photographic L sheet was not rendered');
assert((await page.locator('#photo-94-mechanics').getAttribute('data-top-fasteners'))==='2',
 'The B photographic L sheet must show TWO actual top bolt heads');
await page.screenshot({path:'Transfer-Station-V27-User-Photos-B.png',fullPage:true});
// The original B/108/109 alternate remains available for historical
// comparison, but must not be confused with the user-specified B default.
await page.locator('#btn-b-archive').click();
assert((await page.locator('#platform-caption').textContent()).includes('旧108/109候选'));
await page.locator('#open-bom').click();
const archiveRows=await page.locator('#bom-body tr').allTextContents();
assert(archiveRows.some(t=>t.includes('B02'))&&archiveRows.some(t=>t.includes('B24')),
 'Archived B parts missing from their own BOM');
assert(archiveRows.every(t=>!/^B29\b|^B30\b|^B31\b|^B32\b/.test(t.trim())),
 'Archive BOM must not count new photographed B-only parts');
await page.locator('#close-bom').click();
assert(!(await page.locator('#photo-ledger').textContent()).includes('B32'),
 'Archived B must not silently blend in photographic G40 hardware');
assert(!(await page.locator('.css2d').count()),'never create floating labels outside selection');
const labelCount=await page.evaluate(()=>[...document.querySelectorAll('.dimension-bubble')].filter(x=>x.offsetParent!==null).length);
assert(labelCount===0,'selected dimensions must not show before selection');
await page.screenshot({path:'Transfer-Station-Preview-B.png',fullPage:true});
assert((await page.locator('#photo-ledger').textContent()).includes('B02'),'B magnetic-base proof absent');
assert((await page.locator('#photo-ledger').textContent()).includes('双轴手柄 X:-X / Y:+Z'),'B two orthogonal micrometer heads not shown');
await page.locator('#btn-film-stack').click();
await page.waitForTimeout(450);
await page.screenshot({path:'Transfer-Station-Film-Stack-B.png',fullPage:true});
await page.locator('#btn-optical').click();
await page.waitForTimeout(350);
await page.screenshot({path:'Transfer-Station-V24-Optical-Left-Grip-B.png',fullPage:true});
await page.locator('#btn-iso').click();
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
// The NFP is OEM X ONLY. B03 (glass arm) is the XY assembly with scene
// X/Z directions, not an extra unmodelled NFP micrometer.
assert((await page.locator('#part-detail').textContent()).includes('线性轴 1，线性测微头 1'),
 'B09 must be explicitly represented as a single-axis NFP');
assert((await page.locator('#selected-fastener-count').getAttribute('data-count'))==='4',
 'B09 fixed-side fastener proxies not actually rendered');
const selectBOM=async partId=>{
 await page.locator('#open-bom').click();
 await page.locator('#bom-query').fill(partId);
 const row=page.locator('#bom-body tr').filter({hasText:partId});
 assert(await row.count()===1,'Missing mechanical QA part '+partId);
 await row.click();
};
await selectBOM('B05');
assert((await page.locator('#part-detail').textContent()).includes('直线悬臂'),
 'Legacy return-loop must not survive in part details');
assert(await page.locator('#selected-fastener-count').getAttribute('data-count')==='4',
 'Missing B05 straight-arm mounting hardware');
// B25 and B24 are now *independent* scene parts with real manufacturer
// model references; B26 remains unnamed instead of pretending to be PHCP-2.
await selectBOM('B24');
assert((await page.locator('#part-detail').textContent()).includes('PHCP-2'),
 'The source-identified Zolix swivel post clamp must be separately selectable');
assert(await page.locator('#selected-source-links a').count()>=1,
 'Zolix PHCP-2 manufacturer source not exposed');
assert((await page.locator('#holder-geometric-qa').getAttribute('data-rod-clearance'))==='3',
 'PHCP swivel Ø12 rods physically overlap or datum gap is not exposed');
await selectBOM('B25');
assert((await page.locator('#part-detail').textContent()).includes('PHSP12-5'),
 'The OEM Ø12 x 150mm rod has no independent 3D part');
await selectBOM('B27');
assert((await page.locator('#part-detail').textContent()).includes('PHSP12-1'),
 'Missing anchored short Ø12 optical post');
await selectBOM('B26');
assert((await page.locator('#part-detail').textContent()).includes('待确认'),
 'Nonstandard M6/Ø12 terminal adapter must remain unverified');
await selectBOM('B06');
assert((await page.locator('#part-detail').textContent()).includes('GCM-1302M'),
 'The Daheng candidate plate-holder model is missing');
assert((await page.locator('#holder-geometric-qa').getAttribute('data-drive-count'))==='2',
 'GCM-13 must contain two actual 3D adjustment screw drives');
assert((await page.locator('#holder-geometric-qa').getAttribute('data-pressure-plate-count'))==='1',
 'Two GCM screws must drive one shared moving pressure plate');

await page.locator('#btn-film-holder').click();
await page.waitForTimeout(400);
await page.screenshot({path:'Transfer-Station-V25-Holder-OEM-Closeup.png',fullPage:true});
await page.locator('#btn-film-stack').click();
await page.waitForTimeout(400);
await page.screenshot({path:'Transfer-Station-V25-Holder-Detail-B.png',fullPage:true});
await selectBOM('B03');
assert((await page.locator('#part-detail').textContent()).includes('线性轴 2，线性测微头 2'),
 'Dual-axis film-side stage does not have two independent drives');
assert(await page.locator('#selected-fastener-count').getAttribute('data-count')==='4',
 'Missing four B03 candidate heads');
await selectBOM('B14');
assert(await page.locator('#selected-fastener-count').getAttribute('data-count')==='4',
 'Confirmed four flush B14 screws not drawn in scene');
assert((await page.locator('#part-detail').textContent()).includes('只有顶部四枚及齐平外观'),
 'Unverified screw lengths and bore diameter must not be claimed measured');
await page.locator('#btn-sample-stack').click();
await page.waitForTimeout(350);
await page.screenshot({path:'Transfer-Station-V24-Chuck-Screw-Heads.png',fullPage:true});
await selectBOM('B09');
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
assert((await page.locator('#cad-feature-status').textContent()).includes('不能据此认定'),
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
assert((await page.locator('#photo-scope-note').textContent()).includes('94/95/97'),
 'Physical photo comparison must identify the correct A rig, not B');
// Keep candidate part selected for metadata, but hide the large cyan bounding
// box in evidence comparison screenshots; the real stage remains fully visible.
await page.locator('#toggle-dim').click();
await page.locator('#btn-photo94').click();
await selectBOM('A05');
assert((await page.locator('#part-detail').textContent()).includes('L形薄金属折弯'),
 'Photo 94 is a bent L sheet, not a random horizontal steel rod');
assert((await page.locator('#photo-94-mechanics').getAttribute('data-folded'))==='true');
assert((await page.locator('#photo-94-mechanics').getAttribute('data-top-fasteners'))==='2',
 'Photo94 requires two visible top bolt heads on the bent L sheet');
await page.waitForTimeout(500);
await page.screenshot({path:'Transfer-Station-V26-Photo94-G40-L-Bracket-A.png',fullPage:true});
await page.locator('#btn-photo95').click();
await selectBOM('A15');
assert((await page.locator('#part-detail').textContent()).includes('T25M'),
 '95.jpg shows A15 two-axis T25M below VC13M');
await page.waitForTimeout(350);
await page.screenshot({path:'Transfer-Station-V26-Photo95-T25M-A.png',fullPage:true});
await page.locator('#btn-photo97').click();
await selectBOM('A03');
assert((await page.locator('#part-detail').textContent()).includes('VC13M'),
 '97.jpg shows upright front-face VC13M micrometer, not B V25M');
await page.waitForTimeout(350);
await page.screenshot({path:'Transfer-Station-V26-Photo97-VC13M-A.png',fullPage:true});
await page.locator('#toggle-dim').click();
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
// Photo-specific part checks leave A03 in the BOM search. Clear that filter
// before counting the complete A catalog; this is a test state issue.
await page.locator('#bom-query').fill('');
const aRows=await page.locator('#bom-body tr').count();
assert(aRows>=14,'A BOM missing revised parts');
await page.locator('#close-bom').click();
await page.screenshot({path:'Transfer-Station-Preview-A.png',fullPage:true});
if(fatal.length){console.error(fatal.slice(0,12));throw Error('Browser errors: '+fatal.join(' | '))}
console.log(JSON.stringify({ok:true,B_subsystems:partCountB,B_BOM:all,B_priced:priced,A_BOM:aRows,selectedDim:dimensions}));
await browser.close();
