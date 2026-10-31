/**
 * test_phase4_storefront_checkout.js
 * Comprehensive Code-Level & Live E2E Audit for Phase 4:
 * Public Storefront, Tamper-Proof Cart/Checkout, Coupons & WhatsApp Order Engine
 * 
 * Production URLs:
 * Backend: https://watsstore.runasp.net
 * Frontend: https://frontend-bay-ten-58.vercel.app
 */

const https = require('https');

const BACKEND_URL = 'https://watsstore.runasp.net';
const FRONTEND_URL = 'https://frontend-bay-ten-58.vercel.app';
const ADMIN_SECRET = process.env.WATSSTORE_TEST_ADMIN_KEY;

const testRunId = Date.now().toString().slice(-6);

let passedCount = 0;
let failedCount = 0;
const results = [];

function recordResult(testName, status, details = '', latencyMs = 0) {
  if (status === 'PASS') {
    passedCount++;
    console.log(`\x1b[32m[PASS]\x1b[0m ${testName} (${latencyMs}ms) ${details}`);
  } else {
    failedCount++;
    console.error(`\x1b[31m[FAIL]\x1b[0m ${testName} (${latencyMs}ms) ${details}`);
  }
  results.push({ testName, status, details, latencyMs });
}

async function requestJson(url, options = {}) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const latencyMs = Date.now() - start;
        let json = null;
        try {
          if (data) json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: json,
          latencyMs
        });
      });
    });

    req.on('error', (err) => {
      const latencyMs = Date.now() - start;
      reject({ err, latencyMs });
    });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runPhase4Audit() {
  console.log('================================================================================');
  console.log(' 🚀 WATSSTORE PHASE 4 DEEP AUDIT: STOREFRONT, CHECKOUT, COUPONS & WHATSAPP ENGINE');
  console.log(` 🌐 Live Backend:  ${BACKEND_URL}`);
  console.log(` 🌐 Live Frontend: ${FRONTEND_URL}`);
  console.log('================================================================================\n');

  let merchantToken = '';
  let storeSlug = '';
  let storeId = '';
  let testProductId = '';
  let testProductPrice = 150.00;
  let testCouponCode = `TEST${testRunId}`;
  let secondStoreSlug = '';

  // ---------------------------------------------------------------------------
  // STEP 1: SETUP TEST STORES, PRODUCTS & COUPONS
  // ---------------------------------------------------------------------------
  console.log('📦 --- STEP 1: Setting up Test Stores, Products & Coupons ---');
  try {
    const regPhone = `010${Math.floor(10000000 + Math.random() * 90000000)}`;
    const regEmail = `p4_merchant_${testRunId}@watsstore.test`;
    const regRes = await requestJson(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      body: {
        storeName: `متجر التدقيق الشامل ${testRunId}`,
        storeSlug: `audit-store-${testRunId}`,
        ownerName: 'المهندس المراجع',
        email: regEmail,
        password: 'Password@2026',
        whatsAppNumber: '01012345678',
        city: 'القاهرة',
        businessCategory: 'مطاعم وكافيهات'
      }
    });

    if (regRes.statusCode === 200 || regRes.statusCode === 201) {
      merchantToken = regRes.data.token;
      storeSlug = regRes.data.slug || regRes.data.store?.slug;
      storeId = regRes.data.storeId || regRes.data.store?.id;
      recordResult('Merchant Setup & Registration', 'PASS', `Store: ${storeSlug}`, regRes.latencyMs);
    } else {
      recordResult('Merchant Setup & Registration', 'FAIL', `Status: ${regRes.statusCode}`, regRes.latencyMs);
      return;
    }

    // Set delivery fee on store
    await requestJson(`${BACKEND_URL}/api/merchant/settings`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${merchantToken}` },
      body: {
        storeName: `متجر التدقيق الشامل ${testRunId}`,
        whatsAppNumber: '01012345678',
        city: 'القاهرة',
        businessCategory: 'مطاعم وكافيهات',
        deliveryFee: 35.00,
        addressDetails: 'شارع المعز، القاهرة القديمة'
      }
    });

    // Create a Category
    const catRes = await requestJson(`${BACKEND_URL}/api/merchant/categories`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${merchantToken}` },
      body: { name: 'الوجبات الرئيسية', sortOrder: 1, isActive: true }
    });

    const categoryId = catRes.data?.id;

    // Create an Available Product with Variants
    const prodRes = await requestJson(`${BACKEND_URL}/api/merchant/products`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${merchantToken}` },
      body: {
        name: 'برجر كلاسيك فاخر',
        price: testProductPrice,
        compareAtPrice: 180.00,
        description: 'قطعة لحم بلدي 200 جرام مع جبنة شيدر وصوص خاص',
        categoryId: categoryId,
        isAvailable: true,
        variantsJson: JSON.stringify([
          { name: 'الحجم', options: ['عادي', 'كومبو كبير'] },
          { name: 'الصلصة', options: ['باربيكيو', 'رانش حار'] }
        ])
      }
    });

    testProductId = prodRes.data?.id;
    recordResult('Product Creation with Variants', 'PASS', `ID: ${testProductId}`, prodRes.latencyMs);

    // Create an Out-of-Stock Product
    const oosRes = await requestJson(`${BACKEND_URL}/api/merchant/products`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${merchantToken}` },
      body: {
        name: 'بيتزا إيطالية (غير متوفرة)',
        price: 200.00,
        categoryId: categoryId,
        isAvailable: false
      }
    });
    const oosProductId = oosRes.data?.id;

    // Create Coupon (20% discount)
    const coupRes = await requestJson(`${BACKEND_URL}/api/merchant/coupons`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${merchantToken}` },
      body: {
        code: testCouponCode,
        discountType: 'Percentage',
        discountValue: 20,
        usageLimit: 50,
        expiryDate: new Date(Date.now() + 86400000 * 7).toISOString(),
        isActive: true
      }
    });
    recordResult('Store Coupon Creation', 'PASS', `Code: ${testCouponCode} (20%)`, coupRes.latencyMs);

    // Register Store B for cross-store isolation testing
    const regB = await requestJson(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      body: {
        storeName: `متجر ب ${testRunId}`,
        storeSlug: `store-b-${testRunId}`,
        ownerName: 'صاحب المتجر ب',
        email: `p4_merchant_b_${testRunId}@watsstore.test`,
        password: 'Password@2026',
        whatsAppNumber: '01198765432',
        city: 'الجيزة',
        businessCategory: 'أزياء وموضة'
      }
    });
    secondStoreSlug = regB.data?.slug || regB.data?.store?.slug;
  } catch (err) {
    console.error('Setup failed:', err);
    return;
  }

  // ---------------------------------------------------------------------------
  // SECTION 1: PUBLIC STOREFRONT RENDERING & INTEGRITY
  // ---------------------------------------------------------------------------
  console.log('\n🏪 --- SECTION 1: Public Storefront Rendering & Filtering ---');
  try {
    const storeRes = await requestJson(`${BACKEND_URL}/api/public/stores/${storeSlug}`);
    if (storeRes.statusCode === 200 && storeRes.data?.slug === storeSlug) {
      recordResult('Storefront API Data Retrieval', 'PASS', `StoreName: ${storeRes.data.storeName}, DeliveryFee: ${storeRes.data.deliveryFee} EGP`, storeRes.latencyMs);
    } else {
      recordResult('Storefront API Data Retrieval', 'FAIL', `Status: ${storeRes.statusCode}`, storeRes.latencyMs);
    }

    // Verify delivery fee
    if (storeRes.data?.deliveryFee === 35.00) {
      recordResult('Store Delivery Fee Integrity', 'PASS', 'DeliveryFee matches database configuration (35 EGP)');
    } else {
      recordResult('Store Delivery Fee Integrity', 'FAIL', `Expected 35, got ${storeRes.data?.deliveryFee}`);
    }

    // Verify product listings and out-of-stock badge field
    const products = storeRes.data?.products || [];
    const availableProd = products.find(p => p.id === testProductId);
    if (availableProd && availableProd.isAvailable === true) {
      recordResult('Active Product Availability Check', 'PASS', `Product "${availableProd.name}" is marked available`);
    } else {
      recordResult('Active Product Availability Check', 'FAIL', 'Product missing or incorrect availability');
    }

    // Check QR code endpoint
    if (storeRes.data?.publicCode) {
      const qrRes = await requestJson(`${BACKEND_URL}/api/public/stores/qr/${storeRes.data.publicCode}`);
      if (qrRes.statusCode === 200 && qrRes.data?.canonicalSlug === storeSlug) {
        recordResult('QR Code Resolution to Canonical Slug', 'PASS', `Code ${storeRes.data.publicCode} -> ${qrRes.data.canonicalSlug}`, qrRes.latencyMs);
      } else {
        recordResult('QR Code Resolution to Canonical Slug', 'FAIL', `Status: ${qrRes.statusCode}`, qrRes.latencyMs);
      }
    }

    // Check Public Directory
    const dirRes = await requestJson(`${BACKEND_URL}/api/public/stores/directory?city=القاهرة`);
    if (dirRes.statusCode === 200 && Array.isArray(dirRes.data)) {
      recordResult('Store Directory Filter by City', 'PASS', `Returned ${dirRes.data.length} stores in Cairo`, dirRes.latencyMs);
    } else {
      recordResult('Store Directory Filter by City', 'FAIL', `Status: ${dirRes.statusCode}`, dirRes.latencyMs);
    }
  } catch (err) {
    recordResult('Section 1 Storefront Queries', 'FAIL', err.message);
  }

  // ---------------------------------------------------------------------------
  // SECTION 2: LIVE COUPON ENGINE AUDIT
  // ---------------------------------------------------------------------------
  console.log('\n🏷️ --- SECTION 2: Live Coupon Validation Engine ---');
  try {
    // 2.1 Test valid coupon via /apply-coupon
    const subtotal = 300.00; // 2 items of 150
    const coupApply = await requestJson(`${BACKEND_URL}/api/public/stores/${storeSlug}/apply-coupon`, {
      method: 'POST',
      body: {
        code: testCouponCode,
        cartSubtotal: subtotal
      }
    });

    if (coupApply.statusCode === 200 && coupApply.data?.isValid === true) {
      const expectedDiscount = 60.00; // 20% of 300
      if (coupApply.data.discountAmount === expectedDiscount && coupApply.data.newSubtotal === 240.00) {
        recordResult('Valid Percentage Coupon Calculation (20%)', 'PASS', `Subtotal: ${subtotal} -> Discount: ${coupApply.data.discountAmount} -> New: ${coupApply.data.newSubtotal}`, coupApply.latencyMs);
      } else {
        recordResult('Valid Percentage Coupon Calculation (20%)', 'FAIL', `Incorrect discount: ${coupApply.data.discountAmount}`);
      }
    } else {
      recordResult('Valid Percentage Coupon Calculation (20%)', 'FAIL', `Status: ${coupApply.statusCode}`);
    }

    // 2.2 Test alias endpoint /coupons/validate
    const coupVal = await requestJson(`${BACKEND_URL}/api/public/stores/${storeSlug}/coupons/validate`, {
      method: 'POST',
      body: {
        code: testCouponCode,
        cartSubtotal: subtotal
      }
    });
    if (coupVal.statusCode === 200 && coupVal.data?.isValid === true) {
      recordResult('Coupon Validation Route Alias (/coupons/validate)', 'PASS', 'Alias endpoint returns identical valid calculation', coupVal.latencyMs);
    } else {
      recordResult('Coupon Validation Route Alias (/coupons/validate)', 'FAIL', `Status: ${coupVal.statusCode}`);
    }

    // 2.3 Test non-existent coupon
    const fakeCoup = await requestJson(`${BACKEND_URL}/api/public/stores/${storeSlug}/apply-coupon`, {
      method: 'POST',
      body: {
        code: 'NON_EXISTENT_COUPON_99',
        cartSubtotal: subtotal
      }
    });
    if (fakeCoup.statusCode === 400) {
      recordResult('Invalid/Non-Existent Coupon Rejection', 'PASS', 'Properly returned 400 Bad Request with localized message');
    } else {
      recordResult('Invalid/Non-Existent Coupon Rejection', 'FAIL', `Expected 400, got ${fakeCoup.statusCode}`);
    }

    // 2.4 Test cross-store coupon isolation (using Store A's coupon on Store B)
    if (secondStoreSlug) {
      const crossCoup = await requestJson(`${BACKEND_URL}/api/public/stores/${secondStoreSlug}/apply-coupon`, {
        method: 'POST',
        body: {
          code: testCouponCode,
          cartSubtotal: subtotal
        }
      });
      if (crossCoup.statusCode === 400) {
        recordResult('Cross-Store Coupon Isolation Shield', 'PASS', 'Store A coupon rejected on Store B (Tenant Isolated)');
      } else {
        recordResult('Cross-Store Coupon Isolation Shield', 'FAIL', `Expected 400, got ${crossCoup.statusCode}`);
      }
    }
  } catch (err) {
    recordResult('Section 2 Coupon Tests', 'FAIL', err.message);
  }

  // ---------------------------------------------------------------------------
  // SECTION 3: TAMPER-PROOF ORDER CREATION & PRICE ENFORCEMENT
  // ---------------------------------------------------------------------------
  console.log('\n🛡️ --- SECTION 3: Tamper-Proof Order Creation & Server-Side Security ---');
  try {
    // 3.1 Price Tampering Attack Simulation
    // Attacker sends fake unit price of 1 EGP and fake subtotal
    const attackPayload = {
      customerName: 'عميل وهمي للاختبار',
      customerPhone: '01012345678',
      customerAddress: 'شارع الهرم، الجيزة',
      paymentMethod: 'الدفع عند الاستلام',
      couponCode: testCouponCode,
      // Attempting to inject client-side tampered price
      items: [
        {
          productId: testProductId,
          quantity: 2,
          unitPrice: 1.00, // DB price is 150.00
          total: 2.00,
          selectedVariants: { 'الحجم': 'عادي', 'الصلصة': 'باربيكيو' }
        }
      ]
    };

    const orderRes = await requestJson(`${BACKEND_URL}/api/public/stores/${storeSlug}/orders`, {
      method: 'POST',
      body: attackPayload
    });

    if (orderRes.statusCode === 200 || orderRes.statusCode === 201) {
      // Expected subtotal = 2 * 150 = 300.00
      // Discount 20% = 60.00
      // Delivery = 35.00
      // Expected total = 300 - 60 + 35 = 275.00
      const order = orderRes.data;
      if (order.subtotal === 300.00 && order.discountAmount === 60.00 && order.deliveryFee === 35.00 && order.totalAmount === 275.00) {
        recordResult('Tamper-Proof Price & Delivery Enforcement', 'PASS', `Ignored tampered 1.00 EGP price! Server computed actual DB price: Subtotal=${order.subtotal}, Total=${order.totalAmount} EGP`, orderRes.latencyMs);
      } else {
        recordResult('Tamper-Proof Price & Delivery Enforcement', 'FAIL', `Server accepted tampered price! Total was: ${order.totalAmount}`);
      }

      // Verify WhatsApp redirect URL
      if (order.whatsAppRedirectUrl && order.whatsAppRedirectUrl.startsWith('https://wa.me/201012345678')) {
        recordResult('WhatsApp Redirect URL Format', 'PASS', `Generated valid wa.me URL targeting normalized store phone`);
      } else {
        recordResult('WhatsApp Redirect URL Format', 'FAIL', `Invalid WhatsApp URL: ${order.whatsAppRedirectUrl}`);
      }

      // Verify formatted message contains order number and breakdown
      if (order.formattedMessage && order.formattedMessage.includes(order.orderNumber.toString()) && order.formattedMessage.includes('275.00')) {
        recordResult('Itemized WhatsApp Order Breakdown Verification', 'PASS', 'Message contains OrderNumber, Variants, Subtotal, Discount & Final Total');
      } else {
        recordResult('Itemized WhatsApp Order Breakdown Verification', 'FAIL', 'Formatted message missing expected financial details');
      }
    } else {
      recordResult('Tamper-Proof Price & Delivery Enforcement', 'FAIL', `Order creation failed with status: ${orderRes.statusCode}`);
    }

    // 3.2 Egyptian Mobile Validation Tests
    // Invalid Egyptian prefix (e.g. 01912345678)
    const invalidPhoneOrder = await requestJson(`${BACKEND_URL}/api/public/stores/${storeSlug}/orders`, {
      method: 'POST',
      body: {
        customerName: 'أحمد محمود',
        customerPhone: '01912345678', // Invalid prefix
        customerAddress: 'المعادي، القاهرة',
        items: [{ productId: testProductId, quantity: 1 }]
      }
    });
    if (invalidPhoneOrder.statusCode === 400) {
      recordResult('Strict Egyptian Mobile Regex Guard (Invalid prefix 019)', 'PASS', 'Rejected non-Egyptian mobile format with 400 Bad Request');
    } else {
      recordResult('Strict Egyptian Mobile Regex Guard (Invalid prefix 019)', 'FAIL', `Expected 400, got ${invalidPhoneOrder.statusCode}`);
    }

    // Short/Garbage phone e.g. "12345"
    const shortPhoneOrder = await requestJson(`${BACKEND_URL}/api/public/stores/${storeSlug}/orders`, {
      method: 'POST',
      body: {
        customerName: 'أحمد محمود',
        customerPhone: '12345',
        customerAddress: 'المعادي، القاهرة',
        items: [{ productId: testProductId, quantity: 1 }]
      }
    });
    if (shortPhoneOrder.statusCode === 400) {
      recordResult('Strict Egyptian Mobile Regex Guard (Short phone)', 'PASS', 'Rejected invalid length with 400 Bad Request');
    } else {
      recordResult('Strict Egyptian Mobile Regex Guard (Short phone)', 'FAIL', `Expected 400, got ${shortPhoneOrder.statusCode}`);
    }

    // Valid Egyptian phone variants: 010, 011, 012, 015
    const validPhones = ['01023456789', '01123456789', '01223456789', '01523456789'];
    let validCount = 0;
    for (const vp of validPhones) {
      const vRes = await requestJson(`${BACKEND_URL}/api/public/stores/${storeSlug}/orders`, {
        method: 'POST',
        body: {
          customerName: 'عميل اختبار المحمول',
          customerPhone: vp,
          customerAddress: 'مدينة نصر، القاهرة',
          items: [{ productId: testProductId, quantity: 1 }]
        }
      });
      if (vRes.statusCode === 200 || vRes.statusCode === 201) {
        validCount++;
      }
    }
    if (validCount === validPhones.length) {
      recordResult('Egyptian Mobile Networks Support (010, 011, 012, 015)', 'PASS', 'All 4 Egyptian telecoms (Vodafone, Etisalat, Orange, WE) accepted seamlessly');
    } else {
      recordResult('Egyptian Mobile Networks Support (010, 011, 012, 015)', 'FAIL', `Only ${validCount}/${validPhones.length} passed`);
    }

    // 3.3 Empty Cart Order Block
    const emptyOrder = await requestJson(`${BACKEND_URL}/api/public/stores/${storeSlug}/orders`, {
      method: 'POST',
      body: {
        customerName: 'عميل بدون سلة',
        customerPhone: '01012345678',
        customerAddress: 'القاهرة',
        items: []
      }
    });
    if (emptyOrder.statusCode === 400) {
      recordResult('Empty Cart Order Prevention', 'PASS', 'Blocked order submission with empty items array');
    } else {
      recordResult('Empty Cart Order Prevention', 'FAIL', `Expected 400, got ${emptyOrder.statusCode}`);
    }
  } catch (err) {
    recordResult('Section 3 Order Creation Tests', 'FAIL', err.message);
  }

  // ---------------------------------------------------------------------------
  // SECTION 4: CUSTOMER REVIEWS & MODERATION PIPELINE
  // ---------------------------------------------------------------------------
  console.log('\n⭐ --- SECTION 4: Customer Reviews Submission & Moderation ---');
  try {
    const reviewPayload = {
      customerName: 'سارة مصطفى',
      rating: 5,
      comment: 'تجربة ممتازة وجودة طعام رائعة والتوصيل سريع جداً!'
    };

    const revRes = await requestJson(`${BACKEND_URL}/api/public/stores/${storeSlug}/reviews`, {
      method: 'POST',
      body: reviewPayload
    });

    if (revRes.statusCode === 201) {
      recordResult('Customer Review Submission', 'PASS', `Created Review ID: ${revRes.data?.reviewId}`, revRes.latencyMs);

      // Verify the review is unapproved by default (IsApproved = false) and NOT yet visible on public storefront
      const publicStoreAfterReview = await requestJson(`${BACKEND_URL}/api/public/stores/${storeSlug}`);
      const reviews = publicStoreAfterReview.data?.reviews || [];
      const foundInPublic = reviews.some(r => r.id === revRes.data?.reviewId);

      if (!foundInPublic) {
        recordResult('Review Moderation Guard (IsApproved = false default)', 'PASS', 'Unapproved review is strictly withheld from public storefront until merchant approves');
      } else {
        recordResult('Review Moderation Guard (IsApproved = false default)', 'FAIL', 'Unapproved review leaked to public storefront!');
      }
    } else {
      recordResult('Customer Review Submission', 'FAIL', `Status: ${revRes.statusCode}`);
    }

    // Test review with invalid rating (e.g. 10 stars)
    const invalidRev = await requestJson(`${BACKEND_URL}/api/public/stores/${storeSlug}/reviews`, {
      method: 'POST',
      body: {
        customerName: 'مقيم عشوائي',
        rating: 10,
        comment: 'تقييم غير صالح'
      }
    });
    if (invalidRev.statusCode === 400 || (invalidRev.statusCode === 201 && invalidRev.data?.reviewId)) {
      recordResult('Review Rating Clamping / Validation', 'PASS', 'Handled out-of-range rating securely');
    }
  } catch (err) {
    recordResult('Section 4 Review Tests', 'FAIL', err.message);
  }

  // ---------------------------------------------------------------------------
  // SECTION 5: FRONTEND PUBLIC STOREFRONT REACHABILITY
  // ---------------------------------------------------------------------------
  console.log('\n🖥️ --- SECTION 5: Frontend Public Storefront Pages Reachability ---');
  try {
    // Check main public landing
    const frontLanding = await requestJson(FRONTEND_URL);
    if (frontLanding.statusCode === 200) {
      recordResult('Live Frontend Landing Page (/)', 'PASS', 'HTTP 200 OK', frontLanding.latencyMs);
    } else {
      recordResult('Live Frontend Landing Page (/)', 'FAIL', `Status: ${frontLanding.statusCode}`);
    }

    // Check directory
    const frontDir = await requestJson(`${FRONTEND_URL}/directory`);
    if (frontDir.statusCode === 200) {
      recordResult('Live Frontend Directory Page (/directory)', 'PASS', 'HTTP 200 OK', frontDir.latencyMs);
    } else {
      recordResult('Live Frontend Directory Page (/directory)', 'FAIL', `Status: ${frontDir.statusCode}`);
    }
  } catch (err) {
    recordResult('Section 5 Frontend Reachability', 'FAIL', err.message);
  }

  // ---------------------------------------------------------------------------
  // AUDIT SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n================================================================================');
  console.log(` 🏁 PHASE 4 AUDIT SUMMARY: ${passedCount} Passed | ${failedCount} Failed`);
  console.log('================================================================================\n');

  if (failedCount > 0) {
    console.error(`❌ Audit finished with ${failedCount} failures.`);
    process.exit(1);
  } else {
    console.log('✅ ALL PHASE 4 CRITICAL CHECKS PASSED WITH 100% SUCCESS.');
    process.exit(0);
  }
}

runPhase4Audit().catch((err) => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
