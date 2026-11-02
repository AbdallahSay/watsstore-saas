const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium, firefox, webkit, expect } = require('@playwright/test');

const root = path.resolve(__dirname, '../..');
const site = process.env.E2E_SITE_URL || 'http://localhost:3000';
const api = process.env.E2E_API_URL || 'http://localhost:5000/api';
assert.equal(new URL(site).hostname, 'localhost', 'Never run browser writes against production');
assert.equal(new URL(api).hostname, 'localhost', 'Only isolated fixture backend is allowed');

const fixture = JSON.parse(fs.readFileSync(path.join(root, 'work/e2e-fixtures.json'), 'utf8'))[0];
const themes = ['editorial-luxe','street-pulse','pure-beauty','tech-grid','fresh-market',
  'living-space','golden-atelier','active-motion','little-joy','crafted-story'];
const output = path.join(root, 'work/transformation/theme-preview');
fs.mkdirSync(output, { recursive: true });
const report = [];

async function settings() {
  const res = await fetch(api + '/merchant/commerce/settings', {
    headers: { Authorization: 'Bearer ' + fixture.token }
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  return { publishedTheme: data.publishedTheme, draftTheme: data.draftTheme };
}

async function inspect(page, theme, width, engine) {
  const dialog = page.getByTestId('merchant-theme-preview');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: /موبايل/ }).click();
  const canvas = page.getByTestId('merchant-preview-canvas');
  await expect(canvas.locator('.ws-storefront')).toHaveAttribute('data-theme', theme);
  const bounds = await canvas.boundingBox();
  assert.ok(bounds, 'Preview frame exists');
  assert.ok(bounds.x >= -1 && bounds.x + bounds.width <= width + 1,
    'Preview frame fits viewport at ' + width + 'px for ' + theme);

  const metrics = await page.evaluate(() => {
    const canvas = document.querySelector('[data-testid="merchant-preview-canvas"]');
    const grid = canvas.querySelector('.ws-product-grid');
    const cr = canvas.getBoundingClientRect();
    const overflowing = [];
    for (const el of canvas.querySelectorAll('.ws-catalog-product, .ws-primary-action, .ws-secondary-action, .ws-product-info h3')) {
      const r = el.getBoundingClientRect();
      if (r.width && r.height && (r.left < cr.left - 2 || r.right > cr.right + 2)) {
        overflowing.push((el.className || el.tagName).toString().slice(0, 80));
      }
    }
    return {
      pageOverflow: document.documentElement.scrollWidth > innerWidth + 2,
      columns: grid ? getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
      overflowing: overflowing.slice(0, 8),
      canvasScrollWidth: canvas.scrollWidth,
      canvasClientWidth: canvas.clientWidth
    };
  });
  assert.equal(metrics.pageOverflow, false, 'No page horizontal overflow: ' + engine + ' ' + width);
  assert.ok(metrics.columns <= 2, 'Mobile preview should show <=2 product columns: ' + theme + ' ' + engine);
  assert.deepEqual(metrics.overflowing, [], 'Preview card/button overflow: ' + theme + ' ' + engine);
  report.push({ engine, width, theme, status: 'PASS', columns: metrics.columns });
  if (width === 390) {
    await canvas.screenshot({path: path.join(output, engine + '-' + theme + '-mobile.png')});
  }
  await dialog.getByRole('button', { name: 'إغلاق المعاينة' }).click();
  await expect(dialog).toHaveCount(0);
}

(async () => {
  const original = await settings();
  for (const engine of (process.env.AUDIT_ENGINES || 'chrome,firefox,webkit').split(',')) {
    const browser = engine === 'chrome'
      ? await chromium.launch({channel:'chrome'})
      : await {firefox, webkit}[engine].launch();
    try {
      for (const width of [320, 390]) {
        const context = await browser.newContext({
          viewport:{width,height:844},hasTouch:true,reducedMotion:'reduce'
        });
        await context.addInitScript(fixture => {
          localStorage.setItem('watsstore_lang', 'ar');
          localStorage.setItem('watsstore_theme', 'light');
          localStorage.setItem('watsstore_merchant_token', fixture.token);
          localStorage.setItem('watsstore_user', JSON.stringify(fixture.user));
        }, fixture);
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', err => errors.push(err.message));
        try {
          await page.goto(site + '/dashboard/themes', {waitUntil:'networkidle'});
          await expect(page.getByText('سوق القوالب وتخصيص المتجر')).toBeVisible();
          for (const theme of themes) {
            const article = page.locator('article').filter({
              has: page.locator('h2').filter({hasText: new RegExp(theme.replace(/[.*+?^\x24{}()|[\]\\]/g, '\\$&'), 'i')})
            });
            await expect(article).toHaveCount(1);
            await article.getByRole('button', {name:'معاينة حية'}).click();
            await inspect(page, theme, width, engine);
          }
          assert.deepEqual(errors, [], 'No JavaScript errors in theme marketplace');
        } catch (err) {
          await page.screenshot({path:path.join(output, engine + '-' + width + '-failed.png')}).catch(()=>{});
          throw err;
        } finally {
          await context.close();
        }
      }
    } finally {
      await browser.close();
    }
  }
  assert.deepEqual(await settings(), original, 'Preview must not save or publish merchant settings');
  fs.writeFileSync(path.join(output, 'summary.json'), JSON.stringify(report, null, 2));
  console.log('Merchant theme previews passed: ' + report.length);
})().catch(err => { console.error(err); process.exitCode = 1; });
