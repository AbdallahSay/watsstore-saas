'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { 
  Store as StoreIcon, 
  Mail, 
  ArrowLeft, 
  ArrowRight,
  AlertCircle, 
  ShieldCheck,
  RefreshCw,
  Home
} from 'lucide-react';
import ThemeLanguageBar from '@/components/ThemeLanguageBar';
import { useLanguage } from '@/context/LanguageContext';

function VerifyRecoveryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, dir } = useLanguage();

  const [email, setEmail] = useState('');
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
    const qEmail = searchParams.get('email');
    if (qEmail) {
      setEmail(qEmail);
    }
  }, [searchParams]);

  // Countdown timer for 60s resend cooldown
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
    
    // Support multi-digit paste in any box
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
    if (!email.trim() || !canResend || isResending) return;
    setIsResending(true);
    setErrorMsg(null);
    setResendNotice(null);

    try {
      await api.forgotPassword(email.trim().toLowerCase());
      setCountdown(60);
      setCanResend(false);
      setResendNotice(isRtl ? 'تم إرسال رمز جديد إلى بريدك الإلكتروني.' : 'A new verification code has been sent.');
    } catch (err: any) {
      setErrorMsg(err.message || 'تعذر إرسال الرمز. يرجى الانتظار قليلاً.');
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length !== 6) {
      setErrorMsg(isRtl ? 'يرجى إدخال رمز التحقق كاملاً المكون من 6 أرقام' : 'Please enter the complete 6-digit code');
      return;
    }
    if (!email.trim()) {
      setErrorMsg(isRtl ? 'يرجى إدخال البريد الإلكتروني' : 'Please provide the email address');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.verifyRecoveryCode(email.trim().toLowerCase(), code);
      if (res.recoveryToken) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('watsstore_recovery_token', res.recoveryToken);
          sessionStorage.setItem('watsstore_recovery_email', email.trim().toLowerCase());
        }
        router.push(`/reset-password?token=${encodeURIComponent(res.recoveryToken)}`);
      } else {
        throw new Error(res.message || 'فشل التحقق من الرمز.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'رمز التحقق غير صحيح أو منتهي الصلاحية.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-6 transition-colors">
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
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            {isRtl ? 'البريد الإلكتروني' : 'Email Address'}
          </label>
          <div className="relative">
            <Mail className={`w-4 h-4 text-slate-400 absolute ${isRtl ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2`} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="merchant@example.com"
              className={`w-full ${isRtl ? 'pr-10 pl-3.5' : 'pl-10 pr-3.5'} py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-sm font-medium focus:outline-none focus:border-emerald-500`}
            />
          </div>
        </div>

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
          <span>{isLoading ? (isRtl ? 'جاري التحقق...' : 'Verifying...') : (isRtl ? 'تأكيد الرمز والمتابعة' : 'Verify Code & Continue')}</span>
          <NextIcon className="w-4 h-4" />
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
            <span>{isRtl ? 'لم يصلك الرمز؟ أعد الإرسال الآن' : 'Didn\'t get code? Resend now'}</span>
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
          href="/forgot-password"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          <BackIcon className="w-3.5 h-3.5" />
          <span>{isRtl ? 'تعديل البريد الإلكتروني' : 'Change email address'}</span>
        </Link>
      </div>
    </div>
  );
}

export default function VerifyRecoveryPage() {
  const { t, dir } = useLanguage();

  return (
    <div dir={dir} className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative transition-colors duration-200">
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span>{t('nav.home', undefined, 'الرئيسية')}</span>
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
          <span>{dir === 'rtl' ? 'التحقق من رمز الاستعادة' : 'Verify Recovery Code'}</span>
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 px-4">
          {dir === 'rtl'
            ? 'أدخل الرمز المكون من 6 أرقام المرسل إلى بريدك الإلكتروني.'
            : 'Enter the 6-digit code sent to your email address.'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Suspense fallback={
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 mx-auto border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <VerifyRecoveryForm />
        </Suspense>
      </div>
    </div>
  );
}
