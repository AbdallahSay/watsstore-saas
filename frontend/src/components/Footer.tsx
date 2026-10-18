import Link from 'next/link';
import { Store, MessageCircle, Heart, ShieldCheck, Zap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold">
                <Store className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-wide">WatsStore</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              المنصة الأسرع والأسهل للتجار في مصر لإنشاء متجر ومنيو إلكتروني مربوط مباشرة بالواتساب ومُهيأ لمحركات بحث جوجل وإعلانات ميتا.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-950/60 p-2.5 rounded-lg border border-emerald-800/40">
              <ShieldCheck className="w-4 h-4" />
              <span>مُصمم للتجار وأصحاب المشاريع في مصر 🇪🇬</span>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-4">روابط سريعة</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/#features" className="hover:text-emerald-400 transition-colors">المميزات والخصائص</Link>
              </li>
              <li>
                <Link href="/#pricing" className="hover:text-emerald-400 transition-colors">باقات الأسعار</Link>
              </li>
              <li>
                <Link href="/directory" className="hover:text-emerald-400 transition-colors">دليل المتاجر في المحافظات</Link>
              </li>
              <li>
                <Link href="/s/al-amal-fashion" className="hover:text-emerald-400 transition-colors">معاينة المتجر التجريبي</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-4">بوابات التجار</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/register" className="hover:text-emerald-400 transition-colors">تسجيل متجر جديد</Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-emerald-400 transition-colors">تسجيل دخول لوحة التحكم</Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-emerald-400 transition-colors">إدارة الكتالوج والطلبات</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-4">تواصل ودعم فني</h4>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              فريق الدعم الفني متواجد لمساعدتك في إعداد وتجهيز متجرك وربط بيكسل الإعلانات.
            </p>
            <a
              href="https://wa.me/201012345678"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>تواصل مع الدعم عبر واتساب</span>
            </a>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} WatsStore. جميع الحقوق محفوظة لتجار مصر 🇪🇬</p>
          <div className="flex items-center gap-1">
            <span>صُنع بشغف لخدمة التجارة الإلكترونية المصرية</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 inline fill-rose-500" />
          </div>
        </div>
      </div>
    </footer>
  );
}
