const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

test('all 20 production theme IDs and the Pure Beauty design are registered', () => {
  const themes = read('src/lib/store-themes.ts');
  const expected = ['editorial-luxe','street-pulse','pure-beauty','tech-grid','fresh-market',
    'living-space','golden-atelier','active-motion','little-joy','crafted-story',
    'cafe-ritual','pet-haven','bloom-studio','auto-circuit','game-arena',
    'book-gallery','optical-studio','outdoor-trail','travel-atelier','office-pro'];
  const ids = themes.match(/export const STORE_THEME_IDS = \[([\s\S]*?)\] as const;/);
  assert.ok(ids, 'Theme registry should define an explicit allowlist');
  for (const id of expected) {
    assert.match(ids[1], new RegExp("'"+id+"'"));
    assert.match(themes, new RegExp("'"+id+"':\\s*\\{"));
  }
  assert.match(themes, /editorial: 'editorial-luxe'/);
  assert.match(themes, /streetwear: 'street-pulse'/);
  assert.match(themes, /lifestyle: 'living-space'/);
});

test('merchant can preview every theme with real store data without auto-publishing', () => {
  const storefront = read('src/components/commerce/CommerceStorefront.tsx');
  const page = read('src/app/dashboard/themes/page.tsx');
  assert.match(storefront, /getStoreTheme\(previewTheme \|\| store\.themeId\)/);
  assert.match(storefront, /CommerceCart/);
  assert.match(page, /(?:visibleThemes|filteredThemes)\.map\(\(theme\) =>/);
  assert.match(page, /setPreviewThemeId\(theme\.id\)/);
  assert.match(page, /previewTheme=\{previewThemeId\}/);
  assert.match(page, /previewCustomization=\{customization\}/);
  assert.match(page, /updateSettings\(\{ draftTheme: previewThemeId \}\)/);
  assert.match(page, /executeAction\('publish'\)/);
});

test('storefront CSS and theme customization remain separate from dashboard appearance', () => {
  const styles = read('src/styles/themes/pure-beauty.css');
  assert.match(styles, /\.ws-storefront\.ws-theme--pure-beauty/);
  assert.doesNotMatch(styles, /(?:^|\n)\s*(?:html|body|:root|\.dark|\.dashboard)\s*[{,]/);
});
