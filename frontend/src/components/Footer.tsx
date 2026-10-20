'use client';

import Link from 'next/link';
import { Store, MessageCircle, Heart, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function Footer() {
  const { t, dir } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer dir={dir} className="bg-slate-900 dark:bg-slate-950 text-slate-300 dark:text-slate-400 pt-16 pb-12 border-t border-slate-800 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800 dark:border-slate-800/80">
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/20">
                <Store className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-wide">WatsStore</span>
            </div>
            <p className="text-sm text-slate-400 dark:text-slate-400 leading-relaxed">
              {t('footer.tagline', undefined, 'المنصة الأسرع والأسهل للتجار في مصر لإنشاء متجر ومنيو إلكتروني مربوط مباشرة بالواتساب ومُهيأ لمحركات بحث جوجل وإعلانات ميتا.')}
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-950/60 p-2.5 rounded-lg border border-emerald-800/40">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{t('footer.badge', undefined, 'مُصمم للتجار وأصحاب المشاريع في مصر 🇪🇬')}</span>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-4">
              {t('footer.quick_links', undefined, 'روابط سريعة')}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/#features" className="hover:text-emerald-400 transition-colors">
                  {t('footer.link_features', undefined, 'المميزات والخصائص')}
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="hover:text-emerald-400 transition-colors">
                  {t('footer.link_pricing', undefined, 'باقات الأسعار')}
                </Link>
              </li>
              <li>
                <Link href="/directory" className="hover:text-emerald-400 transition-colors">
                  {t('footer.link_directory', undefined, 'دليل المتاجر في المحافظات')}
                </Link>
              </li>
              <li>
                <Link href="/s/al-amal-fashion" className="hover:text-emerald-400 transition-colors">
                  {t('footer.link_demo', undefined, 'معاينة المتجر التجريبي')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-4">
              {t('footer.merchant_portals', undefined, 'بوابات التجار')}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/register" className="hover:text-emerald-400 transition-colors">
                  {t('footer.link_register', undefined, 'تسجيل متجر جديد')}
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-emerald-400 transition-colors">
                  {t('footer.link_login', undefined, 'تسجيل دخول لوحة التحكم')}
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-emerald-400 transition-colors">
                  {t('footer.link_dashboard', undefined, 'إدارة الكتالوج والطلبات')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-4">
              {t('footer.support_title', undefined, 'تواصل ودعم فني Masar Tech')}
            </h4>
            <p className="text-sm text-slate-400 dark:text-slate-400 leading-relaxed mb-4">
              {t('footer.support_desc', undefined, 'فريق الدعم الفني وإدارة المنصة في خدمتكم لتفعيل باقات Pro/VIP والمساعدة في إعداد المتاجر.')}
            </p>
            <div className="space-y-2">
              <a
                href="https://wa.me/201011653619"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors w-full justify-center shadow-md shadow-emerald-600/20"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{t('footer.whatsapp_support', undefined, 'واتساب الدعم: 01011653619')}</span>
              </a>
              <a
                href="https://www.facebook.com/search/top?q=Masar%20Tech"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs text-slate-400 hover:text-white transition-colors text-center w-full"
              >
                {t('footer.facebook_page', undefined, 'صفحة Masar Tech الرسمية على فيسبوك ↗')}
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>{t('footer.copyright', { year: currentYear }, `© ${currentYear} WatsStore — تطوير وإدارة Masar Tech - 01011653619 🇪🇬`)}</p>
          <div className="flex items-center gap-1.5">
            <span>{t('footer.made_with', undefined, 'صُنع بشغف لخدمة التجارة الإلكترونية المصرية')}</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 inline fill-rose-500" />
          </div>
        </div>
      </div>
    </footer>
  );
}
