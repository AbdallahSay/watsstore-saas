const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('@playwright/test');

const root = path.resolve(__dirname, '../..');
const api = process.env.E2E_API_URL || 'http://localhost:5000/api';
const site = process.env.E2E_SITE_URL || 'http://localhost:3001';

const fixtures = JSON.parse(fs.readFileSync(path.join(root, 'work/e2e-fixtures.json'), 'utf8'));

const WIDTHS = [
  320, 344, 360, 375, 390, 393, 412, 414, 430, 480, 540, 600, 768, 820, 1024, 1280, 1440, 1920
];

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
  'crafted-story',
  'cafe-ritual',
  'pet-haven',
  'bloom-studio',
  'auto-circuit',
  'game-arena',
  'book-gallery',
  'optical-studio',
  'outdoor-trail',
  'travel-atelier',
  'office-pro'
];

async function apiJson(route, method = 'GET', body, token) {
  const r = await fetch(api + route, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  assert.equal(r.status, 200, `API ${route} failed with ${r.status}`);
  return r.json();
}

async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

// WCAG normal-text contrast for theme-adaptive, outlined WhatsApp controls.
function contrastRatio(foreground, background) {
  const parse = value => {
    const values = value.match(/\d+(?:\.\d+)?/g)?.slice(0, 3).map(Number);
    assert.ok(values && values.length === 3, 'Expected computed RGB color: ' + value);
    return values;
  };
  const lightness = value => parse(value).map(channel => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
  const a = lightness(foreground);
  const b = lightness(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

async function auditOutlinedWhatsApp(page, theme, lang) {
  const button = page.locator('.ws-theme-whatsapp-btn--catalog.ws-theme-whatsapp-btn--outlined');
  assert.equal(await button.count(), 1, 'Outlined catalog WhatsApp CTA missing: ' + theme);
  const colors = async () => button.evaluate(el => ({
    foreground: getComputedStyle(el.querySelector('.ws-theme-whatsapp-label')).color,
    background: getComputedStyle(el).backgroundColor,
    storefrontBackground: getComputedStyle(el.closest('.ws-storefront')).backgroundColor
  }));
  const normal = await colors();
  const normalRatio = contrastRatio(normal.foreground, normal.storefrontBackground);
  assert.ok(normalRatio >= 4.5,
    'Invisible/unreadable default outlined CTA: ' + theme + ' ' + lang + ' ratio=' + normalRatio.toFixed(2));
  await button.hover();
  // Allow theme hover transition to finish before measuring the final appearance.
  await page.waitForTimeout(250);
  const hovered = await colors();
  const hoverRatio = contrastRatio(hovered.foreground, hovered.background);
  assert.ok(hoverRatio >= 4.5,
    'Low-contrast hovered outlined CTA: ' + theme + ' ' + lang + ' ratio=' + hoverRatio.toFixed(2));
  return {
    normalText: normal.foreground, normalContrast: Number(normalRatio.toFixed(2)),
    hoverText: hovered.foreground, hoverBackground: hovered.background,
    hoverContrast: Number(hoverRatio.toFixed(2))
  };
}

async function measure(page) {
  return page.evaluate(() => {
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
    };

    const docWidth = document.documentElement.scrollWidth;
    const bodyWidth = document.body.scrollWidth;
    const maxScrollWidth = Math.max(docWidth, bodyWidth);
    const winWidth = window.innerWidth;
    const overflow = maxScrollWidth > winWidth + 1;

    // Measure WhatsApp button tokens and position
    const floatingWa = document.querySelector('.ws-theme-whatsapp-btn--floating');
    const footerWa = document.querySelector('.ws-footer .ws-theme-whatsapp-btn, .ws-footer-wa-btn');
    const catalogWa = document.querySelector('.ws-theme-whatsapp-btn--catalog');

    let waData = null;
    if (floatingWa || footerWa || catalogWa) {
      const target = floatingWa || footerWa || catalogWa;
      const cs = getComputedStyle(target);
      const rect = target.getBoundingClientRect();
      waData = {
        bg: cs.backgroundColor,
        color: cs.color,
        borderColor: cs.borderColor,
        borderRadius: cs.borderRadius,
        minHeight: cs.minHeight,
        minWidth: cs.minWidth,
        width: rect.width,
        height: rect.height,
        bottom: cs.bottom,
        zIndex: cs.zIndex,
        hasSvg: !!target.querySelector('svg.ws-theme-whatsapp-icon'),
        href: target.getAttribute('href') || '',
        text: target.textContent?.trim() || '',
      };
    }

    const count = document.querySelector('.ws-product-count');
    const countPill = count ? (() => {
      const box = count.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(count);
      const text = range.getBoundingClientRect();
      const eps = 2;
      return {
        visible: visible(count),
        textContained: text.left >= box.left - eps && text.right <= box.right + eps &&
          text.top >= box.top - eps && text.bottom <= box.bottom + eps,
        bg: getComputedStyle(count).backgroundColor,
      };
    })() : null;
    const quickAdds = Array.from(document.querySelectorAll('.ws-card-quick-add'));
    const brokenQuickAdds = quickAdds.filter((el) => {
      const rect = el.getBoundingClientRect();
      const card = el.closest('.ws-catalog-product')?.getBoundingClientRect();
      return !card || rect.left < card.left - 2 || rect.right > card.right + 2 ||
        rect.width < 44 || rect.height < 44 || el.scrollWidth > el.clientWidth + 3;
    }).map((el) => el.textContent?.trim().slice(0, 30));

    return {
      width: winWidth,
      scrollWidth: maxScrollWidth,
      overflow,
      waData,
      countPill,
      quickAddCount: quickAdds.length,
      brokenQuickAdds,
      heroCaptionCount: document.querySelectorAll('.ws-hero-art .ws-photo-caption').length,
      dir: document.documentElement.dir || 'ltr',
    };
  });
}

(async () => {
  console.log(`Starting Storefront Mobile Matrix across 18 viewports and 10 themes...`);
  const storeSlug = fixtures[0].slug;
  const storeData = await apiJson(`/public/stores/${storeSlug}`);
  const productSlug = storeData.products[0]?.slug;

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const results = [];
  const waAudit = [];

  try {
    for (const theme of THEMES) {
      console.log(`\n======================================================`);
      console.log(`TESTING THEME: ${theme.toUpperCase()}`);
      console.log(`======================================================`);

      for (const lang of ['ar', 'en']) {
        const context = await browser.newContext({
          viewport: { width: 390, height: 844 },
          reducedMotion: 'reduce'
        });

        await context.addInitScript(({ language }) => {
          localStorage.setItem('watsstore_lang', language);
        }, { language: lang });

        const page = await context.newPage();
        const pageErrors = [];
        page.on('pageerror', (e) => pageErrors.push(e.message));

        const storeUrl = `${site}/s/${storeSlug}?theme=${theme}`;
        await page.goto(storeUrl, { waitUntil: 'networkidle' });
        await settle(page);

        // 1. Verify theme class is present
        const storefrontEl = page.locator('.ws-storefront');
        assert.equal(await storefrontEl.count(), 1, `Storefront wrapper missing for theme ${theme}`);
        const themeClasses = await storefrontEl.getAttribute('class');
        assert.ok(
          themeClasses.includes(`ws-theme--${theme}`),
          `Expected .ws-theme--${theme} in "${themeClasses}"`
        );

        // 2. Measure viewports across all 18 widths
        const widthResults = [];
        for (const width of WIDTHS) {
          await page.setViewportSize({ width, height: 844 });
          await settle(page);
          const m = await measure(page);
          assert.equal(
            m.overflow,
            false,
            `Horizontal overflow detected on theme ${theme} (${lang}) at width ${width}px (scrollWidth: ${m.scrollWidth})`
          );
          assert.ok(m.countPill?.visible && m.countPill?.textContained,
            `Collection count escaped its badge: ${theme} ${lang} ${width}px`);
          assert.deepEqual(m.brokenQuickAdds, [],
            `Quick-add button overflow/touch size: ${theme} ${lang} ${width}px`);
          assert.equal(m.heroCaptionCount, 0, 'Hero must not show a random product label/price');
          if (theme !== 'fresh-market') {
            assert.ok(m.quickAddCount > 0, `Missing quick-add action for theme ${theme}`);
          }
          widthResults.push({ width, scrollWidth: m.scrollWidth, overflow: m.overflow });
        }

        // 3. Extra modes: Landscape & 200% Reflow
        for (const [mode, w, h] of [['landscape', 844, 390], ['200-reflow', 640, 450]]) {
          await page.setViewportSize({ width: w, height: h });
          await settle(page);
          const m = await measure(page);
          assert.equal(
            m.overflow,
            false,
            `Overflow in ${mode} on theme ${theme} (${lang})`
          );
        }

        // 4. WhatsApp Button inspection
        await page.setViewportSize({ width: 390, height: 844 });
        await settle(page);
        const waCheck = await measure(page);
        assert.ok(waCheck.waData, `WhatsApp button data missing for theme ${theme}`);
        assert.ok(waCheck.waData.hasSvg, `WhatsApp icon missing for theme ${theme}`);
        assert.ok(waCheck.waData.href.startsWith('https://wa.me/'), `Invalid wa.me link for theme ${theme}`);
        assert.ok(waCheck.waData.width >= 44 && waCheck.waData.height >= 44, `Touch target below 44px for theme ${theme}`);

        // Verify visible text on transparent outlines even before mouse hover (Street Pulse regression).
        const outlinedColors = await auditOutlinedWhatsApp(page, theme, lang);

        // Record for WhatsApp report
        waAudit.push({
          theme,
          lang,
          bg: waCheck.waData.bg,
          color: waCheck.waData.color,
          border: waCheck.waData.borderColor,
          radius: waCheck.waData.borderRadius,
          width: waCheck.waData.width,
          height: waCheck.waData.height,
          href: waCheck.waData.href,
          outlined: outlinedColors,
        });

        // A card has two separate actions: + adds directly; image/title opens product page.
        // No quick-view product modal should interrupt either action.
        if (theme !== 'fresh-market') {
          const directQuickAdd = page.locator('.ws-card-quick-add[data-quick-add-kind="direct"]').first();
          if (await directQuickAdd.count() > 0) {
            await directQuickAdd.click();
            await settle(page);
            assert.equal(await page.locator('.ws-cart').count(), 0,
              `Quick-add must not open a popup/drawer: ${theme} ${lang}`);
            assert.ok((await directQuickAdd.textContent()).includes('1'),
              `Quick-add should show quantity feedback: ${theme} ${lang}`);
          }
        }
        const firstProductImage = page.locator('.ws-catalog-product .ws-product-image').first();
        assert.ok((await firstProductImage.getAttribute('href')).includes('/p/'),
          'Card image must be a real product detail link');
        await firstProductImage.click();
        await page.waitForURL(/\/p\//);
        // Next.js can update the URL before the streamed product page has committed.
        // Verify the actual rendered details instead of racing route navigation.
        await page.locator('.ws-product-detail').waitFor({ state: 'visible', timeout: 15000 });
        assert.equal(await page.locator('.ws-product-detail').count(), 1,
          `Dedicated product detail page missing: ${theme} ${lang}`);
        assert.equal(await page.locator('[role="dialog"]').count(), 0,
          `Unexpected quick-view popup: ${theme} ${lang}`);
        await page.goto(storeUrl, { waitUntil: 'networkidle' });
        await settle(page);

        // 5. Complete Customer Shopping Journey Test
        console.log(`  -> Testing Customer Journey on ${theme} (${lang})...`);
        
        // Search & Filter
        const searchInput = page.locator('input[type="search"], input[placeholder*="بحث"], input[placeholder*="Search"]').first();
        if (await searchInput.isVisible()) {
          await searchInput.fill(storeData.products[0].name.slice(0, 3));
          await settle(page);
          await searchInput.clear();
          await settle(page);
        }

        // Category filter buttons
        const categoryButtons = page.locator('.ws-categories button');
        if (await categoryButtons.count() > 1) {
          await categoryButtons.nth(1).click();
          await settle(page);
          await categoryButtons.nth(0).click();
          await settle(page);
        }

        // Open Product Details
        const productUrl = `${site}/s/${storeSlug}/p/${productSlug}?theme=${theme}`;
        await page.goto(productUrl, { waitUntil: 'networkidle' });
        await settle(page);

        // Verify product page WhatsApp inquiry button
        const productWa = page.locator('.ws-theme-whatsapp-btn--product');
        assert.equal(await productWa.count(), 1, `Product WhatsApp inquiry button must exist on theme ${theme}`);
        const productWaHref = await productWa.getAttribute('href');
        assert.ok(productWaHref.includes(encodeURIComponent(storeData.products[0].name)), `Product wa link must contain product name`);

        // Add to Bag
        const addToBagBtn = page.locator('.ws-primary-action[type="submit"]');
        assert.equal(await addToBagBtn.count(), 1, `Add to Bag button missing on product page`);
        await addToBagBtn.click();
        await settle(page);

        // Open Cart Bag
        const bagBtn = page.locator('.ws-bag');
        if (await bagBtn.isVisible()) {
          await bagBtn.click();
          await settle(page);
          
          // Verify cart drawer is open
          const cartDrawer = page.locator('.ws-cart');
          assert.equal(await cartDrawer.count(), 1, `Cart drawer must open`);

          // Verify floating WhatsApp button is hidden while cart is open
          const isFloatingHidden = await page.evaluate(() => {
            const el = document.querySelector('.ws-theme-whatsapp-btn--floating');
            if (!el) return true;
            const cs = getComputedStyle(el);
            return cs.display === 'none' || cs.opacity === '0' || cs.visibility === 'hidden';
          });
          assert.equal(isFloatingHidden, true, `Floating WhatsApp button must be hidden when cart is open`);

          // Close Cart
          const closeBtn = page.locator('.ws-cart button[aria-label*="Close"], .ws-cart button[aria-label*="إغلاق"], .ws-cart>header button').first();
          if (await closeBtn.isVisible()) {
            await closeBtn.click();
            await settle(page);
          }
        }

        assert.equal(pageErrors.length, 0, `Page errors encountered in ${theme}: ${pageErrors.join(', ')}`);

        results.push({
          theme,
          lang,
          widthsTested: WIDTHS.length,
          allPassed: true,
          journeyPassed: true,
        });

        await context.close();
        console.log(`  ✓ Passed 18 viewports + journey for ${theme} (${lang})`);
      }
    }

    console.log(`\n======================================================`);
    console.log(`ALL 10 THEMES & 18 VIEWPORTS AUDITED SUCCESSFULLY!`);
    console.log(`======================================================`);

    // Write audit summary
    fs.writeFileSync(
      path.join(root, 'work/transformation/storefront-audit-summary.json'),
      JSON.stringify({ results, waAudit }, null, 2),
      'utf8'
    );

  } finally {
    await browser.close();
  }
})().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
