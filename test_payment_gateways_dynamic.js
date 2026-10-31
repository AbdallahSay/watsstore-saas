const https = require('https');

const API_BASE = 'https://watsstore.runasp.net/api';
const ADMIN_KEY = process.env.WATSSTORE_TEST_ADMIN_KEY;

function makeRequest(url, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 25000
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : null;
          resolve({ status: res.statusCode, headers: res.headers, data: parsed, rawBody: body });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: body, rawBody: body });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out after 25s'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function run() {
  console.log('========================================================================');
  console.log('🚀 LIVE VERIFICATION: DYNAMIC MULTI-ACCOUNT & TOGGLEABLE PAYMENT GATEWAYS');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} - ${details}`);
      failed++;
    }
  }

  try {
    // 1. Health check on MonsterASP API
    console.log('[1/7] Testing MonsterASP API Health...');
    const healthRes = await makeRequest(`${API_BASE}/public/pricing`);
    assert(healthRes.status === 200, 'API /public/pricing returns 200 OK', `Status: ${healthRes.status}`);

    // 2. Fetch gateways as Super Admin
    console.log('\n[2/7] Testing GET /api/admin/payment-gateways with Admin Key...');
    const adminGatewaysRes = await makeRequest(`${API_BASE}/admin/payment-gateways`, 'GET', null, {
      'X-Admin-Key': ADMIN_KEY
    });
    assert(adminGatewaysRes.status === 200, 'GET /api/admin/payment-gateways returns 200', `Status: ${adminGatewaysRes.status}`);
    assert(Array.isArray(adminGatewaysRes.data), 'Admin gateways response is an array', `Type: ${typeof adminGatewaysRes.data}`);
    
    console.log(`   Found ${adminGatewaysRes.data?.length || 0} configured gateways:`);
    (adminGatewaysRes.data || []).forEach(g => {
      console.log(`   - [${g.gatewayKey}] "${g.displayName}" (Enabled: ${g.isEnabled}, Accounts: ${g.accounts?.length || 0})`);
    });

    const vodafoneGw = (adminGatewaysRes.data || []).find(g => g.gatewayKey === 'VodafoneCash');
    const instaPayGw = (adminGatewaysRes.data || []).find(g => g.gatewayKey === 'InstaPay');
    assert(!!vodafoneGw, 'VodafoneCash gateway exists in database', 'Not found');
    assert(!!instaPayGw, 'InstaPay gateway exists in database', 'Not found');

    // 3. Test Merchant Public Gateways endpoint
    console.log('\n[3/7] Testing GET /api/merchant/billing/gateways (Public/Merchant)...');
    const merchantGatewaysRes = await makeRequest(`${API_BASE}/merchant/billing/gateways`);
    assert(merchantGatewaysRes.status === 200, 'GET /api/merchant/billing/gateways returns 200', `Status: ${merchantGatewaysRes.status}`);
    assert(Array.isArray(merchantGatewaysRes.data), 'Merchant gateways response is an array', `Type: ${typeof merchantGatewaysRes.data}`);
    // Only enabled gateways should be returned
    const allEnabled = (merchantGatewaysRes.data || []).every(g => g.isEnabled);
    assert(allEnabled, 'All returned merchant gateways have isEnabled === true', 'Disabled gateway found');

    // 4. Test Super Admin Multi-Account Update: Add a second account to Vodafone Cash
    console.log('\n[4/7] Testing PUT /api/admin/payment-gateways (Adding secondary wallet)...');
    const updatedGatewaysList = JSON.parse(JSON.stringify(adminGatewaysRes.data));
    const targetVodafone = updatedGatewaysList.find(g => g.gatewayKey === 'VodafoneCash');
    
    const originalAccounts = [...(targetVodafone.accounts || [])];
    const testAccount = {
      accountNumber: '01099887766',
      accountName: 'حساب مبيعات إضافي - فودافون كاش',
      isActive: true
    };
    targetVodafone.accounts = [...originalAccounts, testAccount];
    targetVodafone.instructions = 'تحويل فودافون كاش: يرجى التحويل إلى أي من الأرقام المعتمدة مع إرسال رقم العملية.';

    const putRes = await makeRequest(`${API_BASE}/admin/payment-gateways`, 'PUT', { gateways: updatedGatewaysList }, {
      'X-Admin-Key': ADMIN_KEY
    });
    assert(putRes.status === 200, 'PUT /api/admin/payment-gateways returns 200 OK', `Status: ${putRes.status}`);
    assert(putRes.data?.gateways, 'PUT returns updated gateways payload', `No gateways field in response`);

    // Verify change took effect in merchant endpoint
    console.log('\n[5/7] Verifying updated multi-account in GET /api/merchant/billing/gateways...');
    const verifyMerchantGw = await makeRequest(`${API_BASE}/merchant/billing/gateways`);
    const refreshedVodafone = (verifyMerchantGw.data || []).find(g => g.gatewayKey === 'VodafoneCash');
    const foundNewAcc = (refreshedVodafone?.accounts || []).some(a => a.accountNumber === '01099887766');
    assert(foundNewAcc, 'Newly added account 01099887766 is live and visible to merchants', 'Account not found');

    // 5. Test Merchant Authentication and Billing Status
    console.log('\n[6/7] Testing Merchant Billing Status and Upgrade Submission with Destination Account...');
    // Login with an existing test merchant
    const loginRes = await makeRequest(`${API_BASE}/auth/login`, 'POST', {
      email: 'testmerchant@gmail.com',
      password: 'Password123!'
    });

    let merchantToken = null;
    if (loginRes.status === 200 && loginRes.data?.token) {
      merchantToken = loginRes.data.token;
      console.log('   Logged in as testmerchant@gmail.com');
    } else {
      // Register a temporary merchant to test billing flow
      console.log('   Registering a temporary merchant to test billing flow...');
      const regRes = await makeRequest(`${API_BASE}/auth/register`, 'POST', {
        ownerName: 'أحمد التاجر التجريبي',
        storeName: 'متجر اختبار بوابات الدفع ' + Date.now().toString().slice(-4),
        email: `test_gw_${Date.now()}@gmail.com`,
        password: 'Password123!',
        whatsAppNumber: '01012345678',
        businessCategory: 'أزياء وموضة',
        city: 'القاهرة'
      });
      if (regRes.status === 200 && regRes.data?.token) {
        merchantToken = regRes.data.token;
        console.log(`   Registered test merchant successfully`);
      } else {
        console.error('   Registration failed:', regRes.status, regRes.data);
      }
    }

    if (merchantToken) {
      const statusRes = await makeRequest(`${API_BASE}/merchant/billing/status`, 'GET', null, {
        Authorization: `Bearer ${merchantToken}`
      });
      assert(statusRes.status === 200, 'GET /api/merchant/billing/status returns 200 OK', `Status: ${statusRes.status}`);
      assert(Array.isArray(statusRes.data?.activePaymentGateways), 'Billing status includes activePaymentGateways array', 'activePaymentGateways missing');

      // Cancel any existing pending request so we can test clean submission
      if (statusRes.data?.activePendingRequest) {
        console.log(`   Cancelling existing pending request ${statusRes.data.activePendingRequest.id}...`);
        await makeRequest(`${API_BASE}/merchant/billing/upgrade-request/${statusRes.data.activePendingRequest.id}/cancel`, 'POST', null, {
          Authorization: `Bearer ${merchantToken}`
        });
      }

      // Submit upgrade request with the chosen destinationAccount
      const testTx = 'TX' + Math.floor(10000000 + Math.random() * 90000000);
      const upgradeRes = await makeRequest(`${API_BASE}/merchant/billing/upgrade-request`, 'POST', {
        planType: 'Pro',
        billingCycle: 'Annual',
        paymentMethod: 'VodafoneCash',
        destinationAccount: '01099887766',
        senderIdentifier: '01012345678',
        transactionId: testTx,
        notes: 'اختبار الحساب المستهدف المتعدد'
      }, {
        Authorization: `Bearer ${merchantToken}`
      });

      assert(upgradeRes.status === 200, 'Submit upgrade request with destinationAccount returns 200 OK', `Status: ${upgradeRes.status}, Error: ${JSON.stringify(upgradeRes.data)}`);
      const recordedAcc = upgradeRes.data?.destinationAccount || upgradeRes.data?.request?.destinationAccount;
      assert(recordedAcc === '01099887766', 'Recorded destinationAccount matches 01099887766', `Got: ${recordedAcc}`);

      // 6. Verify Super Admin sees the destination account
      console.log('\n[7/7] Verifying Super Admin sees destinationAccount in pending subscriptions...');
      const adminPendingRes = await makeRequest(`${API_BASE}/admin/subscriptions/pending`, 'GET', null, {
        'X-Admin-Key': ADMIN_KEY
      });
      assert(adminPendingRes.status === 200, 'GET /api/admin/subscriptions/pending returns 200 OK', `Status: ${adminPendingRes.status}`);
      const foundSub = (adminPendingRes.data || []).find(s => s.transactionId === testTx);
      assert(!!foundSub, `Admin found pending request with transaction ${testTx}`, 'Not found in admin pending list');
      assert(foundSub?.destinationAccount === '01099887766', `Admin pending request shows destinationAccount = 01099887766`, `Got: ${foundSub?.destinationAccount}`);

      // Clean up the test subscription
      if (foundSub) {
        console.log(`   Cleaning up test subscription ${foundSub.id}...`);
        await makeRequest(`${API_BASE}/merchant/billing/upgrade-request/${foundSub.id}/cancel`, 'POST', null, {
          Authorization: `Bearer ${merchantToken}`
        });
      }
    } else {
      console.warn('   Could not authenticate merchant; skipping merchant submission step.');
    }

    // Restore original accounts for Vodafone Cash to leave system clean
    console.log('\n🧹 Cleaning up test accounts from Vodafone Cash...');
    targetVodafone.accounts = originalAccounts;
    await makeRequest(`${API_BASE}/admin/payment-gateways`, 'PUT', { gateways: updatedGatewaysList }, {
      'X-Admin-Key': ADMIN_KEY
    });
    console.log('   Restored original gateway accounts.');

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  }

  console.log('\n========================================================================');
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('========================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

run();
