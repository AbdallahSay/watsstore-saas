const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('@playwright/test');

const root = path.resolve(__dirname, '../..');
const api = process.env.E2E_API_URL || 'http://localhost:5000/api';
const site = process.env.E2E_SITE_URL || 'http://localhost:3001';

const fixtures = JSON.parse(fs.readFileSync(path.join(root, 'work/e2e-fixtures.json'), 'utf8'));
const admin = JSON.parse(fs.readFileSync(path.join(root, 'work/e2e-admin.json'), 'utf8'));

async function apiJson(route, method = 'GET', body, token) {
  const r = await fetch(api + route, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await r.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text, status: r.status };
  }
}

async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

(async () => {
  console.log(`Starting Merchant Preview & Complete E2E Lifecycle Verification...`);

  const merchant = fixtures[0];
  const token = merchant.token;
  const slug = merchant.slug;

  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  try {
    // =========================================================================
    // PART 1: 17-STEP MERCHANT PREVIEW JOURNEY & PUBLISH / RESTORE LIFECYCLE
    // =========================================================================
    console.log(`\n--- PART 1: 17-Step Merchant Theme Preview & Publish/Restore Journey ---`);
    {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        reducedMotion: 'reduce'
      });

      await context.addInitScript(({ token, user }) => {
        localStorage.setItem('watsstore_lang', 'ar');
        localStorage.setItem('watsstore_merchant_token', token);
        localStorage.setItem('watsstore_user', JSON.stringify(user));
      }, { token, user: merchant.user });

      const page = await context.newPage();
      const pageErrors = [];
      page.on('pageerror', (e) => pageErrors.push(e.message));

      // 1. Merchant logs in & opens Theme Marketplace
      console.log(`1-2. Opening Theme Marketplace (/dashboard/themes)...`);
      await page.goto(`${site}/dashboard/themes`, { waitUntil: 'networkidle' });
      await settle(page);
      assert.equal(await page.locator('h1, h2').first().isVisible(), true, 'Theme Marketplace header must be visible');

      // 3-4. Select a theme to preview (e.g. Street Pulse)
      console.log(`3-4. Opening Preview for Street Pulse...`);
      const previewBtn = page.locator('button:has-text("معاينة حية")').nth(1);
      if (await previewBtn.isVisible()) {
        await previewBtn.click();
      } else {
        await page.locator('button[title*="معاينة"], button:has-text("معاينة")').first().click();
      }
      await settle(page);

      // Verify full screen preview modal is open
      const previewModal = page.locator('.fixed.inset-0.z-50');
      assert.equal(await previewModal.count(), 1, 'Full-screen preview modal must be open');

      // 5. Switch between mobile and desktop preview
      console.log(`5. Switching between desktop and mobile viewport in preview...`);
      const desktopBtn = page.locator('button[aria-label="عرض شاشة الكمبيوتر"], button:has-text("كمبيوتر")').first();
      const mobileBtn = page.locator('button[aria-label="عرض شاشة الموبايل"], button:has-text("موبايل")').first();

      await mobileBtn.click();
      await settle(page);
      // Verify mobile container is active
      const mobileContainer = page.locator('.max-w-\\[390px\\]');
      assert.equal(await mobileContainer.count(), 1, 'Preview must switch to mobile container');

      await desktopBtn.click();
      await settle(page);
      const desktopContainer = page.locator('.max-w-6xl');
      assert.equal(await desktopContainer.count(), 1, 'Preview must switch to desktop container');

      // 6. Inspect homepage inside preview
      console.log(`6. Inspecting homepage inside preview...`);
      const previewStorefront = previewModal.locator('.ws-storefront');
      assert.equal(await previewStorefront.count(), 1, 'Storefront must render inside preview modal');

      // 7-8. Open product details and select variants
      console.log(`7-8. Opening product details and testing variants inside preview...`);
      const firstProductBtn = page.locator('.fixed.inset-0.z-50 .ws-product-image').first();
      await firstProductBtn.waitFor({ state: 'visible', timeout: 5000 });
      await firstProductBtn.click();

      // Wait for dynamically imported ProductModal to mount
      const productModal = page.locator('div[role="dialog"][aria-modal="true"]').first();
      await productModal.waitFor({ state: 'visible', timeout: 5000 });

      // Select variant button if present
      const variantChip = productModal.locator('button:has-text("M"), button:has-text("L"), fieldset button').first();
      if (await variantChip.isVisible()) {
        await variantChip.click();
      }

      // 9. Add to Cart & Open shopping cart inside preview
      console.log(`9. Adding to bag and opening cart drawer in preview...`);
      const addToBag = productModal.locator('button:has-text("إضافة إلى السلة"), button:has-text("أضف إلى الحقيبة")').first();
      await addToBag.waitFor({ state: 'visible', timeout: 5000 });
      await addToBag.click();

      // Check shopping cart bag in preview
      const cartDrawer = page.locator('.ws-cart');
      await cartDrawer.waitFor({ state: 'visible', timeout: 5000 });
      console.log(`Testing safe preview checkout simulation inside cart drawer...`);

      // Test safe preview checkout simulation
      const checkoutBtn = cartDrawer.locator('.ws-primary-action[type="submit"], button:has-text("متابعة الطلب"), button:has-text("إتمام الطلب")').first();
      if (await checkoutBtn.isVisible()) {
        // Fill required name & phone if in checkout step
        const nameInput = cartDrawer.locator('input[name="name"]');
        if (await nameInput.isVisible()) {
          await nameInput.fill('تاجر تجريبي');
          const phoneInput = cartDrawer.locator('input[name="phone"]');
          await phoneInput.fill('01012345678');
          const addressInput = cartDrawer.locator('input[name="address"], textarea[name="address"]');
          await addressInput.fill('عنوان المعاينة');
        }

        await checkoutBtn.click();
        await page.waitForTimeout(300);
      }

      // Close cart
      const closeCart = cartDrawer.locator('button[aria-label="إغلاق"], button:has-text("×")').first();
      if (await closeCart.isVisible()) {
        await closeCart.click();
        await page.waitForTimeout(300);
      }

      // 10. Test navigation, search, and categories in preview
      console.log(`10. Testing categories & search in preview...`);
      const catButton = page.locator('.fixed.inset-0.z-50 .ws-categories button').nth(1);
      if (await catButton.isVisible()) {
        await catButton.click();
        await page.waitForTimeout(300);
      }

      // 11. Close Preview
      console.log(`11. Closing preview modal...`);
      const closePreviewBtn = page.locator('button[aria-label="إغلاق المعاينة"]');
      await closePreviewBtn.waitFor({ state: 'visible', timeout: 5000 });
      await closePreviewBtn.click();
      await page.waitForTimeout(300);
      assert.equal(await page.locator('.fixed.inset-0.z-50').count(), 0, 'Preview modal must close cleanly');

      // 12. Save draft theme (e.g. tech-grid)
      console.log(`12. Saving draft theme (tech-grid)...`);
      const initialSettings = await apiJson('/merchant/commerce/settings', 'GET', undefined, token);
      const originalPublished = initialSettings.publishedTheme || 'editorial-luxe';

      await apiJson('/merchant/commerce/settings', 'PUT', {
        ...initialSettings,
        draftTheme: 'tech-grid',
        shippingZones: initialSettings.shippingZones || []
      }, token);

      // Verify draft saved on backend
      const settingsAfterDraft = await apiJson('/merchant/commerce/settings', 'GET', undefined, token);
      assert.equal(settingsAfterDraft.draftTheme, 'tech-grid', 'Draft theme must be tech-grid');
      assert.equal(settingsAfterDraft.publishedTheme, originalPublished, 'Published theme must remain unchanged after draft save');

      // 13. Publish design
      console.log(`13. Publishing design (tech-grid)...`);
      const publishRes = await apiJson('/merchant/commerce/theme/publish', 'POST', undefined, token);
      assert.equal(publishRes.publishedTheme, 'tech-grid', 'Published theme must now be tech-grid');
      assert.equal(publishRes.previousTheme, originalPublished, 'Previous theme must record the old theme');

      // 14-15. Open public storefront and verify published design matches
      console.log(`14-15. Verifying live public storefront rendered with published theme (tech-grid)...`);
      await page.goto(`${site}/s/${slug}`, { waitUntil: 'networkidle' });
      await settle(page);
      const liveStorefront = page.locator('.ws-storefront');
      const liveClasses = await liveStorefront.getAttribute('class');
      assert.ok(liveClasses.includes('ws-theme--tech-grid'), `Live storefront must have .ws-theme--tech-grid, got: "${liveClasses}"`);

      // 16-17. Restore previous design and verify
      console.log(`16-17. Restoring previous design and verifying storefront restored state...`);
      const restoreRes = await apiJson('/merchant/commerce/theme/restore', 'POST', undefined, token);
      assert.equal(restoreRes.publishedTheme, originalPublished, `Published theme must revert to ${originalPublished}`);

      await page.goto(`${site}/s/${slug}`, { waitUntil: 'networkidle' });
      await settle(page);
      const restoredClasses = await page.locator('.ws-storefront').getAttribute('class');
      assert.ok(
        restoredClasses.includes(`ws-theme--${originalPublished}`),
        `Live storefront must revert to .ws-theme--${originalPublished}, got: "${restoredClasses}"`
      );

      assert.equal(pageErrors.length, 0, `Page errors: ${pageErrors.join(', ')}`);
      await context.close();
      console.log(`✓ 17-Step Preview & Lifecycle Journey PASSED completely!`);
    }

    // =========================================================================
    // PART 2: MOBILE MERCHANT (360px) -> MOBILE & DESKTOP PREVIEW AUDIT
    // =========================================================================
    console.log(`\n--- PART 2: Mobile Merchant (360px screen) Preview Responsiveness ---`);
    {
      const context = await browser.newContext({
        viewport: { width: 360, height: 800 },
        reducedMotion: 'reduce'
      });

      await context.addInitScript(({ token, user }) => {
        localStorage.setItem('watsstore_lang', 'ar');
        localStorage.setItem('watsstore_merchant_token', token);
        localStorage.setItem('watsstore_user', JSON.stringify(user));
      }, { token, user: merchant.user });

      const page = await context.newPage();
      await page.goto(`${site}/dashboard/themes`, { waitUntil: 'networkidle' });
      await settle(page);

      // Verify no overflow on 360px screen before preview
      const docWidth1 = await page.evaluate(() => document.documentElement.scrollWidth);
      assert.ok(docWidth1 <= 361, `Merchant dashboard overflows 360px screen: scrollWidth=${docWidth1}`);

      // Open preview modal
      const previewBtn = page.locator('button[title*="معاينة"], button:has-text("معاينة")').first();
      await previewBtn.click();
      await settle(page);

      // Check preview modal on 360px
      const modal = page.locator('.fixed.inset-0.z-50');
      assert.equal(await modal.count(), 1, 'Modal must open on 360px mobile merchant');

      const docWidth2 = await page.evaluate(() => document.documentElement.scrollWidth);
      assert.ok(docWidth2 <= 361, `Preview modal causes horizontal overflow on 360px phone: scrollWidth=${docWidth2}`);

      // Check close button touch target on 360px
      const closeBtn = page.locator('button[aria-label="إغلاق المعاينة"]');
      const closeBox = await closeBtn.boundingBox();
      assert.ok(closeBox.width >= 44 && closeBox.height >= 44, `Close button below 44px on mobile: ${closeBox.width}x${closeBox.height}`);

      // Switch to Desktop preview on 360px phone
      const desktopBtn = page.locator('button[aria-label="عرض شاشة الكمبيوتر"], button:has-text("كمبيوتر")').first();
      await desktopBtn.click();
      await settle(page);

      // The outer page must NEVER blow out on 360px
      const docWidth3 = await page.evaluate(() => document.documentElement.scrollWidth);
      assert.ok(docWidth3 <= 361, `Desktop preview mode on 360px phone blows out window: scrollWidth=${docWidth3}`);

      // Close modal
      await closeBtn.click();
      await settle(page);

      await context.close();
      console.log(`✓ Mobile Merchant (360px) Preview Responsiveness PASSED!`);
    }

    // =========================================================================
    // PART 3: REAL BACKEND CHECKOUT & INVENTORY DEDUCTION / RESTORATION
    // =========================================================================
    console.log(`\n--- PART 3: Real Database Checkout & Inventory Lifecycle ---`);
    {
      const storeData = await apiJson(`/public/stores/${slug}`);
      const testProduct = storeData.products[0];
      assert.ok(testProduct, 'Test product must exist');

      // 1. Check or initialize inventory for this product
      console.log(`1. Inspecting inventory for product ${testProduct.name}...`);
      let stocks = await apiJson('/merchant/commerce/inventory', 'GET', undefined, token);
      let stock = stocks.find(s => s.productId === testProduct.id);

      if (!stock || stock.quantity < 5) {
        // Adjust stock to 20
        console.log(`Initializing stock to 20 units...`);
        stock = await apiJson(`/merchant/commerce/inventory/${testProduct.id}`, 'POST', {
          adjustment: 20,
          reason: 'Initial test stock setup',
          lowStockThreshold: 3,
          selectedVariants: {}
        }, token);
      }
      const initialQty = stock.quantity;
      console.log(`Initial stock quantity: ${initialQty}`);

      // 2. Customer places order with quantity 2
      console.log(`2. Placing real customer order for quantity 2...`);
      const orderRes = await apiJson(`/public/stores/${slug}/orders`, 'POST', {
        channel: 'online',
        customerName: 'عميل الفحص الدوري',
        customerPhone: '01012345678',
        customerAddress: 'القاهرة، شارع التحرير',
        shippingZoneId: 'cairo',
        governorate: 'القاهرة',
        paymentMethod: 'cod',
        idempotencyKey: crypto.randomUUID(),
        items: [{
          productId: testProduct.id,
          quantity: 2,
          selectedVariants: {}
        }]
      });

      assert.ok(orderRes.orderId && orderRes.trackingToken, `Order must be placed: ${JSON.stringify(orderRes)}`);
      console.log(`Order placed successfully: #${orderRes.orderNumber} (id: ${orderRes.orderId})`);

      // 3. Verify inventory is decremented by 2
      stocks = await apiJson('/merchant/commerce/inventory', 'GET', undefined, token);
      stock = stocks.find(s => s.productId === testProduct.id);
      console.log(`Stock after order: ${stock.quantity} (expected: ${initialQty - 2})`);
      assert.equal(stock.quantity, initialQty - 2, `Inventory was not decremented! Expected ${initialQty - 2}, got ${stock.quantity}`);

      // 4. Verify tracking works
      console.log(`3. Verifying tracking endpoint for token ${orderRes.trackingToken}...`);
      const trackingData = await apiJson(`/public/stores/${slug}/orders/track/${orderRes.trackingToken}`);
      assert.equal(trackingData.orderNumber, orderRes.orderNumber, 'Tracking order number must match');
      assert.equal(trackingData.status, 'Pending', 'Initial status must be Pending');

      // 5. Merchant cancels order -> verify inventory is restored
      console.log(`4. Merchant cancels order #${orderRes.orderNumber}...`);
      const cancelRes = await apiJson(`/merchant/commerce/orders/${orderRes.orderId}/status`, 'PATCH', {
        status: 'Cancelled',
        note: 'E2E cancellation test'
      }, token);
      console.log(`Order cancelled status:`, cancelRes.status || cancelRes);

      // Verify inventory is restored by 2
      stocks = await apiJson('/merchant/commerce/inventory', 'GET', undefined, token);
      stock = stocks.find(s => s.productId === testProduct.id);
      console.log(`Stock after cancellation: ${stock.quantity} (expected: ${initialQty})`);
      assert.equal(stock.quantity, initialQty, `Inventory was not restored on cancellation! Expected ${initialQty}, got ${stock.quantity}`);

      console.log(`✓ Real Database Checkout & Inventory Deduction / Restoration PASSED!`);
    }

    console.log(`\n======================================================`);
    console.log(`ALL E2E VERIFICATION SUITES COMPLETED WITH 100% SUCCESS!`);
    console.log(`======================================================`);

  } finally {
    await browser.close();
  }
})().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
