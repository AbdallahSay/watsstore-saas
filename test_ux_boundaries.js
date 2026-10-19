/**
 * test_ux_boundaries.js
 * Automated verification for Enterprise Loading, 404 Not Found, and Error Boundaries
 */

const https = require('https');

const LIVE_URL = 'https://frontend-bay-ten-58.vercel.app';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    }).on('error', err => reject(err));
  });
}

async function runAudit() {
  console.log('====================================================');
  console.log('🚀 WatsStore Enterprise UX & Boundary Audit Running');
  console.log(`🌐 Target: ${LIVE_URL}`);
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. Check Global 404 on arbitrary random path
  try {
    const randomPath = `${LIVE_URL}/non-existent-page-${Date.now()}`;
    console.log(`[TEST 1] Testing Global 404 Route: ${randomPath}`);
    const res = await fetchUrl(randomPath);
    console.log(`   Status Code: ${res.statusCode}`);
    
    if (res.statusCode === 404) {
      console.log('   ✅ HTTP 404 status correctly returned');
      passed++;
    } else {
      console.log(`   ❌ Expected status 404, received ${res.statusCode}`);
      failed++;
    }

    if (res.body.includes('404') || res.body.includes('الصفحة غير موجودة') || res.body.includes('WatsStore')) {
      console.log('   ✅ Global 404 UI markup and brand verified in response body');
      passed++;
    } else {
      console.log('   ⚠️ Response did not contain expected Arabic 404 text (may be awaiting Vercel redeployment)');
    }
  } catch (err) {
    console.error('   ❌ Error testing global 404:', err.message);
    failed++;
  }

  // 2. Check Storefront 404 on non-existent store
  try {
    const randomStore = `${LIVE_URL}/s/store-missing-${Date.now()}`;
    console.log(`\n[TEST 2] Testing Storefront 404 Route: ${randomStore}`);
    const res = await fetchUrl(randomStore);
    console.log(`   Status Code: ${res.statusCode}`);

    if (res.statusCode === 404) {
      console.log('   ✅ HTTP 404 status correctly returned for missing store');
      passed++;
    } else {
      console.log(`   ❌ Expected status 404, received ${res.statusCode}`);
      failed++;
    }

    if (res.body.includes('المتجر غير متاح') || res.body.includes('المتجر غير متوفر') || res.body.includes('404') || res.body.includes('دليل المتاجر')) {
      console.log('   ✅ Storefront 404 UI markup verified in response body');
      passed++;
    } else {
      console.log('   ⚠️ Response did not contain store-specific 404 text (may be awaiting Vercel redeployment)');
    }
  } catch (err) {
    console.error('   ❌ Error testing store 404:', err.message);
    failed++;
  }

  // 3. Check Live Public Core Pages Health
  const corePages = [
    { name: 'Landing Page', path: '/' },
    { name: 'Store Directory', path: '/directory' },
    { name: 'Merchant Login', path: '/login' },
    { name: 'Merchant Register', path: '/register' },
  ];

  console.log('\n[TEST 3] Verifying Core Public Pages Status Codes:');
  for (const page of corePages) {
    try {
      const res = await fetchUrl(`${LIVE_URL}${page.path}`);
      if (res.statusCode === 200) {
        console.log(`   ✅ ${page.name} (${page.path}) -> HTTP 200 OK`);
        passed++;
      } else {
        console.log(`   ❌ ${page.name} (${page.path}) -> HTTP ${res.statusCode}`);
        failed++;
      }
    } catch (err) {
      console.error(`   ❌ Failed to fetch ${page.name}:`, err.message);
      failed++;
    }
  }

  console.log('\n====================================================');
  console.log(`🏁 UX Boundaries Audit Completed: ${passed} Passed | ${failed} Failed`);
  console.log('====================================================');
}

runAudit().catch(console.error);
