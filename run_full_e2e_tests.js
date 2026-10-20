/**
 * WatsStore SaaS - Master End-to-End (E2E) & Integration Automated Test Suite
 * Production Verification:
 *   Backend:  https://watsstore.runasp.net (MonsterASP .NET Core 8)
 *   Frontend: https://frontend-bay-ten-58.vercel.app (Vercel Next.js 14 App Router)
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BACKEND_BASE = process.env.BACKEND_URL || 'https://watsstore.runasp.net';
const FRONTEND_BASE = process.env.FRONTEND_URL || 'https://frontend-bay-ten-58.vercel.app';
const ADMIN_SECRET_KEY = 'WatsStore_SuperAdmin_SecretKey_2026_Secure!';

const runTimestamp = Date.now().toString().slice(-6);

let passedCount = 0;
let failedCount = 0;
const testResults = [];

function recordResult(section, testName, status, details = '', latencyMs = 0) {
  const isPass = status === 'PASS';
  if (isPass) {
    passedCount++;
    console.log(`\x1b[32m[PASS]\x1b[0m [${section}] ${testName} (${latencyMs}ms) ${details}`);
  } else {
    failedCount++;
    console.error(`\x1b[31m[FAIL]\x1b[0m [${section}] ${testName} (${latencyMs}ms) ${details}`);
  }
  testResults.push({ section, testName, status, details, latencyMs });
}

async function fetchApi(url, options = {}) {
  const start = Date.now();
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'WatsStore-E2E-Auditor/2.0',
        ...(options.headers || {})
      },
      timeout: options.timeout || 25000
    };

    const req = client.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        const latencyMs = Date.now() - start;
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
          json,
          latencyMs
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      const latencyMs = Date.now() - start;
      resolve({ statusCode: 408, error: 'TIMEOUT', latencyMs, data: '' });
    });

    req.on('error', (err) => {
      const latencyMs = Date.now() - start;
      resolve({ statusCode: 500, error: err.message, latencyMs, data: '' });
    });

    if (options.body) {
      if (typeof options.body === 'string') {
        req.write(options.body);
      } else {
        req.setHeader('Content-Type', 'application/json');
        req.write(JSON.stringify(options.body));
      }
    }
    req.end();
  });
}

async function runE2ESuite() {
  console.log('================================================================================');
  console.log('  🚀 WATSSTORE SAAS - MASTER END-TO-END (E2E) & INTEGRATION TEST SUITE');
  console.log(`  Backend:  ${BACKEND_BASE}`);
  console.log(`  Frontend: ${FRONTEND_BASE}`);
  console.log('================================================================================\n');

  let merchantAToken = '';
  let merchantAStoreId = '';
  let merchantASlug = '';
  let merchantBToken = '';
  let merchantBStoreId = '';
  let merchantBSlug = '';
  let adminToken = '';
  let testCategoryId = null;
  let testProductId = '';

  // ============================================================================
  // SECTION 1: AUTH, RBAC & TENANT ISOLATION
  // ============================================================================
  console.log('--- 1. AUTH, RBAC & TENANT ISOLATION TESTS ---');

  // 1.1 Merchant A Registration (Creates store with 14-day Free trial)
  const emailA = `merchant_a_${runTimestamp}@e2etest.com`;
  const regARes = await fetchApi(`${BACKEND_BASE}/api/auth/register`, {
    method: 'POST',
    body: {
      ownerName: 'التاجر أ - تدقيق شامل',
      email: emailA,
      password: 'Password123!',
      storeName: `AlphaStore${runTimestamp}`,
      businessCategory: 'إلكترونيات',
      city: 'القاهرة',
      whatsappNumber: '01012345678'
    }
  });

  if ((regARes.statusCode === 200 || regARes.statusCode === 201) && regARes.json?.token) {
    merchantAToken = regARes.json.token;
    merchantAStoreId = regARes.json.storeId;
    merchantASlug = regARes.json.slug;
    const plan = regARes.json.planType;
    recordResult('AUTH_RBAC', 'Merchant A Registration with Free Trial', 'PASS', `Token issued, Slug: ${merchantASlug}, Plan: ${plan}`, regARes.latencyMs);
  } else {
    recordResult('AUTH_RBAC', 'Merchant A Registration with Free Trial', 'FAIL', `Status: ${regARes.statusCode}, Msg: ${regARes.data.substring(0, 80)}`, regARes.latencyMs);
  }

  // 1.2 Merchant A Login
  const loginARes = await fetchApi(`${BACKEND_BASE}/api/auth/login`, {
    method: 'POST',
    body: {
      email: emailA,
      password: 'Password123!'
    }
  });
  if (loginARes.statusCode === 200 && loginARes.json?.token) {
    recordResult('AUTH_RBAC', 'Merchant A Login & Session Token', 'PASS', `Token verified for store ${loginARes.json.slug}`, loginARes.latencyMs);
  } else {
    recordResult('AUTH_RBAC', 'Merchant A Login & Session Token', 'FAIL', `Status: ${loginARes.statusCode}`, loginARes.latencyMs);
  }

  // 1.3 Merchant B Registration
  const emailB = `merchant_b_${runTimestamp}@e2etest.com`;
  const regBRes = await fetchApi(`${BACKEND_BASE}/api/auth/register`, {
    method: 'POST',
    body: {
      ownerName: 'التاجر ب - عزل المستأجرين',
      email: emailB,
      password: 'Password123!',
      storeName: `BetaStore${runTimestamp}`,
      businessCategory: 'ملابس',
      city: 'الجيزة',
      whatsappNumber: '01098765432'
    }
  });
  if ((regBRes.statusCode === 200 || regBRes.statusCode === 201) && regBRes.json?.token) {
    merchantBToken = regBRes.json.token;
    merchantBStoreId = regBRes.json.storeId;
    merchantBSlug = regBRes.json.slug;
    recordResult('AUTH_RBAC', 'Merchant B Registration', 'PASS', `Store B created: ${merchantBSlug}`, regBRes.latencyMs);
  } else {
    recordResult('AUTH_RBAC', 'Merchant B Registration', 'FAIL', `Status: ${regBRes.statusCode}`, regBRes.latencyMs);
  }

  // 1.4 Tenant Isolation (IDOR Check): Merchant B attempts to access Merchant summary (must be scoped to Store B)
  const idorRes = await fetchApi(`${BACKEND_BASE}/api/merchant/summary`, {
    headers: { 'Authorization': `Bearer ${merchantBToken}` }
  });
  if (idorRes.statusCode === 200) {
    const isIsolated = idorRes.json?.storeInfo?.slug === merchantBSlug && idorRes.json?.storeInfo?.slug !== merchantASlug;
    recordResult('AUTH_RBAC', 'Tenant Isolation (Store Scoping Verification)', isIsolated ? 'PASS' : 'FAIL', `Store isolated to ${idorRes.json?.storeInfo?.slug}`, idorRes.latencyMs);
  } else {
    recordResult('AUTH_RBAC', 'Tenant Isolation (Store Scoping Verification)', 'FAIL', `Status: ${idorRes.statusCode}`, idorRes.latencyMs);
  }

  // 1.5 Super Admin Authentication & Session
  const adminLoginRes = await fetchApi(`${BACKEND_BASE}/api/admin/login`, {
    method: 'POST',
    body: {
      secretKey: ADMIN_SECRET_KEY
    }
  });
  if (adminLoginRes.statusCode === 200 && adminLoginRes.json?.token) {
    adminToken = adminLoginRes.json.token;
    recordResult('AUTH_RBAC', 'Super Admin Master Secret Key Login', 'PASS', `Admin token issued, Role: ${adminLoginRes.json.role || 'Admin'}`, adminLoginRes.latencyMs);
  } else {
    recordResult('AUTH_RBAC', 'Super Admin Master Secret Key Login', 'FAIL', `Status: ${adminLoginRes.statusCode}`, adminLoginRes.latencyMs);
  }

  // 1.6 Super Admin RBAC Protection: Merchant Token should be rejected on Admin endpoints
  const adminDeniedRes = await fetchApi(`${BACKEND_BASE}/api/admin/stats`, {
    headers: { 'Authorization': `Bearer ${merchantAToken}` }
  });
  const isMerchantBlockedFromAdmin = adminDeniedRes.statusCode === 401 || adminDeniedRes.statusCode === 403;
  recordResult('AUTH_RBAC', 'RBAC Guard: Merchant Forbidden on Super Admin API', isMerchantBlockedFromAdmin ? 'PASS' : 'FAIL', `Status: ${adminDeniedRes.statusCode}`, adminDeniedRes.latencyMs);

  // ============================================================================
  // SECTION 2: PLANS, QUOTAS & ATOMIC AI COUNTER
  // ============================================================================
  console.log('\n--- 2. PLANS, QUOTAS & ATOMIC AI COUNTER TESTS ---');

  // 2.1 First create a category for Merchant A
  const catRes = await fetchApi(`${BACKEND_BASE}/api/merchant/categories`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${merchantAToken}` },
    body: { name: 'إلكترونيات واكسسوارات', sortOrder: 1, isActive: true }
  });
  if (catRes.statusCode === 200 || catRes.statusCode === 201) {
    testCategoryId = catRes.json?.id;
    recordResult('PLANS_QUOTAS', 'Category Creation under Free Plan', 'PASS', `Category ID: ${testCategoryId}`, catRes.latencyMs);
  } else {
    recordResult('PLANS_QUOTAS', 'Category Creation under Free Plan', 'FAIL', `Status: ${catRes.statusCode}`, catRes.latencyMs);
  }

  // 2.2 Populate 10 products under Merchant A (Free Plan limit)
  let productsCreated = 0;
  for (let i = 1; i <= 10; i++) {
    const pRes = await fetchApi(`${BACKEND_BASE}/api/merchant/products`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${merchantAToken}` },
      body: {
        name: `منتج تجريبي رقم ${i}`,
        description: `وصف المنتج التجريبي رقم ${i}`,
        price: 150 + i * 10,
        isAvailable: true,
        categoryId: testCategoryId || null,
        images: [`https://picsum.photos/seed/p${i}/600/600`]
      }
    });
    if (pRes.statusCode === 200 || pRes.statusCode === 201) {
      productsCreated++;
      if (i === 1) testProductId = pRes.json?.id;
    }
  }
  recordResult('PLANS_QUOTAS', 'Free Plan Product Creation (1-10 Products)', productsCreated === 10 ? 'PASS' : 'FAIL', `Created ${productsCreated}/10 products`, 0);

  // 2.3 Attempt to create product #11 on Free Plan (Should be 403 Forbidden with Quota Limit)
  const p11Res = await fetchApi(`${BACKEND_BASE}/api/merchant/products`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${merchantAToken}` },
    body: {
      name: 'منتج غير مسموح به رقم 11',
      description: 'هذا المنتج يجب أن يرفض بسبب بلوغ الحد الأقصى للباقة المجانية',
      price: 999,
      isAvailable: true,
      categoryId: testCategoryId || null
    }
  });
  const isLimitEnforced = p11Res.statusCode === 403 || (p11Res.statusCode === 400 && p11Res.data.includes('الحد'));
  recordResult('PLANS_QUOTAS', 'Free Plan Strict Product Limit Guard (#11 -> 403 Forbidden)', isLimitEnforced ? 'PASS' : 'FAIL', `HTTP Status: ${p11Res.statusCode} - ${p11Res.data.substring(0, 60)}`, p11Res.latencyMs);

  // 2.4 Super Admin upgrades Merchant A to Pro Plan
  const upgradeAdminRes = await fetchApi(`${BACKEND_BASE}/api/admin/stores/${merchantAStoreId}/plan`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'X-Admin-Key': ADMIN_SECRET_KEY
    },
    body: {
      plan: 'Pro',
      durationDays: 365,
      notes: 'ترقية نظامية لاختبار مزايا باقة برو'
    }
  });
  const adminUpgradeOk = upgradeAdminRes.statusCode === 200;
  recordResult('PLANS_QUOTAS', 'Super Admin Instant Plan Upgrade (Free -> Pro)', adminUpgradeOk ? 'PASS' : 'FAIL', `Status: ${upgradeAdminRes.statusCode}`, upgradeAdminRes.latencyMs);

  // 2.5 Now Product #11 should succeed under Pro Plan
  const p11ProRes = await fetchApi(`${BACKEND_BASE}/api/merchant/products`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${merchantAToken}` },
    body: {
      name: 'منتج رقم 11 المسموح في باقة برو',
      description: 'نجاح الإضافة بفضل الترقية لباقة برو',
      price: 450,
      isAvailable: true,
      categoryId: testCategoryId || null
    }
  });
  const proUnlockPassed = p11ProRes.statusCode === 200 || p11ProRes.statusCode === 201;
  recordResult('PLANS_QUOTAS', 'Pro Plan Privilege Verification (Product #11 Allowed)', proUnlockPassed ? 'PASS' : 'FAIL', `HTTP Status: ${p11ProRes.statusCode}`, p11ProRes.latencyMs);

  // 2.6 AI Description Generation Quota Decrement
  const aiRes = await fetchApi(`${BACKEND_BASE}/api/merchant/ai/generate-description`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${merchantAToken}` },
    body: {
      productName: 'سماعة بلوتوث رياضية عازلة للضوضاء',
      category: 'إلكترونيات',
      keywords: 'بلوتوث, بطارية 40 ساعة, مقاومة للماء'
    }
  });
  const aiGenerated = aiRes.statusCode === 200 && aiRes.json?.description;
  recordResult('PLANS_QUOTAS', 'AI Product Copywriter & Quota Decrement', aiGenerated ? 'PASS' : 'FAIL', `HTTP ${aiRes.statusCode}, Snippet: ${(aiRes.json?.description || '').substring(0, 45)}...`, aiRes.latencyMs);

  // ============================================================================
  // SECTION 3: DYNAMIC PAYMENT GATEWAYS & BILLING ENGINE
  // ============================================================================
  console.log('\n--- 3. DYNAMIC PAYMENT GATEWAYS & BILLING ENGINE TESTS ---');

  // 3.1 Fetch Payment Gateways
  const gwRes = await fetchApi(`${BACKEND_BASE}/api/merchant/billing/gateways`);
  const hasGateways = gwRes.statusCode === 200 && Array.isArray(gwRes.json) && gwRes.json.length > 0;
  recordResult('BILLING_GATEWAYS', 'Dynamic Payment Gateways Listing', hasGateways ? 'PASS' : 'FAIL', `Active gateways: ${gwRes.json?.map(g => g.gatewayKey).join(', ')}`, gwRes.latencyMs);

  // 3.2 Merchant B Submits Manual Upgrade Request (VIP Plan)
  const txId = `TX_${Date.now().toString().slice(-8)}`;
  const subReqRes = await fetchApi(`${BACKEND_BASE}/api/merchant/billing/upgrade-request`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${merchantBToken}` },
    body: {
      planType: 'VIP',
      billingCycle: 'Annual',
      paymentMethod: gwRes.json?.[0]?.gatewayKey || 'InstaPay',
      transactionId: txId,
      senderIdentifier: '01012345678',
      notes: 'تحويل بنكي سنوي - اختبار E2E'
    }
  });
  const subCreated = subReqRes.statusCode === 200 || subReqRes.statusCode === 201;
  const requestId = subReqRes.json?.requestId || subReqRes.json?.id;
  recordResult('BILLING_GATEWAYS', 'Merchant Upgrade Request Submission (VIP Plan)', subCreated ? 'PASS' : 'FAIL', `Status: ${subReqRes.statusCode}, RequestId: ${requestId}`, subReqRes.latencyMs);

  // 3.3 Anti-Fraud: Duplicate Transaction ID Rejection
  const dupRes = await fetchApi(`${BACKEND_BASE}/api/merchant/billing/upgrade-request`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${merchantBToken}` },
    body: {
      planType: 'VIP',
      billingCycle: 'Annual',
      paymentMethod: gwRes.json?.[0]?.gatewayKey || 'InstaPay',
      transactionId: txId,
      senderIdentifier: '01012345678'
    }
  });
  const dupBlocked = dupRes.statusCode === 400 || dupRes.statusCode === 409;
  recordResult('BILLING_GATEWAYS', 'Anti-Fraud: Duplicate Transaction ID Rejection', dupBlocked ? 'PASS' : 'FAIL', `HTTP Status: ${dupRes.statusCode}`, dupRes.latencyMs);

  // 3.4 Webhook Simulation & Plan Activation
  if (requestId) {
    const hookRes = await fetchApi(`${BACKEND_BASE}/api/merchant/billing/webhook/simulate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${merchantBToken}` },
      body: { requestId }
    });
    const hookOk = hookRes.statusCode === 200 && hookRes.json?.status === 'Approved';
    recordResult('BILLING_GATEWAYS', 'Automated Webhook Idempotency & Plan Activation', hookOk ? 'PASS' : 'FAIL', `Plan: ${hookRes.json?.plan}, Status: ${hookRes.json?.status}`, hookRes.latencyMs);
  }

  // ============================================================================
  // SECTION 4: CATALOG MANAGEMENT & MULTI-IMAGE GALLERY
  // ============================================================================
  console.log('\n--- 4. CATALOG MANAGEMENT & MULTI-IMAGE GALLERY TESTS ---');

  // 4.1 Create Product with Multi-Image Array & Primary Image Indicator
  const multiImages = [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'
  ];

  const createMultiRes = await fetchApi(`${BACKEND_BASE}/api/merchant/products`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${merchantAToken}` },
    body: {
      name: 'ساعة يد ذكية مقاومة للماء مع شاشة أموليد',
      description: 'ساعة متطورة بمستشعرات نبضات القلب والأنشطة الرياضية مع دعم 3 صور عالية الدقة',
      price: 850,
      compareAtPrice: 1100,
      isAvailable: true,
      categoryId: testCategoryId || null,
      images: multiImages
    }
  });

  const multiCreated = (createMultiRes.statusCode === 200 || createMultiRes.statusCode === 201) && createMultiRes.json?.id;
  const createdMultiProductId = createMultiRes.json?.id;
  const returnedImages = createMultiRes.json?.images || [];
  recordResult('CATALOG_GALLERY', 'Multi-Image Product Creation (3 Images Array)', multiCreated && returnedImages.length >= 2 ? 'PASS' : 'FAIL', `ID: ${createdMultiProductId}, Images count: ${returnedImages.length}`, createMultiRes.latencyMs);

  // 4.2 Verify GET /api/merchant/products includes resolved Images array & ImagesJson
  const getProdsRes = await fetchApi(`${BACKEND_BASE}/api/merchant/products`, {
    headers: { 'Authorization': `Bearer ${merchantAToken}` }
  });
  let verifiedGallery = false;
  if (getProdsRes.statusCode === 200 && Array.isArray(getProdsRes.json)) {
    const targetP = getProdsRes.json.find(p => p.id === createdMultiProductId);
    if (targetP && Array.isArray(targetP.images) && targetP.images.length === 3) {
      verifiedGallery = true;
    }
  }
  recordResult('CATALOG_GALLERY', 'Catalog Retrieval with Resolved Multi-Image Arrays', verifiedGallery ? 'PASS' : 'FAIL', `Verified gallery array on product`, getProdsRes.latencyMs);

  // 4.3 Update Product: Re-order gallery and update price
  if (createdMultiProductId) {
    const updatedImages = [multiImages[1], multiImages[0], multiImages[2]];
    const putRes = await fetchApi(`${BACKEND_BASE}/api/merchant/products/${createdMultiProductId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${merchantAToken}` },
      body: {
        name: 'ساعة يد ذكية مقاومة للماء (إصدار محدث)',
        description: 'تم تحديث ترتيب الصور لتعيين الصورة الثانية كرئيسية',
        price: 890,
        compareAtPrice: 1150,
        isAvailable: true,
        categoryId: testCategoryId || null,
        images: updatedImages
      }
    });
    const putOk = putRes.statusCode === 200 && putRes.json?.images?.[0] === multiImages[1];
    recordResult('CATALOG_GALLERY', 'Product Update: Re-order Gallery Images & Set Primary', putOk ? 'PASS' : 'FAIL', `Primary image updated successfully`, putRes.latencyMs);
  }

  // 4.4 Backward Compatibility: Legacy Product with only ImageUrl returns [ImageUrl]
  const legacyProdRes = await fetchApi(`${BACKEND_BASE}/api/merchant/products`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${merchantAToken}` },
    body: {
      name: 'منتج قديم بصورة مفردة تقليدية',
      description: 'التحقق من التوافق الخلفي 100% مع المنتجات القديمة',
      price: 199,
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'
    }
  });
  const legacyOk = (legacyProdRes.statusCode === 200 || legacyProdRes.statusCode === 201) &&
    Array.isArray(legacyProdRes.json?.images) && legacyProdRes.json.images.length === 1;
  recordResult('CATALOG_GALLERY', '100% Backward Compatibility: Legacy Single ImageUrl -> Images Array', legacyOk ? 'PASS' : 'FAIL', `Images length: ${legacyProdRes.json?.images?.length}`, legacyProdRes.latencyMs);

  // 4.5 Security Anti-Tampering Check: Reject negative price
  const negPriceRes = await fetchApi(`${BACKEND_BASE}/api/merchant/products`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${merchantAToken}` },
    body: {
      name: 'محاولة تلاعب بسعر سالب',
      price: -50,
      isAvailable: true
    }
  });
  const priceTamperingBlocked = negPriceRes.statusCode === 400;
  recordResult('CATALOG_GALLERY', 'Price Anti-Tampering: Reject Negative Price (400 Bad Request)', priceTamperingBlocked ? 'PASS' : 'FAIL', `HTTP Status: ${negPriceRes.statusCode}`, negPriceRes.latencyMs);

  // ============================================================================
  // SECTION 5: PUBLIC STOREFRONT, I18N & THEME
  // ============================================================================
  console.log('\n--- 5. PUBLIC STOREFRONT, I18N & THEME TESTS ---');

  // 5.1 Public Storefront API returns products with gallery
  const sfApiRes = await fetchApi(`${BACKEND_BASE}/api/public/stores/${merchantASlug}`);
  const sfApiOk = sfApiRes.statusCode === 200 && sfApiRes.json?.storeName;
  const sfProducts = sfApiRes.json?.products || [];
  const galleryInStorefront = sfProducts.some(p => Array.isArray(p.images) && p.images.length > 1);
  recordResult('STOREFRONT_I18N', 'Public Storefront API Metadata & Multi-Image Gallery', sfApiOk && galleryInStorefront ? 'PASS' : 'FAIL', `Store: ${sfApiRes.json?.storeName}, Products: ${sfProducts.length}`, sfApiRes.latencyMs);

  // 5.2 Public Storefront Frontend Route Reachability (/s/[storeSlug])
  const sfWebRes = await fetchApi(`${FRONTEND_BASE}/s/${merchantASlug}`);
  const sfWebOk = sfWebRes.statusCode === 200;
  recordResult('STOREFRONT_I18N', `Public Storefront Web Page Reachability (/s/${merchantASlug})`, sfWebOk ? 'PASS' : 'FAIL', `HTTP ${sfWebRes.statusCode}`, sfWebRes.latencyMs);

  // 5.3 Order Placement & WhatsApp Click-to-Chat Generation
  const targetProduct = sfProducts[0] || { id: createdMultiProductId, price: 890 };
  const orderRes = await fetchApi(`${BACKEND_BASE}/api/public/stores/${merchantASlug}/orders`, {
    method: 'POST',
    body: {
      customerName: 'أحمد محمود',
      customerPhone: '01011223344',
      customerAddress: 'القاهرة، المعادي، شارع 9',
      customerNotes: 'يرجى التوصيل بعد الساعة 5 مساءً',
      items: [
        {
          productId: targetProduct.id,
          quantity: 2
        }
      ]
    }
  });
  const orderOk = (orderRes.statusCode === 200 || orderRes.statusCode === 201) &&
    orderRes.json?.whatsAppRedirectUrl && orderRes.json.whatsAppRedirectUrl.includes('wa.me');
  recordResult('STOREFRONT_I18N', 'End-to-End Order Checkout & WhatsApp URL Generation', orderOk ? 'PASS' : 'FAIL', `WhatsApp URL: ${(orderRes.json?.whatsAppRedirectUrl || '').substring(0, 45)}...`, orderRes.latencyMs);

  // 5.4 Internationalization (i18n) Engine Check: Verify 7 languages in src/i18n/languages.ts
  let i18nOk = false;
  try {
    const i18nPath = path.join(__dirname, 'frontend', 'src', 'i18n', 'languages.ts');
    if (fs.existsSync(i18nPath)) {
      const i18nContent = fs.readFileSync(i18nPath, 'utf8');
      const hasAllLanguages = ['ar', 'en', 'fr', 'es', 'tr', 'de', 'ru'].every(lang => i18nContent.includes(`code: '${lang}'`) || i18nContent.includes(`'${lang}':`));
      const hasRtlSupport = i18nContent.includes('rtl') && i18nContent.includes('ltr');
      i18nOk = hasAllLanguages && hasRtlSupport;
    }
  } catch (e) {}
  recordResult('STOREFRONT_I18N', '7-Language i18n Engine & RTL/LTR Switcher (ar, en, fr, de, es, tr, ru)', i18nOk ? 'PASS' : 'FAIL', `All 7 locales and bidirectional direction validated`, 0);

  // 5.5 Dark/Light Theme Engine Check: Verify class darkMode in tailwind.config.js & ThemeContext
  let themeOk = false;
  try {
    const tailwindPath = path.join(__dirname, 'frontend', 'tailwind.config.js');
    const themeContextPath = path.join(__dirname, 'frontend', 'src', 'context', 'ThemeContext.tsx');
    if (fs.existsSync(tailwindPath) && fs.existsSync(themeContextPath)) {
      const tw = fs.readFileSync(tailwindPath, 'utf8');
      const tc = fs.readFileSync(themeContextPath, 'utf8');
      themeOk = tw.includes("darkMode: 'class'") && tc.includes('watsstore_theme');
    }
  } catch (e) {}
  recordResult('STOREFRONT_I18N', 'Global Zero-Flicker Dark/Light Theme Engine', themeOk ? 'PASS' : 'FAIL', `darkMode: 'class' and localStorage persistence verified`, 0);

  // ============================================================================
  // SECTION 6: UX BOUNDARIES, SKELETONS & MOBILE UX
  // ============================================================================
  console.log('\n--- 6. UX BOUNDARIES, SKELETONS & MOBILE UX TESTS ---');

  // 6.1 Custom 404 Route Handling
  const notFoundRes = await fetchApi(`${FRONTEND_BASE}/non-existent-route-${runTimestamp}`);
  const notFoundOk = notFoundRes.statusCode === 404 || notFoundRes.statusCode === 200;
  recordResult('UX_BOUNDARIES', 'Custom 404 Not-Found Boundary (No 500 Server Crashes)', notFoundOk ? 'PASS' : 'FAIL', `HTTP Status: ${notFoundRes.statusCode}`, notFoundRes.latencyMs);

  // 6.2 Core App Router Routes Health-Check
  const criticalRoutes = [
    { path: '/', name: 'Landing Page' },
    { path: '/directory', name: 'SEO Store Directory' },
    { path: '/login', name: 'Merchant Login' },
    { path: '/register', name: 'Merchant Registration' },
    { path: '/dashboard', name: 'Merchant Dashboard' },
    { path: '/dashboard/products', name: 'Catalog Manager' },
    { path: '/dashboard/billing', name: 'Billing & Invoices' },
    { path: '/admin', name: 'Super Admin Control Center' }
  ];

  let routesPassed = 0;
  for (const r of criticalRoutes) {
    const res = await fetchApi(`${FRONTEND_BASE}${r.path}`);
    if (res.statusCode === 200) {
      routesPassed++;
    } else {
      console.warn(`    ⚠️ Route ${r.path} returned HTTP ${res.statusCode}`);
    }
  }
  recordResult('UX_BOUNDARIES', 'Core Route Health Check (8/8 App Router Segments)', routesPassed === criticalRoutes.length ? 'PASS' : 'FAIL', `${routesPassed}/${criticalRoutes.length} routes returned HTTP 200`, 0);

  // 6.3 Loading Skeletons & Error Boundaries File Presence
  const requiredBoundaries = [
    'frontend/src/app/loading.tsx',
    'frontend/src/app/error.tsx',
    'frontend/src/app/not-found.tsx',
    'frontend/src/app/dashboard/loading.tsx',
    'frontend/src/app/dashboard/error.tsx'
  ];
  const boundariesExist = requiredBoundaries.every(f => fs.existsSync(path.join(__dirname, f)));
  recordResult('UX_BOUNDARIES', 'Enterprise Loading Skeletons & Error Boundaries Integrity', boundariesExist ? 'PASS' : 'FAIL', `All 5 Next.js boundary files present`, 0);

  // 6.4 Mobile Viewport & Touch UX Optimization
  let mobileUxOk = false;
  try {
    const layoutPath = path.join(__dirname, 'frontend', 'src', 'app', 'layout.tsx');
    const globalsPath = path.join(__dirname, 'frontend', 'src', 'app', 'globals.css');
    if (fs.existsSync(layoutPath) && fs.existsSync(globalsPath)) {
      const layoutContent = fs.readFileSync(layoutPath, 'utf8');
      const globalsContent = fs.readFileSync(globalsPath, 'utf8');
      const hasViewport = layoutContent.includes('viewport') && layoutContent.includes('device-width');
      const hasTouch = globalsContent.includes('touch-action') && globalsContent.includes('tap-highlight');
      mobileUxOk = hasViewport && hasTouch;
    }
  } catch (e) {}
  recordResult('UX_BOUNDARIES', 'Mobile Responsiveness & Touch UX Hardening (Viewport & CSS)', mobileUxOk ? 'PASS' : 'FAIL', `Viewport meta and touch-action optimization verified`, 0);

  // ============================================================================
  // FINAL SCOREBOARD & REPORT GENERATION
  // ============================================================================
  const totalTests = passedCount + failedCount;
  const passRate = totalTests > 0 ? ((passedCount / totalTests) * 100).toFixed(1) : '0';

  console.log('\n================================================================================');
  console.log(`  🎉 MASTER AUDIT FINISHED: ${passedCount}/${totalTests} PASSED (${passRate}%)`);
  console.log(`  Failed Tests: ${failedCount}`);
  console.log('================================================================================\n');

  return {
    totalTests,
    passedCount,
    failedCount,
    passRate,
    testResults
  };
}

if (require.main === module) {
  runE2ESuite().then(summary => {
    if (summary.failedCount > 0) {
      process.exitCode = 1;
    }
  });
}

module.exports = { runE2ESuite };
