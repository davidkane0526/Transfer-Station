import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';

// Pass TRANSFER_STAGE_SOURCE=stl for a preview with the user's private asset.
const preview=process.env.TRANSFER_A_PREVIEW||'http://127.0.0.1:8765/?platform=A';
const expectedSource=process.env.TRANSFER_STAGE_SOURCE||'registered';
const browser=await chromium.launch({
  headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
  args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']
});

try{
  const page=await browser.newPage();
  const pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(error.message));
  if(expectedSource==='registered')await page.route('**/private/**',r=>r.fulfill({status:404,body:''}));
  await page.goto(preview);
  await page.waitForFunction(()=>window.__reviewedAFilmAssemblyProbe?.());
  const assembly=()=>page.evaluate(()=>window.__reviewedAFilmAssemblyProbe());
  const installed=await assembly();
  assert.equal(installed.source,expectedSource);
  const expected={
    A15Y:[[0,0,1],[-26,34.5,32.5],[-26,34.5,95.5]],
    A15X:[[-1,0,0],[-32.5,46,-15],[-78.5,46,-15]],
    A03:[[0,1,0],[-21,61,6],[-21,114,6]],
    A04L:[[-1,0,0],[-20,155,-13],[-53,155,-13]],
    A04:[[0,0,1],[-15,176,20],[-15,176,60]]
  };
  for(const [part,[axis,seat,tip]] of Object.entries(expected)){
    assert.deepEqual(installed.drives[part],{axis,seat,tip,profileCount:5},part+' photo-driven mounting');
  }
  if(process.env.TRANSFER_FILM_SHOTS){
    await page.locator('[data-scope=film]').click();
    for(const name of ['front','left']){
      await page.locator('#inspection-film-'+name).click();
      await page.screenshot({path:process.env.TRANSFER_FILM_SHOTS+'-'+name+'.png'});
    }
    await page.locator('[data-scope=all]').click();
  }

  assert(installed.matingGaps.every(gap=>typeof gap==='number'&&Math.abs(gap)<.3),
    'Installed faces must meet on the stack datum: '+installed.matingGaps);
  assert(installed.equalClampLengths);
  assert.deepEqual(installed.shaftBoresOpen,[true,true]);
  assert.equal(installed.bounds.A17[0][1],20);
  assert.equal(installed.bounds.A17[1][1],installed.bounds.A15[0][1]);
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
  console.log('Platform A '+expectedSource+' registration, deck contacts, glass clamp and explosion passed.');
}finally{
  await browser.close();
}
