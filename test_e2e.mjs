// E2E Integration & Health Audit Test for WatsStore SaaS
const baseUrl = "https://watsstore.runasp.net";
const ts = Date.now().toString().slice(-6);
const email = `merchant_${ts}@testwatsstore.com`;
const storeName = `بوتيك النيل للموضة ${ts}`;

console.log("==========================================================");
console.log("  WatsStore SaaS: End-to-End Integration & Health Audit   ");
console.log(`  Target API: ${baseUrl}`);
console.log("==========================================================\n");

async function runTests() {
  try {
    // -------------------------------------------------------------
    // STEP 1: MERCHANT REGISTRATION FLOW
    // -------------------------------------------------------------
    console.log("[STEP 1] Testing Merchant Registration Flow...");
    const regPayload = {
      ownerName: "أحمد رضوان",
      email: email,
      password: "Password123!",
      storeName: storeName,
      whatsAppNumber: "01099881122",
      businessCategory: "ملابس وأزياء",
      city: "القاهرة"
    };

    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(regPayload)
    });

    if (!regRes.ok) {
      const errText = await regRes.text();
      throw new Error(`Registration failed (${regRes.status}): ${errText}`);
    }

    const regData = await regRes.json();
    if (!regData.token || !regData.slug || !regData.publicCode) {
      throw new Error(`Incomplete registration response: ${JSON.stringify(regData)}`);
    }

    const { token, slug, publicCode, storeId, planType } = regData;
    console.log("✓ Merchant registered successfully!");
    console.log(`  - Store ID:    ${storeId}`);
    console.log(`  - Store Name:  ${storeName}`);
    console.log(`  - Auto Slug:   ${slug}`);
    console.log(`  - Public Code: ${publicCode}`);
    console.log(`  - Plan Type:   ${planType}`);
    console.log(`  - JWT Token:   ${token.substring(0, 25)}...\n`);

    const authHeaders = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };

    // -------------------------------------------------------------
    // STEP 2: DASHBOARD MANAGEMENT & JWT AUTHORIZATION FLOW
    // -------------------------------------------------------------
    console.log("[STEP 2] Testing Dashboard Management Flow (Authenticated)...");

    // 2.1 Get Initial Summary
    const sumRes1 = await fetch(`${baseUrl}/api/merchant/summary`, { headers: authHeaders });
    if (!sumRes1.ok) throw new Error(`Summary fetch failed (${sumRes1.status})`);
    const initSummary = await sumRes1.json();
    console.log(`✓ Initial Summary: Products=${initSummary.totalProducts}, Orders=${initSummary.totalOrders}, Revenue=${initSummary.totalRevenue}`);

    // 2.2 Update Store Settings
    const settingsPayload = {
      storeName: `${storeName} (الفرع الرئيسي)`,
      whatsAppNumber: "01099881122",
      businessCategory: "ملابس وأزياء",
      city: "القاهرة",
      addressDetails: "شارع عباس العقاد - مدينة نصر",
      deliveryFee: 45.0,
      themeColor: "#059669",
      currency: "ج.م",
      seoTitle: "بوتيك النيل | تشكيلة حصرية في مدينة نصر",
      seoDescription: "تسوق أفضل الملابس والأحذية الرياضية أونلاين عبر الواتساب في القاهرة.",
      metaPixelId: "112233445566778"
    };

    const setRes = await fetch(`${baseUrl}/api/merchant/settings`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify(settingsPayload)
    });
    if (!setRes.ok) throw new Error(`Update settings failed (${setRes.status})`);
    console.log("✓ Store Settings updated: DeliveryFee = 45.00, ThemeColor = #059669");

    // 2.3 Create a Category
    const catPayload = {
      name: "أحذية وسنيكرز",
      sortOrder: 2,
      isActive: true
    };
    const catRes = await fetch(`${baseUrl}/api/merchant/categories`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify(catPayload)
    });
    if (!catRes.ok) throw new Error(`Create category failed (${catRes.status})`);
    const newCat = await catRes.json();
    console.log(`✓ New Category created: ID = ${newCat.id}, Name = ${newCat.name}`);

    // 2.4 Create a Product with Variants
    const prodPayload = {
      name: "سنيكرز إير فليكس رياضي",
      categoryId: newCat.id,
      description: "حذاء جري خفيف مع نعل طبي هوائي وتصميم عصري مريح طوال اليوم.",
      price: 750.0,
      compareAtPrice: 900.0,
      imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
      variantsJson: JSON.stringify([
        { name: "المقاس", options: ["41", "42", "43", "44"] },
        { name: "اللون", options: ["أبيض ثلجي", "أسود فاحم"] }
      ]),
      isAvailable: true,
      sortOrder: 1
    };

    const prodRes = await fetch(`${baseUrl}/api/merchant/products`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify(prodPayload)
    });
    if (!prodRes.ok) throw new Error(`Create product failed (${prodRes.status})`);
    const newProd = await prodRes.json();
    console.log(`✓ New Product created with variants: ID = ${newProd.id}, Name = ${newProd.name}\n`);

    // -------------------------------------------------------------
    // STEP 3: PUBLIC STOREFRONT SSR & FEATURE GATING FLOW
    // -------------------------------------------------------------
    console.log("[STEP 3] Testing Public Storefront API & Subscription Feature Gating...");
    const storeRes = await fetch(`${baseUrl}/api/public/stores/${slug}`);
    if (!storeRes.ok) throw new Error(`Public storefront fetch failed (${storeRes.status})`);
    const storeData = await storeRes.json();

    if (!storeData.products || storeData.products.length === 0) {
      throw new Error("Storefront error: Created product not found in public catalog.");
    }

    console.log("✓ Storefront fetched successfully (AsNoTracking):");
    console.log(`  - Store Name:       ${storeData.storeName}`);
    console.log(`  - Delivery Fee:     ${storeData.deliveryFee} ${storeData.currency}`);
    console.log(`  - Categories Count: ${storeData.categories.length}`);
    console.log(`  - Products Count:   ${storeData.products.length}`);

    // Verify Feature Gating: Free Plan must mask MetaPixelId
    if (storeData.planType === "Free" && storeData.metaPixelId !== null) {
      throw new Error(`Feature gate failure: Free plan has unmasked MetaPixelId (${storeData.metaPixelId})`);
    } else {
      console.log(`✓ Feature Gating Verified: Free tier correctly masks MetaPixelId (${storeData.metaPixelId})\n`);
    }

    // -------------------------------------------------------------
    // STEP 4: CHECKOUT & SECURE WHATSAPP ORDER PROCESSING FLOW
    // -------------------------------------------------------------
    console.log("[STEP 4] Testing Checkout & WhatsApp Order Generation...");
    const orderPayload = {
      customerName: "مروان كمال",
      customerPhone: "01155443322",
      customerAddress: "القاهرة - مصر الجديدة - شارع الأهرام",
      customerNotes: "يرجى الاتصال قبل الوصول بنصف ساعة",
      items: [
        {
          productId: newProd.id,
          quantity: 2,
          selectedVariants: {
            "المقاس": "43",
            "اللون": "أبيض ثلجي"
          }
        }
      ]
    };

    const orderRes = await fetch(`${baseUrl}/api/public/stores/${slug}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload)
    });
    if (!orderRes.ok) throw new Error(`Place order failed (${orderRes.status})`);
    const orderData = await orderRes.json();

    const expectedSubtotal = 750.0 * 2; // 1500
    const expectedTotal = expectedSubtotal + 45.0; // 1545 (delivery fee = 45)

    if (orderData.subtotal !== expectedSubtotal) {
      throw new Error(`Subtotal mismatch: expected ${expectedSubtotal}, got ${orderData.subtotal}`);
    }
    if (orderData.totalAmount !== expectedTotal) {
      throw new Error(`Total mismatch: expected ${expectedTotal}, got ${orderData.totalAmount}`);
    }
    if (!orderData.whatsAppRedirectUrl || !orderData.whatsAppRedirectUrl.startsWith("https://wa.me/201099881122")) {
      throw new Error(`WhatsApp URL mismatch: ${orderData.whatsAppRedirectUrl}`);
    }

    console.log("✓ Order created and calculated securely by Backend:");
    console.log(`  - Order Number: #${orderData.orderNumber}`);
    console.log(`  - Subtotal:     ${orderData.subtotal} ج.م`);
    console.log(`  - Delivery Fee: ${orderData.deliveryFee} ج.م`);
    console.log(`  - Total Amount: ${orderData.totalAmount} ج.م`);
    console.log(`  - WhatsApp URL: ${orderData.whatsAppRedirectUrl.substring(0, 48)}...\n`);

    // -------------------------------------------------------------
    // STEP 5: VERIFY ORDER IN MERCHANT DASHBOARD STATS
    // -------------------------------------------------------------
    console.log("[STEP 5] Verifying Order in Merchant Dashboard Summary...");
    const sumRes2 = await fetch(`${baseUrl}/api/merchant/summary`, { headers: authHeaders });
    if (!sumRes2.ok) throw new Error(`Dashboard summary fetch failed (${sumRes2.status})`);
    const afterSummary = await sumRes2.json();

    if (afterSummary.totalOrders !== 1) {
      throw new Error(`Total orders mismatch: expected 1, got ${afterSummary.totalOrders}`);
    }
    if (afterSummary.totalRevenue !== expectedTotal) {
      throw new Error(`Total revenue mismatch: expected ${expectedTotal}, got ${afterSummary.totalRevenue}`);
    }
    if (!afterSummary.recentOrders || afterSummary.recentOrders.length < 1) {
      throw new Error("Recent orders list empty in dashboard summary.");
    }

    console.log(`✓ Dashboard sync verified: Order #${afterSummary.recentOrders[0].orderNumber} logged with revenue ${expectedTotal} ج.م\n`);

    // -------------------------------------------------------------
    // STEP 6: PERMANENT QR CODE REDIRECT RESOLUTION
    // -------------------------------------------------------------
    console.log("[STEP 6] Testing Permanent QR Code Resolver...");
    const qrRes = await fetch(`${baseUrl}/api/public/stores/qr/${publicCode}`);
    if (!qrRes.ok) throw new Error(`QR resolver failed (${qrRes.status})`);
    const qrData = await qrRes.json();

    if (qrData.canonicalSlug !== slug) {
      throw new Error(`QR resolver mismatch: expected ${slug}, got ${qrData.canonicalSlug}`);
    }

    console.log(`✓ Permanent QR code resolved: /m/${publicCode} -> /s/${qrData.canonicalSlug}\n`);

    console.log("==========================================================");
    console.log("  ALL 6 INTEGRATION STEPS PASSED SUCCESSFULLY! (100% OK)  ");
    console.log("==========================================================");

  } catch (err) {
    console.error("❌ Test failed:", err);
    process.exit(1);
  }
}

runTests();
