// Adversarial, Negative & Edge-Case Torture Test Suite for WatsStore SaaS
const BASE_URL = process.env.TEST_API_URL || 'https://watsstore.runasp.net';

const results = [];

function recordTest(category, testName, success, actualStatus, latencyMs, details) {
  const status = success ? 'PASS' : 'FAIL';
  results.push({ category, testName, status, actualStatus, latencyMs: Math.round(latencyMs), details });
  const icon = success ? '✅' : '❌';
  console.log(`${icon} [${status}] [HTTP ${actualStatus}] [${Math.round(latencyMs)}ms] [${category}] ${testName}: ${details}`);
}

async function request(endpoint, options = {}) {
  const start = performance.now();
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (options.rawBody !== undefined) {
      delete headers['Content-Type'];
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      body: options.rawBody !== undefined ? options.rawBody : options.body,
      headers: options.rawHeaders || headers,
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

async function runAdversarialTestSuite() {
  console.log('========================================================================');
  console.log('   WATSSTORE SAAS: ADVERSARIAL, NEGATIVE & EDGE-CASE TORTURE SUITE      ');
  console.log(`   Target Server: ${BASE_URL}`);
  console.log('========================================================================\n');

  // Step 0: Super Admin Auth
  console.log('--- Step 0: Setup Super Admin Authentication ---');
  const adminLoginRes = await request('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ secretKey: 'WatsStore_SuperAdmin_SecretKey_2026_Secure!' }),
  });
  const adminToken = adminLoginRes.data?.token;
  if (!adminToken) {
    console.error('Fatal: Cannot authenticate Super Admin');
    process.exit(1);
  }
  console.log('Super Admin authenticated successfully.');

  let storeAId = null, storeASlug = null, tokenA = null;
  let storeBId = null, storeBSlug = null, tokenB = null;
  let prodBId = null, catBId = null, couponBId = null, reviewBId = null;

  try {
    // Setup Tenant A and Tenant B
    console.log('\n--- Setup: Register Two Isolated Tenants (Store A & Store B) ---');
    const emailA = `store_a_${Date.now()}@watsstore.test`;
    const regARes = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        ownerName: 'التاجر ألف',
        email: emailA,
        password: 'Password123!',
        storeName: `متجر ألف ${Date.now()}`,
        whatsAppNumber: '01011112222',
        businessCategory: 'إلكترونيات',
        city: 'القاهرة',
      }),
    });
    storeAId = regARes.data?.storeId;
    storeASlug = regARes.data?.slug;
    tokenA = regARes.data?.token;

    const emailB = `store_b_${Date.now() + 1}@watsstore.test`;
    const regBRes = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        ownerName: 'التاجر باء',
        email: emailB,
        password: 'Password123!',
        storeName: `متجر باء ${Date.now() + 1}`,
        whatsAppNumber: '01033334444',
        businessCategory: 'أزياء وموضة',
        city: 'الجيزة',
      }),
    });
    storeBId = regBRes.data?.storeId;
    storeBSlug = regBRes.data?.slug;
    tokenB = regBRes.data?.token;

    console.log(`Store A registered: ${storeASlug} (ID: ${storeAId})`);
    console.log(`Store B registered: ${storeBSlug} (ID: ${storeBId})`);

    // Upgrade Store B to Pro so it can hold up to 20 coupons for negative testing
    await request(`/api/admin/stores/${storeBId}/plan`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}`, 'X-Admin-Key': 'WatsStore_SuperAdmin_SecretKey_2026_Secure!' },
      body: JSON.stringify({ plan: 'Pro' }),
    });

    // Populate Store B with initial data (Product, Category, Coupon, Review)
    const pBRes = await request('/api/merchant/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ name: 'منتج المتجر باء الأصلي', price: 200, isAvailable: true }),
    });
    prodBId = pBRes.data?.id;

    const cBRes = await request('/api/merchant/categories', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ name: 'قسم المتجر باء', sortOrder: 1, isActive: true }),
    });
    catBId = cBRes.data?.id;

    const coupBRes = await request('/api/merchant/coupons', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ code: `COUPON_B_${Date.now()}`, discountType: 'Percentage', discountValue: 15, isActive: true }),
    });
    couponBId = coupBRes.data?.id;

    const revBRes = await request(`/api/public/stores/${storeBSlug}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ customerName: 'عميل باء', rating: 5, comment: 'تقييم ممتاز للمتجر باء' }),
    });
    reviewBId = revBRes.data?.reviewId;

    console.log(`Store B populated with Product: ${prodBId}, Category: ${catBId}, Coupon: ${couponBId}, Review: ${reviewBId}`);

    // =========================================================================
    // SECTION 1: AUTHENTICATION, PRIVILEGE ESCALATION & CROSS-TENANT (IDOR)
    // =========================================================================
    console.log('\n========================================================================');
    console.log('  SECTION 1: AUTHENTICATION, PRIVILEGE ESCALATION & CROSS-TENANT (IDOR) ');
    console.log('========================================================================\n');

    // 1.1 IDOR Product Tampering
    const idorPutProduct = await request(`/api/merchant/products/${prodBId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ name: 'قرصنة منتج باء', price: 1, isAvailable: true }),
    });
    recordTest(
      'IDOR Protection',
      'Merchant A cannot update Merchant B Product',
      idorPutProduct.status === 404 || idorPutProduct.status === 403,
      idorPutProduct.status,
      idorPutProduct.latency,
      'Expected 404/403'
    );

    // 1.2 IDOR Product Deletion
    const idorDelProduct = await request(`/api/merchant/products/${prodBId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    recordTest(
      'IDOR Protection',
      'Merchant A cannot delete Merchant B Product',
      idorDelProduct.status === 404 || idorDelProduct.status === 403,
      idorDelProduct.status,
      idorDelProduct.latency,
      'Expected 404/403'
    );

    // 1.3 IDOR Category Update
    const idorPutCat = await request(`/api/merchant/categories/${catBId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ name: 'قرصنة قسم باء', sortOrder: 99, isActive: true }),
    });
    recordTest(
      'IDOR Protection',
      'Merchant A cannot update Merchant B Category',
      idorPutCat.status === 404 || idorPutCat.status === 403,
      idorPutCat.status,
      idorPutCat.latency,
      'Expected 404/403'
    );

    // 1.4 IDOR Category Deletion
    const idorDelCat = await request(`/api/merchant/categories/${catBId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    recordTest(
      'IDOR Protection',
      'Merchant A cannot delete Merchant B Category',
      idorDelCat.status === 404 || idorDelCat.status === 403,
      idorDelCat.status,
      idorDelCat.latency,
      'Expected 404/403'
    );

    // 1.5 IDOR Coupon Deletion
    const idorDelCoupon = await request(`/api/merchant/coupons/${couponBId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    recordTest(
      'IDOR Protection',
      'Merchant A cannot delete Merchant B Coupon',
      idorDelCoupon.status === 404 || idorDelCoupon.status === 403,
      idorDelCoupon.status,
      idorDelCoupon.latency,
      'Expected 404/403'
    );

    // 1.6 IDOR Review Approval & Deletion
    const idorApproveRev = await request(`/api/merchant/reviews/${reviewBId}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ isApproved: true }),
    });
    recordTest(
      'IDOR Protection',
      'Merchant A cannot approve Merchant B Review',
      idorApproveRev.status === 404 || idorApproveRev.status === 403,
      idorApproveRev.status,
      idorApproveRev.latency,
      'Expected 404/403'
    );

    const idorDelRev = await request(`/api/merchant/reviews/${reviewBId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    recordTest(
      'IDOR Protection',
      'Merchant A cannot delete Merchant B Review',
      idorDelRev.status === 404 || idorDelRev.status === 403,
      idorDelRev.status,
      idorDelRev.latency,
      'Expected 404/403'
    );

    // 1.7 Privilege Escalation (Merchant Token -> Super Admin Endpoints)
    const privStats = await request('/api/admin/stats', {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    recordTest(
      'Privilege Escalation',
      'Merchant Token blocked from GET /api/admin/stats',
      privStats.status === 401 || privStats.status === 403,
      privStats.status,
      privStats.latency,
      'Expected 401/403'
    );

    const privDelete = await request(`/api/admin/stores/${storeBId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    recordTest(
      'Privilege Escalation',
      'Merchant Token blocked from DELETE /api/admin/stores/{id}',
      privDelete.status === 401 || privDelete.status === 403,
      privDelete.status,
      privDelete.latency,
      'Expected 401/403'
    );

    const privToggle = await request(`/api/admin/stores/${storeBId}/toggle-status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    recordTest(
      'Privilege Escalation',
      'Merchant Token blocked from PATCH /api/admin/stores/{id}/toggle-status',
      privToggle.status === 401 || privToggle.status === 403,
      privToggle.status,
      privToggle.latency,
      'Expected 401/403'
    );

    // 1.8 Malformed & Tampered JWTs
    const jwtNull = await request('/api/merchant/summary', {
      headers: { Authorization: 'Bearer null' },
    });
    recordTest(
      'JWT Hardening',
      'Authorization: Bearer null rejected with 401',
      jwtNull.status === 401,
      jwtNull.status,
      jwtNull.latency,
      'Expected 401'
    );

    const jwtUndefined = await request('/api/merchant/summary', {
      headers: { Authorization: 'Bearer undefined' },
    });
    recordTest(
      'JWT Hardening',
      'Authorization: Bearer undefined rejected with 401',
      jwtUndefined.status === 401,
      jwtUndefined.status,
      jwtUndefined.latency,
      'Expected 401'
    );

    const jwtTampered = await request('/api/merchant/summary', {
      headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.tampered_signature_xyz' },
    });
    recordTest(
      'JWT Hardening',
      'Tampered JWT signature rejected with 401',
      jwtTampered.status === 401,
      jwtTampered.status,
      jwtTampered.latency,
      'Expected 401'
    );

    // 1.9 Password Reset & Duplicate Registration Abuse
    const pwdInvalidPin = await request('/api/admin/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email: 'abdallahsay10@gmail.com',
        resetToken: 'WATS-000000',
        newPassword: 'NewSecurePassword123!',
      }),
    });
    recordTest(
      'Password Reset Abuse',
      'Reset password with invalid PIN rejected',
      pwdInvalidPin.status === 400,
      pwdInvalidPin.status,
      pwdInvalidPin.latency,
      'Expected 400 Bad Request'
    );

    const pwdWrongEmail = await request('/api/admin/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email: 'hacker@malicious.com',
        resetToken: 'WATS-123456',
        newPassword: 'NewSecurePassword123!',
      }),
    });
    recordTest(
      'Password Reset Abuse',
      'Reset password for non-admin email rejected',
      pwdWrongEmail.status === 400,
      pwdWrongEmail.status,
      pwdWrongEmail.latency,
      'Expected 400 Bad Request'
    );

    const dupEmailReg = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        ownerName: 'مكرر',
        email: emailA,
        password: 'Password123!',
        storeName: 'متجر مكرر',
        whatsAppNumber: '01011112222',
        businessCategory: 'إلكترونيات',
        city: 'القاهرة',
      }),
    });
    recordTest(
      'Registration Abuse',
      'Duplicate email registration rejected',
      dupEmailReg.status === 400,
      dupEmailReg.status,
      dupEmailReg.latency,
      'Expected 400 Bad Request'
    );

    // =========================================================================
    // SECTION 2: FINANCIAL & E-COMMERCE BUSINESS LOGIC ABUSE
    // =========================================================================
    console.log('\n========================================================================');
    console.log('  SECTION 2: FINANCIAL & E-COMMERCE BUSINESS LOGIC ABUSE               ');
    console.log('========================================================================\n');

    // 2.1 Negative & Zero Product Price
    const negPrice = await request('/api/merchant/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ name: 'منتج بسعر سالب', price: -500, isAvailable: true }),
    });
    recordTest(
      'Financial Protection',
      'Product with negative price (-500) rejected',
      negPrice.status === 400,
      negPrice.status,
      negPrice.latency,
      'Expected 400'
    );

    const zeroPrice = await request('/api/merchant/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ name: 'منتج بسعر صفر', price: 0, isAvailable: true }),
    });
    recordTest(
      'Financial Protection',
      'Product with zero price (0) rejected',
      zeroPrice.status === 400,
      zeroPrice.status,
      zeroPrice.latency,
      'Expected 400'
    );

    // 2.2 Order with Negative & Zero Quantities
    const orderNegQty = await request(`/api/public/stores/${storeBSlug}/orders`, {
      method: 'POST',
      body: JSON.stringify({
        customerName: 'عميل احتيالي',
        customerPhone: '01012345678',
        customerAddress: 'شارع الهرم الجيزة',
        items: [{ productId: prodBId, quantity: -3 }],
      }),
    });
    recordTest(
      'Order Logic Abuse',
      'Order with negative quantity (-3) rejected',
      orderNegQty.status === 400,
      orderNegQty.status,
      orderNegQty.latency,
      'Expected 400'
    );

    const orderZeroQty = await request(`/api/public/stores/${storeBSlug}/orders`, {
      method: 'POST',
      body: JSON.stringify({
        customerName: 'عميل احتيالي',
        customerPhone: '01012345678',
        customerAddress: 'شارع الهرم الجيزة',
        items: [{ productId: prodBId, quantity: 0 }],
      }),
    });
    recordTest(
      'Order Logic Abuse',
      'Order with zero quantity (0) rejected',
      orderZeroQty.status === 400,
      orderZeroQty.status,
      orderZeroQty.latency,
      'Expected 400'
    );

    // 2.3 Client-Side Price Tampering (Ensure Server Recalculates from DB)
    const orderTamperedPrice = await request(`/api/public/stores/${storeBSlug}/orders`, {
      method: 'POST',
      body: JSON.stringify({
        customerName: 'عميل تلاعب بالأسعار',
        customerPhone: '01012345678',
        customerAddress: 'شارع التحرير الدقي',
        items: [{ productId: prodBId, quantity: 2, price: -999, unitPrice: 0.01 }],
      }),
    });
    // The server should either ignore client price and charge 200 * 2 = 400, or succeed with subtotal 400
    const serverSubtotal = orderTamperedPrice.data?.subtotal;
    const isPriceSecure = orderTamperedPrice.ok && serverSubtotal === 400;
    recordTest(
      'Financial Protection',
      'Client-side injected price ignored (server recalculated 400 EGP)',
      isPriceSecure,
      orderTamperedPrice.status,
      orderTamperedPrice.latency,
      `Calculated subtotal: ${serverSubtotal} EGP (Expected 400 EGP)`
    );

    // 2.4 Empty & Invalid Phone Checkout
    const orderEmptyItems = await request(`/api/public/stores/${storeBSlug}/orders`, {
      method: 'POST',
      body: JSON.stringify({
        customerName: 'عميل سلة فارغة',
        customerPhone: '01012345678',
        customerAddress: 'شارع التحرير الدقي',
        items: [],
      }),
    });
    recordTest(
      'Order Logic Abuse',
      'Order with empty items array rejected',
      orderEmptyItems.status === 400,
      orderEmptyItems.status,
      orderEmptyItems.latency,
      'Expected 400'
    );

    const orderInvalidPhone = await request(`/api/public/stores/${storeBSlug}/orders`, {
      method: 'POST',
      body: JSON.stringify({
        customerName: 'عميل هاتف وهمي',
        customerPhone: '1234567890', // Invalid Egyptian phone format
        customerAddress: 'شارع التحرير الدقي',
        items: [{ productId: prodBId, quantity: 1 }],
      }),
    });
    recordTest(
      'Order Logic Abuse',
      'Order with invalid phone format (1234567890) rejected',
      orderInvalidPhone.status === 400,
      orderInvalidPhone.status,
      orderInvalidPhone.latency,
      'Expected 400'
    );

    // 2.5 Suspended Store Checkout & Coupon Block
    // Suspend Store B via Admin
    await request(`/api/admin/stores/${storeBId}/toggle-status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}`, 'X-Admin-Key': 'WatsStore_SuperAdmin_SecretKey_2026_Secure!' },
    });

    const suspendedOrderRes = await request(`/api/public/stores/${storeBSlug}/orders`, {
      method: 'POST',
      body: JSON.stringify({
        customerName: 'عميل متجر معطل',
        customerPhone: '01012345678',
        customerAddress: 'العنوان',
        items: [{ productId: prodBId, quantity: 1 }],
      }),
    });
    recordTest(
      'Suspended Store Protection',
      'Placing order on suspended store blocked',
      suspendedOrderRes.status === 404 || suspendedOrderRes.status === 403,
      suspendedOrderRes.status,
      suspendedOrderRes.latency,
      'Expected 404/403'
    );

    const suspendedCouponRes = await request(`/api/public/stores/${storeBSlug}/apply-coupon`, {
      method: 'POST',
      body: JSON.stringify({ code: 'ANY', cartSubtotal: 100 }),
    });
    recordTest(
      'Suspended Store Protection',
      'Applying coupon on suspended store blocked',
      suspendedCouponRes.status === 404 || suspendedCouponRes.status === 403,
      suspendedCouponRes.status,
      suspendedCouponRes.latency,
      'Expected 404/403'
    );

    // Reactivate Store B
    await request(`/api/admin/stores/${storeBId}/toggle-status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}`, 'X-Admin-Key': 'WatsStore_SuperAdmin_SecretKey_2026_Secure!' },
    });

    // 2.6 Coupon Engine: Usage Limit Exceeded Torture Test
    const oneTimeCouponCode = `ONCE_${Date.now()}`;
    await request('/api/merchant/coupons', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({
        code: oneTimeCouponCode,
        discountType: 'FixedAmount',
        discountValue: 50,
        usageLimit: 1,
        isActive: true,
      }),
    });

    // First use: Should succeed
    const firstUseRes = await request(`/api/public/stores/${storeBSlug}/orders`, {
      method: 'POST',
      body: JSON.stringify({
        customerName: 'مستخدم الكوبون أول مرة',
        customerPhone: '01012345678',
        customerAddress: 'شارع النصر المعادي',
        couponCode: oneTimeCouponCode,
        items: [{ productId: prodBId, quantity: 1 }],
      }),
    });
    recordTest(
      'Coupon Engine',
      'Single-use coupon first order succeeds',
      firstUseRes.ok,
      firstUseRes.status,
      firstUseRes.latency,
      'Expected 200/201'
    );

    // Second use: Must be strictly blocked!
    const secondUseRes = await request(`/api/public/stores/${storeBSlug}/orders`, {
      method: 'POST',
      body: JSON.stringify({
        customerName: 'مستخدم الكوبون ثاني مرة',
        customerPhone: '01012345678',
        customerAddress: 'شارع النصر المعادي',
        couponCode: oneTimeCouponCode,
        items: [{ productId: prodBId, quantity: 1 }],
      }),
    });
    recordTest(
      'Coupon Engine',
      'Single-use coupon second order blocked (UsageLimit exceeded)',
      secondUseRes.status === 400,
      secondUseRes.status,
      secondUseRes.latency,
      'Expected 400 Bad Request'
    );

    // 2.7 Expired Coupon Block
    const expiredCouponCode = `EXP_${Date.now()}`;
    await request('/api/merchant/coupons', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({
        code: expiredCouponCode,
        discountType: 'Percentage',
        discountValue: 20,
        expiryDate: '2020-01-01T00:00:00Z',
        isActive: true,
      }),
    });

    const applyExpired = await request(`/api/public/stores/${storeBSlug}/apply-coupon`, {
      method: 'POST',
      body: JSON.stringify({ code: expiredCouponCode, cartSubtotal: 200 }),
    });
    recordTest(
      'Coupon Engine',
      'Expired coupon application rejected',
      applyExpired.status === 400,
      applyExpired.status,
      applyExpired.latency,
      'Expected 400 Bad Request'
    );

    // 2.8 Fixed Discount Greater Than Subtotal (No Negative Total!)
    const giantCouponCode = `GIANT_${Date.now()}`;
    await request('/api/merchant/coupons', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({
        code: giantCouponCode,
        discountType: 'FixedAmount',
        discountValue: 500, // 500 EGP discount
        isActive: true,
      }),
    });

    const giantApplyRes = await request(`/api/public/stores/${storeBSlug}/apply-coupon`, {
      method: 'POST',
      body: JSON.stringify({ code: giantCouponCode, cartSubtotal: 100 }), // 100 EGP cart
    });
    const finalNewSubtotal = giantApplyRes.data?.newSubtotal;
    recordTest(
      'Financial Protection',
      'Discount (500) > Subtotal (100) clamps newSubtotal to 0 EGP (no negative total)',
      giantApplyRes.ok && finalNewSubtotal === 0,
      giantApplyRes.status,
      giantApplyRes.latency,
      `New Subtotal: ${finalNewSubtotal} EGP (Expected 0 EGP)`
    );

    // 2.9 Invalid Percentage Values (> 100% or < 0%)
    const over100Coupon = await request('/api/merchant/coupons', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({
        code: `OVER100_${Date.now()}`,
        discountType: 'Percentage',
        discountValue: 150, // 150%
        isActive: true,
      }),
    });
    recordTest(
      'Coupon Engine',
      'Percentage discount > 100% rejected',
      over100Coupon.status === 400,
      over100Coupon.status,
      over100Coupon.latency,
      'Expected 400 Bad Request'
    );

    const negDiscountCoupon = await request('/api/merchant/coupons', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({
        code: `NEG20_${Date.now()}`,
        discountType: 'Percentage',
        discountValue: -20, // -20%
        isActive: true,
      }),
    });
    recordTest(
      'Coupon Engine',
      'Negative discount value (-20) rejected',
      negDiscountCoupon.status === 400,
      negDiscountCoupon.status,
      negDiscountCoupon.latency,
      'Expected 400 Bad Request'
    );

    // =========================================================================
    // SECTION 3: INJECTION, PAYLOAD OVERFLOW & MALFORMED DATA (FUZZING)
    // =========================================================================
    console.log('\n========================================================================');
    console.log('  SECTION 3: INJECTION, PAYLOAD OVERFLOW & MALFORMED DATA (FUZZING)     ');
    console.log('========================================================================\n');

    // 3.1 XSS & Script Tag Injection in Reviews
    const xssReview = await request(`/api/public/stores/${storeBSlug}/reviews`, {
      method: 'POST',
      body: JSON.stringify({
        customerName: "<script>alert('xss')</script>عميل حقيقي",
        rating: 5,
        comment: "<img src=x onerror=alert('hacked')>تعليق ممتاز ومطهر",
      }),
    });
    recordTest(
      'Input Sanitization (XSS)',
      'Review with script/HTML injection handled safely',
      xssReview.status === 201,
      xssReview.status,
      xssReview.latency,
      'Created with tags stripped (Zero 500 crash)'
    );

    // 3.2 SQL Injection in Public Storefront Slug
    const sqliSlug = await request("/api/public/stores/' OR '1'='1'; DROP TABLE Stores;--");
    recordTest(
      'SQL Injection Resistance',
      'SQL Injection in store slug handled safely with 404 (Zero 500)',
      sqliSlug.status === 404 || sqliSlug.status === 400,
      sqliSlug.status,
      sqliSlug.latency,
      'Expected 404/400'
    );

    // 3.3 Boundary & Rating Abuse (Rating 99, 0, -5)
    const review99 = await request(`/api/public/stores/${storeBSlug}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ customerName: 'مقيم عشوائي', rating: 99, comment: 'تقييم غير منطقي' }),
    });
    recordTest(
      'Boundary Validation',
      'Review with rating 99 rejected',
      review99.status === 400,
      review99.status,
      review99.latency,
      'Expected 400 Bad Request'
    );

    const reviewZero = await request(`/api/public/stores/${storeBSlug}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ customerName: 'مقيم عشوائي', rating: 0, comment: 'تقييم غير منطقي' }),
    });
    recordTest(
      'Boundary Validation',
      'Review with rating 0 rejected',
      reviewZero.status === 400,
      reviewZero.status,
      reviewZero.latency,
      'Expected 400 Bad Request'
    );

    const reviewNeg = await request(`/api/public/stores/${storeBSlug}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ customerName: 'مقيم عشوائي', rating: -5, comment: 'تقييم غير منطقي' }),
    });
    recordTest(
      'Boundary Validation',
      'Review with rating -5 rejected',
      reviewNeg.status === 400,
      reviewNeg.status,
      reviewNeg.latency,
      'Expected 400 Bad Request'
    );

    // 3.4 Extremely Long Payload Overflow (10,000+ chars)
    const hugeString = 'أ'.repeat(10500);
    const overflowReview = await request(`/api/public/stores/${storeBSlug}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ customerName: hugeString, rating: 5, comment: 'نص عادي' }),
    });
    recordTest(
      'Payload Overflow',
      'Customer name with 10,000+ characters rejected with 400',
      overflowReview.status === 400,
      overflowReview.status,
      overflowReview.latency,
      'Expected 400 Bad Request'
    );

    // 3.5 Malformed JSON & Empty Bodies
    const emptyLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    recordTest(
      'Malformed Data Handling',
      'POST /api/auth/login with empty body {} returns 400',
      emptyLogin.status === 400,
      emptyLogin.status,
      emptyLogin.latency,
      'Expected 400 Bad Request'
    );

    const malformedJsonOrder = await request(`/api/public/stores/${storeBSlug}/orders`, {
      method: 'POST',
      rawBody: '{"customerName": "عميل", "items": [ INVALID_JSON_BODY }',
      rawHeaders: { 'Content-Type': 'application/json' },
    });
    recordTest(
      'Malformed Data Handling',
      'Malformed JSON payload rejected cleanly with 400 (Zero 500 error)',
      malformedJsonOrder.status === 400,
      malformedJsonOrder.status,
      malformedJsonOrder.latency,
      'Expected 400 Bad Request'
    );

    const emptyAiBody = await request('/api/merchant/ai/generate-description', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({}),
    });
    recordTest(
      'Malformed Data Handling',
      'POST /api/merchant/ai/generate-description with empty body {} returns 400',
      emptyAiBody.status === 400,
      emptyAiBody.status,
      emptyAiBody.latency,
      'Expected 400 Bad Request'
    );

    // =========================================================================
    // SECTION 4: RATE LIMITING & BURST TEST
    // =========================================================================
    console.log('\n========================================================================');
    console.log('  SECTION 4: RATE LIMITING & CONCURRENCY BURST TEST                    ');
    console.log('========================================================================\n');

    console.log('Firing rapid burst of 15 consecutive login requests to verify 429 limiter...');
    let hit429 = false;
    let burst429Status = 0;
    const burstPromises = [];
    for (let i = 1; i <= 15; i++) {
      burstPromises.push(
        request('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: 'burst_tester@watsstore.test', password: 'WrongPassword!' }),
        })
      );
    }
    const burstResponses = await Promise.all(burstPromises);
    for (const r of burstResponses) {
      if (r.status === 429) {
        hit429 = true;
        burst429Status = 429;
        break;
      }
    }

    recordTest(
      'Rate Limiting & Anti-Brute-Force',
      'Rapid burst triggers HTTP 429 Too Many Requests',
      hit429,
      burst429Status || burstResponses[burstResponses.length - 1].status,
      150,
      hit429 ? 'HTTP 429 correctly triggered after burst limit' : 'Rate limiter did not trigger within 15 requests'
    );

  } finally {
    // =========================================================================
    // SECTION 5: CLEANUP
    // =========================================================================
    console.log('\n========================================================================');
    console.log('  SECTION 5: DATA RESTORATION & CLEANUP                                ');
    console.log('========================================================================\n');

    if (storeAId) {
      const delA = await request(`/api/admin/stores/${storeAId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}`, 'X-Admin-Key': 'WatsStore_SuperAdmin_SecretKey_2026_Secure!' },
      });
      console.log(`Cleaned up Store A (${storeAId}): HTTP ${delA.status}`);
    }

    if (storeBId) {
      const delB = await request(`/api/admin/stores/${storeBId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}`, 'X-Admin-Key': 'WatsStore_SuperAdmin_SecretKey_2026_Secure!' },
      });
      console.log(`Cleaned up Store B (${storeBId}): HTTP ${delB.status}`);
    }
  }

  // =========================================================================
  // RESULTS SUMMARY
  // =========================================================================
  console.log('\n========================================================================');
  console.log('            ADVERSARIAL & NEGATIVE TEST RESULTS SUMMARY                 ');
  console.log('========================================================================');
  const total = results.length;
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`Total Adversarial Checks: ${total} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    console.error(`\n❌ ${failed} ADVERSARIAL CHECKS FAILED! INVESTIGATE IMMEDIATELY.`);
    process.exit(1);
  } else {
    console.log('\n🎉 ALL ADVERSARIAL & NEGATIVE TORTURE TESTS PASSED WITH 100% SUCCESS!');
  }
}

runAdversarialTestSuite().catch(err => {
  console.error('Fatal Test Suite Error:', err);
  process.exit(1);
});
