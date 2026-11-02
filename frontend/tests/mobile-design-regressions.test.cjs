const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root,name),'utf8');

test('public product card image and name link to dedicated product page', () => {
  const s = read('src/components/commerce/CommerceStorefront.tsx');
  assert.match(s, /className="ws-product-image"[\s\S]{0,160}href=\{preview \? '#product-details' :/);
  assert.match(s, /<h3>[\s\S]*?<Link prefetch=\{false\} href=\{preview \? '#product-details' :/);
  assert.match(s, /setPreviewDetail\(p\)/);
  assert.match(s, /activeDetailProduct \? \(/);
  assert.match(s, /className="ws-preview-product-back"/);
});

test('ticker uses two identical repeating groups and never runs out of text', () => {
  const s = read('src/components/commerce/CommerceStorefront.tsx');
  const css = read('src/styles/store-themes.css');
  assert.match(s, /\[0, 1\]\.map\(\(copy\) => \(/);
  assert.match(s, /ws-street-marquee-group/);
  assert.match(css, /\.ws-street-marquee-group\s*\{/);
  assert.match(css, /animation: ws-marquee 25s linear infinite/);
});

test('grocery WhatsApp CTA and index/count pills match and fit their theme', () => {
  const css = read('src/styles/store-themes.css');
  const m = css.match(/\.ws-theme--fresh-market \{([\s\S]*?)\}/);
  assert.ok(m);
  assert.match(m[1], /--store-whatsapp-bg: #15803d/);
  assert.match(m[1], /--store-whatsapp-hover: #166534/);
  assert.match(css, /\.ws-product-image \.ws-product-index\s*\{/);
  assert.match(css, /\.ws-section-heading h2 \.ws-product-count\s*\{/);
});

test('merchant mobile table and sidebar have independent responsive styling', () => {
  const layout = read('src/app/dashboard/layout.tsx');
  const globals = read('src/app/globals.css');
  assert.match(layout, /ws-merchant-sidebar[^"]*sticky top-0 self-start h-dvh/);
  assert.match(layout, /md:hidden bg-white dark:bg-slate-900/);
  assert.match(globals, /html:not\(\.dark\) \.ws-merchant-sidebar/);
  assert.match(globals, /\.ws-merchant-shell \.ws-mobile-cards td\s*\{/);
});

test('shipping has all 27 governorates, city suggestions and custom area fallback', () => {
  const {EGYPT_GOVERNORATES, EGYPT_CITIES_BY_GOVERNORATE} = require('../src/lib/egypt-shipping-locations.ts');
  assert.equal(EGYPT_GOVERNORATES.length, 27);
  assert.ok(EGYPT_GOVERNORATES.includes('القاهرة'));
  assert.ok(EGYPT_GOVERNORATES.includes('الإسكندرية'));
  assert.ok(Object.values(EGYPT_CITIES_BY_GOVERNORATE).flat().length >= 396);
  const view = read('src/app/dashboard/themes/page.tsx');
  assert.match(view, /<datalist id=\{/);
  assert.match(view, /onChange=\{\(e\) => updateShippingZone\(index, \{ name: e.target.value \}\)\}/);
  assert.match(view, /fee: Number\(e.target.value\)/);
});
