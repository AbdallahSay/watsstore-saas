const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const backend = rel => fs.readFileSync(path.join(root, '..', 'backend', rel), 'utf8');

test('Pure Beauty is available in both theme registry and server DTO validation', () => {
  const themes = read('src/lib/store-themes.ts');
  const market = read('src/lib/theme-marketplace.ts');
  const dto = backend('DTOs/CommerceDTOs.cs');
  assert.match(themes, /STORE_THEME_IDS = \[[^\]]*'pure-beauty'\]/);
  assert.match(themes, /'pure-beauty':\s*\{/);
  assert.match(market, /id:'pure-beauty'.*status:'available'/);
  assert.match(dto, /editorial\|streetwear\|lifestyle\|pure-beauty/);
});

test('Pure Beauty renders through the shared secure commerce engine', () => {
  const storefront = read('src/components/commerce/CommerceStorefront.tsx');
  const page = read('src/app/dashboard/themes/page.tsx');
  assert.match(storefront, /getStoreTheme\(previewTheme \|\| store\.themeId\)/);
  assert.match(storefront, /CommerceCart/);
  assert.match(page, /visibleThemes\.map\(theme/);
  assert.match(page, /draftTheme:theme\.id/);
});

test('Pure Beauty styles remain isolated from the dashboard appearance', () => {
  const css = read('src/styles/themes/pure-beauty.css');
  assert.match(css, /\.ws-storefront\.ws-theme--pure-beauty/);
  assert.doesNotMatch(css, /(?:^|\n)\s*(?:html|body|:root|\.dark|\.dashboard)\s*[{,]/);
});
