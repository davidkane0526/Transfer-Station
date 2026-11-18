import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';

const base=new URL(process.env.TRANSFER_INSPECTION_PREVIEW??'http://127.0.0.1:4180/');
const browser=await chromium.launch({
  executablePath:process.env.CHROME_PATH??'/usr/bin/chromium',headless:true,
  args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']
});
const page=await browser.newPage({viewport:{width:1500,height:900}});
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
const probe=()=>page.evaluate(()=>window.__inspectionProbe());
const selectScope=(scope)=>page.locator('#inspection-scopes [data-scope="'+scope+'"]').click();
const selectPart=(id)=>page.locator('#inspection-parts [data-part-id="'+id+'"]').click();
const field=(key)=>page.locator('#part-detail [data-field="'+key+'"]');
const slider=page.locator('#explode');
try{
  const a=new URL(base);a.searchParams.set('platform','A');
  await page.goto(a.href,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__reviewedAFilmAssemblyProbe?.());
  assert.equal(await page.locator('#inspection-scopes button').count(),4);
  await selectScope('film');
  const film=await probe();
  assert.equal(film.scope,'film');
  assert.ok(film.meshes.includes('A15')&&!film.meshes.includes('A33'));
  await slider.fill('100');
  const apart=await probe();
  assert.ok(apart.centers.A03[1]>film.centers.A03[1]);
  await selectScope('sample');
  const sample=await probe();
  assert.equal(sample.explosion,0);
  assert.ok(sample.meshes.includes('A33')&&!sample.meshes.includes('A12'));
  await slider.fill('70');
  const heat=await probe();
  assert.ok(heat.centers.A13[2]<sample.centers.A13[2]);
  await selectScope('optics');
  assert.ok((await probe()).meshes.includes('A12'));
  assert.equal((await probe()).explosion,0);
  await slider.fill('100');
  assert.ok((await probe()).centers.A11[0]>100);
  await selectScope('film');
  assert.equal((await probe()).explosion,100);
  await selectPart('A15');
  assert.deepEqual((await probe()).meshes,['A15']);
  const before=await probe();
  const canvas=await page.locator('#viewer canvas').boundingBox();
  const x=canvas.x+canvas.width*.52, y=canvas.y+canvas.height*.47;
  await page.mouse.move(x,y);
  await page.mouse.down();
  await page.mouse.move(x+110,y+40,{steps:8});
  await page.mouse.up();
  assert.notDeepEqual((await probe()).camera,before.camera);
  await page.locator('#inspection-wire').click();
  await page.waitForFunction(()=>window.__inspectionProbe().edgeMeshes>0);
  assert.equal(await page.locator('#inspection-wire').getAttribute('aria-pressed'),'true');
  if(process.env.TRANSFER_INSPECTION_SHOT)await page.screenshot({path:process.env.TRANSFER_INSPECTION_SHOT});
  await page.locator('#inspection-back').click();
  assert.equal((await probe()).scope,'film');
  assert.equal((await probe()).explosion,100);
  await page.locator('#inspection-wire').click();
  await selectPart('A15');
  if(process.env.TRANSFER_RECORD_TEST==='1'){
    const previous=await field('model').innerText();
    const sampleEdit='SQLite 回归 '+Date.now();
    await page.locator('#open-bom').click();
    await page.locator('#bom-body tr').filter({
      has:page.locator('td:first-child', {hasText:/^A15$/})
    }).locator('[data-edit-field="model"]').dblclick();
    await page.getByRole('textbox',{name:'型号',exact:true}).fill(sampleEdit);
    await page.getByRole('button',{name:'保存',exact:true}).click();
    await page.waitForFunction(text=>document.querySelector('[data-field=model]')?.textContent===text,sampleEdit);
    await page.locator('#open-bom').click();
    assert.equal(await page.locator('#bom-body tr').filter({hasText:sampleEdit}).count(),1);
    await page.locator('#close-bom').click();
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__reviewedAFilmAssemblyProbe?.());
    await selectPart('A15');
    await page.waitForFunction(text=>document.querySelector('[data-field=model]')?.textContent===text,sampleEdit);
    await page.getByRole('button',{name:'修改历史'}).click();
    await page.locator('.inspection-revision').first().getByText(sampleEdit,{exact:false}).waitFor();
    await page.getByRole('button',{name:'恢复此项原值'}).first().click();
    await page.waitForFunction(text=>document.querySelector('[data-field=model]')?.textContent===text,previous);
    assert.ok(await page.locator('.inspection-revision').count()>=2);
  }
  await page.locator('#show-b').click();
  await selectScope('film');
  const b=await probe();
  assert.ok(b.meshes.includes('B24')&&!b.meshes.includes('B21'));
  await slider.fill('100');
  const explodedB=await probe();
  assert.ok(explodedB.centers.B25[0]<b.centers.B25[0]&&explodedB.centers.B07[0]>b.centers.B07[0]);
  await selectScope('sample');
  assert.equal((await probe()).explosion,0);
  assert.ok((await probe()).meshes.includes('B19')&&!(await probe()).meshes.includes('B16'));
  await slider.fill('80');
  assert.ok(!(await probe()).meshes.includes('B40'));
  await selectPart('B40');
  assert.deepEqual((await probe()).meshes,['B40']);
  await page.locator('#inspection-back').click();
  assert.equal((await probe()).explosion,80);
  assert.deepEqual(errors,[]);
  console.log('Assembly scopes, independent progress, isolated orbit, structural wireframe and records passed.');
}finally{
  await browser.close();
}
