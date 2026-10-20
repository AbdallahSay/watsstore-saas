const https = require('https');

function get(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data
        });
      });
    }).on('error', (err) => {
      resolve({ error: err.message });
    });
  });
}

async function main() {
  console.log('=== Checking Vercel Live Deployment ===');
  const res = await get('https://frontend-bay-ten-58.vercel.app/');
  console.log('Status:', res.statusCode);
  console.log('Vercel Headers:');
  console.log('  x-vercel-id:', res.headers['x-vercel-id']);
  console.log('  x-vercel-cache:', res.headers['x-vercel-cache']);
  console.log('  age:', res.headers['age']);
  console.log('  date:', res.headers['date']);
  console.log('  etag:', res.headers['etag']);

  // Check build manifest or static files
  const buildManifestRes = await get('https://frontend-bay-ten-58.vercel.app/_next/static/buildManifest.js');
  console.log('buildManifest status:', buildManifestRes.statusCode);

  // Check if ThemeLanguageBar exists in HTML
  console.log('Contains ThemeLanguageBar / theme / flags:');
  console.log('  has "theme.toggle":', res.data.includes('theme.toggle'));
  console.log('  has "watsstore_theme":', res.data.includes('watsstore_theme'));
  console.log('  has "Language":', res.data.includes('اللغة') || res.data.includes('lang'));
  console.log('  has "dark":', res.data.includes('dark'));
  
  // Check dashboard page
  const dashRes = await get('https://frontend-bay-ten-58.vercel.app/dashboard');
  console.log('Dashboard status:', dashRes.statusCode);
  console.log('Dashboard html snippet:', dashRes.data.substring(0, 300));

  // Check login page
  const loginRes = await get('https://frontend-bay-ten-58.vercel.app/login');
  console.log('Login status:', loginRes.statusCode);
  console.log('Login has theme toggle:', loginRes.data.includes('theme') || loginRes.data.includes('ThemeLanguageBar'));

  // Look for any commit or build id in data
  const buildIdMatch = res.data.match(/"buildId":"([^"]+)"/);
  console.log('Build ID from HTML:', buildIdMatch ? buildIdMatch[1] : 'not found');
}

main();
