// Automated E2E Verification for Enterprise SaaS Billing & Subscription Management
const https = require('https');

const BACKEND_URL = 'https://watsstore.runasp.net';
const FRONTEND_URL = 'https://frontend-bay-ten-58.vercel.app';

function request(url, options = {}, data = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const reqOptions = {
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    if (data) {
      if (typeof data === 'object') {
        data = JSON.stringify(data);
        reqOptions.headers['Content-Type'] = 'application/json';
      }
      reqOptions.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = https.request(reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(body);
        } catch {
          json = body;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runBillingTests() {
  console.log('================================================================');
  console.log('🧪 Starting Enterprise SaaS Billing & Automated Upgrade Test Suite');
  console.log('================================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Super Admin Login
    console.log('\n--- 1. Testing Super Admin Auth ---');
    const adminLoginRes = await request(`${BACKEND_URL}/api/admin/login`, {
      method: 'POST'
    }, {
      email: 'abdallahsay10@gmail.com',
      password: 'Admin@WatsStore2026!'
    });
    assert(adminLoginRes.status === 200, `Admin login returned HTTP ${adminLoginRes.status}`);
    const adminToken = adminLoginRes.body.token;
    assert(!!adminToken, 'Admin token successfully acquired');

    // 2. Test GET /api/admin/plans
    console.log('\n--- 2. Testing GET /api/admin/plans ---');
    const plansRes = await request(`${BACKEND_URL}/api/admin/plans`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(plansRes.status === 200, `GET /api/admin/plans returned HTTP ${plansRes.status}`);
    assert(Array.isArray(plansRes.body.plans), 'Plans array is returned');
    assert(plansRes.body.plans.length === 3, 'All 3 tiers (Free, Pro, VIP) are present');
    assert(!!plansRes.body.vodafoneCashWallet, `Vodafone Cash wallet present: ${plansRes.body.vodafoneCashWallet}`);
    assert(!!plansRes.body.instaPayHandle, `InstaPay handle present: ${plansRes.body.instaPayHandle}`);

    // 3. Test Merchant Authentication (Login as demo merchant)
    console.log('\n--- 3. Testing Merchant Auth & Store Billing Status ---');
    // Login or register a test merchant
    let merchantToken = null;
    const testEmail = `billing_test_${Date.now()}@test.com`;
    const regRes = await request(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST'
    }, {
      ownerName: 'تاجر فحص الفواتير',
      email: testEmail,
      password: 'Password@123!',
      storeName: 'متجر اختبار الفوترة',
      slug: `billing-test-${Date.now()}`,
      whatsAppNumber: '01027150000',
      businessCategory: 'Fashion',
      city: 'Cairo'
    });

    if (regRes.status === 200 && regRes.body.token) {
      merchantToken = regRes.body.token;
      console.log('Registered fresh test merchant store');
    } else {
      // Fallback: try demo store login
      const loginRes = await request(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST'
      }, {
        email: 'demo@watsstore.com',
        password: 'Password123!'
      });
      merchantToken = loginRes.body.token;
      console.log('Logged in as demo merchant');
    }

    assert(!!merchantToken, 'Merchant token obtained');

    // 4. Test GET /api/merchant/billing/status
    console.log('\n--- 4. Testing GET /api/merchant/billing/status ---');
    const billingStatusRes = await request(`${BACKEND_URL}/api/merchant/billing/status`, {
      headers: { Authorization: `Bearer ${merchantToken}` }
    });
    assert(billingStatusRes.status === 200, `Billing status returned HTTP ${billingStatusRes.status}`);
    assert(billingStatusRes.body.planType !== undefined, `Current Plan: ${billingStatusRes.body.planType}`);
    assert(billingStatusRes.body.aiGenerationsLimit !== undefined, `AI Quota Limit: ${billingStatusRes.body.aiGenerationsLimit}`);
    assert(billingStatusRes.body.vodafoneCashWallet !== undefined, `Vodafone Wallet: ${billingStatusRes.body.vodafoneCashWallet}`);

    // 5. Test Merchant Upgrade Request (Vodafone Cash)
    console.log('\n--- 5. Testing POST /api/merchant/billing/upgrade-request (Vodafone Cash) ---');
    const testTxId = `VF-TXN-${Date.now()}`;
    const upgradeReqRes = await request(`${BACKEND_URL}/api/merchant/billing/upgrade-request`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${merchantToken}` }
    }, {
      planType: 'Pro',
      billingCycle: 'Annual',
      paymentMethod: 'VodafoneCash',
      transactionId: testTxId,
      notes: 'تم التحويل من رقم 01027150xxx'
    });

    assert(upgradeReqRes.status === 200, `Upgrade request submitted with HTTP ${upgradeReqRes.status}`);
    assert(upgradeReqRes.body.status === 'Pending', 'Request status is Pending review');
    const createdRequestId = upgradeReqRes.body.requestId;
    assert(!!createdRequestId, `Created Request ID: ${createdRequestId}`);

    // 6. Test Super Admin Pending Subscriptions
    console.log('\n--- 6. Testing GET /api/admin/subscriptions/pending ---');
    const pendingSubsRes = await request(`${BACKEND_URL}/api/admin/subscriptions/pending`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(pendingSubsRes.status === 200, `Pending subscriptions returned HTTP ${pendingSubsRes.status}`);
    assert(Array.isArray(pendingSubsRes.body), 'Pending subscriptions is array');
    const foundPending = pendingSubsRes.body.find(r => r.transactionId === testTxId);
    assert(!!foundPending, `Newly submitted upgrade request found in admin pending list!`);

    // 7. Test Super Admin Approve Subscription
    console.log('\n--- 7. Testing PATCH /api/admin/subscriptions/{id}/approve ---');
    const approveRes = await request(`${BACKEND_URL}/api/admin/subscriptions/${createdRequestId}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(approveRes.status === 200, `Approve subscription returned HTTP ${approveRes.status}`);
    assert(approveRes.body.request.status === 'Approved', 'Subscription request status is now Approved');

    // 8. Re-verify Merchant Billing Status After Approval
    console.log('\n--- 8. Re-verifying Merchant Billing Status Post-Approval ---');
    const updatedBillingRes = await request(`${BACKEND_URL}/api/merchant/billing/status`, {
      headers: { Authorization: `Bearer ${merchantToken}` }
    });
    assert(updatedBillingRes.status === 200, `Updated billing status returned HTTP 200`);
    assert(updatedBillingRes.body.planType === 'Pro', `Store upgraded to Pro Plan successfully! Current: ${updatedBillingRes.body.planType}`);
    assert(updatedBillingRes.body.aiGenerationsLimit === 15, `AI generations quota updated to Pro limit: 15`);
    assert(!!updatedBillingRes.body.subscriptionEndsAt, `Subscription extended to: ${updatedBillingRes.body.subscriptionEndsAt}`);

    // 9. Test Online Card Instant Activation Hook
    console.log('\n--- 9. Testing Online Card Instant Automated Upgrade Hook ---');
    const cardTxId = `CARD-AUTO-${Date.now()}`;
    const cardUpgradeRes = await request(`${BACKEND_URL}/api/merchant/billing/upgrade-request`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${merchantToken}` }
    }, {
      planType: 'VIP',
      billingCycle: 'Annual',
      paymentMethod: 'OnlineCard',
      transactionId: cardTxId
    });
    assert(cardUpgradeRes.status === 200, `Online card upgrade returned HTTP ${cardUpgradeRes.status}`);
    assert(cardUpgradeRes.body.status === 'Approved', 'Online card payment auto-activated immediately! (Approved)');

    // 10. Verify Frontend Pages
    console.log('\n--- 10. Testing Frontend Billing & Admin Availability ---');
    const feBilling = await request(`${FRONTEND_URL}/dashboard/billing`);
    assert(feBilling.status === 200, `Frontend /dashboard/billing returned HTTP ${feBilling.status}`);

    const feAdmin = await request(`${FRONTEND_URL}/admin`);
    assert(feAdmin.status === 200, `Frontend /admin returned HTTP ${feAdmin.status}`);

  } catch (err) {
    console.error('Unhandled test failure:', err);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`📊 Billing Test Suite Results: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runBillingTests();
