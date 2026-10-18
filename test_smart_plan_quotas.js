const API_BASE = 'https://watsstore.runasp.net/api';

async function runTests() {
  console.log('=====================================================');
  console.log('🧪 SMART SAAS TIER & QUOTAS E2E VERIFICATION SUITE');
  console.log(`Backend Target: ${API_BASE}`);
  console.log('=====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  let adminToken = '';
  let merchantToken = '';
  let storeId = '';

  const uniqueId = Date.now().toString().slice(-6);
  const testEmail = `tier_test_${uniqueId}@gmail.com`;
  const testPassword = 'Password@123';
  const testStoreName = `متجر التجربة الذكية ${uniqueId}`;
  const testSlug = `smart-tier-${uniqueId}`;

  try {
    // 0. Super Admin Login
    console.log('▶️ [Step 0] Logging in as Super Admin (abdallahsay10@gmail.com)...');
    const adminLoginRes = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'abdallahsay10@gmail.com', password: 'Admin@WatsStore2026!' })
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginRes.status === 200 && adminLoginData.token, 'Super Admin authenticated successfully');
    adminToken = adminLoginData.token;

    // 1. Register test merchant (starts on Free 14-day trial)
    console.log('\n▶️ [Step 1] Registering New Test Merchant...');
    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeName: testStoreName,
        slug: testSlug,
        ownerName: 'تاجر تجريبي',
        email: testEmail,
        password: testPassword,
        whatsAppNumber: '01011112222',
        businessCategory: 'ملابس وأزياء',
        city: 'القاهرة'
      })
    });

    const regData = await regRes.json();
    assert(regRes.status === 200 && regData.token, 'Merchant registered successfully and received JWT');
    merchantToken = regData.token;
    storeId = regData.storeId;

    // 2. Fetch Dashboard Summary to verify initial state
    console.log('\n▶️ [Step 2] Verifying Dashboard Summary on Free Trial...');
    const sumRes = await fetch(`${API_BASE}/merchant/summary`, {
      headers: { Authorization: `Bearer ${merchantToken}` }
    });
    const sumData = await sumRes.json();
    assert(sumRes.status === 200, 'Summary endpoint responded with 200 OK');
    assert(sumData.storeInfo?.planType === 'Free', `Store planType is Free (got: ${sumData.storeInfo?.planType})`);
    assert(sumData.aiGenerationsLimit === 0, `Free plan AI quota limit is 0 (got: ${sumData.aiGenerationsLimit})`);
    assert(sumData.aiGenerationsUsed === 0, `Free plan AI quota used is 0 (got: ${sumData.aiGenerationsUsed})`);
    assert(sumData.remainingTrialDays >= 13, `Remaining trial days is >= 13 (got: ${sumData.remainingTrialDays})`);

    // 3. Test AI Generation on Free Tier (Must be strictly locked: 403 Forbidden)
    console.log('\n▶️ [Step 3] Testing AI Description Generation on Free Tier (Strictly Locked)...');
    const aiRes = await fetch(`${API_BASE}/merchant/ai/generate-description`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${merchantToken}`
      },
      body: JSON.stringify({
        productName: 'تيشيرت صيفي قطن 100%',
        category: 'ملابس وأزياء'
      })
    });
    const aiData = await aiRes.json();
    assert(aiRes.status === 403, `AI call is blocked with HTTP 403 Forbidden (got: ${aiRes.status})`);
    assert(
      aiData.message && aiData.message.includes('ميزة كتابة الوصف بالذكاء الاصطناعي متاحة فقط في باقات'),
      `AI 403 returned correct Arabic upgrade prompt: "${aiData.message}"`
    );

    // 4. Test Excel Export on Free Tier (Must be locked: 403 Forbidden)
    console.log('\n▶️ [Step 4] Testing Orders Excel Export on Free Tier (Locked)...');
    const exportRes = await fetch(`${API_BASE}/merchant/orders/export`, {
      headers: { Authorization: `Bearer ${merchantToken}` }
    });
    assert(exportRes.status === 403, `Orders CSV export is blocked with HTTP 403 Forbidden (got: ${exportRes.status})`);

    // 5. Test Coupon Quota on Free Tier (Max 1 active coupon)
    console.log('\n▶️ [Step 5] Testing Coupon Quota on Free Tier (Max 1 active coupon)...');
    const coupon1Res = await fetch(`${API_BASE}/merchant/coupons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${merchantToken}`
      },
      body: JSON.stringify({
        code: `FREE1_${uniqueId}`,
        discountType: 'Percentage',
        discountValue: 10,
        isActive: true
      })
    });
    assert(coupon1Res.status === 200 || coupon1Res.status === 201, `First active coupon created successfully on Free tier (status: ${coupon1Res.status})`);

    const coupon2Res = await fetch(`${API_BASE}/merchant/coupons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${merchantToken}`
      },
      body: JSON.stringify({
        code: `FREE2_${uniqueId}`,
        discountType: 'Percentage',
        discountValue: 15,
        isActive: true
      })
    });
    const coupon2Data = await coupon2Res.json();
    assert(coupon2Res.status === 403, `Second active coupon blocked with HTTP 403 (got: ${coupon2Res.status})`);
    assert(
      coupon2Data.message && coupon2Data.message.includes('كوبون واحد نشط'),
      `Coupon quota returned correct Arabic upgrade message: "${coupon2Data.message}"`
    );

    // 6. Test Product Quota on Free Tier (Max 10 products)
    console.log('\n▶️ [Step 6] Testing Product Quota on Free Tier (Max 10 Products)...');
    let prodSuccessCount = 0;
    for (let i = 1; i <= 10; i++) {
      const pRes = await fetch(`${API_BASE}/merchant/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchantToken}`
        },
        body: JSON.stringify({
          name: `منتج تجريبي رقم ${i}`,
          price: 100 * i,
          isAvailable: true
        })
      });
      if (pRes.status === 200 || pRes.status === 201) prodSuccessCount++;
    }
    assert(prodSuccessCount === 10, `Successfully created 10 products on Free tier (${prodSuccessCount}/10)`);

    // 11th product attempt
    const p11Res = await fetch(`${API_BASE}/merchant/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${merchantToken}`
      },
      body: JSON.stringify({
        name: 'منتج رقم 11 الزائد عن الحد',
        price: 500,
        isAvailable: true
      })
    });
    const p11Data = await p11Res.json();
    assert(p11Res.status === 403, `Product #11 blocked with HTTP 403 (got: ${p11Res.status})`);
    assert(
      p11Data.message && p11Data.message.includes('10 منتجات'),
      `Product #11 returned correct Arabic 10-product limit message: "${p11Data.message}"`
    );

    // 7. Super Admin upgrades store to Pro
    console.log('\n▶️ [Step 7] Super Admin Upgrading Store to Pro Tier...');
    const adminUpgradeRes = await fetch(`${API_BASE}/admin/stores/${storeId}/plan`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ plan: 'Pro' })
    });
    const adminUpgradeData = await adminUpgradeRes.json();
    assert(adminUpgradeRes.status === 200, `Super Admin upgraded store to Pro successfully: "${adminUpgradeData.message}"`);

    // 8. Verify Pro Tier State & Reset
    console.log('\n▶️ [Step 8] Verifying Pro Tier State, AI Quota (15), and Excel Export...');
    const proSumRes = await fetch(`${API_BASE}/merchant/summary`, {
      headers: { Authorization: `Bearer ${merchantToken}` }
    });
    const proSumData = await proSumRes.json();
    assert(proSumData.storeInfo?.planType === 'Pro', `Store planType updated to Pro`);
    assert(proSumData.aiGenerationsLimit === 15, `Pro plan AI limit is 15 (got: ${proSumData.aiGenerationsLimit})`);
    assert(proSumData.aiGenerationsUsed === 0, `Pro plan AI used is reset to 0 (got: ${proSumData.aiGenerationsUsed})`);

    // Excel export now unlocked
    const proExportRes = await fetch(`${API_BASE}/merchant/orders/export`, {
      headers: { Authorization: `Bearer ${merchantToken}` }
    });
    assert(proExportRes.status === 200, `Orders CSV export is unlocked on Pro (got: ${proExportRes.status})`);

    // 9. Torture-test AI Quota on Pro Tier: 15 calls allowed, 16th blocked
    console.log('\n▶️ [Step 9] Torture-Testing Pro AI Quota (15 Allowed, Call #16 Blocked)...');
    let aiSuccess = 0;
    for (let i = 1; i <= 15; i++) {
      const callRes = await fetch(`${API_BASE}/merchant/ai/generate-description`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchantToken}`
        },
        body: JSON.stringify({
          productName: `فستان سواريه فاخر كود ${i}`,
          category: 'ملابس وأزياء'
        })
      });
      if (callRes.status === 200) {
        const d = await callRes.json();
        if (d.aiGenerationsUsed === i) {
          aiSuccess++;
        }
      } else {
        console.error(`AI call #${i} returned status ${callRes.status}`);
      }
    }
    assert(aiSuccess === 15, `All 15 AI descriptions generated successfully on Pro (${aiSuccess}/15)`);

    // Call 16 must be blocked
    const call16Res = await fetch(`${API_BASE}/merchant/ai/generate-description`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${merchantToken}`
      },
      body: JSON.stringify({
        productName: 'فستان سواريه رقم 16 الزائد عن الحصة',
        category: 'ملابس وأزياء'
      })
    });
    const call16Data = await call16Res.json();
    assert(call16Res.status === 403, `AI call #16 blocked with HTTP 403 Forbidden (got: ${call16Res.status})`);
    assert(
      call16Data.message && call16Data.message.includes('15/15 وصف'),
      `AI call #16 returned exact upgrade prompt to VIP: "${call16Data.message}"`
    );

    // 10. Super Admin upgrades store to VIP
    console.log('\n▶️ [Step 10] Super Admin Upgrading Store to VIP Tier...');
    const adminUpgradeVipRes = await fetch(`${API_BASE}/admin/stores/${storeId}/plan`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ plan: 'VIP' })
    });
    const adminUpgradeVipData = await adminUpgradeVipRes.json();
    assert(adminUpgradeVipRes.status === 200, `Super Admin upgraded store to VIP successfully: "${adminUpgradeVipData.message}"`);

    // 11. Verify VIP AI Quota (150) & Reset
    console.log('\n▶️ [Step 11] Verifying VIP AI Quota Reset (150 Limit)...');
    const vipSumRes = await fetch(`${API_BASE}/merchant/summary`, {
      headers: { Authorization: `Bearer ${merchantToken}` }
    });
    const vipSumData = await vipSumRes.json();
    assert(vipSumData.storeInfo?.planType === 'VIP', `Store planType updated to VIP`);
    assert(vipSumData.aiGenerationsLimit === 150, `VIP AI limit is 150 (got: ${vipSumData.aiGenerationsLimit})`);
    assert(vipSumData.aiGenerationsUsed === 0, `VIP AI used count was reset to 0 (got: ${vipSumData.aiGenerationsUsed})`);

    // Call AI on VIP
    const vipAiRes = await fetch(`${API_BASE}/merchant/ai/generate-description`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${merchantToken}`
      },
      body: JSON.stringify({
        productName: 'طقم أثاث ليفنج مودرن VIP',
        category: 'أثاث وديكور'
      })
    });
    const vipAiData = await vipAiRes.json();
    assert(vipAiRes.status === 200, `AI call succeeded on VIP tier (got: ${vipAiRes.status})`);
    assert(vipAiData.aiGenerationsUsed === 1, `VIP AI used count is now 1 (got: ${vipAiData.aiGenerationsUsed})`);
    assert(vipAiData.remainingQuota === 149, `VIP remaining quota is 149 (got: ${vipAiData.remainingQuota})`);

  } catch (err) {
    console.error('💥 Unhandled exception during test suite execution:', err);
    failed++;
  } finally {
    // Cleanup: Delete test store via Super Admin API
    if (storeId && adminToken) {
      console.log('\n🧹 [Cleanup] Deleting test store...');
      try {
        const delRes = await fetch(`${API_BASE}/admin/stores/${storeId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (delRes.status === 200) {
          console.log(`  🗑️ Test store ${storeId} deleted cleanly.`);
        } else {
          console.warn(`  ⚠️ Cleanup failed with status: ${delRes.status}`);
        }
      } catch (delErr) {
        console.warn('  ⚠️ Failed to cleanup test store:', delErr.message);
      }
    }
  }

  console.log('\n=====================================================');
  console.log(`📊 FINAL TEST REPORT: ${passed} PASSED, ${failed} FAILED`);
  console.log('=====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
