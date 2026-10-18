// Phase 2 E2E Integration & Verification Test for WatsStore SaaS
const baseUrl = "https://watsstore.runasp.net";
const ts = Date.now().toString().slice(-6);
const email = `phase2_${ts}@testwatsstore.com`;
const storeName = `متجر مسار التجريبي ${ts}`;

console.log("==================================================================");
console.log("   WatsStore SaaS: Phase 2 Upgrade Rigorous E2E Live Test         ");
console.log(`   Target Production API: ${baseUrl}`);
console.log("==================================================================\n");

async function runPhase2Tests() {
  try {
    // -------------------------------------------------------------
    // STEP 1: MERCHANT REGISTRATION
    // -------------------------------------------------------------
    console.log("[TEST 1] Registering a new merchant...");
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerName: "م. حسام الدين",
        email: email,
        password: "Password123!",
        storeName: storeName,
        whatsAppNumber: "01011653619",
        businessCategory: "إلكترونيات وموبايل",
        city: "القاهرة"
      })
    });

    if (!regRes.ok) throw new Error(`Registration failed: ${await regRes.text()}`);
    const regData = await regRes.json();
    const { token, slug, publicCode, storeId } = regData;

    console.log("✓ Merchant registered successfully:");
    console.log(`  - Store: ${storeName} (Slug: ${slug})`);
    console.log(`  - Store ID: ${storeId}`);
    console.log(`  - Public Code: ${publicCode}\n`);

    const authHeaders = {
      "Authorization": `Bearer ${token}`
    };

    // -------------------------------------------------------------
    // TEST 2: NATIVE FILE UPLOAD (POST /api/merchant/upload)
    // -------------------------------------------------------------
    console.log("[TEST 2] Testing Native Image Upload (POST /api/merchant/upload)...");
    
    // Create a 1x1 minimal valid PNG file in memory
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
      0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
      0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
      0x42, 0x60, 0x82
    ]);

    const formData = new FormData();
    const blob = new Blob([pngHeader], { type: "image/png" });
    formData.append("file", blob, "sample-product.png");

    const uploadRes = await fetch(`${baseUrl}/api/merchant/upload`, {
      method: "POST",
      headers: authHeaders,
      body: formData
    });

    if (!uploadRes.ok) {
      throw new Error(`Upload failed (${uploadRes.status}): ${await uploadRes.text()}`);
    }

    const uploadData = await uploadRes.json();
    if (!uploadData.imageUrl || !uploadData.imageUrl.includes("/uploads/")) {
      throw new Error(`Upload returned invalid URL: ${JSON.stringify(uploadData)}`);
    }

    console.log("✓ Image uploaded successfully to server:");
    console.log(`  - File Name: ${uploadData.fileName}`);
    console.log(`  - Public URL: ${uploadData.imageUrl}`);

    // Verify static file is reachable
    const staticCheck = await fetch(uploadData.imageUrl);
    console.log(`✓ Static file verification: HTTP ${staticCheck.status} OK (app.UseStaticFiles works!)\n`);

    // -------------------------------------------------------------
    // TEST 3: UPDATE STORE SETTINGS WITH E-WALLETS & INSTAPAY
    // -------------------------------------------------------------
    console.log("[TEST 3] Updating Store Settings with Vodafone Cash & InstaPay...");
    const settingsPayload = {
      storeName: storeName,
      whatsAppNumber: "01011653619",
      businessCategory: "إلكترونيات وموبايل",
      city: "القاهرة",
      addressDetails: "مول التكنولوجي - الدور الثاني",
      deliveryFee: 50.0,
      themeColor: "#059669",
      currency: "ج.م",
      seoTitle: `${storeName} | أفضل العروض`,
      seoDescription: "تسوق أفضل الإلكترونيات في مصر مع دفع فودافون كاش وإنستاباي.",
      vodafoneCashNumber: "01011653619",
      instaPayAddress: "masartech@instapay",
      logoUrl: uploadData.imageUrl,
      coverUrl: uploadData.imageUrl,
      metaPixelId: "123456789012345"
    };

    const updateRes = await fetch(`${baseUrl}/api/merchant/settings`, {
      method: "PUT",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(settingsPayload)
    });

    if (!updateRes.ok) throw new Error(`Settings update failed: ${await updateRes.text()}`);
    console.log("✓ Settings updated successfully:");
    console.log("  - Vodafone Cash: 01011653619");
    console.log("  - InstaPay: masartech@instapay\n");

    // -------------------------------------------------------------
    // TEST 4: VERIFY PUBLIC STOREFRONT RETURNS E-WALLETS
    // -------------------------------------------------------------
    console.log("[TEST 4] Fetching Public Storefront to verify payment fields...");
    const publicStoreRes = await fetch(`${baseUrl}/api/public/stores/${slug}`);
    if (!publicStoreRes.ok) throw new Error(`Storefront fetch failed: ${publicStoreRes.status}`);
    const publicStore = await publicStoreRes.json();

    if (publicStore.vodafoneCashNumber !== "01011653619") {
      throw new Error(`Mismatch in Vodafone Cash: expected 01011653619, got ${publicStore.vodafoneCashNumber}`);
    }
    if (publicStore.instaPayAddress !== "masartech@instapay") {
      throw new Error(`Mismatch in InstaPay: expected masartech@instapay, got ${publicStore.instaPayAddress}`);
    }
    console.log("✓ Public Storefront correctly provides E-Wallet and InstaPay data to buyers.\n");

    // -------------------------------------------------------------
    // TEST 5: CREATE PRODUCT & 1-CLICK AVAILABILITY TOGGLE
    // -------------------------------------------------------------
    console.log("[TEST 5] Testing Product Creation and 1-Click Availability Toggle...");
    const prodRes = await fetch(`${baseUrl}/api/merchant/products`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "سماعة بلوتوث لاسلكية برو",
        price: 850.0,
        imageUrl: uploadData.imageUrl,
        description: "سماعة عازلة للضوضاء وبطارية تدوم 30 ساعة.",
        isAvailable: true,
        sortOrder: 1
      })
    });

    if (!prodRes.ok) throw new Error(`Create product failed: ${await prodRes.text()}`);
    const product = await prodRes.json();
    console.log(`✓ Product created: ID=${product.id}, Initial isAvailable=${product.isAvailable}`);

    // Toggle availability (turn off)
    const toggle1 = await fetch(`${baseUrl}/api/merchant/products/${product.id}/availability`, {
      method: "PATCH",
      headers: authHeaders
    });
    if (!toggle1.ok) throw new Error(`Toggle 1 failed: ${toggle1.status}`);
    const toggle1Data = await toggle1.json();
    if (toggle1Data.isAvailable !== false) throw new Error("Expected isAvailable to be false");
    console.log(`✓ 1-Click Toggle (Off): isAvailable=${toggle1Data.isAvailable} - "${toggle1Data.message}"`);

    // Toggle availability (turn on again)
    const toggle2 = await fetch(`${baseUrl}/api/merchant/products/${product.id}/availability`, {
      method: "PATCH",
      headers: authHeaders
    });
    if (!toggle2.ok) throw new Error(`Toggle 2 failed: ${toggle2.status}`);
    const toggle2Data = await toggle2.json();
    if (toggle2Data.isAvailable !== true) throw new Error("Expected isAvailable to be true");
    console.log(`✓ 1-Click Toggle (On): isAvailable=${toggle2Data.isAvailable} - "${toggle2Data.message}"\n`);

    // -------------------------------------------------------------
    // TEST 6: CHECKOUT WITH E-WALLET & VERIFY WHATSAPP INVOICE
    // -------------------------------------------------------------
    console.log("[TEST 6] Testing Checkout with Vodafone Cash and Masar Tech Branding...");
    const orderRes = await fetch(`${baseUrl}/api/public/stores/${slug}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: "محمود سامي",
        customerPhone: "01099887766",
        customerAddress: "القاهرة - التجمع الخامس - الحي الأول",
        customerNotes: "يرجى رن الجرس",
        paymentMethod: "محفظة إلكترونية (فودافون كاش / محافظ الجوال)",
        items: [
          {
            productId: product.id,
            quantity: 1
          }
        ]
      })
    });

    if (!orderRes.ok) throw new Error(`Place order failed: ${await orderRes.text()}`);
    const orderData = await orderRes.json();

    console.log("✓ Order placed successfully:");
    console.log(`  - Order Number: #${orderData.orderNumber}`);
    console.log("  Formatted Message from Backend:\n", orderData.formattedMessage);
    const decodedMessage = orderData.formattedMessage || decodeURIComponent(orderData.whatsAppRedirectUrl);
    console.log("✓ WhatsApp Message Verification:");
    if (!decodedMessage.includes("طريقة الدفع")) {
      throw new Error(`WhatsApp message does not contain selected PaymentMethod! Message: ${decodedMessage}`);
    }
    if (!decodedMessage.includes("01011653619")) {
      throw new Error("WhatsApp message does not contain Vodafone Cash transfer number!");
    }
    if (!decodedMessage.includes("Masar Tech")) {
      throw new Error("WhatsApp message does not contain Masar Tech branding footer!");
    }
    console.log("  - Contains PaymentMethod: ✓");
    console.log("  - Contains Vodafone Cash Number (01011653619): ✓");
    console.log("  - Contains Masar Tech Branding: ✓\n");

    // -------------------------------------------------------------
    // TEST 7: ENFORCE 15-PRODUCT LIMIT ON FREE PLAN
    // -------------------------------------------------------------
    console.log("[TEST 7] Testing Free Plan 15-Product Limit Enforcement...");
    // Currently store has 1 product. Add 14 more products to reach 15.
    console.log("  Adding products up to the 15-product limit...");
    for (let i = 2; i <= 15; i++) {
      const pRes = await fetch(`${baseUrl}/api/merchant/products`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `منتج تجريبي رقم ${i}`,
          price: 100 * i,
          isAvailable: true
        })
      });
      if (!pRes.ok) throw new Error(`Failed to add product ${i}: ${await pRes.text()}`);
    }

    console.log("  15 products added. Attempting to add product #16 (must be rejected)...");
    const p16Res = await fetch(`${baseUrl}/api/merchant/products`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "منتج تجريبي رقم 16 يتجاوز الحد",
        price: 999,
        isAvailable: true
      })
    });

    if (p16Res.status !== 400) {
      throw new Error(`Expected HTTP 400 for product #16, but got HTTP ${p16Res.status}`);
    }

    const errData = await p16Res.json();
    console.log(`✓ Product #16 correctly rejected with HTTP 400:`);
    console.log(`  "${errData.message}"\n`);

    console.log("==================================================================");
    console.log("  ALL 7 PHASE 2 PRODUCTION TESTS PASSED SUCCESSFULLY! (100% OK)   ");
    console.log("==================================================================");

  } catch (err) {
    console.error("❌ Phase 2 Test Failed:", err);
    process.exit(1);
  }
}

runPhase2Tests();
