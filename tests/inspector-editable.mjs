import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';

const browser=await chromium.launch({
  executablePath:process.env.CHROME_PATH??'/usr/bin/chromium',
  headless:true,
  args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']
});
const context=await browser.newContext({
  viewport:{width:1460,height:900},
  permissions:['clipboard-read','clipboard-write']
});
const page=await context.newPage();
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
const base=new URL(process.env.TRANSFER_INSPECTION_PREVIEW??'http://127.0.0.1:8765/');
base.searchParams.set('platform','A');
const right=page.locator('#part-detail');
const selectPart=id=>page.locator('#inspection-parts [data-part-id="'+id+'"]').click();
const field=name=>right.locator('[data-record-field="'+name+'"]');
try{
  await page.goto(base.href,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__inspectionProbe?.());
  await selectPart('A34');
  await page.waitForFunction(()=>document.querySelector('#part-detail .inspection-manual-check'));
  assert.match(await right.innerText(),/尚未建立独立 3D 模型/);
  const check=right.getByRole('checkbox',{name:'人工确认此零件'});
  assert.equal(await check.isChecked(),false);
  await check.check();
  assert.equal(await check.isChecked(),true);
  await right.locator('.inspection-info > summary').click();
  const note=field('note');
  await note.getByRole('button',{name:'编辑'}).click();
  await note.getByRole('textbox',{name:'备注'}).fill('人工检查记录：已核对原始照片82');
  await note.getByRole('button',{name:'保存'}).click();
  assert.match(await right.locator('[data-field="note"]').innerText(),/已核对原始照片82/);
  const valueNode=right.locator('[data-field="note"]');
  assert.equal(await valueNode.evaluate(e=>e.tagName),'SPAN');
  assert.equal(await valueNode.evaluate(e=>getComputedStyle(e).userSelect),'text');
  await note.getByRole('button',{name:'复制'}).click();
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),'人工检查记录：已核对原始照片82');
  const datasheet=field('datasheet');
  await datasheet.getByRole('button',{name:'编辑'}).click();
  await datasheet.getByRole('textbox',{name:'规格链接'}).fill('https://www.thorlabs.com/');
  await datasheet.getByRole('button',{name:'保存'}).click();
  assert.equal(await datasheet.locator('.inspection-direct-link').getAttribute('href'),
    'https://www.thorlabs.com/');
  assert.equal(await datasheet.locator('.inspection-open-link').getAttribute('href'),
    'https://www.thorlabs.com/');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__inspectionProbe?.());
  await selectPart('A34');
  assert.equal(await right.getByRole('checkbox',{name:'人工确认此零件'}).isChecked(),true);
  await right.locator('.inspection-info > summary').click();
  assert.match(await right.locator('[data-field="note"]').innerText(),/已核对原始照片82/);
  await selectPart('A35');
  assert.match(await right.innerText(),/尚未建立独立 3D 模型/);
  assert.equal(await right.getByRole('checkbox',{name:'人工确认此零件'}).isChecked(),false);
  assert.deepEqual(errors,[]);
  console.log('PASS: local editing, text selection, clipboard, links, confirmation persistence, A34/A35 model status');
}finally{
  await browser.close();
}
