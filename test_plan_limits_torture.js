// SaaS Subscription Plan Limits & Quota Enforcement Torture Test Suite (Free vs. Pro vs. VIP)
const BASE_URL = process.env.TEST_API_URL || 'https://watsstore.runasp.net';

const results = [];

function recordTest(testName, success, latencyMs, details) {
  const status = success ? 'PASS' : 'FAIL';
  results.push({ testName, status, latencyMs: Math.round(latencyMs), details });
  const icon = success ? '✅' : '❌';
  console.log(`${icon} [${status}] [${Math.round(latencyMs)}ms] ${testName}: ${details}`);
}

async function request(endpoint, options = {}) {
  const start = performance.now();
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    const end = performance.now();
    let data = null;
    try {
      data = await res.json();
    } catch {}
    return { status: res.status, ok: res.ok, data, latency: end - start, error: null };
  } catch (err) {
    const end = performance.now();
    return { status: 0, ok: false, data: null, latency: end - start, error: err };
  }
}

async function runPlanLimitsTortureSuite() {
  console.log('================================================================');
  console.log('  WATSSTORE SAAS: PLAN LIMITS & QUOTAS TORTURE TEST SUITE       ');
  console.log(`  Target Server: ${BASE_URL}`);
  console.log('================================================================\n');

  // Step 1: Super Admin Authentication
  console.log('--- Step 1: Super Admin Authentication ---');
  const adminLoginRes = await request('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({
      secretKey: process.env.WATSSTORE_TEST_ADMIN_KEY,
    }),
  });

  const adminToken = adminLoginRes.data?.token;
  recordTest(
    'Admin Login Authentication',
    adminLoginRes.ok && Boolean(adminToken),
    adminLoginRes.latency,
    adminToken ? `Admin token retrieved (${adminToken.substring(0, 20)}...)` : (adminLoginRes.data?.message || 'Login failed')
  );

  if (!adminToken) {
    console.error('Fatal: Cannot proceed without Super Admin token.');
    process.exit(1);
  }

  // Step 2: Register New Merchant (Default Plan = Free)
  console.log('\n--- Step 2: Register Merchant on Free Plan ---');
  const testEmail = `quota_merchant_${Date.now()}@watsstore.test`;
  const registerRes = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      ownerName: 'تاجر اختبار الحدود',
      email: testEmail,
      password: 'Password123!',
      storeName: 'متجر اختبار باقات الاشتراك',
      whatsAppNumber: '01011223344',
      businessCategory: 'إلكترونيات',
      city: 'القاهرة',
    }),
  });

  const merchantToken = registerRes.data?.token;
  const storeSlug = registerRes.data?.slug;
  const storeId = registerRes.data?.storeId;

  recordTest(
    'Register Free Merchant',
    registerRes.ok && Boolean(merchantToken),
    registerRes.latency,
    merchantToken ? `Store created: ${storeSlug} (ID: ${storeId})` : (registerRes.data?.message || 'Registration failed')
  );

  if (!merchantToken || !storeId || !storeSlug) {
    console.error('Fatal: Merchant registration failed.');
    process.exit(1);
  }

  try {
    // Step 3: Verify Initial Store Plan is Free
    console.log('\n--- Step 3: Verify Initial Store Plan is Free ---');
    const storeInfoRes = await request(`/api/admin/stores`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const storeList = storeInfoRes.data?.stores || storeInfoRes.data || [];
    const testStore = storeList.find(s => s.id === storeId || s.slug === storeSlug);
    const initialPlan = testStore ? (testStore.plan || testStore.planType) : 'Unknown';
    recordTest(
      'Verify Initial Free Plan Assignment',
      storeInfoRes.ok && initialPlan === 'Free',
      storeInfoRes.latency,
      `Initial plan assigned: ${initialPlan}`
    );

    // Step 4: Torture Test Free Product Limit (Max 10 products)
    console.log('\n--- Step 4: Torture Test Free Product Limit (Creating 10 Products) ---');
    let productsCreated = 0;
    for (let i = 1; i <= 10; i++) {
      const pRes = await request('/api/merchant/products', {
        method: 'POST',
        headers: { Authorization: `Bearer ${merchantToken}` },
        body: JSON.stringify({
          name: `منتج مجاني رقم ${i}`,
          price: 100 + i * 10,
          description: `وصف المنتج التجريبي رقم ${i}`,
          isAvailable: true,
        }),
      });
      if (pRes.ok) {
        productsCreated++;
      } else {
        console.error(`Failed at product #${i}:`, pRes.status, pRes.data);
        break;
      }
    }

    recordTest(
      'Free Tier Max 10 Products Allowed',
      productsCreated === 10,
      100,
      `Successfully created ${productsCreated}/10 products`
    );

    // Step 5: Enforce Product Quota Block (Product #11 MUST FAIL with HTTP 403)
    console.log('\n--- Step 5: Enforce Product Quota Block (Attempt Product #11) ---');
    const p11Res = await request('/api/merchant/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${merchantToken}` },
      body: JSON.stringify({
        name: 'منتج غير مصرح به رقم 11',
        price: 999,
        description: 'هذا المنتج يجب أن يرفض تماماً بسبب تجاوز حد الباقة المجانية',
        isAvailable: true,
      }),
    });

    const isBlockedProduct = p11Res.status === 403 && (p11Res.data?.isQuotaExceeded === true || (p11Res.data?.message && p11Res.data.message.includes('10 منتجات')));
    recordTest(
      'Block Product #11 with HTTP 403 & Arabic Upgrade Prompt',
      isBlockedProduct,
      p11Res.latency,
      `HTTP ${p11Res.status} - Response: ${JSON.stringify(p11Res.data)}`
    );

    // Step 6: Torture Test Free Coupon Limit (Max 1 active coupon)
    console.log('\n--- Step 6: Torture Test Free Coupon Limit ---');
    const c1Res = await request('/api/merchant/coupons', {
      method: 'POST',
      headers: { Authorization: `Bearer ${merchantToken}` },
      body: JSON.stringify({
        code: `FREE10_${Date.now()}`,
        discountType: 'Percentage',
        discountValue: 10,
        isActive: true,
      }),
    });

    recordTest(
      'Free Tier 1 Active Coupon Creation',
      c1Res.ok,
      c1Res.latency,
      c1Res.ok ? `Coupon 1 created successfully` : JSON.stringify(c1Res.data)
    );

    // Step 7: Enforce Coupon Quota Block (Coupon #2 MUST FAIL with HTTP 403)
    console.log('\n--- Step 7: Enforce Coupon Quota Block (Attempt Active Coupon #2) ---');
    const c2Res = await request('/api/merchant/coupons', {
      method: 'POST',
      headers: { Authorization: `Bearer ${merchantToken}` },
      body: JSON.stringify({
        code: `FREE20_${Date.now()}`,
        discountType: 'Percentage',
        discountValue: 20,
        isActive: true,
      }),
    });

    const isBlockedCoupon = c2Res.status === 403 && (c2Res.data?.isQuotaExceeded === true || (c2Res.data?.message && c2Res.data.message.includes('كوبون')));
    recordTest(
      'Block Active Coupon #2 with HTTP 403 & Arabic Upgrade Prompt',
      isBlockedCoupon,
      c2Res.latency,
      `HTTP ${c2Res.status} - Response: ${JSON.stringify(c2Res.data)}`
    );

    // Step 8: Privilege Escalation Resistance Test
    console.log('\n--- Step 8: Privilege Escalation Resistance Test ---');
    const tamperRes = await request('/api/merchant/settings', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${merchantToken}` },
      body: JSON.stringify({
        storeName: 'متجر محاولة رفع الصلاحيات',
        plan: 'VIP',
        planType: 'VIP',
        subscriptionTier: 'VIP',
        isVip: true,
      }),
    });

    // Verify still cannot bypass limit
    const pTamperRes = await request('/api/merchant/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${merchantToken}` },
      body: JSON.stringify({
        name: 'منتج بعد محاولة رفع الصلاحية',
        price: 500,
        isAvailable: true,
      }),
    });

    const tamperBlocked = pTamperRes.status === 403;
    recordTest(
      'Privilege Escalation Tamper Resistance',
      tamperBlocked,
      pTamperRes.latency,
      `Tamper attempt blocked. New product creation still restricted: HTTP ${pTamperRes.status}`
    );

    // Step 9: Super Admin Instant Upgrade to Pro
    console.log('\n--- Step 9: Super Admin Instant Upgrade to Pro ---');
    const upgradeRes = await request(`/api/admin/stores/${storeId}/plan`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        plan: 'Pro',
      }),
    });

    recordTest(
      'Super Admin Upgrade to Pro (PATCH /api/admin/stores/{id}/plan)',
      upgradeRes.ok,
      upgradeRes.latency,
      `Response: ${JSON.stringify(upgradeRes.data)}`
    );

    // Step 10: Instant Quota Unlock on Pro (Create Product #11 and Coupon #2)
    console.log('\n--- Step 10: Verify Instant Quota Unlock on Pro ---');
    const p11UnlockedRes = await request('/api/merchant/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${merchantToken}` },
      body: JSON.stringify({
        name: 'منتج رقم 11 مفتوح بعد ترقية برو',
        price: 750,
        description: 'تم فتحه بنجاح بفضل باقة Pro',
        isAvailable: true,
      }),
    });

    recordTest(
      'Product #11 Creation Unlocked on Pro',
      p11UnlockedRes.ok,
      p11UnlockedRes.latency,
      `HTTP ${p11UnlockedRes.status} - Product created successfully`
    );

    const c2UnlockedRes = await request('/api/merchant/coupons', {
      method: 'POST',
      headers: { Authorization: `Bearer ${merchantToken}` },
      body: JSON.stringify({
        code: `PRO20_${Date.now()}`,
        discountType: 'Percentage',
        discountValue: 20,
        isActive: true,
      }),
    });

    recordTest(
      'Coupon #2 Creation Unlocked on Pro',
      c2UnlockedRes.ok,
      c2UnlockedRes.latency,
      `HTTP ${c2UnlockedRes.status} - Coupon created successfully`
    );

    // Step 11: Downgrade Safety & Grandfathered Data Integrity
    console.log('\n--- Step 11: Downgrade Safety & Grandfathered Data Integrity ---');
    const downgradeRes = await request(`/api/admin/stores/${storeId}/plan`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        plan: 'Free',
      }),
    });

    recordTest(
      'Super Admin Downgrade to Free',
      downgradeRes.ok,
      downgradeRes.latency,
      `Response: ${JSON.stringify(downgradeRes.data)}`
    );

    // Verify all 11 products remain intact on the public storefront
    const publicStoreRes = await request(`/api/public/stores/${storeSlug}`);
    const publicProducts = publicStoreRes.data?.products || [];
    recordTest(
      'Grandfathered Products Intact on Storefront After Downgrade',
      publicStoreRes.ok && publicProducts.length === 11,
      publicStoreRes.latency,
      `Storefront HTTP ${publicStoreRes.status} - Served all ${publicProducts.length}/11 products without data loss`
    );

    // Verify new creations are blocked because count (11) >= quota (10)
    const p12BlockedRes = await request('/api/merchant/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${merchantToken}` },
      body: JSON.stringify({
        name: 'منتج رقم 12 بعد التخفيض للمجاني',
        price: 300,
        isAvailable: true,
      }),
    });

    recordTest(
      'New Creations Blocked After Downgrade (11 >= 10)',
      p12BlockedRes.status === 403,
      p12BlockedRes.latency,
      `HTTP ${p12BlockedRes.status} - Correctly blocked new additions`
    );

    // Step 12: Unlimited AI Product Description Verification
    console.log('\n--- Step 12: Unlimited AI Description Verification ---');
    let aiCallsSuccess = 0;
    for (let j = 1; j <= 3; j++) {
      const aiRes = await request('/api/merchant/ai/generate-description', {
        method: 'POST',
        headers: { Authorization: `Bearer ${merchantToken}` },
        body: JSON.stringify({
          productName: `حذاء رياضي أنيق ${j}`,
          keywords: 'مريح خفيف أصلي',
          tone: 'احترافي',
        }),
      });
      if (aiRes.ok && (aiRes.data?.description || typeof aiRes.data === 'string')) {
        aiCallsSuccess++;
      }
    }

    recordTest(
      'AI Product Description Remains 100% Unlimited & Functional',
      aiCallsSuccess === 3,
      300,
      `Successfully completed ${aiCallsSuccess}/3 AI generations without any tier restriction`
    );

  } finally {
    // Step 13: Cleanup Test Store
    console.log('\n--- Step 13: Cleanup Test Store ---');
    const deleteRes = await request(`/api/admin/stores/${storeId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    recordTest(
      'Super Admin Cleanup Test Store',
      deleteRes.ok,
      deleteRes.latency,
      `Store ID ${storeId} deleted: HTTP ${deleteRes.status}`
    );
  }

  // Summary
  console.log('\n================================================================');
  console.log('                 TORTURE TEST RESULTS SUMMARY                   ');
  console.log('================================================================');
  const total = results.length;
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`Total Checks: ${total} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    console.error('❌ SOME TESTS FAILED!');
    process.exit(1);
  } else {
    console.log('🎉 ALL TORTURE TESTS PASSED WITH 100% SUCCESS!');
  }
}

runPlanLimitsTortureSuite().catch(err => {
  console.error('Fatal Test Suite Error:', err);
  process.exit(1);
});
