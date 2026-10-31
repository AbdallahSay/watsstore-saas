// Automated E2E Verification for WatsStore Smart Pricing Engine & Super Admin Pricing Management
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

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Starting Automated E2E Pricing & Admin Test Suite');
  console.log('====================================================');

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
    // 1. Test Public Pricing Endpoint
    console.log('\n--- 1. Testing GET /api/public/pricing ---');
    const pubRes = await request(`${BACKEND_URL}/api/public/pricing`);
    assert(pubRes.status === 200, `Public pricing returned HTTP ${pubRes.status}`);
    assert(pubRes.body.proMonthlyPrice !== undefined, 'proMonthlyPrice is present in response');
    assert(pubRes.body.vipMonthlyPrice !== undefined, 'vipMonthlyPrice is present in response');
    assert(pubRes.body.proProductLimit !== undefined, 'proProductLimit is present in response');
    assert(pubRes.body.isLaunchDiscountBannerActive !== undefined, 'isLaunchDiscountBannerActive is present in response');
    console.log('Current Public Pricing:', JSON.stringify(pubRes.body, null, 2));

    // 2. Test Super Admin Login
    console.log('\n--- 2. Testing Super Admin Login ---');
    const loginRes = await request(`${BACKEND_URL}/api/admin/login`, {
      method: 'POST'
    }, {
      email: 'abdallahsay10@gmail.com',
      password: process.env.WATSSTORE_TEST_ADMIN_PASSWORD
    });
    assert(loginRes.status === 200, `Admin login returned HTTP ${loginRes.status}`);
    const adminToken = loginRes.body.token;
    assert(!!adminToken, 'Admin token successfully retrieved');

    // 3. Test Admin Get Pricing
    console.log('\n--- 3. Testing GET /api/admin/pricing ---');
    const adminPricingRes = await request(`${BACKEND_URL}/api/admin/pricing`, {
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
    assert(adminPricingRes.status === 200, `Admin get pricing returned HTTP ${adminPricingRes.status}`);
    assert(adminPricingRes.body.proMonthlyPrice === pubRes.body.proMonthlyPrice, 'Admin pricing matches public pricing');

    // 4. Test Updating Pricing via PUT /api/admin/pricing
    console.log('\n--- 4. Testing PUT /api/admin/pricing (Live Updates) ---');
    const updatePayload = {
      proMonthlyPrice: 299,
      proAnnualPrice: 2499,
      proProductLimit: 100,
      proCouponLimit: 15,
      proAiLimit: 15,
      vipMonthlyPrice: 599,
      vipAnnualPrice: 4999,
      vipProductLimit: 9999,
      vipCouponLimit: 9999,
      vipAiLimit: 150,
      isLaunchDiscountBannerActive: true,
      launchDiscountText: '🔥 عرض الإطلاق التجاري: احصل على خصم إضافي عند الاشتراك السنوي اليوم!'
    };

    const updateRes = await request(`${BACKEND_URL}/api/admin/pricing`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    }, updatePayload);

    assert(updateRes.status === 200, `Admin update pricing returned HTTP ${updateRes.status}`);
    assert(updateRes.body.settings.proMonthlyPrice === 299, 'Updated proMonthlyPrice is 299');
    assert(updateRes.body.settings.proAnnualPrice === 2499, 'Updated proAnnualPrice is 2499');
    assert(updateRes.body.settings.vipMonthlyPrice === 599, 'Updated vipMonthlyPrice is 599');
    assert(updateRes.body.settings.vipAnnualPrice === 4999, 'Updated vipAnnualPrice is 4999');
    assert(updateRes.body.settings.isLaunchDiscountBannerActive === true, 'Banner is active');

    // 5. Verify Immediate Public Pricing Reflection
    console.log('\n--- 5. Verifying Immediate Public Pricing Reflection ---');
    const pubVerifyRes = await request(`${BACKEND_URL}/api/public/pricing`);
    assert(pubVerifyRes.status === 200, `Public pricing returned HTTP 200`);
    assert(pubVerifyRes.body.proMonthlyPrice === 299, 'Public proMonthlyPrice reflects updated 299 EGP');
    assert(pubVerifyRes.body.proAnnualPrice === 2499, 'Public proAnnualPrice reflects updated 2,499 EGP');
    assert(pubVerifyRes.body.vipMonthlyPrice === 599, 'Public vipMonthlyPrice reflects updated 599 EGP');
    assert(pubVerifyRes.body.vipAnnualPrice === 4999, 'Public vipAnnualPrice reflects updated 4,999 EGP');

    // 6. Test Frontend Health & Availability
    console.log('\n--- 6. Testing Frontend Landing & Admin Routes ---');
    const feLanding = await request(FRONTEND_URL);
    assert(feLanding.status === 200, `Frontend Landing page returned HTTP ${feLanding.status}`);

    const feAdmin = await request(`${FRONTEND_URL}/admin`);
    assert(feAdmin.status === 200, `Frontend Admin page returned HTTP ${feAdmin.status}`);

  } catch (err) {
    console.error('Unhandled test exception:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
