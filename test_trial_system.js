// Automated E2E Test Suite for 14-Day Free Trial System in WatsStore SaaS
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

async function runTrialTestSuite() {
  console.log('================================================================');
  console.log('   WATSSTORE SAAS: 14-DAY FREE TRIAL SYSTEM AUTOMATED E2E QA    ');
  console.log(`   Target Server: ${BASE_URL}`);
  console.log('================================================================\n');

  // 1. Super Admin Authentication
  console.log('--- Step 1: Super Admin Authentication ---');
  const adminLoginRes = await request('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({
      secretKey: 'WatsStore_SuperAdmin_SecretKey_2026_Secure!',
    }),
  });

  const adminToken = adminLoginRes.data?.token;
  recordTest(
    'Admin Login Authentication',
    adminLoginRes.ok && Boolean(adminToken),
    adminLoginRes.latency,
    adminToken ? `Admin token retrieved (${adminToken.substring(0, 20)}...)` : adminLoginRes.data?.message || 'Login failed'
  );

  if (!adminToken) {
    console.error('Fatal: Cannot proceed without Super Admin token.');
    process.exit(1);
  }

  // 2. Register New Merchant (starts 14-day free trial)
  console.log('\n--- Step 2: Merchant Registration & 14-Day Free Trial Start ---');
  const testEmail = `trial_merchant_${Date.now()}@watsstore.test`;
  const registerRes = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      ownerName: 'تاجر التجربة المجانية',
      email: testEmail,
      password: 'Password123!',
      storeName: 'متجر تجربة الـ 14 يوم',
      whatsAppNumber: '01099887766',
      businessCategory: 'ملابس وأزياء',
      city: 'القاهرة',
    }),
  });

  const merchantToken = registerRes.data?.token;
  const storeSlug = registerRes.data?.slug;
  const storeId = registerRes.data?.storeId;

  recordTest(
    'Merchant Registration with Free Trial',
    registerRes.ok && Boolean(merchantToken),
    registerRes.latency,
    merchantToken ? `Store created: ${storeSlug} (ID: ${storeId})` : registerRes.data?.message
  );

  if (!merchantToken || !storeId || !storeSlug) {
    console.error('Fatal: Merchant registration failed.');
    process.exit(1);
  }

  // 3. Verify Active Trial in Merchant Summary
  console.log('\n--- Step 3: Verify Active Trial Metadata in Merchant Summary ---');
  const summaryRes = await request('/api/merchant/summary', {
    headers: { Authorization: `Bearer ${merchantToken}` },
  });

  const isTrialExpired = summaryRes.data?.isTrialExpired;
  const remainingDays = summaryRes.data?.remainingTrialDays;
  const trialEndsAt = summaryRes.data?.trialEndsAt;

  recordTest(
    'Merchant Active Trial Metadata',
    summaryRes.ok && isTrialExpired === false && remainingDays >= 13 && Boolean(trialEndsAt),
    summaryRes.latency,
    `isTrialExpired: ${isTrialExpired}, remainingDays: ${remainingDays}, endsAt: ${trialEndsAt}`
  );

  // 4. Create Product while trial is active (Positive Test)
  console.log('\n--- Step 4: Add Product during Active Trial ---');
  const createProductRes = await request('/api/merchant/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${merchantToken}` },
    body: JSON.stringify({
      name: 'منتج تجريبي 1',
      price: 250,
      description: 'وصف المنتج التجريبي',
      isAvailable: true,
      sortOrder: 1,
    }),
  });

  const createdProductId = createProductRes.data?.id;
  recordTest(
    'Add Product during Active Trial',
    createProductRes.ok && Boolean(createdProductId),
    createProductRes.latency,
    createdProductId ? `Product created: ${createdProductId}` : createProductRes.data?.message
  );

  // 5. Create Coupon while trial is active (Positive Test)
  console.log('\n--- Step 5: Add Coupon during Active Trial ---');
  const couponCode = `TRIAL${Math.floor(Math.random() * 1000)}`;
  const createCouponRes = await request('/api/merchant/coupons', {
    method: 'POST',
    headers: { Authorization: `Bearer ${merchantToken}` },
    body: JSON.stringify({
      code: couponCode,
      discountType: 'Percentage',
      discountValue: 10,
      isActive: true,
    }),
  });

  recordTest(
    'Add Coupon during Active Trial',
    createCouponRes.ok && Boolean(createCouponRes.data?.id),
    createCouponRes.latency,
    createCouponRes.data?.id ? `Coupon created: ${couponCode}` : createCouponRes.data?.message
  );

  // 6. Create Order on Public Storefront during Active Trial (Positive Test)
  console.log('\n--- Step 6: Create WhatsApp Order during Active Trial ---');
  const orderRes = await request(`/api/public/stores/${storeSlug}/orders`, {
    method: 'POST',
    body: JSON.stringify({
      customerName: 'عميل تجريبي نشط',
      customerPhone: '01011223344',
      customerAddress: 'المعادي، القاهرة',
      couponCode: couponCode,
      items: [{ productId: createdProductId, quantity: 1 }],
    }),
  });

  recordTest(
    'Create Order during Active Trial',
    orderRes.ok && Boolean(orderRes.data?.orderId),
    orderRes.latency,
    orderRes.data?.orderId ? `Order #${orderRes.data.orderNumber} Total: ${orderRes.data.totalAmount}` : orderRes.data?.message
  );

  // 7. Simulate Trial Expiration via Super Admin (-1 day)
  console.log('\n--- Step 7: Simulate Trial Expiration via Super Admin ---');
  const expireRes = await request(`/api/admin/stores/${storeId}/extend-trial`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ days: -1 }),
  });

  recordTest(
    'Admin Simulate Trial Expiration',
    expireRes.ok && expireRes.data?.isTrialExpired === true && expireRes.data?.remainingTrialDays === 0,
    expireRes.latency,
    `isTrialExpired: ${expireRes.data?.isTrialExpired}, remainingDays: ${expireRes.data?.remainingTrialDays}`
  );

  // 8. Negative Testing: Block operations on expired store (HTTP 403 Forbidden)
  console.log('\n--- Step 8: Negative Testing on Expired Store (Enforcement Verification) ---');
  
  // 8.1 Block Product Creation
  const blockProductRes = await request('/api/merchant/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${merchantToken}` },
    body: JSON.stringify({
      name: 'منتج بعد انتهاء التجربة',
      price: 300,
    }),
  });

  const blockProductPass = blockProductRes.status === 403 && blockProductRes.data?.isTrialExpired === true;
  recordTest(
    'Block Product Creation on Expired Store (403 Forbidden)',
    blockProductPass,
    blockProductRes.latency,
    `Status: ${blockProductRes.status}, Message: "${blockProductRes.data?.message}"`
  );

  // 8.2 Block Coupon Creation
  const blockCouponRes = await request('/api/merchant/coupons', {
    method: 'POST',
    headers: { Authorization: `Bearer ${merchantToken}` },
    body: JSON.stringify({
      code: 'EXPIRED10',
      discountType: 'Percentage',
      discountValue: 15,
      isActive: true,
    }),
  });

  const blockCouponPass = blockCouponRes.status === 403 && blockCouponRes.data?.isTrialExpired === true;
  recordTest(
    'Block Coupon Creation on Expired Store (403 Forbidden)',
    blockCouponPass,
    blockCouponRes.latency,
    `Status: ${blockCouponRes.status}, Message: "${blockCouponRes.data?.message}"`
  );

  // 8.3 Block Order Placement on Public Storefront
  const blockOrderRes = await request(`/api/public/stores/${storeSlug}/orders`, {
    method: 'POST',
    body: JSON.stringify({
      customerName: 'عميل متجر منتهي',
      customerPhone: '01011223344',
      customerAddress: 'المهندسين، الجيزة',
      items: [{ productId: createdProductId, quantity: 1 }],
    }),
  });

  const blockOrderPass = blockOrderRes.status === 403 && blockOrderRes.data?.isTrialExpired === true;
  recordTest(
    'Block Public Order Placement on Expired Store (403 Forbidden)',
    blockOrderPass,
    blockOrderRes.latency,
    `Status: ${blockOrderRes.status}, Message: "${blockOrderRes.data?.message}"`
  );

  // 9. Super Admin Upgrades Store to Pro (Unlocks Store)
  console.log('\n--- Step 9: Super Admin Upgrades Store to Pro ---');
  const upgradeRes = await request(`/api/admin/stores/${storeId}/plan`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ plan: 'Pro' }),
  });

  const upgradePass = upgradeRes.ok && upgradeRes.data?.planType === 'Pro' && upgradeRes.data?.isTrialExpired === false;
  recordTest(
    'Super Admin Upgrade Store to Pro',
    upgradePass,
    upgradeRes.latency,
    `Plan: ${upgradeRes.data?.planType}, isTrialExpired: ${upgradeRes.data?.isTrialExpired}, Message: "${upgradeRes.data?.message}"`
  );

  // 10. Verify Unlocked Store Operations
  console.log('\n--- Step 10: Verify Operations Restored after Pro Upgrade ---');
  
  // 10.1 Create product should succeed
  const restoreProductRes = await request('/api/merchant/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${merchantToken}` },
    body: JSON.stringify({
      name: 'منتج بعد ترقية باقة Pro',
      price: 499,
      isAvailable: true,
    }),
  });

  recordTest(
    'Add Product after Pro Upgrade',
    restoreProductRes.ok && Boolean(restoreProductRes.data?.id),
    restoreProductRes.latency,
    restoreProductRes.data?.id ? `Product created: ${restoreProductRes.data.id}` : restoreProductRes.data?.message
  );

  // 10.2 Order placement should succeed
  const restoreOrderRes = await request(`/api/public/stores/${storeSlug}/orders`, {
    method: 'POST',
    body: JSON.stringify({
      customerName: 'عميل بعد الترقية إلى Pro',
      customerPhone: '01099887766',
      customerAddress: 'الدقي، الجيزة',
      items: [{ productId: createdProductId, quantity: 1 }],
    }),
  });

  recordTest(
    'Create Order after Pro Upgrade',
    restoreOrderRes.ok && Boolean(restoreOrderRes.data?.orderId),
    restoreOrderRes.latency,
    restoreOrderRes.data?.orderId ? `Order #${restoreOrderRes.data.orderNumber} Total: ${restoreOrderRes.data.totalAmount}` : restoreOrderRes.data?.message
  );

  // 11. Test Admin Extend Trial (+14 Days)
  console.log('\n--- Step 11: Test Admin Extend Trial (+14 Days) ---');
  // Revert back to Free to test extension
  await request(`/api/admin/stores/${storeId}/plan`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ plan: 'Free' }),
  });

  const extendRes = await request(`/api/admin/stores/${storeId}/extend-trial`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ days: 14 }),
  });

  const extendPass = extendRes.ok && extendRes.data?.isTrialExpired === false && extendRes.data?.remainingTrialDays >= 13;
  recordTest(
    'Admin Extend Trial (+14 Days)',
    extendPass,
    extendRes.latency,
    `Remaining days: ${extendRes.data?.remainingTrialDays}, isTrialExpired: ${extendRes.data?.isTrialExpired}`
  );

  // 12. Cleanup: Delete Test Store via Admin API
  console.log('\n--- Step 12: Cleanup Test Store ---');
  const deleteRes = await request(`/api/admin/stores/${storeId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  recordTest(
    'Admin Delete Test Store Cleanup',
    deleteRes.ok,
    deleteRes.latency,
    deleteRes.data?.message || 'Store deleted'
  );

  // -------------------------------------------------------------
  // FINAL SCORECARD & SUMMARY
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log('                 TRIAL SYSTEM TEST SCORECARD                    ');
  console.log('================================================================');
  const total = results.length;
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const successRate = Math.round((passed / total) * 100);

  console.log(`Total Checks:   ${total}`);
  console.log(`Passed:         ${passed} ✅`);
  console.log(`Failed:         ${failed} ❌`);
  console.log(`Success Rate:   ${successRate}%\n`);

  if (failed > 0) {
    console.log('❌ Failed Checks:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  - ${r.testName}: ${r.details}`);
    });
    process.exit(1);
  } else {
    console.log('🎉 ALL 14-DAY FREE TRIAL SYSTEM CHECKS PASSED WITH 100% SUCCESS!');
    process.exit(0);
  }
}

runTrialTestSuite();
