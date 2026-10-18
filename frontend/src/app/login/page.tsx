'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import Swal from 'sweetalert2';
import { 
  Store as StoreIcon, 
  Mail, 
  Lock, 
  ArrowLeft, 
  AlertCircle, 
  Sparkles,
  LogIn
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await api.login({ email, password });
      
      // Store token & user session in localStorage
      localStorage.setItem('watsstore_token', res.token);
      localStorage.setItem('watsstore_user', JSON.stringify(res));

      await Swal.fire({
        icon: 'success',
        title: 'أهلاً بك مجدداً! 👋',
        text: `تم تسجيل الدخول إلى متجر ${res.storeName} بنجاح.`,
        timer: 1500,
        showConfirmButton: false,
      });

      router.push('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'بيانات الدخول غير صحيحة');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('demo@watsstore.com');
    setPassword('123456');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 group mb-4">
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <StoreIcon className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent">
            WatsStore
          </span>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          تسجيل دخول التاجر
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-600">
          أو{' '}
          <Link href="/register" className="font-bold text-emerald-600 hover:text-emerald-700">
            أنشئ متجراً جديداً مجاناً في دقيقتين
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/80 space-y-6">
          {/* Quick Demo Login Pill */}
          <button
            type="button"
            onClick={handleFillDemo}
            className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>تجربة سريعة: ملء بيانات متجر العرض (Demo Store)</span>
          </button>

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="merchant@example.com"
                  className="w-full pr-10 pl-3.5 py-3 rounded-2xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pr-10 pl-3.5 py-3 rounded-2xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoading ? 'جاري التحقق...' : 'دخول لوحة التحكم'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
