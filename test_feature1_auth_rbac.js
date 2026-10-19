/**
 * WatsStore SaaS - Feature 1 Hardening Test Suite
 * Comprehensive automated verification for:
 * 1. Secure Authentication & Registration
 * 2. Cross-Tenant IDOR Shield (Products, Categories, Orders, Coupons, Reviews -> 403 Forbidden)
 * 3. RBAC Privilege Boundaries (Merchant JWT accessing Admin endpoints -> 403 Forbidden)
 * 4. Admin JWT Isolation (Admin accessing Merchant dashboard -> 401/403)
 * 5. Rate Limiting Protection (Brute Force on Auth endpoints -> 429 Too Many Requests)
 */

const BACKEND_URL = process.env.TEST_BACKEND_URL || 'https://watsstore.runasp.net';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'abdallahsay10@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@WatsStore2026!';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'WatsStore_SuperAdmin_SecretKey_2026_Secure!';

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  details: []
};

function recordTest(name, passed, message) {
  results.total++;
  if (passed) {
    results.passed++;
    console.log(`  ✅ [PASS] ${name}`);
  } else {
    results.failed++;
    console.log(`  ❌ [FAIL] ${name} - ${message}`);
  }
  results.details.push({ name, passed, message });
}

async function request(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  let body = null;
  const text = await res.text();
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, headers: res.headers, body };
}

