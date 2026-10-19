// test_hardened_billing_admin.js
// Principal Fintech QA & Security Automated Test Suite
// Verifies:
// 1. Single active pending upgrade lock (409 Conflict)
// 2. Reject duplicate Transaction ID (400 Bad Request)
// 3. Reject invalid Transaction ID format (<6 or >30 chars) (400 Bad Request)
// 4. Merchant can cancel pending upgrade request (DELETE/POST cancel -> 200 OK)
// 5. Server-side price calculation strictly from PlatformSettings
// 6. Elimination of unverified instant upgrade bypass (Status = Pending)
// 7. Admin approval idempotency & double-approval rejection (400 Bad Request)

const BASE_URL = process.env.API_BASE_URL || 'https://watsstore.runasp.net';
const ADMIN_SECRET = 'WatsStore_SuperAdmin_SecretKey_2026_Secure!';
const ADMIN_EMAIL = 'abdallahsay10@gmail.com';
const ADMIN_PASS = 'Admin@WatsStore2026!';

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} - ${details}`);
    failed++;
  }
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  const res = await fetch(url, {
    ...options,
    headers
  });
  let data = null;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = text;
  }
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log(`\n======================================================`);
  console.log(`🚀 RUNNING HARDENED BILLING & ADMIN TORTURE TEST SUITE`);
  console.log(`🎯 Target API: ${BASE_URL}`);
  console.log(`======================================================\n`);

  // Step 0: Obtain Admin Token
  console.log(`[0] Authenticating Super Admin...`);
  const adminLoginRes = await request('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS })
  });
  assert(adminLoginRes.status === 200 && adminLoginRes.data?.token, 'Super Admin Authentication', JSON.stringify(adminLoginRes.data));
  const adminToken = adminLoginRes.data?.token;

  // Step 1: Register unique Test Merchant
  console.log(`\n[1] Registering fresh Test Merchant...`);
  const uniqueSuffix = Date.now().toString().slice(-6);
  const merchantEmail = `test_merchant_${uniqueSuffix}@watsstore.qa`;
  const merchantPass = 'Password123!';
  const phoneA = '010' + Math.floor(10000000 + Math.random() * 90000000);
  const regRes = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      storeName: `Hardened Store ${uniqueSuffix}`,
      ownerName: `Tester ${uniqueSuffix}`,
      email: merchantEmail,
      password: merchantPass,
      whatsAppNumber: phoneA,
      city: 'القاهرة',
      businessCategory: 'إلكترونيات',
      themeColor: '#10B981',
      currency: 'EGP'
    })
  });
  assert(regRes.status === 200 && regRes.data?.token, 'Merchant Registration', JSON.stringify(regRes.data));
  const merchantToken = regRes.data?.token;

  // Step 2: Test Invalid Transaction ID Formats (< 6 chars, > 30 chars)
  console.log(`\n[2] Testing Malformed Transaction ID Validation (Security Guard)...`);
  const shortTxRes = await request('/api/merchant/billing/upgrade-request', {
    method: 'POST',
    headers: { Authorization: `Bearer ${merchantToken}` },
    body: JSON.stringify({
      planType: 'Pro',
      billingCycle: 'Annual',
      paymentMethod: 'VodafoneCash',
      transactionId: '123' // Too short (< 6 chars)
    })
  });
  assert(shortTxRes.status === 400, 'Reject short Transaction ID (< 6 chars) with 400', `Got HTTP ${shortTxRes.status}: ${JSON.stringify(shortTxRes.data)}`);

  const longTxRes = await request('/api/merchant/billing/upgrade-request', {
    method: 'POST',
    headers: { Authorization: `Bearer ${merchantToken}` },
    body: JSON.stringify({
      planType: 'Pro',
      billingCycle: 'Annual',
      paymentMethod: 'VodafoneCash',
      transactionId: 'A'.repeat(35) // Too long (> 30 chars)
    })
  });
  assert(longTxRes.status === 400, 'Reject long Transaction ID (> 30 chars) with 400', `Got HTTP ${longTxRes.status}: ${JSON.stringify(longTxRes.data)}`);

  // Step 3: Test OnlineCard does NOT auto-upgrade without verification (Elimination of instant bypass)
  console.log(`\n[3] Testing OnlineCard Submission (Must Enter Status = Pending)...`);
  const cardTxId = `TX-CARD-${uniqueSuffix}-01`;
  const cardReqRes = await request('/api/merchant/billing/upgrade-request', {
    method: 'POST',
    headers: { Authorization: `Bearer ${merchantToken}` },
    body: JSON.stringify({
      planType: 'Pro',
      billingCycle: 'Annual',
      paymentMethod: 'OnlineCard',
      transactionId: cardTxId,
      senderIdentifier: '01012345678'
    })
  });
  assert(cardReqRes.status === 200 && cardReqRes.data?.status === 'Pending', 
    'OnlineCard enters Status=Pending awaiting verification', 
    `Got status: ${cardReqRes.data?.status}`
  );
  const firstReqId = cardReqRes.data?.requestId;

  // Step 4: Test Single Active Request Lock (409 Conflict)
  console.log(`\n[4] Testing Single Active Request Lock (409 Conflict)...`);
  const secondTxId = `TX-VODAFONE-${uniqueSuffix}-02`;
  const conflictReqRes = await request('/api/merchant/billing/upgrade-request', {
    method: 'POST',
    headers: { Authorization: `Bearer ${merchantToken}` },
    body: JSON.stringify({
      planType: 'VIP',
      billingCycle: 'Annual',
      paymentMethod: 'VodafoneCash',
      transactionId: secondTxId
    })
  });
  assert(conflictReqRes.status === 409, 
    'Reject concurrent upgrade request with 409 Conflict', 
    `Got HTTP ${conflictReqRes.status}: ${JSON.stringify(conflictReqRes.data)}`
  );

  // Step 5: Test Merchant Cancellation of Pending Request
  console.log(`\n[5] Testing Merchant Cancellation of Pending Request...`);
  const cancelRes = await request(`/api/merchant/billing/upgrade-request/${firstReqId}/cancel`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${merchantToken}` }
  });
  assert(cancelRes.status === 200 && cancelRes.data?.status === 'Cancelled',
    'Cancel active pending upgrade request',
    `Got status: ${cancelRes.data?.status}`
  );

  // Verify status is Cancelled and no activePendingRequest exists
  const statusAfterCancel = await request('/api/merchant/billing/status', {
    headers: { Authorization: `Bearer ${merchantToken}` }
  });
  assert(statusAfterCancel.status === 200 && statusAfterCancel.data?.activePendingRequest === null,
    'Merchant status shows no activePendingRequest after cancellation',
    JSON.stringify(statusAfterCancel.data?.activePendingRequest)
  );

  // Step 6: Test Strict Server-Side Price Calculation & SenderIdentifier Mapping
  console.log(`\n[6] Testing Server-Side Price Calculation & SenderIdentifier...`);
  const validTxId = `TX-INSTAPAY-${uniqueSuffix}-03`;
  const newUpgradeRes = await request('/api/merchant/billing/upgrade-request', {
    method: 'POST',
    headers: { Authorization: `Bearer ${merchantToken}` },
    body: JSON.stringify({
      planType: 'Pro',
      billingCycle: 'Annual',
      paymentMethod: 'InstaPay',
      transactionId: validTxId,
      senderIdentifier: 'qa_sender@instapay',
      amount: 1 // Malicious client attempt to pay 1 EGP
    })
  });
  assert(newUpgradeRes.status === 200 && newUpgradeRes.data?.status === 'Pending', 'Submit new upgrade request after cancel', JSON.stringify(newUpgradeRes.data));
  assert(newUpgradeRes.data?.amount === 2499, 'Server overrides client price to active annual price (2499)', `Got amount: ${newUpgradeRes.data?.amount}`);
  assert(newUpgradeRes.data?.senderIdentifier === 'qa_sender@instapay', 'SenderIdentifier properly saved', `Got: ${newUpgradeRes.data?.senderIdentifier}`);
  const activeReqId = newUpgradeRes.data?.requestId;

  // Step 7: Test Duplicate Transaction ID Guard from another merchant (400 Bad Request)
  console.log(`\n[7] Testing Duplicate Transaction ID Rejection across merchants...`);
  const merchantBEmail = `merchant_b_${uniqueSuffix}@watsstore.qa`;
  const phoneB = '011' + Math.floor(10000000 + Math.random() * 90000000);
  const regBRes = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      storeName: `Store B ${uniqueSuffix}`,
      ownerName: `Owner B`,
      email: merchantBEmail,
      password: 'Password123!',
      whatsAppNumber: phoneB,
      city: 'الإسكندرية',
      businessCategory: 'ملابس',
      themeColor: '#10B981',
      currency: 'EGP'
    })
  });
  const merchantBToken = regBRes.data?.token;

  const dupTxRes = await request('/api/merchant/billing/upgrade-request', {
    method: 'POST',
    headers: { Authorization: `Bearer ${merchantBToken}` },
    body: JSON.stringify({
      planType: 'Pro',
      billingCycle: 'Monthly',
      paymentMethod: 'VodafoneCash',
      transactionId: validTxId // Attempting to use the SAME transaction ID currently in Pending
    })
  });
  assert(dupTxRes.status === 400, 'Reject duplicate Transaction ID with 400 Bad Request', `Got HTTP ${dupTxRes.status}: ${JSON.stringify(dupTxRes.data)}`);

  // Step 8: Super Admin Approval Flow & Cumulative Expiry
  console.log(`\n[8] Testing Super Admin Approval & Plan Upgrade...`);
  const approveRes = await request(`/api/admin/subscriptions/${activeReqId}/approve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(approveRes.status === 200 && approveRes.data?.request?.status === 'Approved', 
    'Admin approves subscription request successfully',
    JSON.stringify(approveRes.data)
  );

  // Check store was upgraded to Pro
  const merchantStatus = await request('/api/merchant/billing/status', {
    headers: { Authorization: `Bearer ${merchantToken}` }
  });
  assert(merchantStatus.data?.planType === 'Pro', 'Store Plan upgraded to Pro', `Got plan: ${merchantStatus.data?.planType}`);

  // Step 9: Test Idempotency Guard (Reject Double Approval / Double Rejection on processed request)
  console.log(`\n[9] Testing Admin Idempotency Guard (Double Approval & Rejection Prevention)...`);
  const doubleApproveRes = await request(`/api/admin/subscriptions/${activeReqId}/approve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(doubleApproveRes.status === 400, 'Reject double-approval of already approved request with 400', `Got HTTP ${doubleApproveRes.status}: ${JSON.stringify(doubleApproveRes.data)}`);

  const rejectAfterApproveRes = await request(`/api/admin/subscriptions/${activeReqId}/reject`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ adminNotes: 'Cannot reject approved' })
  });
  assert(rejectAfterApproveRes.status === 400, 'Reject rejection of already approved request with 400', `Got HTTP ${rejectAfterApproveRes.status}: ${JSON.stringify(rejectAfterApproveRes.data)}`);

  // Summary
  console.log(`\n======================================================`);
  console.log(`🏁 TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
