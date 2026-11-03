'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { appSwal } from '@/lib/sweetalert';
import { 
  Store as StoreIcon, 
  Mail, 
  ArrowLeft, 
  ArrowRight,
  AlertCircle, 
  CheckCircle2,
  RefreshCw,
  Home,
  ShieldCheck
} from 'lucide-react';
import ThemeLanguageBar from '@/components/ThemeLanguageBar';
import { useLanguage } from '@/context/LanguageContext';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { t, dir } = useLanguage();

  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(60);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isRtl = dir === 'rtl';
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const NextIcon = isRtl ? ArrowLeft : ArrowRight;

  useEffect(() => {
    const storedToken = localStorage.getItem('watsstore_merchant_token') || localStorage.getItem('watsstore_token');
    const storedUser = localStorage.getItem('watsstore_user');

    if (!storedToken || !storedUser) {
      router.push('/login');
      return;
    }

    try {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      setToken(storedToken);
    } catch {
      router.push('/login');
    }
  }, [router]);

  // Resend cooldown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleDigitChange = (index: number, value: string) => {
    setErrorMsg(null);
    const sanitized = value.replace(/\D/g, '');

    // Multi-digit paste
    if (sanitized.length > 1) {
      const chars = sanitized.slice(0, 6).split('');
      const newDigits = [...digits];
      chars.forEach((c, i) => {
        if (i < 6) newDigits[i] = c;
      });
      setDigits(newDigits);
      const nextFocus = Math.min(chars.length, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = sanitized;
    setDigits(newDigits);

    if (sanitized && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setDigits(newDigits);
    const nextIdx = Math.min(pasted.length, 5);
    inputRefs.current[nextIdx]?.focus();
  };

  const handleResend = async () => {
    if (!token || !canResend || isResending) return;
    setIsResending(true);
    setErrorMsg(null);
    setResendNotice(null);

    try {
      await api.resendEmailOtp(token);
      setCountdown(60);
      setCanResend(false);
      setResendNotice(isRtl ? 'تم إرسال رمز تحقق جديد إلى بريدك الإلكتروني.' : 'A new code has been sent to your email.');
    } catch (err: any) {
      setErrorMsg(err.message || (isRtl ? 'تعذر إرسال الرمز. يرجى الانتظار والمحاولة لاحقاً.' : 'Failed to resend code. Please try again later.'));
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length !== 6) {
      setErrorMsg(isRtl ? 'يرجى إدخال رمز التحقق المكون من 6 أرقام.' : 'Please enter the complete 6-digit code.');
      return;
    }
    if (!token) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.verifyEmail(token, code);

      // Update local storage user
      if (user) {
        const updatedUser = {
          ...user,
          emailVerified: true,
          emailVerificationStatus: 'Verified',
        };
        localStorage.setItem('watsstore_user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }

      await appSwal.fire({
        icon: 'success',
        title: isRtl ? 'تهانينا! تم تأكيد بريدك الإلكتروني 🎉' : 'Email Verified Successfully! 🎉',
        text: res.message || (isRtl ? 'تم تفعيل حساب متجرك بالكامل وأصبح بإمكانك نشر قوالب المتجر الحية.' : 'Your store account is now fully verified and can publish live themes.'),
        confirmButtonText: isRtl ? 'الانتقال إلى لوحة التحكم' : 'Go to Dashboard',
        confirmButtonColor: '#10B981',
      });

      router.push('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || (isRtl ? 'رمز التحقق غير صحيح أو منتهي الصلاحية.' : 'Verification code is invalid or expired.'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div dir={dir} className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative transition-colors duration-200">
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between max-w-4xl mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span>{isRtl ? 'لوحة التحكم' : 'Dashboard'}</span>
        </Link>
        <ThemeLanguageBar variant="navbar" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mt-6">
        <Link href="/" className="inline-flex items-center gap-2 group mb-4">
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <StoreIcon className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent">
            WatsStore
          </span>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center justify-center gap-2">
          <ShieldCheck className="w-7 h-7 text-emerald-600" />
          <span>{isRtl ? 'تأكيد البريد الإلكتروني' : 'Verify Email Address'}</span>
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 px-4">
          {isRtl
            ? `لقد أرسلنا رمز تحقق مكوّن من 6 أرقام إلى:`
            : `We sent a 6-digit verification code to:`}
          <br />
          <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{user?.email}</strong>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-6 transition-colors">
          {user.emailVerified ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {isRtl ? 'بريدك الإلكتروني موثق بالفعل ✅' : 'Email Already Verified ✅'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {isRtl ? 'حساب متجرك مؤمن ومكتمل الصلاحيات.' : 'Your store account is fully verified.'}
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                {isRtl ? 'العودة للوحة التحكم' : 'Return to Dashboard'}
              </Link>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {resendNotice && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 font-bold">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>{resendNotice}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {isRtl ? 'رمز التحقق (6 أرقام)' : 'Verification Code (6 digits)'}
                    </label>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isRtl ? 'صالح لـ 15 دقيقة' : 'Valid 15m'}
                    </span>
                  </div>

                  <div dir="ltr" className="grid grid-cols-6 gap-2">
                    {digits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { inputRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        autoFocus={index === 0}
                        className="w-full h-13 sm:h-14 text-center text-xl sm:text-2xl font-black rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || digits.join('').length !== 6}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isLoading ? (isRtl ? 'جاري التحقق...' : 'Verifying...') : (isRtl ? 'تأكيد تفعيل البريد' : 'Confirm & Verify Email')}</span>
                </button>
              </form>

              {/* Resend Cooldown Section */}
              <div className="pt-2 flex flex-col items-center justify-center text-xs space-y-1">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending}
                    className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                    <span>{isRtl ? 'لم يصلك الرمز؟ أعد الإرسال الآن' : 'Didn\'t receive the code? Resend now'}</span>
                  </button>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 font-medium">
                    {isRtl
                      ? `يمكنك إعادة إرسال الرمز خلال (${countdown}) ثانية`
                      : `You can resend the code in (${countdown})s`}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  <BackIcon className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'العودة للوحة التحكم وتأكيد الرمز لاحقاً' : 'Return to Dashboard & verify later'}</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
