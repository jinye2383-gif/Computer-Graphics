// HTTP 集成检查；完整交互回归由 browser-check.cjs 执行。
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({
    channel: process.env.TEST_BROWSER || 'msedge',
    headless: true,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
  });
  try {
    const page = await browser.newPage({viewport: {width: 1280, height: 900}});
    const errors = [];
    const assets = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      assets.push({url: response.url(), status: response.status()});
      if (response.status() >= 400) errors.push(response.url());
    });
    page.on('requestfailed', request => errors.push(request.url()));
    const url = 'http://127.0.0.1:5174';
    await page.goto(url);
    await page.waitForFunction(() => document.querySelector('#status').textContent === '生长完成');
    assert.match(await page.locator('#draw-count').innerText(), /20,000 \/ 20,000/);
    await page.locator('canvas').focus();
    await page.keyboard.press('2');
    assert.match(await page.locator('#algorithm-badge').innerText(), /LINES/);
    await page.keyboard.press('3');
    assert.match(await page.locator('#algorithm-badge').innerText(), /TRIANGLES/);
    const graphics = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      const gl = canvas.getContext('webgl2');
      const pixels = new Uint8Array(canvas.width * canvas.height * 4);
      gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      let visiblePixels = 0;
      for (let i = 3; i < pixels.length; i += 4) if (pixels[i]) visiblePixels++;
      return {version: gl.getParameter(gl.VERSION), error: gl.getError(), visiblePixels};
    });
    assert.ok(graphics.visiblePixels > 1000);
    assert.equal(graphics.error, 0);
    assert.equal(assets.filter(asset => /\/(?:Common|js)\/.*\.js$/.test(asset.url)).length, 8);
    assert.deepEqual(errors, []);
    const report = {
      timestamp: new Date().toISOString(), url, browser: await browser.version(),
      checks: ['All eight local JavaScript files load over HTTP', 'WebGL 2.0 renders 20000 chaos points', 'Keyboard selects LINES and TRIANGLES', 'Solid framebuffer has visible pixels and no GL errors', 'No failed requests or JavaScript exceptions'],
      graphics, assets, errors
    };
    fs.writeFileSync(path.resolve(__dirname, '../verification-http.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
