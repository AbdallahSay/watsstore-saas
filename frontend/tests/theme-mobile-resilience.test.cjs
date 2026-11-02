const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('mobile merchant theme preview uses fluid width and accessible controls', () => {
 const code = read('src/app/dashboard/themes/page.tsx');
 assert.match(code, /w-full max-w-\[390px\]/);
 assert.match(code, /sm:flex-row/);
 assert.match(code, /max-h-\[min\(750px,75dvh\)\]/);
 assert.match(code, /previewCustomization=\{customization\}/);
});
test('storefront card and purchase controls adapt to lengthy content', () => {
 const css = read('src/styles/store-themes.css');
 assert.match(css, /\.ws-preview-canvas \{ container: ws-mobile-preview/);
 assert.match(css, /\.ws-storefront \.ws-product-grid > \*/);
 assert.match(css, /overflow-wrap:\\s*anywhere/);
 assert.match(css, /white-space:\\s*normal/);
});
