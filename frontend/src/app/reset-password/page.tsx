'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { appSwal } from '@/lib/sweetalert';
import { 
  Store as StoreIcon, 
  Lock, 
  Eye, 
  EyeOff,
  AlertCircle, 
  CheckCircle2,
  KeyRound,
  Home,
  ShieldCheck
} from 'lucide-react';
import ThemeLanguageBar from '@/components/ThemeLanguageBar';
import { useLanguage } from '@/context/LanguageContext';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, dir } = useLanguage();

  const [token, setToken] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isRtl = dir === 'rtl';

  useEffect(() => {
    let qToken = searchParams.get('token');
    if (!qToken && typeof window !== 'undefined') {
      qToken = sessionStorage.getItem('watsstore_recovery_token');
    }
    if (qToken) {
      setToken(qToken);
    }
  }, [searchParams]);

  const passwordLengthValid = newPassword.length >= 6;
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!token) {
      setErrorMsg(isRtl ? 'رمز التفويض للاستعادة مفقود أو منتهي الصلاحية. يرجى إعادة طلب رمز جديد.' : 'Recovery authorization token is missing or expired. Please request a new code.');
      return;
    }

    if (!passwordLengthValid) {
      setErrorMsg(isRtl ? 'يجب أن لا تقل كلمة المرور عن 6 أحرف أو أرقام.' : 'Password must be at least 6 characters.');
      return;
    }

    if (!passwordsMatch) {
      setErrorMsg(isRtl ? 'كلمتا المرور غير متطابقتين.' : 'Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.resetPassword(token, newPassword);

      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('watsstore_recovery_token');
        sessionStorage.removeItem('watsstore_recovery_email');
      }

      await appSwal.fire({
        icon: 'success',
        title: isRtl ? 'تم تغيير كلمة المرور بنجاح! 🔒' : 'Password Reset Successfully!',
        text: res.message || (isRtl ? 'يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.' : 'You can now log in with your new password.'),
        confirmButtonText: isRtl ? 'تسجيل الدخول الآن' : 'Log in now',
        confirmButtonColor: '#10B981',
      });

      router.push('/login');
    } catch (err: any) {
      setErrorMsg(err.message || (isRtl ? 'تعذر إعادة تعيين كلمة المرور. قد يكون الرابط منتهي الصلاحية.' : 'Failed to reset password. Token may be expired.'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 space-y-5 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
          {isRtl ? 'رابط الاستعادة مفقود أو غير صالح' : 'Recovery Session Missing'}
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          {isRtl
            ? 'لم يتم العثور على رمز تفويض ساري. يرجى البدء من جديد عبر طلب رمز استعادة جديد.'
            : 'No active recovery session was found. Please request a new recovery code to proceed.'}
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center justify-center w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
        >
          {isRtl ? 'طلب رمز استعادة جديد' : 'Request New Code'}
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-6 transition-colors">
      {errorMsg && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 font-bold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            {isRtl ? 'كلمة المرور الجديدة' : 'New Password'}
          </label>
          <div className="relative">
            <Lock className={`w-4 h-4 text-slate-400 absolute ${isRtl ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2`} />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full ${isRtl ? 'pr-10 pl-10' : 'pl-10 pr-10'} py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-sm font-medium focus:outline-none focus:border-emerald-500`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute ${isRtl ? 'left-3.5' : 'right-3.5'} top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1`}
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px]">
            <span className={passwordLengthValid ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
              {passwordLengthValid ? '✓' : '•'} {isRtl ? '6 أحرف على الأقل' : 'At least 6 characters'}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            {isRtl ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
          </label>
          <div className="relative">
            <Lock className={`w-4 h-4 text-slate-400 absolute ${isRtl ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2`} />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full ${isRtl ? 'pr-10 pl-10' : 'pl-10 pr-10'} py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-sm font-medium focus:outline-none focus:border-emerald-500`}
            />
          </div>
          {confirmPassword && (
            <div className="mt-1 text-[11px] font-bold">
              {passwordsMatch ? (
                <span className="text-emerald-600">✓ {isRtl ? 'كلمتا المرور متطابقتان' : 'Passwords match'}</span>
              ) : (
                <span className="text-rose-500">✕ {isRtl ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'}</span>
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !passwordLengthValid || !passwordsMatch}
          className="w-full mt-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{isLoading ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ كلمة المرور الجديدة وتسجيل الدخول' : 'Save New Password & Log In')}</span>
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
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
          <KeyRound className="w-7 h-7 text-emerald-600" />
          <span>{dir === 'rtl' ? 'تعيين كلمة مرور جديدة' : 'Set New Password'}</span>
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 px-4">
          {dir === 'rtl'
            ? 'قم بإنشاء كلمة مرور قوية لتأمين متجرك وحمايته.'
            : 'Create a strong new password to protect your store.'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Suspense fallback={
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 mx-auto border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
