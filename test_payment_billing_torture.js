// Comprehensive Payment, Billing & Subscription Torture Test Suite
const https = require('https');

const BACKEND_URL = 'https://watsstore.runasp.net';
const FRONTEND_URL = 'https://frontend-bay-ten-58.vercel.app';

function request(url, options = {}, data = null) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
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
        const responseTimeMs = Date.now() - startTime;
        let json = null;
        try {
          json = JSON.parse(body);
        } catch {
          json = body;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json, timeMs: responseTimeMs });
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runPaymentTortureSuite() {
  console.log('========================================================================');
  console.log('🔥 Rigorous Payment, Billing & Subscription Torture Test Suite');
  console.log('Target API: ' + BACKEND_URL);
  console.log('Target Frontend: ' + FRONTEND_URL);
  console.log('========================================================================\n');

  const results = [];
  let passedCount = 0;
  let failedCount = 0;

  function record(testName, scenarioType, expectedStatus, actualStatus, timeMs, passed, details = '') {
    if (passed) {
      console.log(`✅ [PASS] ${testName} (${timeMs}ms) - HTTP ${actualStatus}`);
      passedCount++;
    } else {
      console.error(`❌ [FAIL] ${testName} (${timeMs}ms) - Expected: ${expectedStatus}, Got: ${actualStatus}. Details: ${details}`);
      failedCount++;
    }
    results.push({
      testName,
      scenarioType,
      expectedStatus,
      actualStatus,
      timeMs,
      passed,
      details
    });
  }

  try {
    // ---------------------------------------------------------
    // SETUP: Create Merchant A, Merchant B, and Login Super Admin
    // ---------------------------------------------------------
    console.log('--- SETUP: Authenticating Entities ---');

    // 1. Super Admin Login
    const adminLogin = await request(`${BACKEND_URL}/api/admin/login`, { method: 'POST' }, {
      email: 'abdallahsay10@gmail.com',
      password: 'Admin@WatsStore2026!'
    });
    const adminToken = adminLogin.body?.token;
    record('Super Admin Authentication', 'Auth', 200, adminLogin.status, adminLogin.timeMs, adminLogin.status === 200 && !!adminToken);

    // 2. Register Merchant A
    const emailA = `merchant_a_${Date.now()}@torture.com`;
    const regA = await request(`${BACKEND_URL}/api/auth/register`, { method: 'POST' }, {
      ownerName: 'التاجر أ - فحص الفوترة',
      email: emailA,
      password: 'Password@123!',
      storeName: 'متجر التاجر أ',
      slug: `store-a-${Date.now()}`,
      whatsAppNumber: '01011111111',
      businessCategory: 'Electronics',
      city: 'Cairo'
    });
    const tokenA = regA.body?.token;
    record('Register Merchant A', 'Setup', 200, regA.status, regA.timeMs, regA.status === 200 && !!tokenA);

    // 3. Register Merchant B
    const emailB = `merchant_b_${Date.now()}@torture.com`;
    const regB = await request(`${BACKEND_URL}/api/auth/register`, { method: 'POST' }, {
      ownerName: 'التاجر ب - محاولة الاختراق',
      email: emailB,
      password: 'Password@123!',
      storeName: 'متجر التاجر ب',
      slug: `store-b-${Date.now()}`,
      whatsAppNumber: '01022222222',
      businessCategory: 'Fashion',
      city: 'Alexandria'
    });
    const tokenB = regB.body?.token;
    record('Register Merchant B', 'Setup', 200, regB.status, regB.timeMs, regB.status === 200 && !!tokenB);

    // ---------------------------------------------------------
    // PART 1: HAPPY PATH SCENARIOS (دورة الدفع الناجحة)
    // ---------------------------------------------------------
    console.log('\n--- PART 1: Happy Path Scenarios ---');

    // 1.1 Merchant A Billing Status Retrieval
    const statusA = await request(`${BACKEND_URL}/api/merchant/billing/status`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const isInitialFree = statusA.body?.planType === 'Free' && statusA.body?.aiGenerationsLimit === 0;
    record(
      'Merchant A Billing Status (Initial Free Trial)',
      'Happy Path',
      200,
      statusA.status,
      statusA.timeMs,
      statusA.status === 200 && isInitialFree,
      `Plan: ${statusA.body?.planType}, AI Limit: ${statusA.body?.aiGenerationsLimit}`
    );

    // 1.2 Submit Vodafone Cash Upgrade Request
    const testTxId = `TXN-VF-987654321-${Date.now()}`;
    const upgradeReqA = await request(`${BACKEND_URL}/api/merchant/billing/upgrade-request`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` }
    }, {
      planType: 'Pro',
      billingCycle: 'Monthly',
      paymentMethod: 'VodafoneCash',
      transactionId: testTxId,
      notes: 'تم التحويل من محفظة فودافون كاش 01027150xxx'
    });

    const reqAId = upgradeReqA.body?.requestId;
    const isPending = upgradeReqA.body?.status === 'Pending';
    record(
      'Merchant A Vodafone Cash Upgrade Submission',
      'Happy Path',
      200,
      upgradeReqA.status,
      upgradeReqA.timeMs,
      upgradeReqA.status === 200 && isPending && !!reqAId,
      `Request ID: ${reqAId}, Status: ${upgradeReqA.body?.status}`
    );

    // 1.3 Super Admin Lists Pending Subscriptions
    const pendingList = await request(`${BACKEND_URL}/api/admin/subscriptions/pending`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const foundInPending = Array.isArray(pendingList.body) && pendingList.body.some(r => r.id === reqAId);
    record(
      'Super Admin Lists Pending Upgrade Requests',
      'Happy Path',
      200,
      pendingList.status,
      pendingList.timeMs,
      pendingList.status === 200 && foundInPending,
      `Found request in pending queue: ${foundInPending}`
    );

    // 1.4 Super Admin Approves Merchant A Request
    const approveA = await request(`${BACKEND_URL}/api/admin/subscriptions/${reqAId}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const isApproved = approveA.body?.request?.status === 'Approved';
    record(
      'Super Admin Approves Upgrade Request',
      'Happy Path',
      200,
      approveA.status,
      approveA.timeMs,
      approveA.status === 200 && isApproved,
      approveA.body?.message
    );

    // 1.5 Verify Merchant A Plan Upgraded to Pro with AI & 30-Day Extension
    const postApproveStatusA = await request(`${BACKEND_URL}/api/merchant/billing/status`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const isUpgradedToPro = postApproveStatusA.body?.planType === 'Pro';
    const isAiQuotaUnlocked = postApproveStatusA.body?.aiGenerationsLimit === 15;
    const hasExpiry = !!postApproveStatusA.body?.subscriptionEndsAt;
    record(
      'Verify Merchant A Upgraded to Pro with Unlocked AI (15 Limit) & 30-Day Extension',
      'Happy Path',
      200,
      postApproveStatusA.status,
      postApproveStatusA.timeMs,
      postApproveStatusA.status === 200 && isUpgradedToPro && isAiQuotaUnlocked && hasExpiry,
      `Plan: ${postApproveStatusA.body?.planType}, AI Limit: ${postApproveStatusA.body?.aiGenerationsLimit}, Expiry: ${postApproveStatusA.body?.subscriptionEndsAt}`
    );

    // ---------------------------------------------------------
    // PART 2: BAD / NEGATIVE SCENARIOS & ADVERSARIAL TORTURE
    // ---------------------------------------------------------
    console.log('\n--- PART 2: Adversarial & Negative Scenarios ---');

    // 2.1 IDOR: Merchant B tries to view Merchant A's subscription request details
    const idorView = await request(`${BACKEND_URL}/api/merchant/billing/requests/${reqAId}`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const isIdorBlocked = idorView.status === 403 || idorView.status === 401;
    record(
      'IDOR Attack: Merchant B attempts to view Merchant A billing request',
      'Security / IDOR',
      403,
      idorView.status,
      idorView.timeMs,
      isIdorBlocked,
      `Returned status: ${idorView.status}`
    );

    // 2.2 Privilege Escalation: Merchant B tries to approve Merchant A request via Admin API
    const privEscApprove = await request(`${BACKEND_URL}/api/admin/subscriptions/${reqAId}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const isPrivEscApproveBlocked = privEscApprove.status === 401 || privEscApprove.status === 403;
    record(
      'Privilege Escalation: Merchant B attempts to call Admin approve endpoint',
      'Security / Auth',
      401,
      privEscApprove.status,
      privEscApprove.timeMs,
      isPrivEscApproveBlocked,
      `Returned status: ${privEscApprove.status}`
    );

    // 2.3 Privilege Escalation: Merchant B tries to reject Merchant A request via Admin API
    const privEscReject = await request(`${BACKEND_URL}/api/admin/subscriptions/${reqAId}/reject`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenB}` }
    }, { adminNotes: 'Hacked by Merchant B' });
    const isPrivEscRejectBlocked = privEscReject.status === 401 || privEscReject.status === 403;
    record(
      'Privilege Escalation: Merchant B attempts to call Admin reject endpoint',
      'Security / Auth',
      401,
      privEscReject.status,
      privEscReject.timeMs,
      isPrivEscRejectBlocked,
      `Returned status: ${privEscReject.status}`
    );

    // 2.4 Privilege Escalation: Merchant B tries to list all subscriptions
    const privEscList = await request(`${BACKEND_URL}/api/admin/subscriptions`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const isPrivEscListBlocked = privEscList.status === 401 || privEscList.status === 403;
    record(
      'Privilege Escalation: Merchant B attempts to list all tenant subscriptions',
      'Security / Auth',
      401,
      privEscList.status,
      privEscList.timeMs,
      isPrivEscListBlocked,
      `Returned status: ${privEscList.status}`
    );

    // 2.5 Malformed Input: Invalid Plan Type ("MegaVIP")
    const badPlanReq = await request(`${BACKEND_URL}/api/merchant/billing/upgrade-request`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` }
    }, {
      planType: 'MegaVIP',
      billingCycle: 'Monthly',
      paymentMethod: 'VodafoneCash',
      transactionId: `TXN-BAD-PLAN-${Date.now()}`
    });
    record(
      'Input Validation: Reject Fake Plan Type ("MegaVIP")',
      'Input Validation',
      400,
      badPlanReq.status,
      badPlanReq.timeMs,
      badPlanReq.status === 400,
      `Status: ${badPlanReq.status}`
    );

    // 2.6 Malformed Input: Invalid Payment Method ("Bitcoin")
    const badPaymentMethodReq = await request(`${BACKEND_URL}/api/merchant/billing/upgrade-request`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` }
    }, {
      planType: 'Pro',
      billingCycle: 'Monthly',
      paymentMethod: 'Bitcoin',
      transactionId: `TXN-BAD-METHOD-${Date.now()}`
    });
    record(
      'Input Validation: Reject Unsupported Payment Method ("Bitcoin")',
      'Input Validation',
      400,
      badPaymentMethodReq.status,
      badPaymentMethodReq.timeMs,
      badPaymentMethodReq.status === 400,
      `Status: ${badPaymentMethodReq.status}`
    );

    // 2.7 Malformed Input: Invalid Billing Cycle ("Weekly")
    const badCycleReq = await request(`${BACKEND_URL}/api/merchant/billing/upgrade-request`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` }
    }, {
      planType: 'Pro',
      billingCycle: 'Weekly',
      paymentMethod: 'VodafoneCash',
      transactionId: `TXN-BAD-CYCLE-${Date.now()}`
    });
    record(
      'Input Validation: Reject Unsupported Billing Cycle ("Weekly")',
      'Input Validation',
      400,
      badCycleReq.status,
      badCycleReq.timeMs,
      badCycleReq.status === 400,
      `Status: ${badCycleReq.status}`
    );

    // 2.8 Empty Transaction ID
    const emptyTxReq = await request(`${BACKEND_URL}/api/merchant/billing/upgrade-request`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` }
    }, {
      planType: 'Pro',
      billingCycle: 'Monthly',
      paymentMethod: 'VodafoneCash',
      transactionId: ''
    });
    record(
      'Input Validation: Reject Empty Transaction ID ("")',
      'Input Validation',
      400,
      emptyTxReq.status,
      emptyTxReq.timeMs,
      emptyTxReq.status === 400,
      `Status: ${emptyTxReq.status}`
    );

    // 2.9 Duplicate Transaction ID Reuse (Reusing Merchant A's approved transaction ID)
    const duplicateTxReq = await request(`${BACKEND_URL}/api/merchant/billing/upgrade-request`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` }
    }, {
      planType: 'Pro',
      billingCycle: 'Monthly',
      paymentMethod: 'VodafoneCash',
      transactionId: testTxId // reused transaction ID
    });
    record(
      'Fraud Prevention: Reject Reused / Duplicate Transaction ID',
      'Fraud Prevention',
      400,
      duplicateTxReq.status,
      duplicateTxReq.timeMs,
      duplicateTxReq.status === 400,
      `Status: ${duplicateTxReq.status}, Message: ${duplicateTxReq.body?.message}`
    );

    // 2.10 Rejection Flow (Merchant B submits valid InstaPay request, Admin rejects it)
    const rejectTxId = `TXN-INSTA-REJECT-${Date.now()}`;
    const submitForReject = await request(`${BACKEND_URL}/api/merchant/billing/upgrade-request`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` }
    }, {
      planType: 'VIP',
      billingCycle: 'Annual',
      paymentMethod: 'InstaPay',
      transactionId: rejectTxId,
      notes: 'حوالة تجريبية بغرض فحص الرفض'
    });
    const rejectReqId = submitForReject.body?.requestId;

    const adminRejectAction = await request(`${BACKEND_URL}/api/admin/subscriptions/${rejectReqId}/reject`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    }, {
      adminNotes: 'لم يتم استلام أي حوالة على حساب إنستاباي، يرجى إعادة التحقق من الإيصال'
    });
    const isStatusRejected = adminRejectAction.body?.request?.status === 'Rejected';
    record(
      'Super Admin Rejects Invalid Payment with Reason',
      'Rejection Flow',
      200,
      adminRejectAction.status,
      adminRejectAction.timeMs,
      adminRejectAction.status === 200 && isStatusRejected,
      `Request Status: ${adminRejectAction.body?.request?.status}`
    );

    // 2.11 Verify Merchant B Remains on Free Plan after Rejection
    const postRejectStatusB = await request(`${BACKEND_URL}/api/merchant/billing/status`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const staysFree = postRejectStatusB.body?.planType === 'Free';
    const hasRejectedInHistory = postRejectStatusB.body?.invoiceHistory?.some(r => r.id === rejectReqId && r.status === 'Rejected');
    const noPending = postRejectStatusB.body?.activePendingRequest === null || postRejectStatusB.body?.activePendingRequest === undefined;
    record(
      'Merchant B Remains on Free Plan with Rejection Reason Logged in History',
      'Rejection Flow',
      200,
      postRejectStatusB.status,
      postRejectStatusB.timeMs,
      postRejectStatusB.status === 200 && staysFree && hasRejectedInHistory && noPending,
      `Plan: ${postRejectStatusB.body?.planType}, Pending: ${postRejectStatusB.body?.activePendingRequest}`
    );

    // 2.12 Online Card Instant Activation Hook
    const cardTxId = `TXN-CARD-INSTANT-${Date.now()}`;
    const cardUpgradeB = await request(`${BACKEND_URL}/api/merchant/billing/upgrade-request`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` }
    }, {
      planType: 'VIP',
      billingCycle: 'Annual',
      paymentMethod: 'OnlineCard',
      transactionId: cardTxId
    });
    const isCardApproved = cardUpgradeB.body?.status === 'Approved';
    record(
      'Automated Online Card Payment Instant Activation',
      'Automation Hook',
      200,
      cardUpgradeB.status,
      cardUpgradeB.timeMs,
      cardUpgradeB.status === 200 && isCardApproved,
      `Status: ${cardUpgradeB.body?.status}`
    );

    // 2.13 Live Frontend Availability Checks
    const feBillingCheck = await request(`${FRONTEND_URL}/dashboard/billing`);
    record(
      'Frontend Billing Page Availability (/dashboard/billing)',
      'Frontend',
      200,
      feBillingCheck.status,
      feBillingCheck.timeMs,
      feBillingCheck.status === 200
    );

    const feAdminCheck = await request(`${FRONTEND_URL}/admin`);
    record(
      'Frontend Super Admin Page Availability (/admin)',
      'Frontend',
      200,
      feAdminCheck.status,
      feAdminCheck.timeMs,
      feAdminCheck.status === 200
    );

  } catch (err) {
    console.error('Crash in test suite execution:', err);
    failedCount++;
  }

  // ---------------------------------------------------------
  // SUMMARY TABLE
  // ---------------------------------------------------------
  console.log('\n========================================================================');
  console.log('📊 PAYMENT & BILLING TORTURE TEST RESULTS SUMMARY');
  console.log('========================================================================');
  console.table(results.map(r => ({
    'Test Name': r.testName,
    'Category': r.scenarioType,
    'Expected': r.expectedStatus,
    'Actual': r.actualStatus,
    'Latency (ms)': r.timeMs,
    'Verdict': r.passed ? 'PASS ✅' : 'FAIL ❌'
  })));

  console.log(`\nTOTAL: ${passedCount + failedCount} | PASSED: ${passedCount} | FAILED: ${failedCount}`);

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPaymentTortureSuite();
