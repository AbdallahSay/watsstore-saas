const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Merchant Account Security & Verification Suite', async (t) => {
  await t.test('1. Login page does NOT contain public demo quick-fill credentials or demo fill button', () => {
    const loginFilePath = path.join(__dirname, '..', 'src', 'app', 'login', 'page.tsx');
    const content = fs.readFileSync(loginFilePath, 'utf8');

    assert.doesNotMatch(content, /demo@watsstore\.com/, 'Demo email must not be hardcoded in login UI');
    assert.doesNotMatch(content, /handleFillDemo/, 'handleFillDemo must be removed');
    assert.doesNotMatch(content, /auth\.demo_fill/, 'Demo fill translation key must be removed');
    assert.match(content, /href="\/forgot-password"/, 'Forgot password link must point to dedicated /forgot-password page');
  });

  await t.test('2. Forgot password page is properly structured with email validation and generic response flow', () => {
    const forgotFilePath = path.join(__dirname, '..', 'src', 'app', 'forgot-password', 'page.tsx');
    assert.ok(fs.existsSync(forgotFilePath), 'forgot-password/page.tsx must exist');
    const content = fs.readFileSync(forgotFilePath, 'utf8');

    assert.match(content, /api\.forgotPassword/, 'Must call api.forgotPassword');
    assert.match(content, /\/verify-recovery\?email=/, 'Must redirect or link to verify-recovery with email');
  });

  await t.test('3. Verify recovery code page supports 6-digit OTP input with paste and 60s cooldown timer', () => {
    const verifyRecoveryFilePath = path.join(__dirname, '..', 'src', 'app', 'verify-recovery', 'page.tsx');
    assert.ok(fs.existsSync(verifyRecoveryFilePath), 'verify-recovery/page.tsx must exist');
    const content = fs.readFileSync(verifyRecoveryFilePath, 'utf8');

    assert.match(content, /api\.verifyRecoveryCode/, 'Must call api.verifyRecoveryCode');
    assert.match(content, /handlePaste/, 'Must support pasting 6-digit codes');
    assert.match(content, /watsstore_recovery_token/, 'Must store recovery authorization token');
    assert.match(content, /countdown/, 'Must enforce cooldown timer for resends');
    assert.match(content, /Suspense/, 'Must wrap searchParams in Suspense for Next.js SSR');
  });

  await t.test('4. Reset password page enforces password length >= 6 and match validation', () => {
    const resetFilePath = path.join(__dirname, '..', 'src', 'app', 'reset-password', 'page.tsx');
    assert.ok(fs.existsSync(resetFilePath), 'reset-password/page.tsx must exist');
    const content = fs.readFileSync(resetFilePath, 'utf8');

    assert.match(content, /api\.resetPassword/, 'Must call api.resetPassword');
    assert.match(content, /newPassword\.length >= 6/, 'Must enforce password length >= 6');
    assert.match(content, /newPassword === confirmPassword/, 'Must enforce password confirmation match');
    assert.match(content, /Suspense/, 'Must wrap searchParams in Suspense for Next.js SSR');
  });

  await t.test('5. Verify email page allows verifying onboarded merchant and resending OTP with cooldown', () => {
    const verifyEmailFilePath = path.join(__dirname, '..', 'src', 'app', 'verify-email', 'page.tsx');
    assert.ok(fs.existsSync(verifyEmailFilePath), 'verify-email/page.tsx must exist');
    const content = fs.readFileSync(verifyEmailFilePath, 'utf8');

    assert.match(content, /api\.verifyEmail/, 'Must call api.verifyEmail');
    assert.match(content, /api\.resendEmailOtp/, 'Must call api.resendEmailOtp');
    assert.match(content, /emailVerified:\s*true/, 'Must update merchant emailVerified status upon success');
  });

  await t.test('6. Dashboard settings page includes account security, password change, and session revocation', () => {
    const settingsFilePath = path.join(__dirname, '..', 'src', 'app', 'dashboard', 'settings', 'page.tsx');
    const content = fs.readFileSync(settingsFilePath, 'utf8');

    assert.match(content, /api\.getMerchantSecurityStatus/, 'Must load merchant security status');
    assert.match(content, /api\.changeMerchantPassword/, 'Must allow changing merchant password');
    assert.match(content, /api\.revokeOtherSessions/, 'Must allow revoking all other active sessions');
    assert.match(content, /خدمة إرسال رسائل التحقق النصية/, 'Must display honest pending SMS status without faking verification');
  });

  await t.test('7. Dashboard layout includes unverified email attention banner', () => {
    const layoutFilePath = path.join(__dirname, '..', 'src', 'app', 'dashboard', 'layout.tsx');
    const content = fs.readFileSync(layoutFilePath, 'utf8');

    assert.match(content, /user\.emailVerified === false/, 'Must detect unverified merchant');
    assert.match(content, /href="\/verify-email"/, 'Must link directly to verify-email');
  });
});
