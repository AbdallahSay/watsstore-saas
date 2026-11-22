const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

test('billing pending-upgrade card never mixes toLocaleDateString with timeStyle', () => {
  const s = read('src/app/dashboard/billing/page.tsx');
  // toLocaleDateString throws TypeError "Invalid option" when given timeStyle,
  // which crashed the whole billing page for every merchant with a pending request.
  assert.ok(!/toLocaleDateString\([^)]*timeStyle/.test(s),
    'toLocaleDateString must not receive timeStyle - use toLocaleString for date+time');
  assert.match(s, /activePendingRequest\.createdAt\)\.toLocaleString\('ar-EG', \{ dateStyle: 'medium', timeStyle: 'short' \}\)/);
});

test('wide dashboard tables scroll horizontally instead of squeezing on phones', () => {
  const billing = read('src/app/dashboard/billing/page.tsx');
  const admin = read('src/app/admin/page.tsx');
  // Without a min-width inside overflow-x-auto, w-full tables compress into
  // unreadable one-word-per-line vertical strips at 390px.
  assert.match(billing, /<table className="w-full min-w-\[640px\] text-right text-xs">/);
  assert.equal((admin.match(/<table className="w-full min-w-\[760px\] text-right text-xs">/g) || []).length, 2);
});

test('analytics daily-sales chart scrolls within its card on small screens', () => {
  const s = read('src/app/dashboard/analytics/page.tsx');
  assert.match(s, /h-64 flex items-end gap-2 sm:gap-3 px-2 border-b[^"]*overflow-x-auto/);
  assert.match(s, /flex-1 min-w-\[26px\] sm:min-w-0 flex flex-col items-center h-full/);
});

test('analytics page is fully themed in dark mode', () => {
  const s = read('src/app/dashboard/analytics/page.tsx');
  // The page previously had zero dark: variants and rendered light inside dark mode.
  assert.ok((s.match(/dark:/g) || []).length >= 25, 'analytics page needs dark: variants across its cards, text and chart');
  for (const token of ['bg-white', 'bg-slate-50', 'bg-slate-100', 'text-slate-800', 'text-slate-700', 'text-slate-600', 'text-slate-500']) {
    const bare = new RegExp(token.replace(/-/g, '\\-') + '(?![\\w/-])(?! dark:)');
    assert.ok(!bare.test(s), `${token} without a dark: counterpart in analytics page`);
  }
});
