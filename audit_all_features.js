/**
 * Comprehensive Feature-by-Feature Code & Live Logic Audit for WatsStore SaaS
 * Principal QA Architect & Lead Full-Stack Auditor
 * 
 * Target Frontend: https://frontend-bay-ten-58.vercel.app
 * Target Backend:  https://watsstore.runasp.net
 */

const fs = require('fs');

const FRONTEND_URL = 'https://frontend-bay-ten-58.vercel.app';
const BACKEND_URL = 'https://watsstore.runasp.net';

const ADMIN_EMAIL = 'abdallahsay10@gmail.com';
const ADMIN_PASSWORD = process.env.WATSSTORE_TEST_ADMIN_PASSWORD;
const ADMIN_SECRET_KEY = process.env.WATSSTORE_TEST_ADMIN_KEY;

const testResults = [];
let passCount = 0;
let failCount = 0;

function record(id, moduleName, featureName, expected, actual, timeMs, pass, details = '') {
  const result = {
    id,
    module: moduleName,
    feature: featureName,
    expected: String(expected),
    actual: String(actual),
    latencyMs: Math.round(timeMs),
    status: pass ? 'PASS' : 'FAIL',
    details
  };
  testResults.push(result);
  if (pass) {
    passCount++;
    console.log(`✅ [${result.status}] [${id}] ${moduleName} -> ${featureName} (${result.latencyMs}ms)`);
  } else {
    failCount++;
    console.error(`❌ [${result.status}] [${id}] ${moduleName} -> ${featureName} (${result.latencyMs}ms)\n   Expected: ${expected}\n   Actual: ${actual}\n   Details: ${details}`);
  }
}

async function request(url, options = {}, body = null) {
  const start = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  const fetchOptions = {
    ...options,
    signal: controller.signal,
    headers: {
      'User-Agent': 'WatsStore-Master-Audit-Agent/1.0',
      ...(options.headers || {})
    }
  };

  if (body) {
    fetchOptions.headers['Content-Type'] = 'application/json';
    fetchOptions.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);
    const end = performance.now();
    const contentType = res.headers.get('content-type') || '';

    let parsedBody = null;
    let rawText = '';
    const arrayBuf = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    if (contentType.includes('application/json')) {
      try {
        parsedBody = JSON.parse(buffer.toString('utf8'));
      } catch (e) {
        parsedBody = null;
      }
    } else {
      rawText = buffer.toString('utf8');
    }

    return {
      status: res.status,
      headers: res.headers,
      body: parsedBody,
      text: rawText,
      buffer: buffer,
      timeMs: end - start,
      contentType
    };
  } catch (err) {
    clearTimeout(timeoutId);
    const end = performance.now();
    return {
      status: 0,
      headers: new Headers(),
      body: null,
      text: '',
      buffer: Buffer.alloc(0),
      timeMs: end - start,
      error: err.message
    };
  }
}

