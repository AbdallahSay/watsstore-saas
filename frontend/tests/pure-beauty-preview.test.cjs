const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

test('Pure Beauty remains preview-only until backend support is verified', () => {
  const themes = read('src/lib/store-themes.ts');
  const market = read('src/lib/theme-marketplace.ts');
  const page = read('src/app/dashboard/themes/page.tsx');
  const storefront = read('src/components/commerce/CommerceStorefront.tsx');
  assert.match(themes, /STORE_THEME_IDS = \['editorial', 'streetwear', 'lifestyle'\]/);
  assert.doesNotMatch(themes, /STORE_THEME_IDS\s*=\s*\[[^\]]*pure-beauty/);
  assert.match(market, /id:'pure-beauty'.*status:'planned'/);
  assert.match(page, /setPreview\('pure-beauty'\)/);
  assert.match(storefront, /preview && previewTheme === 'pure-beauty'/);
  assert.match(page, /preview previewTheme=\{preview\}/);
  assert.doesNotMatch(page, /update\(\{draftTheme:'pure-beauty'\}\)/);
});

test('Beauty theme selectors are isolated from merchant application appearance', () => {
  const css = read('src/styles/themes/pure-beauty.css');
  const selectors = css.match(/[^{}]+\{/g) || [];
  for (const selector of selectors) {
    const trimmed = selector.replace(/\{$/, '').trim();
    if (trimmed.startsWith('@') || trimmed.startsWith('/*')) continue;
    assert.ok(trimmed.startsWith('.ws-theme--pure-beauty') || trimmed.startsWith('.ws-storefront.ws-theme--pure-beauty'),
      'Unexpected unscoped selector: ' + trimmed);
  }
  assert.doesNotMatch(css, /(?:^|\n)\s*(?:html|body|:root|\.dark|\.dashboard)\s*[{,]/);
});
