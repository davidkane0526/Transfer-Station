// QA only: renders the actual official NFP shell STEP converted privately to STL.
// No OEM CAD file or mesh is uploaded by the workflow, only a PNG screenshot.
import {chromium} from 'playwright-core';
import fs from 'node:fs';
const file=process.env.OEM_STL_PATH;
if(!file||!fs.existsSync(file))throw Error('Set OEM_STL_PATH to privately converted OEM STL');
const browser=await chromium.launch({headless:true,
  executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
  args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1600,height:960},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await page.waitForSelector('#viewer canvas');
 await page.locator('#open-bom').click();
 await page.locator('#bom-query').fill('NFP-1462C');
 const row=page.locator('#bom-body tr').filter({has:page.locator('td').filter({hasText:/^B09$/})});
 if(await row.count()!==1)throw Error('NFP B09 not found');
 await row.click();
 await page.locator('#cad-profile').selectOption('nfp1462c');
 await page.locator('#cad-file').setInputFiles(file);
 await page.waitForFunction(()=>document.getElementById('import-status').textContent.includes('导入 NFP'),{timeout:20000});
 const status=await page.locator('#import-status').textContent();
 if(!status.includes('nfp1462c')||!status.includes('167.5'))throw Error('OEM mesh dimensions not accepted: '+status);
 await page.locator('#btn-sample-stack').click();
 await page.waitForTimeout(1800);
 await page.screenshot({path:'NFP-1462C-OEM-NATIVE-SHELL-PREVIEW.png',fullPage:true});
 console.log('Official manufacturer shell mesh displayed privately, 167.5mm drive axis, QA:',status);
 if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close()}