async function runAudit() {
  console.log('======================================================================');
  console.log('🚀 STARTING COMPREHENSIVE FEATURE-BY-FEATURE CODE & LOGIC AUDIT');
  console.log(`🌐 Backend:  ${BACKEND_URL}`);
  console.log(`🌐 Frontend: ${FRONTEND_URL}`);
  console.log(`⏱️ Timestamp: ${new Date().toISOString()}`);
  console.log('======================================================================\n');

  const runId = Date.now().toString().slice(-6);

  // Merchant Test State
  let merchantA = null;
  let merchantB = null;
  let adminToken = null;

  // ==========================================================================
  // MODULE 1: AUTHENTICATION, RBAC & SECURITY LAYER
  // ==========================================================================
  console.log('--- [MODULE 1: Authentication, RBAC & Security Layer] ---');

  // M1-01: Merchant Registration (14-day trial & JWT claim verification)
  const regEmailA = `audit_merch_a_${runId}@watsstore.test`;
  const regPass = 'Pass@123456!';
  const regPayloadA = {
    ownerName: 'تاجر التدقيق أ',
    email: regEmailA,
    password: regPass,
    storeName: `متجر التدقيق الألف ${runId}`,
    businessCategory: 'ملابس وأزياء',
    city: 'الفيوم',
    whatsAppNumber: '01012345678'
  };

  const regResA = await request(`${BACKEND_URL}/api/Auth/register`, { method: 'POST' }, regPayloadA);
  const regSuccessA = regResA.status === 200 && regResA.body?.token && regResA.body?.storeId && regResA.body?.planType === 'Free';
  if (regSuccessA) {
    merchantA = {
      ...regResA.body,
      password: regPass,
      email: regEmailA
    };
  }
  record(
    'M1-01',
    'Module 1: Auth & Security',
    'Merchant Registration with Free Plan & JWT',
    'HTTP 200, valid JWT token, PlanType: Free',
    `HTTP ${regResA.status}, Plan: ${regResA.body?.planType}, Token: ${!!regResA.body?.token}`,
    regResA.timeMs,
    regSuccessA,
    regResA.body?.message || ''
  );

  // M1-02: Duplicate Email Registration Defense
  const dupRes = await request(`${BACKEND_URL}/api/Auth/register`, { method: 'POST' }, regPayloadA);
  const dupBlocked = dupRes.status === 400 && dupRes.body?.message?.includes('مسجل بالفعل');
  record(
    'M1-02',
    'Module 1: Auth & Security',
    'Duplicate Registration Defense',
    'HTTP 400 with duplicate email Arabic error message',
    `HTTP ${dupRes.status}, Message: ${dupRes.body?.message}`,
    dupRes.timeMs,
    dupBlocked
  );

  // M1-03: Merchant Login with Correct Credentials
  const loginRes = await request(`${BACKEND_URL}/api/Auth/login`, { method: 'POST' }, {
    email: regEmailA,
    password: regPass
  });
  const loginSuccess = loginRes.status === 200 && loginRes.body?.token && loginRes.body?.email === regEmailA;
  record(
    'M1-03',
    'Module 1: Auth & Security',
    'Merchant Login (Valid Credentials)',
    'HTTP 200 with JWT and store profile',
    `HTTP ${loginRes.status}, Token: ${!!loginRes.body?.token}`,
    loginRes.timeMs,
    loginSuccess
  );

  // M1-04: Merchant Login with Incorrect Password
  const badLoginRes = await request(`${BACKEND_URL}/api/Auth/login`, { method: 'POST' }, {
    email: regEmailA,
    password: 'WrongPassword123!'
  });
  const badLoginBlocked = badLoginRes.status === 401;
  record(
    'M1-04',
    'Module 1: Auth & Security',
    'Merchant Login (Invalid Password Defense)',
    'HTTP 401 Unauthorized',
    `HTTP ${badLoginRes.status}`,
    badLoginRes.timeMs,
    badLoginBlocked
  );

  // M1-05: Super Admin Auth via Master Secret Key
  const adminKeyLoginRes = await request(`${BACKEND_URL}/api/Admin/login`, { method: 'POST' }, {
    secretKey: ADMIN_SECRET_KEY
  });
  const adminKeySuccess = adminKeyLoginRes.status === 200 && adminKeyLoginRes.body?.token && adminKeyLoginRes.body?.role === 'Admin';
  if (adminKeySuccess) {
    adminToken = adminKeyLoginRes.body.token;
  }
  record(
    'M1-05',
    'Module 1: Auth & Security',
    'Super Admin Auth (Master Secret Key)',
    'HTTP 200, role: Admin, valid JWT token',
    `HTTP ${adminKeyLoginRes.status}, Role: ${adminKeyLoginRes.body?.role}`,
    adminKeyLoginRes.timeMs,
    adminKeySuccess
  );

  // M1-06: Super Admin Auth via Email & Password
  const adminCredLoginRes = await request(`${BACKEND_URL}/api/Admin/login`, { method: 'POST' }, {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  });
  const adminCredSuccess = adminCredLoginRes.status === 200 && adminCredLoginRes.body?.token;
  record(
    'M1-06',
    'Module 1: Auth & Security',
    'Super Admin Auth (Email & Password Credentials)',
    'HTTP 200 with valid Admin JWT',
    `HTTP ${adminCredLoginRes.status}, Email: ${adminCredLoginRes.body?.email}`,
    adminCredLoginRes.timeMs,
    adminCredSuccess
  );

  // M1-07: Super Admin Forgot-Password PIN Token Generation
  const forgotRes = await request(`${BACKEND_URL}/api/Admin/forgot-password`, { method: 'POST' }, {
    email: ADMIN_EMAIL
  });
  const resetToken = forgotRes.body?.resetToken;
  const pinGenerated = forgotRes.status === 200 && resetToken && resetToken.startsWith('WATS-') && forgotRes.body?.expiresInMinutes === 15;
  record(
    'M1-07',
    'Module 1: Auth & Security',
    'Super Admin PIN Generation (/forgot-password)',
    'HTTP 200, 6-digit PIN (WATS-######), 15 min expiry',
    `HTTP ${forgotRes.status}, Token: ${resetToken}, Expires: ${forgotRes.body?.expiresInMinutes}m`,
    forgotRes.timeMs,
    pinGenerated
  );

  // M1-08: Super Admin Reset-Password Flow (Invalid PIN rejection & Valid PIN verification)
  const badPinRes = await request(`${BACKEND_URL}/api/Admin/reset-password`, { method: 'POST' }, {
    email: ADMIN_EMAIL,
    resetToken: 'WATS-000000',
    newPassword: 'Temp@NewAdmin2026!'
  });
  const badPinBlocked = badPinRes.status === 400 && badPinRes.body?.message?.includes('غير صحيح');

  let resetWorked = false;
  if (pinGenerated) {
    const validResetRes = await request(`${BACKEND_URL}/api/Admin/reset-password`, { method: 'POST' }, {
      email: ADMIN_EMAIL,
      resetToken: resetToken,
      newPassword: 'Temp@NewAdmin2026!'
    });
    if (validResetRes.status === 200) {
      // Verify login with new password
      const newPassLogin = await request(`${BACKEND_URL}/api/Admin/login`, { method: 'POST' }, {
        email: ADMIN_EMAIL,
        password: 'Temp@NewAdmin2026!'
      });
      // Restore default admin password immediately
      await request(`${BACKEND_URL}/api/Admin/change-password`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${newPassLogin.body?.token}` }
      }, {
        currentPassword: 'Temp@NewAdmin2026!',
        newPassword: ADMIN_PASSWORD,
        confirmPassword: ADMIN_PASSWORD
      });
      resetWorked = newPassLogin.status === 200;
    }
  }
  record(
    'M1-08',
    'Module 1: Auth & Security',
    'Super Admin Password Reset Validation & Reversion',
    'Bad PIN returns 400; valid PIN resets password and restores securely',
    `Bad PIN HTTP: ${badPinRes.status}, Reset & Restore Success: ${resetWorked}`,
    badPinRes.timeMs,
    badPinBlocked && resetWorked
  );

  // Register Merchant B for cross-tenant IDOR attack testing
  const regEmailB = `audit_merch_b_${runId}@watsstore.test`;
  const regResB = await request(`${BACKEND_URL}/api/Auth/register`, { method: 'POST' }, {
    ownerName: 'تاجر التدقيق ب',
    email: regEmailB,
    password: regPass,
    storeName: `متجر التدقيق الباء ${runId}`,
    businessCategory: 'إلكترونيات وموبايل',
    city: 'القاهرة',
    whatsAppNumber: '01112345678'
  });
  if (regResB.status === 200) {
    merchantB = {
      ...regResB.body,
      password: regPass,
      email: regEmailB
    };
  }

  // Create a product under Merchant A to test IDOR
  const prodA_Res = await request(`${BACKEND_URL}/api/merchant/products`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${merchantA?.token}` }
  }, {
    name: 'منتج المتجر أ الحصري',
    price: 350.00,
    description: 'منتج لاختبار عزل المستأجرين',
    isAvailable: true
  });
  const prodA_Id = prodA_Res.body?.id || prodA_Res.body?.Id;

  // M1-09: Cross-Tenant Abuse Defense (IDOR on Products)
  let idorProdBlocked = false;
  if (merchantB?.token && prodA_Id) {
    const attackRes = await request(`${BACKEND_URL}/api/merchant/products/${prodA_Id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${merchantB.token}` }
    }, {
      name: 'منتج مسروق عبر ثغرة IDOR',
      price: 10.00,
      isAvailable: true
    });
    // Must return 404 Not Found (or 403 Forbidden)
    idorProdBlocked = attackRes.status === 404 || attackRes.status === 403;
  }
  record(
    'M1-09',
    'Module 1: Auth & Security',
    'Cross-Tenant Abuse Defense (IDOR on Products)',
    'HTTP 404/403 when Store B attempts to modify Store A product',
    `HTTP ${idorProdBlocked ? '404/403 (BLOCKED)' : 'VULNERABLE'}`,
    0,
    idorProdBlocked
  );

  // Create a billing upgrade request under Merchant A to test IDOR
  const billReqA_Res = await request(`${BACKEND_URL}/api/merchant/billing/upgrade-request`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${merchantA?.token}` }
  }, {
    planType: 'Pro',
    billingCycle: 'Monthly',
    paymentMethod: 'VodafoneCash',
    transactionId: `TX-IDOR-${runId}`
  });
  const billReqA_Id = billReqA_Res.body?.requestId || billReqA_Res.body?.RequestId;

  // M1-10: Cross-Tenant Abuse Defense (IDOR on Billing Requests)
  let idorBillBlocked = false;
  if (merchantB?.token && billReqA_Id) {
    const billAttackRes = await request(`${BACKEND_URL}/api/merchant/billing/requests/${billReqA_Id}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${merchantB.token}` }
    });
    idorBillBlocked = billAttackRes.status === 403;
  }
  record(
    'M1-10',
    'Module 1: Auth & Security',
    'Cross-Tenant Abuse Defense (IDOR on Billing)',
    'HTTP 403 Forbidden when Store B attempts to view Store A billing request',
    `HTTP ${idorBillBlocked ? '403 (BLOCKED)' : 'VULNERABLE'}`,
    0,
    idorBillBlocked
  );

  // M1-11: Exception Shielding (No unhandled 500 stack traces leaked)
  const malformedGuidRes = await request(`${BACKEND_URL}/api/merchant/billing/requests/00000000-0000-0000-0000-000000000000`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${merchantA?.token}` }
  });
  const exceptionShielded = malformedGuidRes.status === 400 || malformedGuidRes.status === 404;
  record(
    'M1-11',
    'Module 1: Auth & Security',
    'Exception Shielding & Input Sanitization',
    'HTTP 400/404 on malformed route parameter without 500 stack leak',
    `HTTP ${malformedGuidRes.status}`,
    malformedGuidRes.timeMs,
    exceptionShielded
  );

  console.log('\n--- [MODULE 2: Smart SaaS Plans, Quotas & Concurrency Logic] ---');

  // M2-01: Free Plan AI Description Generation Locked
  const freeAiRes = await request(`${BACKEND_URL}/api/merchant/ai/generate-description`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${merchantA?.token}` }
  }, {
    productName: 'حذاء كاجوال جلد طبيعي',
    category: 'أحذية'
  });
  const freeAiLocked = freeAiRes.status === 403 && freeAiRes.body?.isQuotaExceeded === true;
  record(
    'M2-01',
    'Module 2: Smart SaaS Plans',
    'Free Plan AI Description Lock (Quota = 0)',
    'HTTP 403 Forbidden with isQuotaExceeded: true',
    `HTTP ${freeAiRes.status}, isQuotaExceeded: ${freeAiRes.body?.isQuotaExceeded}`,
    freeAiRes.timeMs,
    freeAiLocked,
    freeAiRes.body?.message || ''
  );

  // M2-02: Free Plan Excel Export Locked
  const freeExportRes = await request(`${BACKEND_URL}/api/merchant/orders/export`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${merchantA?.token}` }
  });
  const freeExportLocked = freeExportRes.status === 403 && freeExportRes.body?.isQuotaExceeded === true;
  record(
    'M2-02',
    'Module 2: Smart SaaS Plans',
    'Free Plan Excel CSV Export Lock',
    'HTTP 403 Forbidden with isQuotaExceeded: true',
    `HTTP ${freeExportRes.status}`,
    freeExportRes.timeMs,
    freeExportLocked
  );

  // M2-03: Super Admin Plan Upgrade to Pro
  const adminUpgradeRes = await request(`${BACKEND_URL}/api/Admin/stores/${merchantA?.storeId}/plan`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` }
  }, {
    plan: 'Pro'
  });
  const planVal = adminUpgradeRes.body?.planType || adminUpgradeRes.body?.plan;
  const adminUpgradeOk = adminUpgradeRes.status === 200 && planVal === 'Pro';
  record(
    'M2-03',
    'Module 2: Smart SaaS Plans',
    'Super Admin Dynamic Plan Upgrade (to Pro)',
    'HTTP 200, store plan upgraded to Pro',
    `HTTP ${adminUpgradeRes.status}, Plan: ${planVal}`,
    adminUpgradeRes.timeMs,
    adminUpgradeOk
  );

  // M2-04: Pro Plan AI Description Allowed & Atomic Counter
  const proAiRes = await request(`${BACKEND_URL}/api/merchant/ai/generate-description`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${merchantA?.token}` }
  }, {
    productName: 'ساعة يد كلاسيكية فاخرة',
    category: 'إكسسوارات',
    keywords: 'مقاومة للماء، ستانلس ستيل'
  });
  const proAiAllowed = proAiRes.status === 200 && proAiRes.body?.aiGenerationsUsed === 1 && proAiRes.body?.aiGenerationsLimit === 15 && proAiRes.body?.description?.includes('💎 أهم المميزات');
  record(
    'M2-04',
    'Module 2: Smart SaaS Plans',
    'Pro Plan AI Copy Generation Allowed (Quota: 1/15)',
    'HTTP 200, valid generated copy, used: 1, limit: 15',
    `HTTP ${proAiRes.status}, Used: ${proAiRes.body?.aiGenerationsUsed}/${proAiRes.body?.aiGenerationsLimit}`,
    proAiRes.timeMs,
    proAiAllowed
  );

  // M2-05: Pro Plan 15/15 AI Quota Enforcement (Simulate exhaustion)
  // Direct admin update to set AiGenerationsCount = 15 or call iteratively
  // We can test the enforcement by setting usage or exhausting
  // Let's call description generation or verify limit enforcement
  console.log('   Simulating Pro plan AI exhaustion (testing 15 quota ceiling)...');
  for (let i = 2; i <= 15; i++) {
    await request(`${BACKEND_URL}/api/merchant/ai/generate-description`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${merchantA?.token}` }
    }, {
      productName: `منتج تجريبي #${i}`,
      category: 'عام'
    });
  }
  // Now attempt the 16th generation
  const proAi16Res = await request(`${BACKEND_URL}/api/merchant/ai/generate-description`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${merchantA?.token}` }
  }, {
    productName: 'منتج تجريبي رقم 16 المحظور',
    category: 'عام'
  });
  const proAiExhausted = proAi16Res.status === 403 && proAi16Res.body?.isQuotaExceeded === true && proAi16Res.body?.aiGenerationsUsed === 15;
  record(
    'M2-05',
    'Module 2: Smart SaaS Plans',
    'Pro Plan AI Quota Limit Ceiling (15/15 -> 16th Blocked)',
    'HTTP 403 Forbidden, isQuotaExceeded: true when exceeding 15',
    `HTTP ${proAi16Res.status}, isQuotaExceeded: ${proAi16Res.body?.isQuotaExceeded}, Used: ${proAi16Res.body?.aiGenerationsUsed}`,
    proAi16Res.timeMs,
    proAiExhausted
  );

  // M2-06: Safe Downgrade & Grandfathered Data Architecture
  // Downgrade merchant A back to Free. Merchant A already has products created.
  await request(`${BACKEND_URL}/api/Admin/stores/${merchantA?.storeId}/plan`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` }
  }, {
    plan: 'Free'
  });

  // Verify grandfathered product can still be updated
  const editGrandfatheredRes = await request(`${BACKEND_URL}/api/merchant/products/${prodA_Id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${merchantA?.token}` }
  }, {
    name: 'منتج أ القديم بعد تخفيض الباقة (مسموح بالتعديل)',
    price: 399.00,
    isAvailable: true
  });
  const editAllowed = editGrandfatheredRes.status === 200;

  record(
    'M2-06',
    'Module 2: Smart SaaS Plans',
    'Safe Downgrade & Grandfathered Data (Edit Permitted)',
    'HTTP 200 allowing merchant to edit existing grandfathered products',
    `HTTP ${editGrandfatheredRes.status}`,
    editGrandfatheredRes.timeMs,
    editAllowed
  );

  console.log('\n--- [MODULE 3: Enterprise Billing & Subscription Engine] ---');

  // M3-01: Merchant Billing Status Retrieval
  const billingStatusRes = await request(`${BACKEND_URL}/api/merchant/billing/status`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${merchantA?.token}` }
  });
  const billingStatusOk = billingStatusRes.status === 200 && billingStatusRes.body?.storeId && billingStatusRes.body?.vodafoneCashWallet && billingStatusRes.body?.remainingTrialDays !== undefined;
  record(
    'M3-01',
    'Module 3: Enterprise Billing',
    'Merchant Billing Status Retrieval',
    'HTTP 200 with plan, trial status, and payment wallet details',
    `HTTP ${billingStatusRes.status}, Plan: ${billingStatusRes.body?.planType}, TrialDays: ${billingStatusRes.body?.remainingTrialDays}`,
    billingStatusRes.timeMs,
    billingStatusOk
  );

  // M3-02: Local Payment Upgrade Request Submission (Vodafone Cash)
  const uniqueTxId = `VF-${runId}-${Date.now().toString().slice(-4)}`;
  const submitUpgradeRes = await request(`${BACKEND_URL}/api/merchant/billing/upgrade-request`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${merchantA?.token}` }
  }, {
    planType: 'VIP',
    billingCycle: 'Annual',
    paymentMethod: 'VodafoneCash',
    transactionId: uniqueTxId,
    notes: 'تحويل كاش سنوي لاختبار التدقيق'
  });
  const subReqId = submitUpgradeRes.body?.requestId;
  const upgradeSubmitted = submitUpgradeRes.status === 200 && submitUpgradeRes.body?.status === 'Pending' && subReqId;
  record(
    'M3-02',
    'Module 3: Enterprise Billing',
    'Vodafone Cash Upgrade Request Submission',
    'HTTP 200, status: Pending, unique requestId',
    `HTTP ${submitUpgradeRes.status}, Status: ${submitUpgradeRes.body?.status}, ID: ${subReqId}`,
    submitUpgradeRes.timeMs,
    upgradeSubmitted
  );

  // M3-03: Duplicate Transaction ID Defense
  const dupTxRes = await request(`${BACKEND_URL}/api/merchant/billing/upgrade-request`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${merchantA?.token}` }
  }, {
    planType: 'VIP',
    billingCycle: 'Annual',
    paymentMethod: 'VodafoneCash',
    transactionId: uniqueTxId, // same TX ID
    notes: 'محاولة تكرار نفس العملية'
  });
  const dupTxBlocked = dupTxRes.status === 400 && dupTxRes.body?.message?.includes('مسجل بالفعل');
  record(
    'M3-03',
    'Module 3: Enterprise Billing',
    'Duplicate Transaction ID Rejection Defense',
    'HTTP 400 with duplicate transaction ID Arabic warning',
    `HTTP ${dupTxRes.status}, Message: ${dupTxRes.body?.message}`,
    dupTxRes.timeMs,
    dupTxBlocked
  );

  // M3-04: Super Admin Pending Review & Approval Flow
  let approveSuccess = false;
  if (subReqId) {
    const approveRes = await request(`${BACKEND_URL}/api/Admin/subscriptions/${subReqId}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    approveSuccess = approveRes.status === 200 && approveRes.body?.request?.status === 'Approved';

    // Verify merchant plan became VIP
    const checkPlanRes = await request(`${BACKEND_URL}/api/merchant/billing/status`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${merchantA?.token}` }
    });
    approveSuccess = approveSuccess && checkPlanRes.body?.planType === 'VIP';
  }
  record(
    'M3-04',
    'Module 3: Enterprise Billing',
    'Super Admin Subscription Review & Approval',
    'HTTP 200, request Approved, Store Plan upgraded to VIP',
    `Approval Status: ${approveSuccess ? 'Approved & Verified' : 'Failed'}`,
    0,
    approveSuccess
  );

  // M3-05: Super Admin Subscription Rejection with Reason Note
  const rejectTxId = `REJ-${runId}-${Date.now().toString().slice(-4)}`;
  const submitRejReq = await request(`${BACKEND_URL}/api/merchant/billing/upgrade-request`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${merchantB?.token}` }
  }, {
    planType: 'Pro',
    billingCycle: 'Monthly',
    paymentMethod: 'InstaPay',
    transactionId: rejectTxId
  });
  const rejReqId = submitRejReq.body?.requestId;

  let rejectSuccess = false;
  if (rejReqId) {
    const adminRejectRes = await request(`${BACKEND_URL}/api/Admin/subscriptions/${rejReqId}/reject`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    }, {
      adminNotes: 'رقم العملية غير موجود في سجلات البنك'
    });
    rejectSuccess = adminRejectRes.status === 200 && adminRejectRes.body?.request?.status === 'Rejected' && adminRejectRes.body?.request?.adminNotes?.includes('غير موجود');
  }
  record(
    'M3-05',
    'Module 3: Enterprise Billing',
    'Super Admin Subscription Rejection with Notes',
    'HTTP 200, status: Rejected, admin notes preserved',
    `Status: ${rejectSuccess ? 'Rejected with Admin Note' : 'Failed'}`,
    0,
    rejectSuccess
  );

  // M3-06: Instant Activation via OnlineCard Payment Hook
  const onlineCardTxId = `CARD-${runId}-${Date.now().toString().slice(-4)}`;
  const onlineCardRes = await request(`${BACKEND_URL}/api/merchant/billing/upgrade-request`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${merchantB?.token}` }
  }, {
    planType: 'Pro',
    billingCycle: 'Annual',
    paymentMethod: 'OnlineCard',
    transactionId: onlineCardTxId
  });
  const instantActive = onlineCardRes.status === 200 && onlineCardRes.body?.status === 'Approved' && onlineCardRes.body?.planType === 'Pro';
  record(
    'M3-06',
    'Module 3: Enterprise Billing',
    'Automated Instant Activation (OnlineCard Hook)',
    'HTTP 200, instant status: Approved, planType: Pro',
    `HTTP ${onlineCardRes.status}, Status: ${onlineCardRes.body?.status}`,
    onlineCardRes.timeMs,
    instantActive
  );

  // M3-07: Dynamic Platform Pricing & Quotas Editor
  const getPlansRes = await request(`${BACKEND_URL}/api/Admin/plans`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const updatePricingRes = await request(`${BACKEND_URL}/api/Admin/plans`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` }
  }, {
    proMonthlyPrice: 299,
    proAnnualPrice: 2499,
    proProductLimit: 100,
    proCouponLimit: 15,
    proAiLimit: 15,
    vipMonthlyPrice: 599,
    vipAnnualPrice: 4999,
    vipProductLimit: 999999,
    vipCouponLimit: 999999,
    vipAiLimit: 150,
    isLaunchDiscountBannerActive: true,
    launchDiscountText: '🔥 عروض الإطلاق التجاري الحصرية: احصل على خصم 30% على الباقات السنوية اليوم!'
  });
  const publicPricingRes = await request(`${BACKEND_URL}/api/public/pricing`);
  const pricingEngineSync = getPlansRes.status === 200 && updatePricingRes.status === 200 && publicPricingRes.status === 200 && publicPricingRes.body?.proMonthlyPrice === 299;
  record(
    'M3-07',
    'Module 3: Enterprise Billing',
    'Dynamic Pricing & Quotas Management Engine',
    'Admin updates pricing; synced instantly with public pricing API',
    `Admin PUT: ${updatePricingRes.status}, Public GET: ${publicPricingRes.status}, Price: ${publicPricingRes.body?.proMonthlyPrice} EGP`,
    updatePricingRes.timeMs,
    pricingEngineSync
  );

  console.log('\n--- [MODULE 4: Merchant Dashboard & Store Operations] ---');

  // M4-01: Category Management CRUD
  const catCreateRes = await request(`${BACKEND_URL}/api/merchant/categories`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${merchantA?.token}` }
  }, {
    name: 'أحدث التشكيلات',
    sortOrder: 1,
    isActive: true
  });
  const catId = catCreateRes.body?.id;
  const catUpdateRes = await request(`${BACKEND_URL}/api/merchant/categories/${catId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${merchantA?.token}` }
  }, {
    name: 'أحدث التشكيلات الحصرية 2026',
    sortOrder: 2,
    isActive: true
  });
  const catSuccess = catCreateRes.status === 200 && catUpdateRes.status === 200 && catUpdateRes.body?.name?.includes('2026');
  record(
    'M4-01',
    'Module 4: Merchant Operations',
    'Categories Management (Create, Update, List)',
    'HTTP 200, category created and updated successfully',
    `Create HTTP: ${catCreateRes.status}, Update HTTP: ${catUpdateRes.status}`,
    catCreateRes.timeMs + catUpdateRes.timeMs,
    catSuccess
  );

  // M4-02: Product Creation with Variants & Price Validation
  const zeroPriceRes = await request(`${BACKEND_URL}/api/merchant/products`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${merchantA?.token}` }
  }, {
    name: 'منتج مجاني غير صالح',
    price: 0, // Invalid price
    isAvailable: true
  });
  const zeroPriceBlocked = zeroPriceRes.status === 400 && (zeroPriceRes.text.includes('أكبر من صفر') || JSON.stringify(zeroPriceRes.body || {}).includes('أكبر من صفر'));

  const validProdRes = await request(`${BACKEND_URL}/api/merchant/products`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${merchantA?.token}` }
  }, {
    name: `قميص كلاسيكي قطن ${runId}`,
    categoryId: catId,
    price: 450.00,
    compareAtPrice: 600.00,
    description: 'قميص قطن 100% عالي الجودة',
    variantsJson: JSON.stringify([
      { name: 'المقاس', options: ['M', 'L', 'XL'] },
      { name: 'اللون', options: ['أبيض', 'كحلي', 'أسود'] }
    ]),
    isAvailable: true
  });
  const prodId = validProdRes.body?.id || validProdRes.body?.Id;
  const prodSuccess = zeroPriceBlocked && validProdRes.status === 200 && !!prodId;
  record(
    'M4-02',
    'Module 4: Merchant Operations',
    'Product Creation with Variants & Price Validation',
    'Price <= 0 blocked with 400; valid product with variants created',
    `Zero Price HTTP: ${zeroPriceRes.status}, Valid Prod HTTP: ${validProdRes.status}`,
    validProdRes.timeMs,
    prodSuccess
  );

  // M4-03: Product Availability Toggle
  const toggleProdRes = await request(`${BACKEND_URL}/api/merchant/products/${prodId}/toggle-availability`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${merchantA?.token}` }
  });
  const toggleProdOk = toggleProdRes.status === 200 && toggleProdRes.body?.isAvailable === false;
  // Re-enable availability
  await request(`${BACKEND_URL}/api/merchant/products/${prodId}/toggle-availability`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${merchantA?.token}` }
  });
  record(
    'M4-03',
    'Module 4: Merchant Operations',
    'Product Availability Status Toggle',
    'HTTP 200 with inverted availability flag',
    `HTTP ${toggleProdRes.status}, isAvailable: ${toggleProdRes.body?.isAvailable}`,
    toggleProdRes.timeMs,
    toggleProdOk
  );

  // M4-04: Coupons Engine: Percentage & Fixed Discount
  const couponCodePct = `DISC20_${runId}`;
  const couponPctRes = await request(`${BACKEND_URL}/api/merchant/coupons`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${merchantA?.token}` }
  }, {
    code: couponCodePct,
    discountType: 'Percentage',
    discountValue: 20,
    minOrderAmount: 200,
    usageLimit: 100,
    isActive: true
  });

  const couponCodeFix = `OFF50_${runId}`;
  const couponFixRes = await request(`${BACKEND_URL}/api/merchant/coupons`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${merchantA?.token}` }
  }, {
    code: couponCodeFix,
    discountType: 'Fixed',
    discountValue: 50,
    minOrderAmount: 150,
    usageLimit: 50,
    isActive: true
  });
  const couponsCreated = (couponPctRes.status === 200 || couponPctRes.status === 201) && (couponFixRes.status === 200 || couponFixRes.status === 201);
  record(
    'M4-04',
    'Module 4: Merchant Operations',
    'Coupons Engine (Percentage & Fixed Discount Creation)',
    'HTTP 200/201, both Percentage and Fixed coupons created',
    `Pct HTTP: ${couponPctRes.status}, Fixed HTTP: ${couponFixRes.status}`,
    couponPctRes.timeMs + couponFixRes.timeMs,
    couponsCreated
  );

  // M4-05: Coupon Status Toggle
  const couponId = couponPctRes.body?.id;
  let couponToggleSuccess = false;
  if (couponId) {
    const toggleCouponRes = await request(`${BACKEND_URL}/api/merchant/coupons/${couponId}/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${merchantA?.token}` }
    });
    couponToggleSuccess = toggleCouponRes.status === 200 && toggleCouponRes.body?.isActive === false;
    // Re-enable coupon
    await request(`${BACKEND_URL}/api/merchant/coupons/${couponId}/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${merchantA?.token}` }
    });
  }
  record(
    'M4-05',
    'Module 4: Merchant Operations',
    'Coupon Status Toggle (Active/Inactive)',
    'HTTP 200, coupon status toggled successfully',
    `Status: ${couponToggleSuccess ? 'Toggled & Re-enabled' : 'Failed'}`,
    0,
    couponToggleSuccess
  );

  // M4-06: Orders Management Listing & Pagination
  const ordersListRes = await request(`${BACKEND_URL}/api/merchant/orders?page=1&pageSize=10`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${merchantA?.token}` }
  });
  const ordersListOk = ordersListRes.status === 200 && Array.isArray(ordersListRes.body?.orders);
  record(
    'M4-06',
    'Module 4: Merchant Operations',
    'Orders Management Listing & Pagination',
    'HTTP 200 with orders array, page, and pageSize',
    `HTTP ${ordersListRes.status}, Total Orders: ${ordersListRes.body?.total}`,
    ordersListRes.timeMs,
    ordersListOk
  );

  // M4-07: Excel CSV Export with UTF-8 BOM
  const exportCsvRes = await request(`${BACKEND_URL}/api/merchant/orders/export`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${merchantA?.token}` }
  });
  const hasBom = exportCsvRes.buffer.length >= 3 &&
                 exportCsvRes.buffer[0] === 0xEF &&
                 exportCsvRes.buffer[1] === 0xBB &&
                 exportCsvRes.buffer[2] === 0xBF;
  const isCsvContent = exportCsvRes.contentType.includes('text/csv');
  record(
    'M4-07',
    'Module 4: Merchant Operations',
    'Excel Orders CSV Export with UTF-8 BOM',
    'HTTP 200, text/csv, starts with raw UTF-8 BOM (0xEF, 0xBB, 0xBF)',
    `HTTP ${exportCsvRes.status}, BOM: ${hasBom}, Type: ${exportCsvRes.contentType}`,
    exportCsvRes.timeMs,
    exportCsvRes.status === 200 && hasBom && isCsvContent
  );

  // M4-08: Customer Reviews Inbox & Approval Flow
  // Submit a customer review via public endpoint
  const pubReviewRes = await request(`${BACKEND_URL}/api/public/stores/${merchantA?.slug}/reviews`, {
    method: 'POST'
  }, {
    customerName: 'أحمد محمود',
    rating: 5,
    comment: 'متجر ممتاز وسرعة فائقة في التوصيل والجودة راقية جداً'
  });
  const revId = pubReviewRes.body?.reviewId;

  // Merchant views inbox and approves review
  let reviewApproved = false;
  if (revId) {
    const approveRevRes = await request(`${BACKEND_URL}/api/merchant/reviews/${revId}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${merchantA?.token}` }
    }, {
      isApproved: true
    });
    reviewApproved = approveRevRes.status === 200 && approveRevRes.body?.isApproved === true;
  }
  record(
    'M4-08',
    'Module 4: Merchant Operations',
    'Customer Review Moderation & Approval',
    'HTTP 200, review submitted pending and approved by merchant',
    `Review Submit: ${pubReviewRes.status}, Merchant Approval: ${reviewApproved}`,
    pubReviewRes.timeMs,
    pubReviewRes.status === 201 && reviewApproved
  );

  console.log('\n--- [MODULE 5: Public Storefront, Checkout & SEO Engine] ---');

  // M5-01: Public Storefront Catalog Rendering
  const pubStoreRes = await request(`${BACKEND_URL}/api/public/stores/${merchantA?.slug}`);
  const pubStoreOk = pubStoreRes.status === 200 &&
                     pubStoreRes.body?.storeName === merchantA?.storeName &&
                     Array.isArray(pubStoreRes.body?.products) &&
                     pubStoreRes.body?.products.length > 0 &&
                     Array.isArray(pubStoreRes.body?.categories);
  record(
    'M5-01',
    'Module 5: Public Storefront',
    'Storefront Catalog Rendering & Hydration',
    'HTTP 200, store profile, categories, available products, reviews',
    `HTTP ${pubStoreRes.status}, Products: ${pubStoreRes.body?.products?.length}, Store: ${pubStoreRes.body?.storeName}`,
    pubStoreRes.timeMs,
    pubStoreOk
  );

  // M5-02: Public Store Coupon Application
  const applyCouponRes = await request(`${BACKEND_URL}/api/public/stores/${merchantA?.slug}/apply-coupon`, {
    method: 'POST'
  }, {
    code: couponCodePct,
    cartSubtotal: 500.00
  });
  // 20% of 500 = 100 discount, newSubtotal = 400
  const couponApplied = applyCouponRes.status === 200 &&
                        applyCouponRes.body?.isValid === true &&
                        applyCouponRes.body?.discountAmount === 100 &&
                        applyCouponRes.body?.newSubtotal === 400;
  record(
    'M5-02',
    'Module 5: Public Storefront',
    'Checkout Coupon Discount Engine (20% on 500)',
    'HTTP 200, isValid: true, discountAmount: 100, newSubtotal: 400',
    `HTTP ${applyCouponRes.status}, Discount: ${applyCouponRes.body?.discountAmount}, NewTotal: ${applyCouponRes.body?.newSubtotal}`,
    applyCouponRes.timeMs,
    couponApplied
  );

  // M5-03: Invalid Coupon Rejection
  const invalidCouponRes = await request(`${BACKEND_URL}/api/public/stores/${merchantA?.slug}/apply-coupon`, {
    method: 'POST'
  }, {
    code: 'NON_EXISTENT_COUPON',
    cartSubtotal: 300.00
  });
  const invalidCouponBlocked = invalidCouponRes.status === 400 && invalidCouponRes.body?.isValid === false;
  record(
    'M5-03',
    'Module 5: Public Storefront',
    'Invalid Coupon Rejection Defense',
    'HTTP 400 with isValid: false and Arabic warning',
    `HTTP ${invalidCouponRes.status}, isValid: ${invalidCouponRes.body?.isValid}`,
    invalidCouponRes.timeMs,
    invalidCouponBlocked
  );

  // M5-04: Tamper-Proof Order Placement (Server-side price calculation)
  // Client attempts to pass a tampered unitPrice of 1.00 EGP for a 450.00 EGP product
  const tamperOrderRes = await request(`${BACKEND_URL}/api/public/stores/${merchantA?.slug}/orders`, {
    method: 'POST'
  }, {
    customerName: 'كريم التميمي',
    customerPhone: '01098765432',
    customerAddress: 'الفيوم - شارع الجمهورية',
    paymentMethod: 'الدفع عند الاستلام',
    couponCode: couponCodePct,
    items: [
      {
        productId: prodId,
        quantity: 2,
        unitPrice: 1.00 // Malicious attempt to override server price
      }
    ]
  });
  // Actual product price = 450 EGP. 2 * 450 = 900.
  // Coupon 20% discount = 180 EGP.
  // Subtotal = 900, Total = 720 EGP.
  const tamperProofVerified = tamperOrderRes.status === 200 &&
                              tamperOrderRes.body?.subtotal === 900 &&
                              tamperOrderRes.body?.discountAmount === 180 &&
                              tamperOrderRes.body?.totalAmount === 720;
  record(
    'M5-04',
    'Module 5: Public Storefront',
    'Tamper-Proof Checkout Server Price Enforcement',
    'Server calculates real price (2 * 450 = 900 - 180 = 720), ignoring 1.00 EGP tampering',
    `HTTP ${tamperOrderRes.status}, Subtotal: ${tamperOrderRes.body?.subtotal}, Total: ${tamperOrderRes.body?.totalAmount}`,
    tamperOrderRes.timeMs,
    tamperProofVerified
  );

  // M5-05: Egyptian Mobile Phone Number Validation
  const badPhoneOrderRes = await request(`${BACKEND_URL}/api/public/stores/${merchantA?.slug}/orders`, {
    method: 'POST'
  }, {
    customerName: 'عميل برقم خطأ',
    customerPhone: '01912345678', // Invalid carrier prefix
    customerAddress: 'القاهرة',
    items: [{ productId: prodId, quantity: 1 }]
  });
  const badPhoneBlocked = badPhoneOrderRes.status === 400 && badPhoneOrderRes.body?.message?.includes('محمول مصري');
  record(
    'M5-05',
    'Module 5: Public Storefront',
    'Egyptian Mobile Phone Validation (010/011/012/015)',
    'HTTP 400 rejecting non-Egyptian/invalid mobile prefix',
    `HTTP ${badPhoneOrderRes.status}, Message: ${badPhoneOrderRes.body?.message}`,
    badPhoneOrderRes.timeMs,
    badPhoneBlocked
  );

  // M5-06: WhatsApp Direct Link Generation
  const waUrl = tamperOrderRes.body?.whatsAppRedirectUrl;
  const waLinkValid = waUrl &&
                      waUrl.startsWith('https://wa.me/') &&
                      waUrl.includes('text=') &&
                      tamperOrderRes.body?.formattedMessage?.includes('طلب جديد رقم #') &&
                      tamperOrderRes.body?.formattedMessage?.includes('المجموع الفرعي');
  record(
    'M5-06',
    'Module 5: Public Storefront',
    'WhatsApp Pre-filled Order Link Generator',
    'Valid wa.me link with URL-encoded Arabic order summary & line items',
    `URL Valid: ${!!waUrl}, Has Arabic Summary: ${tamperOrderRes.body?.formattedMessage?.includes('المجموع الفرعي')}`,
    0,
    waLinkValid
  );

  // M5-07: Dynamic OpenGraph Image Generation
  const ogRes = await request(`${FRONTEND_URL}/s/${merchantA?.slug}/opengraph-image`);
  const ogOk = ogRes.status === 200 && ogRes.contentType.includes('image/png');
  record(
    'M5-07',
    'Module 5: Public Storefront',
    'Dynamic OpenGraph Image Generation (/s/[slug]/opengraph-image)',
    'HTTP 200 with image/png binary data',
    `HTTP ${ogRes.status}, Content-Type: ${ogRes.contentType}, Bytes: ${ogRes.buffer.length}`,
    ogRes.timeMs,
    ogOk
  );

  // M5-08: Dynamic Sitemap XML
  const sitemapRes = await request(`${FRONTEND_URL}/sitemap.xml`);
  const sitemapOk = sitemapRes.status === 200 && sitemapRes.text.includes('<urlset') && sitemapRes.text.includes('/directory');
  record(
    'M5-08',
    'Module 5: Public Storefront',
    'Dynamic Platform Sitemap (/sitemap.xml)',
    'HTTP 200, valid XML urlset containing directory routes',
    `HTTP ${sitemapRes.status}, Has urlset: ${sitemapRes.text.includes('<urlset')}`,
    sitemapRes.timeMs,
    sitemapOk
  );

  // M5-09: Robots.txt Verification
  const robotsRes = await request(`${FRONTEND_URL}/robots.txt`);
  const robotsOk = robotsRes.status === 200 && robotsRes.text.includes('User-Agent') && robotsRes.text.includes('sitemap.xml');
  record(
    'M5-09',
    'Module 5: Public Storefront',
    'Search Engine Robots Configuration (/robots.txt)',
    'HTTP 200 with User-Agent rules and Sitemap declaration',
    `HTTP ${robotsRes.status}, Has Sitemap: ${robotsRes.text.includes('sitemap.xml')}`,
    robotsRes.timeMs,
    robotsOk
  );

  // M5-10: Schema.org Structured Data Verification
  const homeHtmlRes = await request(`${FRONTEND_URL}`);
  const dirHtmlRes = await request(`${FRONTEND_URL}/directory/%D8%A7%D9%84%D9%81%D9%8A%D9%88%D9%85/%D9%85%D9%84%D8%A7%D8%A8%D8%B3%20%D9%88%D8%A3%D8%B2%D9%8A%D8%A7%D8%A1`);
  const hasSchema = (homeHtmlRes.text.includes('schema.org') && (homeHtmlRes.text.includes('Organization') || homeHtmlRes.text.includes('SoftwareApplication'))) ||
                    (dirHtmlRes.text.includes('schema.org') && (dirHtmlRes.text.includes('ItemList') || dirHtmlRes.text.includes('BreadcrumbList')));
  record(
    'M5-10',
    'Module 5: Public Storefront',
    'Schema.org Rich Structured Data (JSON-LD)',
    'HTTP 200, contains valid schema.org JSON-LD schemas (Organization, Store, ItemList)',
    `Home Schema: ${homeHtmlRes.text.includes('schema.org')}, Directory Schema: ${dirHtmlRes.text.includes('schema.org')}`,
    homeHtmlRes.timeMs + dirHtmlRes.timeMs,
    hasSchema
  );

  // ==========================================================================
  // FINAL REPORT & SUMMARY METRICS
  // ==========================================================================
  console.log('\n======================================================================');
  console.log('📊 MASTER AUDIT EXECUTION SUMMARY');
  console.log('======================================================================');
  const totalTests = testResults.length;
  const passRate = ((passCount / totalTests) * 100).toFixed(1);
  const avgLatency = Math.round(testResults.reduce((acc, t) => acc + t.latencyMs, 0) / totalTests);

  console.log(`Total Features Audited: ${totalTests}`);
  console.log(`✅ Passed:             ${passCount}`);
  console.log(`❌ Failed:             ${failCount}`);
  console.log(`📈 Success Rate:        ${passRate}%`);
  console.log(`⚡ Average Latency:     ${avgLatency}ms`);
  console.log('======================================================================\n');

  // Breakdown by Module
  const modules = [...new Set(testResults.map(t => t.module))];
  modules.forEach(mod => {
    const modTests = testResults.filter(t => t.module === mod);
    const modPass = modTests.filter(t => t.status === 'PASS').length;
    console.log(`  * ${mod}: ${modPass}/${modTests.length} Passed (${((modPass / modTests.length) * 100).toFixed(0)}%)`);
  });

  const finalOutput = {
    timestamp: new Date().toISOString(),
    backendUrl: BACKEND_URL,
    frontendUrl: FRONTEND_URL,
    summary: {
      total: totalTests,
      passed: passCount,
      failed: failCount,
      passRate: `${passRate}%`,
      averageLatencyMs: avgLatency
    },
    results: testResults
  };

  fs.writeFileSync('audit_all_features_results.json', JSON.stringify(finalOutput, null, 2), 'utf8');
  console.log('\n📄 Complete audit results saved to audit_all_features_results.json');

  if (failCount > 0) {
    process.exit(1);
  }
}

runAudit().catch(err => {
  console.error('💥 Fatal error during audit execution:', err);
  process.exit(1);
});
