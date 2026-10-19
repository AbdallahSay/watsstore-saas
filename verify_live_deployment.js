const https = require('https');
const http = require('http');

const FRONTEND_BASE = 'https://frontend-bay-ten-58.vercel.app';
const BACKEND_BASE = 'https://watsstore.runasp.net';

function request(url, options = {}) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'WatsStore-Live-Audit-Bot/1.0',
        ...(options.headers || {})
      },
      timeout: 15000
    };

    const req = client.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({
          url,
          statusCode: res.statusCode,
          headers: res.headers,
          data
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ url, statusCode: 408, error: 'TIMEOUT' });
    });

    req.on('error', (err) => {
      resolve({ url, statusCode: 500, error: err.message });
    });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runAudit() {
  console.log('===========================================================');
  console.log('   WATSSTORE LIVE DEPLOYMENT & LINK HEALTH VERIFICATION   ');
  console.log('===========================================================\n');

  const results = [];

  const endpoints = [
    // 1. Frontend Core Public & Marketing Routes
    { name: 'Frontend Landing Page (/)', url: `${FRONTEND_BASE}/`, expected: 200 },
    { name: 'Frontend Directory (/directory)', url: `${FRONTEND_BASE}/directory`, expected: 200 },
    { name: 'Frontend Merchant Registration (/register)', url: `${FRONTEND_BASE}/register`, expected: 200 },
    { name: 'Frontend Merchant Login (/login)', url: `${FRONTEND_BASE}/login`, expected: 200 },
    { name: 'Frontend Merchant Dashboard (/dashboard)', url: `${FRONTEND_BASE}/dashboard`, expected: 200 },
    { name: 'Frontend Merchant Products (/dashboard/products)', url: `${FRONTEND_BASE}/dashboard/products`, expected: 200 },
    { name: 'Frontend Merchant Billing (/dashboard/billing)', url: `${FRONTEND_BASE}/dashboard/billing`, expected: 200 },
    { name: 'Frontend Super Admin (/admin)', url: `${FRONTEND_BASE}/admin`, expected: 200 },
    { name: 'Frontend XML Sitemap (/sitemap.xml)', url: `${FRONTEND_BASE}/sitemap.xml`, expected: 200 },
    { name: 'Frontend Robots TXT (/robots.txt)', url: `${FRONTEND_BASE}/robots.txt`, expected: 200 },

    // 2. Backend Live API Endpoints (MonsterASP)
    { name: 'Backend Health Check (/health)', url: `${BACKEND_BASE}/health`, expected: 200 },
    { name: 'Backend Public Pricing API (/api/public/pricing)', url: `${BACKEND_BASE}/api/public/pricing`, expected: 200 },
    { name: 'Backend Public Stores API (/api/public/stores)', url: `${BACKEND_BASE}/api/public/stores`, expected: 200 },
    { name: 'Backend Payment Gateways API (/api/merchant/billing/gateways)', url: `${BACKEND_BASE}/api/merchant/billing/gateways`, expected: 200 },
  ];

  console.log(`Auditing ${endpoints.length} critical live routes & endpoints...\n`);

  for (const ep of endpoints) {
    const start = Date.now();
    const res = await request(ep.url);
    const duration = Date.now() - start;
    const passed = res.statusCode === ep.expected || (res.statusCode >= 200 && res.statusCode < 400);

    const statusBadge = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`[${statusBadge}] ${ep.name.padEnd(55)} HTTP ${res.statusCode} (${duration}ms)`);
    results.push({
      ...ep,
      actual: res.statusCode,
      duration,
      passed,
      dataSnippet: res.data ? res.data.substring(0, 80).replace(/\s+/g, ' ') : ''
    });
  }

  // 3. Test Storefront slug resolution
  console.log('\nTesting Storefront dynamic slug resolution from live database...');
  const storesRes = await request(`${BACKEND_BASE}/api/public/stores`);
  let sampleSlug = 'store-b-571081';
  try {
    const storesData = JSON.parse(storesRes.data);
    if (Array.isArray(storesData) && storesData.length > 0) {
      const asciiStore = storesData.find(s => /^[a-zA-Z0-9_-]+$/.test(s.slug));
      sampleSlug = asciiStore ? asciiStore.slug : encodeURIComponent(storesData[0].slug);
    }
  } catch (e) {}

  const storefrontUrl = `${FRONTEND_BASE}/s/${sampleSlug}`;
  const sfRes = await request(storefrontUrl);
  const sfPassed = sfRes.statusCode === 200;
  console.log(`[${sfPassed ? '✅ PASS' : '❌ FAIL'}] Frontend Storefront (/s/${sampleSlug})`.padEnd(64) + ` HTTP ${sfRes.statusCode}`);
  results.push({
    name: `Frontend Public Storefront (/s/${sampleSlug})`,
    url: storefrontUrl,
    expected: 200,
    actual: sfRes.statusCode,
    passed: sfPassed
  });

  // 4. Content Inspection: Verify no localhost leakage in frontend landing HTML
  console.log('\nChecking for localhost or development URL leaks in production HTML...');
  const landingRes = await request(`${FRONTEND_BASE}/`);
  const hasLocalhost = landingRes.data && (landingRes.data.includes('localhost:') || landingRes.data.includes('127.0.0.1:'));
  console.log(`[${!hasLocalhost ? '✅ PASS' : '❌ FAIL'}] Production HTML Integrity (0 Localhost leaks)`);
  results.push({
    name: 'Production HTML URL Leak Check',
    url: `${FRONTEND_BASE}/`,
    expected: 200,
    actual: hasLocalhost ? 'LEAK_DETECTED' : 'CLEAN',
    passed: !hasLocalhost
  });

  // Summary
  const totalPassed = results.filter(r => r.passed).length;
  const totalFailed = results.filter(r => !r.passed).length;

  console.log('\n===========================================================');
  console.log(`   LIVE AUDIT COMPLETE: ${totalPassed} PASSED | ${totalFailed} FAILED   `);
  console.log('===========================================================');

  return { totalPassed, totalFailed, results };
}

runAudit();
