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
assert(await page.locator('#bom-body tr').count()===1,'model search not filtering');
await page.locator('#bom-body tr').first().click();
assert((await page.locator('#part-detail').textContent()).includes('NFP-1462C'),'table click did not select NFP');
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
// A small fabricated local STL is used only for testing the replacement control.
// This exercise is not a vendor CAD or real manufactured component.
const tetra='solid fixture\\n'+[
 [[0,0,0],[8,0,0],[0,8,0]],
 [[0,0,0],[8,0,0],[0,0,8]],
 [[0,0,0],[0,8,0],[0,0,8]],
 [[8,0,0],[0,8,0],[0,0,8]]
].map(v=>'facet normal 0 0 1\\nouter loop\\n'+v.map(p=>'vertex '+p.join(' ')).join('\\n')+'\\nendloop\\nendfacet\\n').join('')+'endsolid fixture';
await page.locator('#cad-file').setInputFiles({name:'qa_fixture.stl',mimeType:'model/stl',buffer:Buffer.from(tetra)});
await page.waitForFunction(()=>document.getElementById('import-status').textContent.includes('已导入'),{timeout:9000});
assert((await page.locator('#import-status').textContent()).includes('qa_fixture.stl'),'local STL import did not complete');
// Verify A's corrected base-stage relation and BOM
await page.locator('#explode').fill('0');
await page.locator('#sample-move').fill('0');
await page.locator('#rotate-sample').fill('0');
await page.locator('#show-a').click();
await page.waitForTimeout(600);
assert((await page.locator('#platform-caption').textContent()).includes('平台 A'),'switch to A failed');
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