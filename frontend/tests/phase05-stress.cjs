const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium, firefox, webkit, expect } = require('@playwright/test');
const root = path.resolve(__dirname, '../..'), site = process.env.E2E_SITE_URL || 'http://localhost:3001';
assert.equal(new URL(site).hostname, 'localhost');
const fixture = JSON.parse(fs.readFileSync(path.join(root, 'work/e2e-fixtures.json')))[0];
const out = path.join(root, 'work/transformation/phase05');
// This is computed text-size stress, not native browser zoom or a physical keyboard test.
(async () => {
  const results = [];
  for (const engine of ['chrome', 'firefox', 'webkit']) {
    const browser = engine === 'chrome' ? await chromium.launch({channel:'chrome'}) : await ({firefox, webkit}[engine]).launch();
    try {
      for (const language of ['ar', 'en']) {
        const context = await browser.newContext({viewport:{width:390,height:420},hasTouch:true,reducedMotion:'reduce'});
        await context.addInitScript(({fixture, language}) => {
          localStorage.setItem('watsstore_lang',language);
          localStorage.setItem('watsstore_theme','light');
          localStorage.setItem('watsstore_merchant_token',fixture.token);
          localStorage.setItem('watsstore_user',JSON.stringify(fixture.user));
        }, {fixture,language});
        let delayed = 0;
        await context.route('http://localhost:5000/**', async route => {
          assert.equal(route.request().method(), 'GET', 'Stress suite must remain read-only');
          delayed++;
          await new Promise(resolve => setTimeout(resolve, 400));
          await route.continue();
        });
        const page = await context.newPage();
        for (const [name, route, ready] of [
          ['setup','/dashboard/setup','.merchant-setup nav button'],
          ['registration','/register','form button[type=submit]'],
          ['store','/s/'+fixture.slug,'.ws-product-image'],
        ]) {
          await page.goto(site+route,{waitUntil:'networkidle'});
          await expect(page.locator(ready).first()).toBeVisible();
          const changed = await page.evaluate(() => {
            const elements = [...document.body.querySelectorAll('*')].filter(e => ['INPUT','TEXTAREA','SELECT','BUTTON'].includes(e.tagName) || [...e.childNodes].some(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim()));
            const sizes = elements.map(e => parseFloat(getComputedStyle(e).fontSize));
            elements.forEach((e,i) => e.style.setProperty('font-size', sizes[i]*2+'px','important'));
            return elements.length;
          });
          assert.ok(changed > 10);
          await page.screenshot({path:path.join(out,`${engine}-${language}-${name}-text200-height420.png`),fullPage:true});
          const overflow = await page.evaluate(() => [...document.body.querySelectorAll('*')].map(e=>({tag:e.tagName,cls:e.className,left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right})).filter(r=>r.left < -1 || r.right > innerWidth+1));
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1), true, name+' text-size overflow '+JSON.stringify(overflow.slice(0,15)));
          if (name === 'setup') {
            const last = page.locator('.merchant-setup nav button').last();
            await last.click();
            await expect(last).toHaveAttribute('aria-current','step');
          }
          await page.screenshot({path:path.join(out,`${engine}-${language}-${name}-text200-height420.png`),fullPage:true});
          results.push({engine,language,page:name,viewport:{width:390,height:420},textScale:2,network:'400ms per API request; no bandwidth emulation',productionData:false,status:'PASS'});
        }
        assert.ok(delayed > 0);
        await context.close();
      }
    } finally { await browser.close(); }
  }
  fs.writeFileSync(path.join(out,'stress.json'),JSON.stringify(results,null,2));
  console.log('PASS',results.length,'text-size / delayed API / narrow-height cases');
})().catch(error => {console.error(error);process.exitCode=1;});
