const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('@playwright/test');

const root = path.resolve(__dirname, '../..');
const site = process.env.E2E_SITE_URL || 'http://localhost:3001';
const fixtures = JSON.parse(fs.readFileSync(path.join(root, 'work/e2e-fixtures.json'), 'utf8'));

const outDir = path.join(root, 'work/transformation/screenshots');
fs.mkdirSync(outDir, { recursive: true });

const THEMES = [
  'editorial-luxe',
  'street-pulse',
  'pure-beauty',
  'tech-grid',
  'fresh-market',
  'living-space',
  'golden-atelier',
  'active-motion',
  'little-joy',
  'crafted-story'
];

async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

(async () => {
  console.log(`Starting Visual Regression Screenshot Capture...`);
  const storeSlug = fixtures[0].slug;
  const merchant = fixtures[0];

  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  try {
    for (const theme of THEMES) {
      console.log(`Capturing screenshots for theme: ${theme}...`);

      // 1. Mobile (390px)
      {
        const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
        const page = await context.newPage();
        await page.goto(`${site}/s/${storeSlug}?theme=${theme}`, { waitUntil: 'networkidle' });
        await settle(page);
        await page.screenshot({ path: path.join(outDir, `${theme}-mobile-390.png`), fullPage: false });
        await context.close();
      }

      // 2. Tablet (768px)
      {
        const context = await browser.newContext({ viewport: { width: 768, height: 1024 } });
        const page = await context.newPage();
        await page.goto(`${site}/s/${storeSlug}?theme=${theme}`, { waitUntil: 'networkidle' });
        await settle(page);
        await page.screenshot({ path: path.join(outDir, `${theme}-tablet-768.png`), fullPage: false });
        await context.close();
      }

      // 3. Desktop (1280px)
      {
        const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
        const page = await context.newPage();
        await page.goto(`${site}/s/${storeSlug}?theme=${theme}`, { waitUntil: 'networkidle' });
        await settle(page);
        await page.screenshot({ path: path.join(outDir, `${theme}-desktop-1280.png`), fullPage: false });
        await context.close();
      }

      // 4. Standalone Theme Preview (Theme switcher view)
      {
        const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
        const page = await context.newPage();
        await page.goto(`${site}/theme-preview/${storeSlug}?theme=${theme}`, { waitUntil: 'networkidle' });
        await settle(page);
        await page.screenshot({ path: path.join(outDir, `${theme}-theme-preview-mobile.png`), fullPage: false });
        await context.close();
      }
    }

    // 5. Merchant Dashboard Preview Screenshots
    {
      const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      await context.addInitScript(({ token, user }) => {
        localStorage.setItem('watsstore_lang', 'ar');
        localStorage.setItem('watsstore_merchant_token', token);
        localStorage.setItem('watsstore_user', JSON.stringify(user));
      }, { token: merchant.token, user: merchant.user });

      const page = await context.newPage();
      await page.goto(`${site}/dashboard/themes`, { waitUntil: 'networkidle' });
      await settle(page);

      // Open preview modal
      const previewBtn = page.locator('button[title*="معاينة"], button:has-text("معاينة")').first();
      await previewBtn.click();
      await settle(page);

      // Desktop preview screenshot
      await page.screenshot({ path: path.join(outDir, `merchant-preview-desktop.png`), fullPage: false });

      // Mobile switcher
      const mobileBtn = page.locator('button[aria-label="عرض شاشة الموبايل"], button:has-text("موبايل")').first();
      await mobileBtn.click();
      await settle(page);
      await page.screenshot({ path: path.join(outDir, `merchant-preview-mobile-device.png`), fullPage: false });

      await context.close();
    }

    console.log(`✓ All visual regression screenshots captured into ${outDir}`);

  } finally {
    await browser.close();
  }
})().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
