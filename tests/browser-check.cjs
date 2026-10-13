// QA dependency comes from the Codex runtime; Common/ libraries ship with the application.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:process.env.TEST_BROWSER||'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:1050},deviceScaleFactor:1});
 const errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',async dialog=>{errors.push(dialog.message());await dialog.dismiss();});
 await page.goto(process.env.TEST_URL||'http://127.0.0.1:5174');await page.waitForFunction(()=>document.querySelector('#gl-tag').textContent.includes('已连接'));
 const pass=s=>checks.push(s),stats=()=>page.locator('#draw-count').innerText();
 await page.waitForFunction(()=>document.querySelector('#status').textContent==='生长完成');assert.match(await stats(),/20,000 \/ 20,000/);pass('Chaos grows to 20000 points');
 // Inspect actual framebuffer pixels and WebGL errors, rather than trusting labels.
 const pixels=await page.evaluate(()=>{const c=document.querySelector('canvas'),gl=c.getContext('webgl2'),p=new Uint8Array(c.width*c.height*4);gl.readPixels(0,0,c.width,c.height,gl.RGBA,gl.UNSIGNED_BYTE,p);let ink=0;for(let i=3;i<p.length;i+=4)if(p[i])ink++;return {ink,error:gl.getError(),version:gl.getParameter(gl.VERSION),shaderVersion:gl.getParameter(gl.SHADING_LANGUAGE_VERSION),isWebGL2:gl instanceof WebGL2RenderingContext,common:['initShaders','vec2','flatten'].every(name=>typeof window[name]==='function')&&typeof window.WebGLUtils?.create3DContext==='function'};});assert.ok(pixels.ink>3000);assert.equal(pixels.error,0);assert.equal(pixels.isWebGL2,true);assert.equal(pixels.common,true);pass('Real WebGL 2.0 / GLSL ES 3.00 context with all three Common libraries; nonempty framebuffer and no GL error');
 const shots=path.resolve(__dirname,process.env.TEST_SCREENSHOTS||'../screenshots');fs.mkdirSync(shots,{recursive:true});
 await page.screenshot({path:path.join(shots,'01-points.png'),fullPage:true});
 await page.locator('#restart').click();await page.locator('canvas').focus();await page.waitForTimeout(300);await page.keyboard.press('Space');const stopped=await stats();await page.waitForTimeout(350);assert.equal(await stats(),stopped);await page.keyboard.press('Space');await page.waitForTimeout(250);assert.notEqual(await stats(),stopped);pass('Space pauses and resumes growth');
 await page.keyboard.press('2');assert.equal(await page.locator('#recursive').getAttribute('aria-pressed'),'true');assert.match(await stats(),/1,458/);pass('Key 2 selects LINES and recursive algorithm');
 await page.locator('#depth').fill('6');await page.locator('#depth').press('Tab');await page.waitForTimeout(100);assert.match(await stats(),/4,374/);pass('Depth 6 renders 729 leaf triangles without crashing');
 await page.locator('#depth').fill('5');await page.locator('#depth').press('Tab');await page.screenshot({path:path.join(shots,'02-lines.png'),fullPage:true});
 await page.locator('canvas').focus();await page.keyboard.press('3');assert.match(await stats(),/729/);await page.screenshot({path:path.join(shots,'03-solid.png'),fullPage:true});pass('Key 3 selects TRIANGLES');
 await page.keyboard.press('1');assert.equal(await page.locator('#recursive').getAttribute('aria-pressed'),'true');await page.waitForFunction(()=>document.querySelector('#status').textContent==='生长完成');assert.match(await stats(),/729 \/ 729/);pass('Key 1 shows same recursive leaf vertex set as points');
 const box=await page.locator('canvas').boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.wheel(0,-300);await page.waitForTimeout(100);assert.match(await page.locator('#zoom').innerText(),/1.57/);pass('Wheel zoom');
 const before=await page.locator('canvas').screenshot();await page.mouse.down();await page.mouse.move(box.x+box.width/2+80,box.y+box.height/2+40,{steps:5});await page.mouse.up();await page.waitForTimeout(100);const after=await page.locator('canvas').screenshot();assert.notDeepEqual(before,after);pass('Mouse drag changes rendered image');
 await page.locator('#reset').click();await page.waitForTimeout(80);assert.match(await page.locator('#zoom').innerText(),/1.00/);pass('View reset');
 for(const theme of ['sunset','ice','mint']){await page.selectOption('#palette',theme);await page.waitForTimeout(70);}pass('All three palette controls');
 await page.locator('#chaos').click();for(const n of ['5','6']){await page.selectOption('#polygon',n);await page.waitForFunction(()=>document.querySelector('#status').textContent==='生长完成');await page.screenshot({path:path.join(shots,`E1-polygon-${n}.png`),fullPage:true});}pass('E1 pentagon and hexagon grow to target');
 await page.locator('#count').fill('5000');await page.locator('#count').dispatchEvent('input');await page.waitForFunction(()=>document.querySelector('#status').textContent==='生长完成');assert.match(await stats(),/5,000 \/ 5,000/);pass('Minimum point count control');
 await page.locator('#size').fill('5');await page.locator('#size').dispatchEvent('input');assert.match(await page.locator('#size-value').innerText(),/5.0/);pass('Point size control');
 await page.locator('#recursive').click();await page.locator('#depth').fill('0');await page.locator('#depth').press('Tab');await page.locator('[data-mode="solid"]').click();await page.waitForFunction(()=>document.querySelector('#draw-count').textContent==='3 顶点');assert.match(await stats(),/3 顶点/);await page.locator('#depth').fill('99');await page.locator('#depth').press('Tab');assert.equal(await page.locator('#depth').inputValue(),'6');pass('Depth 0 and clamping invalid depth to 6');
 assert.deepEqual(errors,[]);pass('No browser JavaScript exceptions');
 const report={timestamp:new Date().toISOString(),url:page.url(),browser:await browser.version(),checks,pixels,errors};fs.writeFileSync(path.resolve(__dirname,process.env.TEST_REPORT||'../verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
