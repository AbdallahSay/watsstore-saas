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

test('admin subscriptions table never mixes toLocaleDateString with timeStyle', () => {
  const s = read('src/app/admin/page.tsx');
  assert.ok(!/toLocaleDateString\([^)]*timeStyle/.test(s),
    'same invalid-options crash class as billing - dates silently fell back to placeholder text');
  assert.match(s, /toLocaleString\('ar-EG', \{ dateStyle: 'short', timeStyle: 'short' \}\)/);
});

test('dashboard and admin pages render in the Cairo theme font, not a stray mono or system stack', () => {
  for (const f of ['src/app/dashboard/page.tsx', 'src/app/admin/page.tsx', 'src/app/dashboard/billing/page.tsx', 'src/app/dashboard/analytics/page.tsx', 'src/app/dashboard/orders/page.tsx', 'src/app/dashboard/products/page.tsx', 'src/app/dashboard/settings/page.tsx', 'src/app/dashboard/coupons/page.tsx', 'src/app/dashboard/themes/page.tsx']) {
    const s = read(f);
    assert.ok(!/font-mono|font-sans/.test(s), f + ' must inherit the Cairo theme font');
  }
});

test('wide dashboard tables scroll horizontally instead of squeezing on phones', () => {
  const billing = read('src/app/dashboard/billing/page.tsx');
  const admin = read('src/app/admin/page.tsx');
  // Without a min-width inside overflow-x-auto, w-full tables compress into
  // unreadable one-word-per-line vertical strips at 390px.
  assert.match(billing, /<table className="w-full min-w-\[900px\] text-right text-xs">/);
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

test('billing invoice table protects every column from mid-word wrapping', () => {
  const s = read('src/app/dashboard/billing/page.tsx');
  // Auto table layout squeezed flexible columns to min-content at 390px, splitting
  // Arabic words mid-token ("المبل" / "غ"). Headers and single-token cells must not wrap.
  const tableRegion = s.slice(s.indexOf('min-w-[900px]'));
  assert.ok((tableRegion.match(/<th className="py-3 px-4 font-bold whitespace-nowrap">/g) || []).length === 8,
    'all 8 invoice-table headers need whitespace-nowrap');
  assert.ok((tableRegion.match(/whitespace-nowrap/g) || []).length >= 17,
    'invoice date/plan/cycle/amount/method/sender cells and status pills need whitespace-nowrap');
  assert.match(tableRegion, /max-w-\[150px\] truncate/, 'transaction id cell keeps truncate protection');
});

test('billing headings and wizard surfaces stay readable in dark mode', () => {
  const s = read('src/app/dashboard/billing/page.tsx');
  // Plan name + wizard title previously rendered text-slate-900 on dark:bg-slate-900.
  assert.match(s, /text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100/g);
  assert.equal((s.match(/text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100/g) || []).length, 2,
    'current-plan name and wizard title both need a dark foreground');
  for (const token of ['bg-slate-100 text-slate-600 hover:bg-slate-200', 'bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2']) {
    assert.ok(!s.includes(token), `unguarded light surface in billing: ${token}`);
  }
  // quota cards, stepper buttons and cycle switcher carry dark: variants
  assert.match(s, /bg-slate-50 dark:bg-slate-800\/60 border border-slate-200 dark:border-slate-700/);
  assert.match(s, /bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/);
});
