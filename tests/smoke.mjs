import {chromium} from 'playwright-core';
const browser=await chromium.launch({
  headless:true,
  executablePath:process.env.CHROME_PATH || '/usr/bin/google-chrome',
  args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']
});
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
const fatal=[];
page.on('pageerror',e=>fatal.push(String(e)));
page.on('console',m=>{if(m.type()==='error'&& !/favicon/i.test(m.text()))fatal.push(m.text())});
await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
await page.waitForSelector('#viewer canvas',{timeout:30000});
await page.waitForTimeout(1800);
await page.screenshot({path:'Transfer-Station-Preview-B.png',fullPage:true});
await page.locator('#show-a').click();
await page.waitForTimeout(600);
if(!(await page.locator('#platform-caption').textContent()).includes('平台 A'))throw new Error('Platform A switch failed');
await page.locator('#show-b').click();
await page.locator('#open-bom').click();
if(await page.locator('#bom-body tr').count() < 18)throw new Error('BOM population failed');
await page.locator('#close-bom').click();
if(fatal.length){console.error(fatal.slice(0,10));throw Error('Browser errors: '+fatal.join(' | '))}
console.log('Viewer smoke test successful, screenshot saved.');
await browser.close();
