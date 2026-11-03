import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';

// Regression for the user's actual failure: platform B must render the
// COMPLETE apparatus, not a photograph-only isolated film stage.
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
 assert.match(await page.locator('#platform-caption').innerText(),/平台 B.*全系统布局/);
 const rect=await page.locator('#viewer canvas').boundingBox();
 assert(rect && rect.width>=400 && rect.height>=400,'3D canvas is missing or collapsed');
 for(const category of ['base','film','sample','heat','microscope','vacuum','external']){
   assert.equal(await page.locator('#group-list input[data-group="'+category+'"]').count(),1,
    'Model B scene is missing group '+category);
 }
 assert.match(await page.locator('#photo-ledger').innerText(),/B08/);
 assert.match(await page.locator('#photo-ledger').innerText(),/B09/);
 assert.equal(await page.locator('#sample-move').isEnabled(),true);
 assert.equal(await page.locator('#btn-sample-stack').isEnabled(),true);
 await page.screenshot({path:'Transfer-Station-ModelB-Full-Assembly.png'});
 await page.locator('#open-bom').click();
 const rows=await page.locator('#bom-body tr').allTextContents();
 for(const id of ['B01','B03','B07','B08','B09','B10','B11','B12',
     'B14','B15','B16','B17','B18','B19','B20','B21','B22','B23',
     'B29','B30','B31','B32']){
   assert(rows.some(row=>row.trim().startsWith(id)),
     'Model B full-layout BOM has lost essential component '+id);
 }
 for(const retired of ['B02','B04','B05','B06','B24','B25','B26','B27']){
   assert(!rows.some(row=>row.trim().startsWith(retired)),
     'Current photo arm must not include retired alternative '+retired);
 }
 await page.locator('#close-bom').click();
 await page.locator('#btn-b-archive').click();
 for(const category of ['sample','heat','microscope','vacuum','external']){
   assert.equal(await page.locator('#group-list input[data-group="'+category+'"]').count(),1,
      'Switching film arm removed the '+category+' subsystem');
 }
 await page.locator('#btn-b-user-photos').click();
 assert.equal(await page.locator('#group-list input[data-group="sample"]').count(),1);
 assert.deepEqual(failures,[],'JavaScript errors in model B: '+failures.join('; '));
 console.log('Model B full visible assembly, both film profiles, critical BOM and camera: PASS');
} finally{
 await browser.close();
}