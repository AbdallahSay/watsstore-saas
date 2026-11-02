const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('legacy host redirects permanently to the official domain and preserves paths', async () => {
  const config = require('../next.config.js');
  const redirects = await config.redirects();
  const legacy = redirects.find(rule =>
    rule.has?.some(predicate => predicate.type === 'host' && predicate.value === 'frontend-bay-ten-58.vercel.app')
  );
  assert.ok(legacy, 'Legacy host must have a host-conditional redirect');
  assert.equal(legacy.source, '/:path*');
  assert.equal(legacy.destination, 'https://watsstore.vercel.app/:path*');
  assert.equal(legacy.permanent, true);
  assert.equal(redirects.some(rule => rule.has?.some(predicate =>
    predicate.type === 'host' && predicate.value === 'watsstore.vercel.app')), false,
    'New official domain must not redirect in a loop');
});

test('SEO metadata, sitemap and robots use the official domain as fallback', () => {
  const root = path.resolve(__dirname, '..');
  for (const file of ['src/app/layout.tsx', 'src/app/sitemap.ts', 'src/app/robots.ts']) {
    const text = fs.readFileSync(path.join(root, file), 'utf8');
    assert.ok(text.includes("process.env.NEXT_PUBLIC_APP_URL || 'https://watsstore.vercel.app'"), file);
    assert.ok(!text.includes('https://frontend-bay-ten-58.vercel.app'), file);
  }
});
