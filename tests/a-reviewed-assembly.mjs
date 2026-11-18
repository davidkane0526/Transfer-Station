import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';

// Run against a preview serving the user's ignored private/micro_stage_v2.stl.
const preview=process.env.TRANSFER_A_PREVIEW||'http://127.0.0.1:8765/?platform=A';
const browser=await chromium.launch({
  headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
  args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']
});

try{
  const page=await browser.newPage();
  const pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(error.message));
  await page.goto(preview);
  await page.waitForFunction(()=>window.__reviewedAFilmAssemblyProbe?.());
  const assembly=()=>page.evaluate(()=>window.__reviewedAFilmAssemblyProbe());
  const installed=await assembly();
  assert(installed.driveLeftAndFront,'VC13M must stay left and in front of its guide in monitor coordinates');
  assert(installed.equalClampLengths);
  assert.deepEqual(installed.shaftBoresOpen,[true,true]);
  assert.equal(installed.bounds.A17[0][1],20);
  assert.equal(installed.bounds.A17[1][1],installed.bounds.A15[0][1]);
  assert.equal(installed.bounds.A15Y[1][2],77);
  assert.equal(installed.bounds.A15X[0][0]+60.75,-59.5);
  assert(installed.bounds.A04[0][0]<-100 && installed.bounds.A04L[1][2]>50);
  const clamp=await page.evaluate(()=>window.__platformABareClampProbe());
  assert(clamp.visibleGlass);
  assert.equal(clamp.glassUpperFootGapMm,0);
  assert.equal(clamp.glassLowerBladeGapMm,0);
  assert.equal(clamp.screwGlassOverlapMm3,0);
  assert.equal(clamp.visibleWingScrewCount,2);
  assert(Math.abs(installed.workingLensCenter[0]-78)<.001);
  assert(Math.abs(installed.workingLensCenter[2])<.001);
  assert(installed.workingLensToSlideGap>4);

  const explode=value=>page.locator('#explode').evaluate((input,value)=>{
    input.value=value;
    input.dispatchEvent(new Event('input'));
  },value);
  await explode(100);
  const separated=(await assembly()).bounds;
  assert(separated.A15Y[0][1]>separated.A15[1][1]);
  assert(separated.A15X[0][1]>separated.A15Y[1][1]);
  assert(separated.A05G[0][1]>separated.A05C[1][1]);
  await explode(0);
  assert.deepEqual(await assembly(),installed);
  assert.deepEqual(pageErrors,[]);
  console.log('Platform A monitor registration, glass clamp and explosion passed.');
}finally{
  await browser.close();
}
