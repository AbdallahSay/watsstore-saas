/**
 * WatsStore SaaS - Phase 2 Deep Audit Test Suite
 * Merchant Dashboard, Catalog CRUD, AI Quota Guard, Coupons, Orders/Export & Reviews Moderation
 * Production URLs:
 *   Backend: https://watsstore.runasp.net
 *   Frontend: https://frontend-bay-ten-58.vercel.app
 */

const BACKEND_URL = "https://watsstore.runasp.net";
const FRONTEND_URL = "https://frontend-bay-ten-58.vercel.app";
const ADMIN_SECRET_KEY = "WatsStore_SuperAdmin_SecretKey_2026_Secure!";

const timestamp = Date.now().toString().slice(-6);

let passedCount = 0;
let failedCount = 0;
const results = [];

function recordResult(testName, status, details = "", latencyMs = 0) {
  if (status === "PASS") {
    passedCount++;
    console.log(`\x1b[32m[PASS]\x1b[0m ${testName} (${latencyMs}ms) ${details}`);
  } else {
    failedCount++;
    console.error(`\x1b[31m[FAIL]\x1b[0m ${testName} (${latencyMs}ms) ${details}`);
  }
  results.push({ testName, status, details, latencyMs });
}

async function fetchWithTiming(url, options = {}) {
  const start = Date.now();
  try {
    const res = await fetch(url, options);
    const latencyMs = Date.now() - start;
    return { res, latencyMs };
  } catch (err) {
    const latencyMs = Date.now() - start;
    throw { err, latencyMs };
  }
}

