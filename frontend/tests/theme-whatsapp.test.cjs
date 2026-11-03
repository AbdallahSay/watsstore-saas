const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const cssPath = path.resolve(__dirname, '../src/styles/store-themes.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

const { STORE_THEMES, STORE_THEME_IDS } = require('../src/lib/store-themes.ts');

function sanitizeWhatsAppNumber(raw) {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) {
    return `20${digits.slice(1)}`;
  }
  return digits;
}

test('Theme WhatsApp Number Sanitizer handles Egyptian and International numbers', () => {
  assert.equal(sanitizeWhatsAppNumber('01012345678'), '201012345678');
  assert.equal(sanitizeWhatsAppNumber('+20 101 234 5678'), '201012345678');
  assert.equal(sanitizeWhatsAppNumber('+966 50 123 4567'), '966501234567');
  assert.equal(sanitizeWhatsAppNumber('011-9876-5432'), '201198765432');
  assert.equal(sanitizeWhatsAppNumber(''), '');
  assert.equal(sanitizeWhatsAppNumber(null), '');
});

test('All 20 themes in registry have art-directed WhatsApp token defaults', () => {
  assert.equal(STORE_THEME_IDS.length, 20);
  
  for (const id of STORE_THEME_IDS) {
    const theme = STORE_THEMES[id];
    assert.ok(theme, `Theme ${id} must exist in registry`);
    assert.ok(theme.whatsappTokenDefaults, `Theme ${id} must have whatsappTokenDefaults`);
    const wa = theme.whatsappTokenDefaults;
    assert.ok(wa.bg, `${id} must have wa.bg`);
    assert.ok(wa.text, `${id} must have wa.text`);
    assert.ok(wa.border, `${id} must have wa.border`);
    assert.ok(wa.hover, `${id} must have wa.hover`);
    assert.ok(wa.focus, `${id} must have wa.focus`);
    assert.ok(wa.radius, `${id} must have wa.radius`);

    // Verify WhatsApp button is NOT default brand green (#25D366)
    assert.notEqual(wa.bg.toLowerCase(), '#25d366', `${id} wa.bg must not be hardcoded WhatsApp green`);
  }
});

test('store-themes.css defines semantic WhatsApp tokens for all 20 theme selectors', () => {
  const themeClasses = [
    'editorial-luxe',
    'street-pulse',
    'pure-beauty',
    'tech-grid',
    'fresh-market',
    'living-space',
    'golden-atelier',
    'active-motion',
    'little-joy',
    'crafted-story',
    'cafe-ritual',
    'pet-haven',
    'bloom-studio',
    'auto-circuit',
    'game-arena',
    'book-gallery',
    'optical-studio',
    'outdoor-trail',
    'travel-atelier',
    'office-pro',
  ];

  for (const theme of themeClasses) {
    const selector = `.ws-theme--${theme}`;
    const idx = cssContent.indexOf(selector);
    assert.ok(idx !== -1, `CSS selector ${selector} must exist in store-themes.css`);
    
    // Look ahead within the block
    const blockEnd = cssContent.indexOf('}', idx);
    const block = cssContent.slice(idx, blockEnd);

    assert.ok(block.includes('--store-whatsapp-bg'), `${theme} must declare --store-whatsapp-bg`);
    assert.ok(block.includes('--store-whatsapp-text'), `${theme} must declare --store-whatsapp-text`);
    assert.ok(block.includes('--store-whatsapp-border'), `${theme} must declare --store-whatsapp-border`);
    assert.ok(block.includes('--store-whatsapp-hover'), `${theme} must declare --store-whatsapp-hover`);
    assert.ok(block.includes('--store-whatsapp-focus'), `${theme} must declare --store-whatsapp-focus`);
    assert.ok(block.includes('--store-whatsapp-radius'), `${theme} must declare --store-whatsapp-radius`);
  }
});

test('Theme WhatsApp Button classes and variants exist in CSS', () => {
  assert.ok(cssContent.includes('.ws-theme-whatsapp-btn'), 'Base .ws-theme-whatsapp-btn must exist');
  assert.ok(cssContent.includes('.ws-theme-whatsapp-btn--filled'), '.ws-theme-whatsapp-btn--filled must exist');
  assert.ok(cssContent.includes('.ws-theme-whatsapp-btn--outlined'), '.ws-theme-whatsapp-btn--outlined must exist');
  assert.ok(cssContent.includes('.ws-theme-whatsapp-btn--minimal'), '.ws-theme-whatsapp-btn--minimal must exist');
  assert.ok(cssContent.includes('.ws-theme-whatsapp-btn--floating'), '.ws-theme-whatsapp-btn--floating must exist');
  assert.ok(cssContent.includes('.ws-theme-whatsapp-btn--compact'), '.ws-theme-whatsapp-btn--compact must exist');
  assert.ok(cssContent.includes('.ws-theme-whatsapp-btn--hidden'), '.ws-theme-whatsapp-btn--hidden must exist');
  assert.ok(cssContent.includes('env(safe-area-inset-bottom'), 'Floating button must respect safe area insets');
});

test('Outlined and minimal WhatsApp labels are readable before hover on dark storefronts', () => {
  // A filled CTA on Street Pulse needs dark text on orange, but a transparent outlined
  // CTA requires *light* foreground text on the dark catalog. These are distinct tokens.
  assert.match(cssContent, /--store-whatsapp-outline-text:\s*var\(--ws-fg\)/);
  assert.match(cssContent, /--store-whatsapp-outline-hover-text:\s*var\(--store-whatsapp-text\)/);
  assert.match(cssContent, /\.ws-theme-whatsapp-btn--outlined\s*\{[^}]*color:\s*var\(--store-whatsapp-outline-text/);
  assert.match(cssContent, /\.ws-theme-whatsapp-btn--outlined:hover\s*\{[^}]*color:\s*var\(--store-whatsapp-outline-hover-text/);
  assert.match(cssContent, /\.ws-theme-whatsapp-btn--minimal\s*\{[^}]*color:\s*var\(--store-whatsapp-outline-text/);
  assert.match(cssContent, /\.ws-theme-whatsapp-btn--minimal:hover\s*\{[^}]*color:\s*var\(--store-whatsapp-outline-hover-text/);
  assert.match(cssContent, /\.ws-theme--street-pulse,\s*\.ws-theme--streetwear\s*\{[^}]*--ws-fg:\s*#f8f7f3;/);
});
