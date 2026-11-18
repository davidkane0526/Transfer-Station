import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';

const url=process.env.TRANSFER_PREVIEW??'http://127.0.0.1:4175/';
const browser=await chromium.launch({
  headless:true,executablePath:process.env.CHROME_PATH??'/usr/bin/chromium',
  args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']
});
try {
  const page=await browser.newPage({viewport:{width:1450,height:850},acceptDownloads:true});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  for(const platform of ['A','B']){
    const preview=new URL(url);
    preview.searchParams.set('platform',platform);
    await page.goto(preview.href,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(key=>window.__activePlatformProbe?.().platform===key,platform);
    if(platform==='A')await page.waitForFunction(()=>Boolean(window.__reviewedAFilmAssemblyProbe?.()));
    const checks=await page.locator('#explode').evaluate(input=>{
      return [0,6,10,20,27,31,41,44,49,54,59,63,68,72,78,85,92,100,0].map(value=>{
        input.value=String(value);
        input.dispatchEvent(new Event('input',{bubbles:true}));
        return [value,window.__stagedExplosionProbe()];
      });
    });
    const poses=new Map(checks);
    const clearance=Math.min(...checks.map(([,pose])=>pose.opticalGap));
    assert.ok(clearance>0,platform+' objective clearance');
    assert.deepEqual(poses.get(0).boreClear,[true,true,true,true],platform+' fastener passage');
    assert.ok(checks.every(([,pose])=>pose.serviceOpen.every(Boolean)),platform+' rear service channels');
    assert.ok(checks.every(([,pose])=>pose.slideToOptics>0),platform+' slide to objectives clearance');
    assert.equal(poses.get(44).coverY,poses.get(0).coverY,platform+' chuck must wait for the screws');
    assert.ok(poses.get(44).screwAboveCover>0,platform+' screws clear before the chuck rises');
    assert.ok(poses.get(100).screwAboveCover>0,platform+' screw clearance at full explosion');
    assert.ok(poses.get(100).coverY>poses.get(44).coverY);
    assert.deepEqual(checks[0],checks.at(-1),platform+' reverse assembly');
    await page.locator('#explode').fill('100');
    await page.locator('#inspection-fit').click();
    if(process.env.TRANSFER_SHOTS)await page.screenshot({path:process.env.TRANSFER_SHOTS+'-'+platform+'.png'});
    await page.locator('#open-bom').click();
    assert.equal(await page.locator('#bom-body tr').first().locator('td').count(),13);
    const hardware=page.locator('#bom-body tr').filter({hasText:platform+'-H01'});
    assert.equal(await hardware.count(),1);
    assert.match(await hardware.innerText(),/M6×/);
    if(platform==='A'){
      const next=page.waitForEvent('download');
      await page.locator('#export-all-csv').click();
      const file=await next;
      assert.equal(file.suggestedFilename(),'Transfer_Station_A_B_Procurement_BOM.csv');
      const csv=await readFile(await file.path(),'utf8');
      assert.ok(csv.startsWith('\uFEFF"id",'));
      assert.equal(csv.split('\r\n').length,105);
      for(const id of ['A-H06','B-H12','A05CS','B35'])assert.ok(csv.includes('"'+id+'"'));
      assert.match(csv,/"traceability","connection","quoteStatus"/);
      if(process.env.TRANSFER_CSV)await file.saveAs(process.env.TRANSFER_CSV);
    }
    console.log(platform+' staged sequence, four bore axes, BOM and return pose passed. Minimum sampled optical gap: '+clearance+' mm.');
  }
  assert.deepEqual(errors,[]);
}finally{
  await browser.close();
}