async function runPhase2Audit() {
  console.log("================================================================================");
  console.log(" 🚀 STARTING WATSSTORE PHASE 2 DEEP AUDIT SUITE");
  console.log(` Target Backend:  ${BACKEND_URL}`);
  console.log(` Target Frontend: ${FRONTEND_URL}`);
  console.log("================================================================================\n");

  let merchantAToken = "";
  let merchantAStoreId = "";
  let merchantASlug = "";
  let merchantBToken = "";
  let merchantBStoreId = "";
  let merchantCToken = "";
  let merchantCStoreId = "";
  let merchantCSlug = "";

  // --------------------------------------------------------------------------
  // SECTION 0: FRONTEND DASHBOARD ROUTES REACHABILITY (HTTP 200)
  // --------------------------------------------------------------------------
  console.log("--- Section 0: Frontend Dashboard Routes Verification ---");
  const frontendRoutes = [
    "/dashboard",
    "/dashboard/categories",
    "/dashboard/products",
    "/dashboard/coupons",
    "/dashboard/orders",
    "/dashboard/reviews",
    "/dashboard/analytics",
    "/dashboard/settings",
    "/dashboard/billing"
  ];

  for (const route of frontendRoutes) {
    try {
      const { res, latencyMs } = await fetchWithTiming(`${FRONTEND_URL}${route}`);
      if (res.status === 200) {
        recordResult(`Frontend Route Reachability: ${route}`, "PASS", `HTTP ${res.status}`, latencyMs);
      } else {
        recordResult(`Frontend Route Reachability: ${route}`, "FAIL", `Expected 200, got ${res.status}`, latencyMs);
      }
    } catch (e) {
      recordResult(`Frontend Route Reachability: ${route}`, "FAIL", e.err?.message || e.message, e.latencyMs || 0);
    }
  }

  // --------------------------------------------------------------------------
  // SECTION 1: MERCHANT REGISTRATION & DASHBOARD KPI SUMMARY
  // --------------------------------------------------------------------------
  console.log("\n--- Section 1: Merchant Auth & Dashboard Summary / Analytics ---");

  // Register Merchant A
  try {
    const emailA = `merchant_a_${timestamp}@testwatsstore.com`;
    const { res, latencyMs } = await fetchWithTiming(`${BACKEND_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerName: "التاجر أ - مسار تجريبي",
        email: emailA,
        password: "Password123!",
        storeName: `متجر أ ${timestamp}`,
        whatsAppNumber: "01011653619",
        businessCategory: "أزياء وموضة",
        city: "القاهرة"
      })
    });

    const data = await res.json();
    if (res.status === 200 || res.status === 201) {
      merchantAToken = data.token;
      merchantAStoreId = data.storeId;
      merchantASlug = data.slug;
      recordResult("Register Merchant A (Free Plan)", "PASS", `StoreId: ${merchantAStoreId}, Slug: ${merchantASlug}`, latencyMs);
    } else {
      recordResult("Register Merchant A (Free Plan)", "FAIL", JSON.stringify(data), latencyMs);
    }
  } catch (e) {
    recordResult("Register Merchant A (Free Plan)", "FAIL", e.err?.message || e.message, e.latencyMs || 0);
  }

  // Register Merchant B (for Tenant Isolation testing)
  try {
    const emailB = `merchant_b_${timestamp}@testwatsstore.com`;
    const { res, latencyMs } = await fetchWithTiming(`${BACKEND_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerName: "التاجر ب - متطفل أمني",
        email: emailB,
        password: "Password123!",
        storeName: `متجر ب ${timestamp}`,
        whatsAppNumber: "01022334455",
        businessCategory: "إلكترونيات",
        city: "الإسكندرية"
      })
    });

    const data = await res.json();
    if (res.status === 200 || res.status === 201) {
      merchantBToken = data.token;
      merchantBStoreId = data.storeId;
      recordResult("Register Merchant B (Isolation Auditor)", "PASS", `StoreId: ${merchantBStoreId}`, latencyMs);
    } else {
      recordResult("Register Merchant B (Isolation Auditor)", "FAIL", JSON.stringify(data), latencyMs);
    }
  } catch (e) {
    recordResult("Register Merchant B (Isolation Auditor)", "FAIL", e.err?.message || e.message, e.latencyMs || 0);
  }

  // GET /api/merchant/summary (Merchant A)
  try {
    const { res, latencyMs } = await fetchWithTiming(`${BACKEND_URL}/api/merchant/summary`, {
      headers: { "Authorization": `Bearer ${merchantAToken}` }
    });
    const data = await res.json();
    if (res.status === 200 && data.storeInfo && data.storeInfo.planType === "Free") {
      const kpisValid = data.totalProducts === 0 && data.totalOrders === 0 && data.aiGenerationsLimit === 0;
      recordResult("GET /api/merchant/summary KPI Data", kpisValid ? "PASS" : "FAIL", 
        `Plan: ${data.storeInfo.planType}, Products: ${data.totalProducts}, AI Limit: ${data.aiGenerationsLimit}`, latencyMs);
    } else {
      recordResult("GET /api/merchant/summary KPI Data", "FAIL", `Status: ${res.status}, body: ${JSON.stringify(data)}`, latencyMs);
    }
  } catch (e) {
    recordResult("GET /api/merchant/summary KPI Data", "FAIL", e.err?.message || e.message, e.latencyMs || 0);
  }

  // GET /api/merchant/analytics (Merchant A)
  try {
    const { res, latencyMs } = await fetchWithTiming(`${BACKEND_URL}/api/merchant/analytics`, {
      headers: { "Authorization": `Bearer ${merchantAToken}` }
    });
    const data = await res.json();
    if (res.status === 200 && Array.isArray(data.dailySales) && Array.isArray(data.paymentMethodsBreakdown)) {
      recordResult("GET /api/merchant/analytics Sales Trend & Breakdown", "PASS", 
        `DailySales: ${data.dailySales.length} days, Currency: ${data.currency}`, latencyMs);
    } else {
      recordResult("GET /api/merchant/analytics Sales Trend & Breakdown", "FAIL", `Status: ${res.status}`, latencyMs);
    }
  } catch (e) {
    recordResult("GET /api/merchant/analytics Sales Trend & Breakdown", "FAIL", e.err?.message || e.message, e.latencyMs || 0);
  }

  // --------------------------------------------------------------------------
  // SECTION 2: CATEGORIES CRUD & TENANT ISOLATION
  // --------------------------------------------------------------------------
  console.log("\n--- Section 2: Catalog Categories CRUD & Tenant Isolation ---");
  let createdCategoryId = 0;

  // 1. Create Category
  try {
    const { res, latencyMs } = await fetchWithTiming(`${BACKEND_URL}/api/merchant/categories`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${merchantAToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "ملابس رجالية فاخرة",
        sortOrder: 1,
        isActive: true
      })
    });
    const data = await res.json();
    if (res.status === 200 && data.id) {
      createdCategoryId = data.id;
      recordResult("POST /api/merchant/categories (Create Category)", "PASS", `Category ID: ${createdCategoryId}, Name: ${data.name}`, latencyMs);
    } else {
      recordResult("POST /api/merchant/categories (Create Category)", "FAIL", `Status: ${res.status}, body: ${JSON.stringify(data)}`, latencyMs);
    }
  } catch (e) {
    recordResult("POST /api/merchant/categories (Create Category)", "FAIL", e.err?.message || e.message, e.latencyMs || 0);
  }

  // 2. Get Categories List
  try {
    const { res, latencyMs } = await fetchWithTiming(`${BACKEND_URL}/api/merchant/categories`, {
      headers: { "Authorization": `Bearer ${merchantAToken}` }
    });
    const data = await res.json();
    if (res.status === 200 && Array.isArray(data) && data.some(c => c.id === createdCategoryId)) {
      recordResult("GET /api/merchant/categories (List Categories)", "PASS", `Total Categories: ${data.length}`, latencyMs);
    } else {
      recordResult("GET /api/merchant/categories (List Categories)", "FAIL", `Status: ${res.status}`, latencyMs);
    }
  } catch (e) {
    recordResult("GET /api/merchant/categories (List Categories)", "FAIL", e.err?.message || e.message, e.latencyMs || 0);
  }

  // 3. Update Category
  try {
    const { res, latencyMs } = await fetchWithTiming(`${BACKEND_URL}/api/merchant/categories/${createdCategoryId}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${merchantAToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "أزياء رجالية وشبابية كلاسيك",
        sortOrder: 2,
        isActive: true
      })
    });
    const data = await res.json();
    if (res.status === 200 && data.name.includes("كلاسيك") && data.sortOrder === 2) {
      recordResult("PUT /api/merchant/categories/:id (Update Category)", "PASS", `Updated Name: ${data.name}`, latencyMs);
    } else {
      recordResult("PUT /api/merchant/categories/:id (Update Category)", "FAIL", `Status: ${res.status}`, latencyMs);
    }
  } catch (e) {
    recordResult("PUT /api/merchant/categories/:id (Update Category)", "FAIL", e.err?.message || e.message, e.latencyMs || 0);
  }

  // 4. Tenant Isolation: Merchant B attempts to fetch Merchant A's category
  try {
    const { res, latencyMs } = await fetchWithTiming(`${BACKEND_URL}/api/merchant/categories/${createdCategoryId}`, {
      headers: { "Authorization": `Bearer ${merchantBToken}` }
    });
    if (res.status === 403 || res.status === 404) {
      recordResult("Tenant Isolation: Category Access Rejection (Merchant B -> A)", "PASS", `Properly rejected with HTTP ${res.status}`, latencyMs);
    } else {
      recordResult("Tenant Isolation: Category Access Rejection (Merchant B -> A)", "FAIL", `Vulnerability: Returned HTTP ${res.status}`, latencyMs);
    }
  } catch (e) {
    recordResult("Tenant Isolation: Category Access Rejection (Merchant B -> A)", "FAIL", e.err?.message || e.message, e.latencyMs || 0);
  }

  // 5. Tenant Isolation: Merchant B attempts to update Merchant A's category
  try {
    const { res, latencyMs } = await fetchWithTiming(`${BACKEND_URL}/api/merchant/categories/${createdCategoryId}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${merchantBToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name: "اختراق القسم", sortOrder: 99, isActive: true })
    });
    if (res.status === 403 || res.status === 404) {
      recordResult("Tenant Isolation: Category Update Rejection (Merchant B -> A)", "PASS", `Properly rejected with HTTP ${res.status}`, latencyMs);
    } else {
      recordResult("Tenant Isolation: Category Update Rejection (Merchant B -> A)", "FAIL", `Vulnerability: Returned HTTP ${res.status}`, latencyMs);
    }
  } catch (e) {
    recordResult("Tenant Isolation: Category Update Rejection (Merchant B -> A)", "FAIL", e.err?.message || e.message, e.latencyMs || 0);
  }

  // --------------------------------------------------------------------------
  // SECTION 3: PRODUCTS CRUD, VARIANTS, VALIDATION & FREE PLAN QUOTA
  // --------------------------------------------------------------------------
  console.log("\n--- Section 3: Products CRUD, Price Validation, Variants & Free Plan 10 Quota ---");
  let createdProductId = "";

  // 1. Negative Validation: Price <= 0 rejection
  try {
    const { res, latencyMs } = await fetchWithTiming(`${BACKEND_URL}/api/merchant/products`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${merchantAToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "منتج بسعر صفر",
        price: 0,
        isAvailable: true
      })
    });
    if (res.status === 400) {
      recordResult("Validation: Reject Product Price <= 0 (Price: 0)", "PASS", `HTTP 400 Bad Request`, latencyMs);
    } else {
      recordResult("Validation: Reject Product Price <= 0 (Price: 0)", "FAIL", `Expected 400, got ${res.status}`, latencyMs);
    }
  } catch (e) {
    recordResult("Validation: Reject Product Price <= 0 (Price: 0)", "FAIL", e.err?.message || e.message, e.latencyMs || 0);
  }

  try {
    const { res, latencyMs } = await fetchWithTiming(`${BACKEND_URL}/api/merchant/products`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${merchantAToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "منتج بسعر سالب",
        price: -50,
        isAvailable: true
      })
    });
    if (res.status === 400) {
      recordResult("Validation: Reject Product Price <= 0 (Price: -50)", "PASS", `HTTP 400 Bad Request`, latencyMs);
    } else {
      recordResult("Validation: Reject Product Price <= 0 (Price: -50)", "FAIL", `Expected 400, got ${res.status}`, latencyMs);
    }
  } catch (e) {
    recordResult("Validation: Reject Product Price <= 0 (Price: -50)", "FAIL", e.err?.message || e.message, e.latencyMs || 0);
  }

  // 2. Create Product with Variants (Sizes / Colors)
  const variantsJson = JSON.stringify([
    { name: "المقاس", options: ["S", "M", "L", "XL"] },
    { name: "اللون", options: ["أسود ملكي", "أزرق كحلي", "أبيض"] }
  ]);

  try {
    const { res, latencyMs } = await fetchWithTiming(`${BACKEND_URL}/api/merchant/products`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${merchantAToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "قميص كتان كاجوال فاخر",
        categoryId: createdCategoryId,
        description: "قميص رجالي مصنوع من الكتان الطبيعي الفاخر 100%، مريح وجذاب.",
        price: 450.0,
        compareAtPrice: 600.0,
        variantsJson: variantsJson,
        isAvailable: true,
        sortOrder: 1
      })
    });
    const data = await res.json();
    if (res.status === 200 && data.id) {
      createdProductId = data.id;
      recordResult("POST /api/merchant/products (Create with Variants)", "PASS", 
        `Product ID: ${createdProductId}, Price: ${data.price}, CompareAt: ${data.compareAtPrice}`, latencyMs);
    } else {
      recordResult("POST /api/merchant/products (Create with Variants)", "FAIL", `Status: ${res.status}, body: ${JSON.stringify(data)}`, latencyMs);
    }
  } catch (e) {
    recordResult("POST /api/merchant/products (Create with Variants)", "FAIL", e.err?.message || e.message, e.latencyMs || 0);
  }

  // 3. 1-Click Availability Toggle
  try {
    // Toggle Off
    const toggleOff = await fetchWithTiming(`${BACKEND_URL}/api/merchant/products/${createdProductId}/availability`, {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${merchantAToken}` }
    });
    const offData = await toggleOff.res.json();

    // Toggle On
    const toggleOn = await fetchWithTiming(`${BACKEND_URL}/api/merchant/products/${createdProductId}/availability`, {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${merchantAToken}` }
    });
    const onData = await toggleOn.res.json();

    if (offData.isAvailable === false && onData.isAvailable === true) {
      recordResult("PATCH /api/merchant/products/:id/availability (1-Click Toggle)", "PASS", 
        `Toggled false -> true seamlessly`, toggleOn.latencyMs);
    } else {
      recordResult("PATCH /api/merchant/products/:id/availability (1-Click Toggle)", "FAIL", 
        `Toggle off: ${offData.isAvailable}, toggle on: ${onData.isAvailable}`, toggleOn.latencyMs);
    }
  } catch (e) {
    recordResult("PATCH /api/merchant/products/:id/availability (1-Click Toggle)", "FAIL", e.err?.message || e.message, e.latencyMs || 0);
  }

  // 4. Tenant Isolation on Products: Merchant B tries to modify Merchant A's product
  try {
    const { res, latencyMs } = await fetchWithTiming(`${BACKEND_URL}/api/merchant/products/${createdProductId}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${merchantBToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "تعديل غير مصرح",
        price: 10,
        isAvailable: true
      })
    });
    if (res.status === 403 || res.status === 404) {
      recordResult("Tenant Isolation: Product Update Rejection (Merchant B -> A)", "PASS", `HTTP ${res.status}`, latencyMs);
    } else {
      recordResult("Tenant Isolation: Product Update Rejection (Merchant B -> A)", "FAIL", `Expected 403/404, got ${res.status}`, latencyMs);
    }
  } catch (e) {
    recordResult("Tenant Isolation: Product Update Rejection (Merchant B -> A)", "FAIL", e.err?.message || e.message, e.latencyMs || 0);
  }

  // 5. Free Plan 10 Products Quota Enforcement
  // Merchant A currently has 1 product. Let's add 9 more to reach exactly 10.
  console.log("  Adding 9 more products to reach Free plan limit (10 products)...");
  let allAdded = true;
  for (let i = 2; i <= 10; i++) {
    try {
      const { res } = await fetchWithTiming(`${BACKEND_URL}/api/merchant/products`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${merchantAToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: `منتج مجاني رقم ${i}`,
          price: 100 * i,
          isAvailable: true
        })
      });
      if (res.status !== 200) {
        allAdded = false;
        console.error(`Failed to add product ${i}: status ${res.status}`);
        break;
      }
    } catch (err) {
      allAdded = false;
      break;
    }
  }

  if (allAdded) {
    recordResult("Add Products Up to Free Plan Limit (10 products)", "PASS", "Successfully reached 10 products", 0);
  } else {
    recordResult("Add Products Up to Free Plan Limit (10 products)", "FAIL", "Error adding intermediate products", 0);
  }

  // Attempt to add 11th product on Free plan (MUST BE REJECTED WITH HTTP 403)
  try {
    const { res, latencyMs } = await fetchWithTiming(`${BACKEND_URL}/api/merchant/products`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${merchantAToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "المنتج الحادي عشر المحظور",
        price: 999,
        isAvailable: true
      })
    });
    const data = await res.json();
    if (res.status === 403 && data.isQuotaExceeded) {
      recordResult("Free Plan Quota Guard: Reject 11th Product", "PASS", `HTTP 403: "${data.message}"`, latencyMs);
    } else {
      recordResult("Free Plan Quota Guard: Reject 11th Product", "FAIL", `Expected 403 isQuotaExceeded, got ${res.status} body: ${JSON.stringify(data)}`, latencyMs);
    }
  } catch (e) {
    recordResult("Free Plan Quota Guard: Reject 11th Product", "FAIL", e.err?.message || e.message, e.latencyMs || 0);
  }

  // --------------------------------------------------------------------------
  // SECTION 4: AI DESCRIPTION GENERATOR & QUOTA GUARD
  // --------------------------------------------------------------------------
  console.log("\n--- Section 4: AI Product Description Generator & Quota Guard ---");

  // 1. Free plan attempt: MUST be blocked with HTTP 403
  try {
    const { res, latencyMs } = await fetchWithTiming(`${BACKEND_URL}/api/merchant/ai/generate-description`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${merchantAToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        productName: "ساعة ذكية فاخرة",
        category: "إلكترونيات",
        keywords: "مقاومة للماء، قياس نبضات القلب"
      })
    });
    const data = await res.json();
    if (res.status === 403 && data.isQuotaExceeded) {
      recordResult("AI Quota Guard: Free Plan Block (HTTP 403)", "PASS", `HTTP 403: "${data.message}"`, latencyMs);
    } else {
      recordResult("AI Quota Guard: Free Plan Block (HTTP 403)", "FAIL", `Expected 403, got ${res.status}`, latencyMs);
    }
  } catch (e) {
    recordResult("AI Quota Guard: Free Plan Block (HTTP 403)", "FAIL", e.err?.message || e.message, e.latencyMs || 0);
  }

  // 2. Upgrade Merchant A to "Pro" via Admin API
  try {
    const { res, latencyMs } = await fetchWithTiming(`${BACKEND_URL}/api/admin/stores/${merchantAStoreId}/plan`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Key": ADMIN_SECRET_KEY
      },
      body: JSON.stringify({ plan: "Pro" })
    });
    const data = await res.json();
    if (res.status === 200 && data.planType === "Pro") {
      recordResult("Admin Upgrade Store to Pro Plan", "PASS", `Store upgraded to ${data.planType}`, latencyMs);
    } else {
      recordResult("Admin Upgrade Store to Pro Plan", "FAIL", `Status ${res.status}: ${JSON.stringify(data)}`, latencyMs);
    }
  } catch (e) {
    recordResult("Admin Upgrade Store to Pro Plan", "FAIL", e.err?.message || e.message, e.latencyMs || 0);
  }

  // 3. Call AI Generation on Pro Plan (Should succeed with 200 OK & increment quota)
  try {
    const { res, latencyMs } = await fetchWithTiming(`${BACKEND_URL}/api/merchant/ai/generate-description`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${merchantAToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        productName: "ساعة ألترا الرياضية الذكية",
        category: "إلكترونيات وأجهزة ذكية",
        keywords: "شاشة AMOLED، بطارية تدوم 10 أيام، مقاومة للماء 5ATM"
      })
    });
    const data = await res.json();
    if (res.status === 200 && data.description && data.aiGenerationsUsed === 1 && data.remainingQuota === 14) {
      recordResult("POST /api/merchant/ai/generate-description (Pro Plan Quota)", "PASS", 
        `Used: ${data.aiGenerationsUsed}/15, Remaining: ${data.remainingQuota}`, latencyMs);
    } else {
      recordResult("POST /api/merchant/ai/generate-description (Pro Plan Quota)", "FAIL", 
        `Status ${res.status}: ${JSON.stringify(data)}`, latencyMs);
    }
  } catch (e) {
    recordResult("POST /api/merchant/ai/generate-description (Pro Plan Quota)", "FAIL", e.err?.message || e.message, e.latencyMs || 0);
  }

  // --------------------------------------------------------------------------
  // SECTION 5: DISCOUNT COUPONS ENGINE & QUOTA
  // --------------------------------------------------------------------------
  console.log("\n--- Section 5: Discount Coupons Engine, Quota & Tenant Isolation ---");
  
  // Register Merchant C (Free Plan) specifically for Coupon Quota verification
  try {
    const emailC = `merchant_c_${timestamp}@testwatsstore.com`;
    const { res, latencyMs } = await fetchWithTiming(`${BACKEND_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerName: "التاجر ج - اختبار الكوبونات",
        email: emailC,
        password: "Password123!",
        storeName: `متجر ج ${timestamp}`,
        whatsAppNumber: "01033445566",
        businessCategory: "هدايا وعطور",
        city: "الجيزة"
      })
    });
    const data = await res.json();
    if (res.status === 200 || res.status === 201) {
      merchantCToken = data.token;
      merchantCStoreId = data.storeId;
      merchantCSlug = data.slug;
      recordResult("Register Merchant C (Free Plan - Coupon Testing)", "PASS", `StoreId: ${merchantCStoreId}`, latencyMs);
    } else {
      recordResult("Register Merchant C (Free Plan - Coupon Testing)", "FAIL", JSON.stringify(data), latencyMs);
    }
  } catch (e) {
    recordResult("Register Merchant C (Free Plan - Coupon Testing)", "FAIL", e.err?.message || e.message, e.latencyMs || 0);
  }

  // 1. Negative Validation: DiscountValue <= 0
  try {
    const { res, latencyMs } = await fetchWithTiming(`${BACKEND_URL}/api/merchant/coupons`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${merchantCToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        code: "ZERO0",
        discountType: "Percentage",
        discountValue: 0,
        isActive: true
      })
    });
    if (res.status === 400) {
      recordResult("Validation: Reject Coupon DiscountValue <= 0", "PASS", "HTTP 400 Bad Request", latencyMs);
    } else {
      recordResult("Validation: Reject Coupon DiscountValue <= 0", "FAIL", `Expected 400, got ${res.status}`, latencyMs);
    }
  } catch (e) {
    recordResult("Validation: Reject Coupon DiscountValue <= 0", "FAIL", e.err?.message || e.message, e.latencyMs || 0);
  }

  // 2. Negative Validation: Percentage > 100%
  try {
    const { res, latencyMs } = await fetchWithTiming(`${BACKEND_URL}/api/merchant/coupons`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${merchantCToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        code: "SUPER150",
        discountType: "Percentage",
        discountValue: 150,
        isActive: true
      })
    });
    if (res.status === 400) {
      recordResult("Validation: Reject Percentage Coupon > 100%", "PASS", "HTTP 400 Bad Request", latencyMs);
    } else {
      recordResult("Validation: Reject Percentage Coupon > 100%", "FAIL", `Expected 400, got ${res.status}`, latencyMs);
    }
  } catch (e) {
    recordResult("Validation: Reject Percentage Coupon > 100%", "FAIL", e.err?.message || e.message, e.latencyMs || 0);
  }

  // 3. Create 1st Active Coupon (Free Plan allows 1 active coupon)
  let coupon1Id = "";
  try {
    const { res, latencyMs } = await fetchWithTiming(`${BACKEND_URL}/api/merchant/coupons`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${merchantCToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        code: `PROMO10_${timestamp}`,
        discountType: "Percentage",
        discountValue: 10,
        isActive: true
      })
    });
    const data = await res.json();
    if (res.status === 201 && data.id) {
      coupon1Id = data.id;
      recordResult("POST /api/merchant/coupons (Create 1st Active Coupon)", "PASS", `Code: ${data.code}, ID: ${coupon1Id}`, latencyMs);
    } else {
      recordResult("POST /api/merchant/coupons (Create 1st Active Coupon)", "FAIL", `Status ${res.status}: ${JSON.stringify(data)}`, latencyMs);
    }
  } catch (e) {
    recordResult("POST /api/merchant/coupons (Create 1st Active Coupon)", "FAIL", e.err?.message || e.message, e.latencyMs || 0);
  }

  // 4. Free Plan Limit: Attempt 2nd Active Coupon -> MUST be rejected with HTTP 403
  try {
    const { res, latencyMs } = await fetchWithTiming(`${BACKEND_URL}/api/merchant/coupons`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${merchantCToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        code: `PROMO20_${timestamp}`,
        discountType: "FixedAmount",
        discountValue: 50,
        isActive: true
      })
    });
    const data = await res.json();
    if (res.status === 403 && data.isQuotaExceeded) {
      recordResult("Free Plan Coupon Quota: Reject 2nd Active Coupon", "PASS", `HTTP 403: "${data.message}"`, latencyMs);
    } else {
      recordResult("Free Plan Coupon Quota: Reject 2nd Active Coupon", "FAIL", `Expected 403, got ${res.status}: ${JSON.stringify(data)}`, latencyMs);
    }
  } catch (e) {
    recordResult("Free Plan Coupon Quota: Reject 2nd Active Coupon", "FAIL", e.err?.message || e.message, e.latencyMs || 0);
  }

  // 5. Toggle coupon inactive, then add 2nd coupon
  try {
    const { res, latencyMs } = await fetchWithTiming(`${BACKEND_URL}/api/merchant/coupons/${coupon1Id}/toggle`, {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${merchantCToken}` }
    });
    const data = await res.json();
    if (res.status === 200 && data.isActive === false) {
      recordResult("PATCH /api/merchant/coupons/:id/toggle (Deactivate)", "PASS", data.message, latencyMs);
    } else {
      recordResult("PATCH /api/merchant/coupons/:id/toggle (Deactivate)", "FAIL", `Status: ${res.status}`, latencyMs);
    }
  } catch (e) {
    recordResult("PATCH /api/merchant/coupons/:id/toggle (Deactivate)", "FAIL", e.err?.message || e.message, e.latencyMs || 0);
  }

  // 6. Tenant Isolation: Merchant B attempts to fetch or delete Merchant C's coupon
  try {
    const { res, latencyMs } = await fetchWithTiming(`${BACKEND_URL}/api/merchant/coupons/${coupon1Id}`, {
      headers: { "Authorization": `Bearer ${merchantBToken}` }
    });
    if (res.status === 403 || res.status === 404) {
      recordResult("Tenant Isolation: Coupon Access Rejection (Merchant B -> C)", "PASS", `HTTP ${res.status}`, latencyMs);
    } else {
      recordResult("Tenant Isolation: Coupon Access Rejection (Merchant B -> C)", "FAIL", `Expected 403/404, got ${res.status}`, latencyMs);
    }
  } catch (e) {
    recordResult("Tenant Isolation: Coupon Access Rejection (Merchant B -> C)", "FAIL", e.err?.message || e.message, e.latencyMs || 0);
  }

  // --------------------------------------------------------------------------
  // SECTION 6: ORDERS ENGINE & EXCEL (CSV WITH UTF-8 BOM) EXPORT
  // --------------------------------------------------------------------------
  console.log("\n--- Section 6: Orders Management & Excel Export Engine ---");

  // 1. Customer places order on Merchant A's store
  try {
    const { res, latencyMs } = await fetchWithTiming(`${BACKEND_URL}/api/public/stores/${merchantASlug}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: "عميل تجريبي ممتاز",
        customerPhone: "01099887766",
        customerAddress: "القاهرة الجديدة - التجمع الخامس",
        customerNotes: "يرجى الاتصال قبل الوصول",
        paymentMethod: "الدفع عند الاستلام",
        items: [
          {
            productId: createdProductId,
            quantity: 2
          }
        ]
      })
    });
    const data = await res.json();
    if (res.status === 200 || res.status === 201) {
      recordResult("Place Customer Order via WhatsApp Checkout API", "PASS", `Order #${data.orderNumber}`, latencyMs);
    } else {
      recordResult("Place Customer Order via WhatsApp Checkout API", "FAIL", `Status ${res.status}: ${JSON.stringify(data)}`, latencyMs);
    }
  } catch (e) {
    recordResult("Place Customer Order via WhatsApp Checkout API", "FAIL", e.err?.message || e.message, e.latencyMs || 0);
  }

  // 2. Merchant A fetches orders list
  try {
    const { res, latencyMs } = await fetchWithTiming(`${BACKEND_URL}/api/merchant/orders`, {
      headers: { "Authorization": `Bearer ${merchantAToken}` }
    });
    const data = await res.json();
    if (res.status === 200 && Array.isArray(data.orders) && data.orders.length >= 1) {
      const order = data.orders[0];
      recordResult("GET /api/merchant/orders (List Orders)", "PASS", 
        `Total Orders: ${data.total}, Latest: #${order.orderNumber} (${order.customerName})`, latencyMs);
    } else {
      recordResult("GET /api/merchant/orders (List Orders)", "FAIL", `Status ${res.status}: ${JSON.stringify(data)}`, latencyMs);
    }
  } catch (e) {
    recordResult("GET /api/merchant/orders (List Orders)", "FAIL", e.err?.message || e.message, e.latencyMs || 0);
  }

  // 3. Excel Export Guard on Free Plan (Merchant C): MUST BE REJECTED (HTTP 403)
  try {
    const { res, latencyMs } = await fetchWithTiming(`${BACKEND_URL}/api/merchant/orders/export`, {
      headers: { "Authorization": `Bearer ${merchantCToken}` }
    });
    const data = await res.json();
    if (res.status === 403 && data.isQuotaExceeded) {
      recordResult("Orders Export Guard: Free Plan Block (HTTP 403)", "PASS", `HTTP 403: "${data.message}"`, latencyMs);
    } else {
      recordResult("Orders Export Guard: Free Plan Block (HTTP 403)", "FAIL", `Expected 403, got ${res.status}: ${JSON.stringify(data)}`, latencyMs);
    }
  } catch (e) {
    recordResult("Orders Export Guard: Free Plan Block (HTTP 403)", "FAIL", e.err?.message || e.message, e.latencyMs || 0);
  }

  // 4. Excel Export on Pro Plan (Merchant A): MUST RETURN CSV WITH UTF-8 BOM
  try {
    const { res, latencyMs } = await fetchWithTiming(`${BACKEND_URL}/api/merchant/orders/export`, {
      headers: { "Authorization": `Bearer ${merchantAToken}` }
    });

    if (res.status === 200) {
      const buffer = Buffer.from(await res.arrayBuffer());
      const hasBOM = buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF;
      const textContent = buffer.toString("utf8");
      const hasArabicHeaders = textContent.includes("رقم الطلب") && textContent.includes("اسم العميل");

      if (hasBOM && hasArabicHeaders) {
        recordResult("Orders Export Engine: UTF-8 BOM & Arabic CSV Format", "PASS", 
          `BOM Verified: Yes (0xEF, 0xBB, 0xBF), Size: ${buffer.length} bytes, Headers Verified`, latencyMs);
      } else {
        recordResult("Orders Export Engine: UTF-8 BOM & Arabic CSV Format", "FAIL", 
          `BOM Verified: ${hasBOM}, Arabic Headers: ${hasArabicHeaders}`, latencyMs);
      }
    } else {
      recordResult("Orders Export Engine: UTF-8 BOM & Arabic CSV Format", "FAIL", `Status ${res.status}`, latencyMs);
    }
  } catch (e) {
    recordResult("Orders Export Engine: UTF-8 BOM & Arabic CSV Format", "FAIL", e.err?.message || e.message, e.latencyMs || 0);
  }

  // --------------------------------------------------------------------------
  // SECTION 7: CUSTOMER REVIEWS MODERATION & TENANT ISOLATION
  // --------------------------------------------------------------------------
  console.log("\n--- Section 7: Customer Reviews Moderation & Tenant Isolation ---");
  let reviewId = "";

  // 1. Submit Public Review
  try {
    const { res, latencyMs } = await fetchWithTiming(`${BACKEND_URL}/api/public/stores/${merchantASlug}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: "سارة أحمد",
        rating: 5,
        comment: "خامة ممتازة وتوصيل سريع جداً، شكراً متجر مسار!"
      })
    });
    const data = await res.json();
    if (res.status === 201 && data.reviewId) {
      reviewId = data.reviewId;
      recordResult("POST /api/public/stores/:slug/reviews (Customer Review)", "PASS", `Review ID: ${reviewId}`, latencyMs);
    } else {
      recordResult("POST /api/public/stores/:slug/reviews (Customer Review)", "FAIL", `Status ${res.status}: ${JSON.stringify(data)}`, latencyMs);
    }
  } catch (e) {
    recordResult("POST /api/public/stores/:slug/reviews (Customer Review)", "FAIL", e.err?.message || e.message, e.latencyMs || 0);
  }

  // 2. Merchant A fetches reviews (Should see pending count >= 1 and isApproved == false)
  try {
    const { res, latencyMs } = await fetchWithTiming(`${BACKEND_URL}/api/merchant/reviews`, {
      headers: { "Authorization": `Bearer ${merchantAToken}` }
    });
    const data = await res.json();
    const createdReview = data.reviews?.find(r => r.id === reviewId);
    if (res.status === 200 && createdReview && createdReview.isApproved === false) {
      recordResult("GET /api/merchant/reviews (Pending State)", "PASS", 
        `Total: ${data.totalCount}, Pending: ${data.pendingCount}, Approved: ${data.approvedCount}`, latencyMs);
    } else {
      recordResult("GET /api/merchant/reviews (Pending State)", "FAIL", `Status: ${res.status}`, latencyMs);
    }
  } catch (e) {
    recordResult("GET /api/merchant/reviews (Pending State)", "FAIL", e.err?.message || e.message, e.latencyMs || 0);
  }

  // 3. Approve Review
  try {
    const { res, latencyMs } = await fetchWithTiming(`${BACKEND_URL}/api/merchant/reviews/${reviewId}/approve`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${merchantAToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ isApproved: true })
    });
    const data = await res.json();
    if (res.status === 200 && data.isApproved === true) {
      recordResult("PATCH /api/merchant/reviews/:id/approve (Publish Review)", "PASS", data.message, latencyMs);
    } else {
      recordResult("PATCH /api/merchant/reviews/:id/approve (Publish Review)", "FAIL", `Status: ${res.status}`, latencyMs);
    }
  } catch (e) {
    recordResult("PATCH /api/merchant/reviews/:id/approve (Publish Review)", "FAIL", e.err?.message || e.message, e.latencyMs || 0);
  }

  // 4. Tenant Isolation: Merchant B attempts to toggle or delete Merchant A's review
  try {
    const { res, latencyMs } = await fetchWithTiming(`${BACKEND_URL}/api/merchant/reviews/${reviewId}/approve`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${merchantBToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ isApproved: false })
    });
    if (res.status === 403 || res.status === 404) {
      recordResult("Tenant Isolation: Review Moderation Rejection (Merchant B -> A)", "PASS", `HTTP ${res.status}`, latencyMs);
    } else {
      recordResult("Tenant Isolation: Review Moderation Rejection (Merchant B -> A)", "FAIL", `Expected 403/404, got ${res.status}`, latencyMs);
    }
  } catch (e) {
    recordResult("Tenant Isolation: Review Moderation Rejection (Merchant B -> A)", "FAIL", e.err?.message || e.message, e.latencyMs || 0);
  }

  // 5. Delete Review
  try {
    const { res, latencyMs } = await fetchWithTiming(`${BACKEND_URL}/api/merchant/reviews/${reviewId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${merchantAToken}` }
    });
    const data = await res.json();
    if (res.status === 200) {
      recordResult("DELETE /api/merchant/reviews/:id (Delete Review)", "PASS", data.message, latencyMs);
    } else {
      recordResult("DELETE /api/merchant/reviews/:id (Delete Review)", "FAIL", `Status: ${res.status}`, latencyMs);
    }
  } catch (e) {
    recordResult("DELETE /api/merchant/reviews/:id (Delete Review)", "FAIL", e.err?.message || e.message, e.latencyMs || 0);
  }

  // --------------------------------------------------------------------------
  // SUMMARY REPORT
  // --------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(" 📊 PHASE 2 TEST RESULTS SUMMARY");
  console.log("================================================================================");
  console.log(` Total Test Cases: ${passedCount + failedCount}`);
  console.log(` Passed:           ${passedCount} ✅`);
  console.log(` Failed:           ${failedCount} ❌`);
  const successRate = Math.round((passedCount / (passedCount + failedCount)) * 100);
  console.log(` Success Rate:     ${successRate}%`);
  console.log("================================================================================\n");

  if (failedCount > 0) {
    console.error("❌ Phase 2 audit encountered failures!");
    process.exit(1);
  } else {
    console.log("✨ All Phase 2 tests passed with 100% success!");
    process.exit(0);
  }
}

runPhase2Audit().catch(err => {
  console.error("Unhandled fatal error:", err);
  process.exit(1);
});
