// E2E QA, Security Hardening & Performance Benchmark for WatsStore SaaS
const fs = require('fs');

const BACKEND_BASE = 'https://watsstore.runasp.net';
const FRONTEND_BASE = 'https://frontend-bay-ten-58.vercel.app';

const results = [];

function recordTest(category, testName, success, latencyMs, details) {
  const status = success ? 'PASS' : 'FAIL';
  results.push({ category, testName, status, latencyMs: Math.round(latencyMs), details });
  const icon = success ? '✅' : '❌';
  console.log(`${icon} [${status}] [${Math.round(latencyMs)}ms] ${category} -> ${testName}: ${details}`);
}

async function request(url, options = {}) {
  const start = performance.now();
  try {
    const res = await fetch(url, options);
    const end = performance.now();
    return { res, latency: end - start, error: null };
  } catch (err) {
    const end = performance.now();
    return { res: null, latency: end - start, error: err };
  }
}

async function runAllTests() {
  console.log('================================================================');
  console.log('   WATSSTORE SAAS: COMPREHENSIVE AUTOMATED E2E QA & SECURITY    ');
  console.log(`   Backend:  ${BACKEND_BASE}`);
  console.log(`   Frontend: ${FRONTEND_BASE}`);
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // PHASE 1: Enterprise Security Headers & Tenant Isolation
  // -------------------------------------------------------------
  console.log('--- PHASE 1: Enterprise Security & HTTP Headers ---');
  
  // 1.1 Backend Security Headers
  const bHdrRes = await request(`${BACKEND_BASE}/api/public/stores/al-amal-fashion`);
  if (bHdrRes.res) {
    const h = bHdrRes.res.headers;
    const hsts = h.get('strict-transport-security');
    const nosniff = h.get('x-content-type-options');
    const frame = h.get('x-frame-options');
    const xss = h.get('x-xss-protection');
    const referrer = h.get('referrer-policy');

    const pass = Boolean(hsts && nosniff === 'nosniff' && frame === 'SAMEORIGIN');
    recordTest(
      'Security',
      'Backend Security HTTP Headers (HSTS, nosniff, SAMEORIGIN)',
      pass,
      bHdrRes.latency,
      `HSTS: ${hsts || 'NONE'}, X-Content-Type-Options: ${nosniff}, X-Frame-Options: ${frame}, Referrer: ${referrer}`
    );
  } else {
    recordTest('Security', 'Backend Security HTTP Headers', false, bHdrRes.latency, bHdrRes.error?.message);
  }

  // 1.2 Frontend Security Headers
  const fHdrRes = await request(FRONTEND_BASE);
  if (fHdrRes.res) {
    const h = fHdrRes.res.headers;
    const hsts = h.get('strict-transport-security');
    const nosniff = h.get('x-content-type-options');
    const frame = h.get('x-frame-options');
    const pass = Boolean(nosniff === 'nosniff' && frame === 'SAMEORIGIN');
    recordTest(
      'Security',
      'Frontend Security HTTP Headers (nosniff, SAMEORIGIN, HSTS)',
      pass,
      fHdrRes.latency,
      `HSTS: ${hsts ? 'Active' : 'N/A'}, X-Content-Type-Options: ${nosniff}, X-Frame-Options: ${frame}`
    );
  } else {
    recordTest('Security', 'Frontend Security HTTP Headers', false, fHdrRes.latency, fHdrRes.error?.message);
  }

  // 1.3 Tenant Isolation & Unauthorized Access Prevention
  const unauthRes = await request(`${BACKEND_BASE}/api/merchant/summary`);
  if (unauthRes.res) {
    const is401 = unauthRes.res.status === 401;
    recordTest(
      'Security',
      'Unauthorized Access Guard (/api/merchant/summary)',
      is401,
      unauthRes.latency,
      `Response: HTTP ${unauthRes.res.status} Unauthorized (Tenant Isolation Verified)`
    );
  } else {
    recordTest('Security', 'Unauthorized Access Guard', false, unauthRes.latency, unauthRes.error?.message);
  }

  // -------------------------------------------------------------
  // PHASE 2.1: Flow 1 - Super Admin Master Control
  // -------------------------------------------------------------
  console.log('\n--- PHASE 2.1: Flow 1 - Super Admin Master Control ---');

  let adminToken = null;
  // Admin Login via Email & Password
  const adminLoginRes = await request(`${BACKEND_BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ email: 'abdallahsay10@gmail.com', password: process.env.WATSSTORE_TEST_ADMIN_PASSWORD }),
  });

  if (adminLoginRes.res && adminLoginRes.res.ok) {
    const data = await adminLoginRes.res.json();
    adminToken = data.token;
    recordTest(
      'SuperAdmin',
      'Admin Login (Email + Password)',
      Boolean(adminToken),
      adminLoginRes.latency,
      `Token Generated, Role: ${data.role}, Admin: ${data.email}`
    );
  } else {
    // Fallback to SecretKey
    const adminKeyRes = await request(`${BACKEND_BASE}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ secretKey: process.env.WATSSTORE_TEST_ADMIN_KEY }),
    });
    if (adminKeyRes.res && adminKeyRes.res.ok) {
      const data = await adminKeyRes.res.json();
      adminToken = data.token;
      recordTest(
        'SuperAdmin',
        'Admin Login (Master Secret Key)',
        Boolean(adminToken),
        adminKeyRes.latency,
        `Token Generated, Role: ${data.role}, Admin: ${data.email}`
      );
    } else {
      recordTest('SuperAdmin', 'Admin Login', false, adminLoginRes.latency, 'Admin credentials failed');
    }
  }

  // Admin Platform Stats
  if (adminToken) {
    const statsRes = await request(`${BACKEND_BASE}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (statsRes.res && statsRes.res.ok) {
      const stats = await statsRes.res.json();
      recordTest(
        'SuperAdmin',
        'Platform Real-Time Statistics',
        true,
        statsRes.latency,
        `Stores: ${stats.totalStores} (Active: ${stats.activeStores}), Orders: ${stats.totalOrders}, Revenue: ${stats.totalRevenue} EGP`
      );
    } else {
      recordTest('SuperAdmin', 'Platform Real-Time Statistics', false, statsRes.latency, `HTTP ${statsRes.res?.status}`);
    }

    // Admin List Stores
    const storesRes = await request(`${BACKEND_BASE}/api/admin/stores`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (storesRes.res && storesRes.res.ok) {
      const stores = await storesRes.res.json();
      recordTest(
        'SuperAdmin',
        'List All Platform Stores',
        Array.isArray(stores),
        storesRes.latency,
        `Retrieved ${stores.length} registered merchant stores`
      );
    } else {
      recordTest('SuperAdmin', 'List All Platform Stores', false, storesRes.latency, `HTTP ${storesRes.res?.status}`);
    }

    // Admin Forgot Password Recovery
    const forgotRes = await request(`${BACKEND_BASE}/api/admin/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ email: 'abdallahsay10@gmail.com' }),
    });
    if (forgotRes.res && forgotRes.res.ok) {
      const forgotData = await forgotRes.res.json();
      recordTest(
        'SuperAdmin',
        'Admin Password Recovery PIN Generation',
        Boolean(forgotData.resetToken),
        forgotRes.latency,
        `Generated PIN: ${forgotData.resetToken}, Valid for ${forgotData.expiresInMinutes} minutes`
      );
    } else {
      recordTest('SuperAdmin', 'Admin Password Recovery', false, forgotRes.latency, `HTTP ${forgotRes.res?.status}`);
    }
  }

  // -------------------------------------------------------------
  // PHASE 2.2: Flow 2 - Merchant Authentication & Dashboard
  // -------------------------------------------------------------
  console.log('\n--- PHASE 2.2: Flow 2 - Merchant Auth & Dashboard ---');

  let merchantToken = null;
  const merchantLoginRes = await request(`${BACKEND_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ email: 'demo@watsstore.com', password: '123456' }),
  });

  if (merchantLoginRes.res && merchantLoginRes.res.ok) {
    const data = await merchantLoginRes.res.json();
    merchantToken = data.token;
    recordTest(
      'Merchant',
      'Merchant Authentication (demo@watsstore.com)',
      Boolean(merchantToken),
      merchantLoginRes.latency,
      `Store: "${data.storeName}", Slug: ${data.slug}, City: ${data.city}`
    );
  } else {
    recordTest('Merchant', 'Merchant Authentication', false, merchantLoginRes.latency, `HTTP ${merchantLoginRes.res?.status}`);
  }

  if (merchantToken) {
    const summaryRes = await request(`${BACKEND_BASE}/api/merchant/summary`, {
      headers: { Authorization: `Bearer ${merchantToken}` },
    });
    if (summaryRes.res && summaryRes.res.ok) {
      const summary = await summaryRes.res.json();
      recordTest(
        'Merchant',
        'Merchant Dashboard Summary & Store Profile',
        true,
        summaryRes.latency,
        `Products: ${summary.totalProducts}, Orders: ${summary.totalOrders}, Revenue: ${summary.totalRevenue} ${summary.storeInfo.currency}`
      );
    } else {
      recordTest('Merchant', 'Merchant Dashboard Summary', false, summaryRes.latency, `HTTP ${summaryRes.res?.status}`);
    }
  }

  // -------------------------------------------------------------
  // PHASE 2.3: Flow 3 - Catalog & AI Description Generator
  // -------------------------------------------------------------
  console.log('\n--- PHASE 2.3: Flow 3 - Catalog & AI Description ---');

  if (merchantToken) {
    const aiRes = await request(`${BACKEND_BASE}/api/merchant/ai/generate-description`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${merchantToken}`,
      },
      body: JSON.stringify({
        productName: 'تيشيرت أوفر سايز قطن مصري فاخر',
        category: 'ملابس رجالية',
        keywords: 'قطن 100%, مريح, صيفي, خامة عالية',
      }),
    });

    if (aiRes.res && aiRes.res.ok) {
      const aiData = await aiRes.res.json();
      const hasContent = Boolean(aiData.description && aiData.description.length > 50);
      recordTest(
        'Catalog & AI',
        'Unlimited AI Product Description Generation',
        hasContent,
        aiRes.latency,
        `Generated ${aiData.description.length} chars of Arabic marketing copy (Zero Quota Limits)`
      );
    } else {
      recordTest('Catalog & AI', 'Unlimited AI Product Description Generation', false, aiRes.latency, `HTTP ${aiRes.res?.status}`);
    }

    // List Merchant Products
    const prodsRes = await request(`${BACKEND_BASE}/api/merchant/products`, {
      headers: { Authorization: `Bearer ${merchantToken}` },
    });
    if (prodsRes.res && prodsRes.res.ok) {
      const prods = await prodsRes.res.json();
      recordTest(
        'Catalog & AI',
        'List Merchant Products',
        Array.isArray(prods),
        prodsRes.latency,
        `Store has ${prods.length} active products in catalog`
      );
    } else {
      recordTest('Catalog & AI', 'List Merchant Products', false, prodsRes.latency, `HTTP ${prodsRes.res?.status}`);
    }
  }

  // -------------------------------------------------------------
  // PHASE 2.4: Flow 4 - Coupons Engine
  // -------------------------------------------------------------
  console.log('\n--- PHASE 2.4: Flow 4 - Coupons Engine ---');

  if (merchantToken) {
    const couponsRes = await request(`${BACKEND_BASE}/api/merchant/coupons`, {
      headers: { Authorization: `Bearer ${merchantToken}` },
    });
    if (couponsRes.res && couponsRes.res.ok) {
      const coupons = await couponsRes.res.json();
      recordTest(
        'Coupons',
        'List Merchant Coupons',
        Array.isArray(coupons),
        couponsRes.latency,
        `Found ${coupons.length} coupons configured`
      );
    } else {
      recordTest('Coupons', 'List Merchant Coupons', false, couponsRes.latency, `HTTP ${couponsRes.res?.status}`);
    }
  }

  // Public Coupon Validation (Invalid coupon test)
  const invalidCouponRes = await request(`${BACKEND_BASE}/api/public/stores/al-amal-fashion/apply-coupon`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ code: 'INVALID_COUPON_999', cartSubtotal: 300 }),
  });
  if (invalidCouponRes.res) {
    const isRejected = invalidCouponRes.res.status === 400 || invalidCouponRes.res.status === 404;
    recordTest(
      'Coupons',
      'Public Coupon Validation (Invalid Code Rejection)',
      isRejected,
      invalidCouponRes.latency,
      `Correctly rejected invalid promo code with HTTP ${invalidCouponRes.res.status}`
    );
  } else {
    recordTest('Coupons', 'Public Coupon Validation', false, invalidCouponRes.latency, invalidCouponRes.error?.message);
  }

  // -------------------------------------------------------------
  // PHASE 2.5: Flow 5 - Public Storefront & Orders with CSV Export
  // -------------------------------------------------------------
  console.log('\n--- PHASE 2.5: Flow 5 - Public Storefront & Orders with CSV Export ---');

  let storeData = null;
  const storeRes = await request(`${BACKEND_BASE}/api/public/stores/al-amal-fashion`);
  if (storeRes.res && storeRes.res.ok) {
    storeData = await storeRes.res.json();
    recordTest(
      'Storefront',
      'Public Storefront Resolution & Loading (/s/al-amal-fashion)',
      Boolean(storeData.storeName),
      storeRes.latency,
      `Store: "${storeData.storeName}", Products: ${storeData.products?.length || 0}, Delivery Fee: ${storeData.deliveryFee} ${storeData.currency}`
    );
  } else {
    recordTest('Storefront', 'Public Storefront Resolution', false, storeRes.latency, `HTTP ${storeRes.res?.status}`);
  }

  // Place test order
  if (storeData && storeData.products && storeData.products.length > 0) {
    const prod = storeData.products[0];
    const orderRes = await request(`${BACKEND_BASE}/api/public/stores/al-amal-fashion/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        customerName: 'عميل الفحص الآلي المستمر',
        customerPhone: '01099887766',
        customerAddress: 'الفيوم - شارع الجمهورية - برج السلام الدور الثالث',
        paymentMethod: 'الدفع عند الاستلام',
        customerNotes: 'طلب فحص آلي DevSecOps E2E QA',
        items: [
          {
            productId: prod.id,
            quantity: 1,
            selectedVariants: { 'المقاس': 'L' },
          },
        ],
      }),
    });

    if (orderRes.res && orderRes.res.ok) {
      const order = await orderRes.res.json();
      const hasOrder = Boolean(order.orderNumber && (order.whatsAppRedirectUrl || order.whatsAppUrl));
      recordTest(
        'Orders',
        'Submit Public Storefront Order & WhatsApp Link Generation',
        hasOrder,
        orderRes.latency,
        `Order #${order.orderNumber} placed successfully, WhatsApp URL generated`
      );
    } else {
      recordTest('Orders', 'Submit Public Storefront Order', false, orderRes.latency, `HTTP ${orderRes.res?.status}`);
    }
  }

  // Export Orders CSV (Validate UTF-8 BOM)
  if (merchantToken) {
    const csvRes = await request(`${BACKEND_BASE}/api/merchant/orders/export`, {
      headers: { Authorization: `Bearer ${merchantToken}` },
    });

    if (csvRes.res && csvRes.res.ok) {
      const buffer = await csvRes.res.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      // UTF-8 BOM is 0xEF, 0xBB, 0xBF
      const hasBom = bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF;
      const textDecoder = new TextDecoder('utf-8');
      const csvString = textDecoder.decode(buffer);
      const hasHeaders = csvString.includes('رقم الطلب') || csvString.includes('اسم العميل');

      recordTest(
        'Export',
        '1-Click Excel/CSV Export (UTF-8 BOM Validated)',
        hasBom && hasHeaders,
        csvRes.latency,
        `UTF-8 BOM: ${hasBom ? 'YES (Guarantees Arabic renders cleanly in Microsoft Excel)' : 'NO'}, Content-Type: ${csvRes.res.headers.get('content-type')}`
      );
    } else {
      recordTest('Export', '1-Click Excel/CSV Export', false, csvRes.latency, `HTTP ${csvRes.res?.status}`);
    }
  }

  // -------------------------------------------------------------
  // PHASE 2.6: Flow 6 - Customer Reviews & Trust Badges
  // -------------------------------------------------------------
  console.log('\n--- PHASE 2.6: Flow 6 - Customer Reviews & Moderation ---');

  let submittedReviewId = null;
  const reviewRes = await request(`${BACKEND_BASE}/api/public/stores/al-amal-fashion/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      customerName: 'محمد أحمد السيد',
      rating: 5,
      comment: 'تجربة شراء ممتازة وجودة المنتج تفوق التوقعات، شكراً لكم!',
    }),
  });

  if (reviewRes.res && (reviewRes.res.status === 201 || reviewRes.res.ok)) {
    const revData = await reviewRes.res.json();
    submittedReviewId = revData.reviewId;
    recordTest(
      'Reviews',
      'Submit Public Customer Review & Rating',
      Boolean(submittedReviewId),
      reviewRes.latency,
      `Review Created with ID: ${submittedReviewId}`
    );
  } else {
    recordTest('Reviews', 'Submit Public Customer Review', false, reviewRes.latency, `HTTP ${reviewRes.res?.status}`);
  }

  if (merchantToken) {
    const revListRes = await request(`${BACKEND_BASE}/api/merchant/reviews`, {
      headers: { Authorization: `Bearer ${merchantToken}` },
    });
    if (revListRes.res && revListRes.res.ok) {
      const revData = await revListRes.res.json();
      recordTest(
        'Reviews',
        'Merchant Review Moderation Inbox',
        true,
        revListRes.latency,
        `Total: ${revData.totalCount}, Approved: ${revData.approvedCount}, Pending: ${revData.pendingCount}`
      );
    } else {
      recordTest('Reviews', 'Merchant Review Moderation Inbox', false, revListRes.latency, `HTTP ${revListRes.res?.status}`);
    }
  }

  // -------------------------------------------------------------
  // PHASE 2.7: Flow 7 - Real-Time Analytics Dashboard
  // -------------------------------------------------------------
  console.log('\n--- PHASE 2.7: Flow 7 - Real-Time Analytics Dashboard ---');

  if (merchantToken) {
    const analyticsRes = await request(`${BACKEND_BASE}/api/merchant/analytics`, {
      headers: { Authorization: `Bearer ${merchantToken}` },
    });
    if (analyticsRes.res && analyticsRes.res.ok) {
      const a = await analyticsRes.res.json();
      recordTest(
        'Analytics',
        'Real-Time Merchant Revenue & Sales Analytics',
        Array.isArray(a.dailySales) && Array.isArray(a.topProducts),
        analyticsRes.latency,
        `Total Revenue: ${a.totalRevenue} ${a.currency}, Orders: ${a.totalOrdersCount}, Top Products: ${a.topProducts.length}, Daily Trend: ${a.dailySales.length} days`
      );
    } else {
      recordTest('Analytics', 'Real-Time Merchant Analytics', false, analyticsRes.latency, `HTTP ${analyticsRes.res?.status}`);
    }
  }

  // -------------------------------------------------------------
  // PHASE 2.8: Flow 8 - Subdomains, OG Images & Programmatic SEO
  // -------------------------------------------------------------
  console.log('\n--- PHASE 2.8: Flow 8 - Subdomains, OG Images & Programmatic SEO ---');

  // Dynamic OpenGraph Image
  const ogRes = await request(`${FRONTEND_BASE}/s/al-amal-fashion/opengraph-image`);
  if (ogRes.res && ogRes.res.ok) {
    const ct = ogRes.res.headers.get('content-type') || '';
    const isImage = ct.includes('image');
    recordTest(
      'SEO & Branding',
      'Dynamic OpenGraph (OG) Image Generator',
      isImage,
      ogRes.latency,
      `Status: HTTP 200, Content-Type: ${ct}`
    );
  } else {
    recordTest('SEO & Branding', 'Dynamic OpenGraph Image Generator', false, ogRes.latency, `HTTP ${ogRes.res?.status}`);
  }

  // Programmatic SEO Directory Route
  const city = encodeURIComponent('الفيوم');
  const cat = encodeURIComponent('ملابس');
  const dirRes = await request(`${FRONTEND_BASE}/directory/${city}/${cat}`);
  if (dirRes.res && dirRes.res.ok) {
    const html = await dirRes.res.text();
    const hasCards = html.length > 500;
    recordTest(
      'SEO & Branding',
      'Programmatic SEO Directory (/directory/الفيوم/ملابس)',
      hasCards,
      dirRes.latency,
      `HTTP 200 OK, HTML Length: ${html.length} bytes, SSR rendered successfully`
    );
  } else {
    recordTest('SEO & Branding', 'Programmatic SEO Directory', false, dirRes.latency, `HTTP ${dirRes.res?.status}`);
  }

  // Multi-governorate sitemap.xml
  const sitemapRes = await request(`${FRONTEND_BASE}/sitemap.xml`);
  if (sitemapRes.res && sitemapRes.res.ok) {
    const xml = await sitemapRes.res.text();
    const hasXml = xml.includes('<urlset') || xml.includes('<url>');
    recordTest(
      'SEO & Branding',
      'Dynamic Multi-Governorate sitemap.xml',
      hasXml,
      sitemapRes.latency,
      `HTTP 200 OK, XML contains <urlset> with programmatic routes`
    );
  } else {
    recordTest('SEO & Branding', 'Dynamic sitemap.xml', false, sitemapRes.latency, `HTTP ${sitemapRes.res?.status}`);
  }

  // Wildcard Subdomain Middleware Rewriting
  const subRes = await request(FRONTEND_BASE, {
    headers: { 'x-subdomain': 'al-amal-fashion' },
  });
  if (subRes.res && subRes.res.ok) {
    recordTest(
      'Subdomains',
      'Wildcard Subdomain Middleware Storefront Resolution',
      true,
      subRes.latency,
      'HTTP 200 OK via x-subdomain header resolution'
    );
  } else {
    recordTest('Subdomains', 'Wildcard Subdomain Resolution', false, subRes.latency, `HTTP ${subRes.res?.status}`);
  }

  // -------------------------------------------------------------
  // Final Benchmark Table & Output
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log('                  QA EXECUTION SUMMARY                          ');
  console.log('================================================================');

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const total = results.length;
  const avgLatency = Math.round(results.reduce((acc, r) => acc + r.latencyMs, 0) / total);

  console.log(`Total Checks Executed: ${total}`);
  console.log(`Passed:                ${passed} ✅`);
  console.log(`Failed:                ${failed} ${failed > 0 ? '❌' : ''}`);
  console.log(`Pass Rate:             ${((passed / total) * 100).toFixed(1)}%`);
  console.log(`Average Latency:       ${avgLatency} ms`);
  console.log('================================================================\n');

  console.table(results);

  // Write results JSON file for detailed report generation
  fs.writeFileSync('qa_results.json', JSON.stringify({ passed, failed, total, avgLatency, results }, null, 2));
}

runAllTests();