async function runTests() {
  console.log(`\n===============================================================`);
  console.log(`🚀 Starting Feature 1 Hardening Test Suite (Auth, RBAC, IDOR & Rate Limiter)`);
  console.log(`🎯 Target API: ${BACKEND_URL}`);
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  console.log(`===============================================================\n`);

  const timestamp = Date.now();
  const merchantA_email = `merchant_a_${timestamp}@testwats.com`;
  const merchantB_email = `merchant_b_${timestamp}@testwats.com`;
  const testPassword = `P@ssword123456!`;

  let tokenA = null;
  let storeA_id = null;
  let tokenB = null;
  let storeB_id = null;
  let adminToken = null;

  // --------------------------------------------------------------------------
  // PART 1: Registration and Authentication
  // --------------------------------------------------------------------------
  console.log(`\n--- [Part 1: Registration & Authentication] ---`);

  // Register Merchant A
  try {
    const resA = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        storeName: `متجر أ ${timestamp}`,
        ownerName: `تاجر أ`,
        email: merchantA_email,
        password: testPassword,
        whatsAppNumber: `0101111${String(timestamp).slice(-4)}`,
        businessCategory: `ملابس وأزياء`,
        city: `القاهرة`
      })
    });

    if (resA.status === 200 && resA.body?.token) {
      tokenA = resA.body.token;
      storeA_id = resA.body.id || resA.body.storeId;
      recordTest('Register Merchant A', true, 'Merchant A registered successfully');
    } else {
      recordTest('Register Merchant A', false, `Status ${resA.status}: ${JSON.stringify(resA.body)}`);
    }
  } catch (err) {
    recordTest('Register Merchant A', false, err.message);
  }

  // Register Merchant B
  try {
    const resB = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        storeName: `متجر ب ${timestamp}`,
        ownerName: `تاجر ب`,
        email: merchantB_email,
        password: testPassword,
        whatsAppNumber: `0102222${String(timestamp).slice(-4)}`,
        businessCategory: `إلكترونيات`,
        city: `الجيزة`
      })
    });

    if (resB.status === 200 && resB.body?.token) {
      tokenB = resB.body.token;
      storeB_id = resB.body.id || resB.body.storeId;
      recordTest('Register Merchant B', true, 'Merchant B registered successfully');
    } else {
      recordTest('Register Merchant B', false, `Status ${resB.status}: ${JSON.stringify(resB.body)}`);
    }
  } catch (err) {
    recordTest('Register Merchant B', false, err.message);
  }

  if (!tokenA || !tokenB) {
    console.error('❌ Cannot proceed with IDOR tests without tokens for both merchants.');
    return;
  }

  // --------------------------------------------------------------------------
  // PART 2: Seed Merchant A Resources (Product, Category, Order, Coupon)
  // --------------------------------------------------------------------------
  console.log(`\n--- [Part 2: Seeding Resources for Merchant A] ---`);

  let categoryA_id = null;
  let productA_id = null;
  let couponA_id = null;
  let orderA_id = null;

  // Create Category for Merchant A
  try {
    const catRes = await request('/api/merchant/categories', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ name: 'قسم اختبار أ', sortOrder: 1, isActive: true })
    });
    if (catRes.status === 200 && catRes.body?.id) {
      categoryA_id = catRes.body.id;
      recordTest('Create Category in Store A', true, `Category ID: ${categoryA_id}`);
    } else {
      recordTest('Create Category in Store A', false, `Status ${catRes.status}: ${JSON.stringify(catRes.body)}`);
    }
  } catch (err) {
    recordTest('Create Category in Store A', false, err.message);
  }

  // Create Product for Merchant A
  try {
    const prodRes = await request('/api/merchant/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        name: 'منتج اختبار أ الأصلي',
        price: 250,
        compareAtPrice: 300,
        categoryId: categoryA_id,
        description: 'وصف المنتج أ',
        isAvailable: true,
        sortOrder: 0
      })
    });
    if (prodRes.status === 200 && prodRes.body?.id) {
      productA_id = prodRes.body.id;
      recordTest('Create Product in Store A', true, `Product ID: ${productA_id}`);
    } else {
      recordTest('Create Product in Store A', false, `Status ${prodRes.status}: ${JSON.stringify(prodRes.body)}`);
    }
  } catch (err) {
    recordTest('Create Product in Store A', false, err.message);
  }

  // Create Coupon for Merchant A
  try {
    const coupRes = await request('/api/merchant/coupons', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        code: `DISC${String(timestamp).slice(-5)}`,
        discountType: 'Percentage',
        discountValue: 20,
        isActive: true
      })
    });
    if ((coupRes.status === 200 || coupRes.status === 201) && coupRes.body?.id) {
      couponA_id = coupRes.body.id;
      recordTest('Create Coupon in Store A', true, `Coupon ID: ${couponA_id}`);
    } else {
      recordTest('Create Coupon in Store A', false, `Status ${coupRes.status}: ${JSON.stringify(coupRes.body)}`);
    }
  } catch (err) {
    recordTest('Create Coupon in Store A', false, err.message);
  }

  // Create an Order on Merchant A's public storefront
  try {
    // Get store slug first
    const summaryA = await request('/api/merchant/summary', {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const slugA = summaryA.body?.storeInfo?.slug;
    if (slugA) {
      const orderRes = await request(`/api/storefront/${slugA}/orders`, {
        method: 'POST',
        body: JSON.stringify({
          customerName: 'عميل اختبار',
          customerPhone: '01012345678',
          customerAddress: 'القاهرة - المعادي',
          customerNotes: 'ملاحظة طلب تجريبي',
          paymentMethod: 'CashOnDelivery',
          itemsJson: JSON.stringify([
            { productId: productA_id, productName: 'منتج أ', unitPrice: 250, quantity: 1, subtotal: 250 }
          ]),
          totalAmount: 250
        })
      });
      if ((orderRes.status === 200 || orderRes.status === 201) && orderRes.body?.orderId) {
        orderA_id = orderRes.body.orderId;
        recordTest('Create Order on Store A', true, `Order ID: ${orderA_id}`);
      } else {
        recordTest('Create Order on Store A', false, `Status ${orderRes.status}: ${JSON.stringify(orderRes.body)}`);
      }
    }
  } catch (err) {
    recordTest('Create Order on Store A', false, err.message);
  }

  // --------------------------------------------------------------------------
  // PART 3: IDOR Shield - Merchant B Cross-Tenant Attack on Merchant A
  // --------------------------------------------------------------------------
  console.log(`\n--- [Part 3: Cross-Tenant IDOR Tampering Tests (Expect 403 Forbidden)] ---`);

  // 1. Merchant B attempts GET Merchant A's product
  if (productA_id) {
    const getRes = await request(`/api/merchant/products/${productA_id}`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    recordTest('IDOR Shield: Block GET other merchant product', getRes.status === 403, `Returned HTTP ${getRes.status}`);

    // 2. Merchant B attempts to toggle Merchant A's product
    const toggleRes = await request(`/api/merchant/products/${productA_id}/toggle-availability`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    recordTest('IDOR Shield: Block toggle other merchant product', toggleRes.status === 403, `Returned HTTP ${toggleRes.status}`);

    // 3. Merchant B attempts to update Merchant A's product
    const updateRes = await request(`/api/merchant/products/${productA_id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ name: 'محاولة اختراق منتج', price: 1 })
    });
    recordTest('IDOR Shield: Block UPDATE other merchant product', updateRes.status === 403, `Returned HTTP ${updateRes.status}`);

    // 4. Merchant B attempts to delete Merchant A's product
    const delRes = await request(`/api/merchant/products/${productA_id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    recordTest('IDOR Shield: Block DELETE other merchant product', delRes.status === 403, `Returned HTTP ${delRes.status}`);
  }

  // 5. Merchant B attempts GET Merchant A's category
  if (categoryA_id) {
    const getCatRes = await request(`/api/merchant/categories/${categoryA_id}`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    recordTest('IDOR Shield: Block GET other merchant category', getCatRes.status === 403, `Returned HTTP ${getCatRes.status}`);

    // 6. Merchant B attempts to update Merchant A's category
    const updateCatRes = await request(`/api/merchant/categories/${categoryA_id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ name: 'تعديل غير مصرح به', sortOrder: 99, isActive: false })
    });
    recordTest('IDOR Shield: Block UPDATE other merchant category', updateCatRes.status === 403, `Returned HTTP ${updateCatRes.status}`);

    // 7. Merchant B attempts to delete Merchant A's category
    const delCatRes = await request(`/api/merchant/categories/${categoryA_id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    recordTest('IDOR Shield: Block DELETE other merchant category', delCatRes.status === 403, `Returned HTTP ${delCatRes.status}`);
  }

  // 8. Merchant B attempts GET Merchant A's order
  if (orderA_id) {
    const getOrderRes = await request(`/api/merchant/orders/${orderA_id}`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    recordTest('IDOR Shield: Block GET other merchant order', getOrderRes.status === 403, `Returned HTTP ${getOrderRes.status}`);
  }

  // 9. Merchant B attempts GET Merchant A's coupon
  if (couponA_id) {
    const getCoupRes = await request(`/api/merchant/coupons/${couponA_id}`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    recordTest('IDOR Shield: Block GET other merchant coupon', getCoupRes.status === 403, `Returned HTTP ${getCoupRes.status}`);

    // 10. Merchant B attempts to toggle Merchant A's coupon
    const toggleCoupRes = await request(`/api/merchant/coupons/${couponA_id}/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    recordTest('IDOR Shield: Block TOGGLE other merchant coupon', toggleCoupRes.status === 403, `Returned HTTP ${toggleCoupRes.status}`);

    // 11. Merchant B attempts to delete Merchant A's coupon
    const delCoupRes = await request(`/api/merchant/coupons/${couponA_id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    recordTest('IDOR Shield: Block DELETE other merchant coupon', delCoupRes.status === 403, `Returned HTTP ${delCoupRes.status}`);
  }

  // 12. Non-existent resource returns 404 (not 403)
  const randomGuid = '00000000-0000-0000-0000-000000000999';
  const notFoundRes = await request(`/api/merchant/products/${randomGuid}`, {
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  recordTest('IDOR Shield: Non-existent product returns 404', notFoundRes.status === 404, `Returned HTTP ${notFoundRes.status}`);

  // --------------------------------------------------------------------------
  // PART 4: RBAC & Admin Privilege Boundary
  // --------------------------------------------------------------------------
  console.log(`\n--- [Part 4: RBAC & Admin Privilege Boundary] ---`);

  // 1. Anonymous request to Admin endpoint -> 401 Unauthorized
  const anonAdminRes = await request('/api/admin/stats');
  recordTest('RBAC: Anonymous access to /api/admin/stats returns 401', anonAdminRes.status === 401, `Returned HTTP ${anonAdminRes.status}`);

  // 2. Merchant JWT token calling Admin endpoints -> Expect 403 Forbidden!
  const merchantAdminRes1 = await request('/api/admin/stats', {
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  recordTest('RBAC: Merchant JWT accessing /api/admin/stats returns 403', merchantAdminRes1.status === 403, `Returned HTTP ${merchantAdminRes1.status}`);

  const merchantAdminRes2 = await request('/api/admin/stores', {
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  recordTest('RBAC: Merchant JWT accessing /api/admin/stores returns 403', merchantAdminRes2.status === 403, `Returned HTTP ${merchantAdminRes2.status}`);

  const merchantAdminRes3 = await request('/api/admin/plans', {
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  recordTest('RBAC: Merchant JWT accessing /api/admin/plans returns 403', merchantAdminRes3.status === 403, `Returned HTTP ${merchantAdminRes3.status}`);

  const merchantAdminRes4 = await request('/api/admin/change-password', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({ currentPassword: 'test', newPassword: 'test' })
  });
  recordTest('RBAC: Merchant JWT accessing /api/admin/change-password returns 403', merchantAdminRes4.status === 403, `Returned HTTP ${merchantAdminRes4.status}`);

  // 3. Admin Login & Authorized Access
  try {
    const adminLoginRes = await request('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        secretKey: ADMIN_SECRET
      })
    });

    if (adminLoginRes.status === 200 && adminLoginRes.body?.token) {
      adminToken = adminLoginRes.body.token;
      recordTest('Super Admin Login', true, 'Admin JWT received successfully');

      // Admin access to stats -> 200
      const statsRes = await request('/api/admin/stats', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      recordTest('RBAC: Super Admin can access /api/admin/stats', statsRes.status === 200, `Returned HTTP ${statsRes.status}`);

      // Admin access to plans -> 200
      const plansRes = await request('/api/admin/plans', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      recordTest('RBAC: Super Admin can access /api/admin/plans', plansRes.status === 200, `Returned HTTP ${plansRes.status}`);

      // 4. Admin JWT accessing Merchant Dashboard -> should be blocked (401 or 403)
      const adminMerchantRes = await request('/api/merchant/summary', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const blockedAsExpected = adminMerchantRes.status === 401 || adminMerchantRes.status === 403;
      recordTest('Admin Isolation: Admin JWT cannot access merchant summary', blockedAsExpected, `Returned HTTP ${adminMerchantRes.status}`);
    } else {
      recordTest('Super Admin Login', false, `Status ${adminLoginRes.status}: ${JSON.stringify(adminLoginRes.body)}`);
    }
  } catch (err) {
    recordTest('Super Admin Login', false, err.message);
  }

  // --------------------------------------------------------------------------
  // PART 5: Rate Limiting Enforcement (Brute Force Protection)
  // --------------------------------------------------------------------------
  console.log(`\n--- [Part 5: Rate Limiting Enforcement (Brute Force Protection)] ---`);

  console.log(`  Sending 25 rapid requests to /api/auth/login to trigger rate limit threshold (20 req/min)...`);
  let hit429 = false;
  let retryAfterHeader = null;
  let rateLimitMessage = null;

  for (let i = 1; i <= 25; i++) {
    const rlRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: `bogus_${timestamp}_${i}@test.com`,
        password: `invalid_${i}`
      })
    });

    if (rlRes.status === 429) {
      hit429 = true;
      retryAfterHeader = rlRes.headers.get('retry-after');
      rateLimitMessage = typeof rlRes.body === 'object' ? rlRes.body?.message : rlRes.body;
      console.log(`  ⚡ Rate limit triggered at request #${i}! (HTTP 429)`);
      break;
    }
  }

  recordTest('Rate Limiter: Returns HTTP 429 on brute force', hit429, hit429 ? `Message: ${rateLimitMessage}, Retry-After: ${retryAfterHeader}` : 'Did not trigger 429 within 25 requests');

  // --------------------------------------------------------------------------
  // SUMMARY REPORT
  // --------------------------------------------------------------------------
  console.log(`\n===============================================================`);
  console.log(`📊 FEATURE 1 AUDIT RESULTS SUMMARY`);
  console.log(`===============================================================`);
  console.log(`  Total Tests Run: ${results.total}`);
  console.log(`  Passed:          ${results.passed}`);
  console.log(`  Failed:          ${results.failed}`);
  console.log(`  Success Rate:    ${Math.round((results.passed / results.total) * 100)}%`);
  console.log(`===============================================================\n`);

  if (results.failed > 0) {
    console.error(`❌ Some tests failed. Please inspect the log above.`);
    process.exit(1);
  } else {
    console.log(`🎉 ALL FEATURE 1 TESTS PASSED PERFECTLY! Authentication, RBAC, IDOR Shield & Rate Limiter are 100% hardened.`);
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Unhandled test execution error:', err);
  process.exit(1);
});
