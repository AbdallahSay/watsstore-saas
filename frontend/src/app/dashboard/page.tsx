'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { DashboardSummary } from '@/types';
import Swal from 'sweetalert2';
import { 
  ShoppingBag, 
  Receipt, 
  TrendingUp, 
  QrCode, 
  Copy, 
  ExternalLink, 
  Check, 
  Clock, 
  User, 
  Phone, 
  MapPin,
  Sparkles,
  Download,
  Crown,
  Wallet,
  Building2,
  MessageCircle,
  X,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { platformConfig } from '@/config/platformConfig';

export default function DashboardOverviewPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedQr, setCopiedQr] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'vip'>('pro');

  useEffect(() => {
    const fetchSummary = async () => {
      const token = localStorage.getItem('watsstore_token');
      if (!token) return;

      try {
        const data = await api.getDashboardSummary(token);
        setSummary(data);
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'خطأ',
          text: err.message || 'فشل في تحميل بيانات لوحة التحكم',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const copyToClipboard = (text: string, type: 'link' | 'qr' | 'wallet') => {
    navigator.clipboard.writeText(text);
    const toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 1600,
    });

    if (type === 'qr') {
      setCopiedQr(true);
      setTimeout(() => setCopiedQr(false), 2000);
      toast.fire({ icon: 'success', title: 'تم نسخ رابط الـ QR الدائم' });
    } else if (type === 'wallet') {
      setCopiedWallet(true);
      setTimeout(() => setCopiedWallet(false), 2000);
      toast.fire({ icon: 'success', title: 'تم نسخ رقم فودافون كاش / إنستاباي' });
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast.fire({ icon: 'success', title: 'تم نسخ رابط المتجر' });
    }
  };

  const handleDownloadQr = (qrCodeUrl: string, storeName: string) => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `QR-${storeName.replace(/\s+/g, '-')}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    const toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
    });
    toast.fire({ icon: 'success', title: 'جاري تحميل كود QR للطباعة...' });
  };

  const openWhatsAppUpgrade = (plan: 'pro' | 'vip') => {
    const planName = plan === 'vip' ? 'باقة النخبة VIP (299 ج.م/شهر)' : 'باقة المحترفين Pro (149 ج.م/شهر)';
    const text = encodeURIComponent(
      `مرحباً Masar Tech، قمت بتحويل الرسوم وأرغب في تفعيل [${planName}] لمتجري:\n• اسم المتجر: ${summary?.storeInfo.storeName}\n• الرابط: ${summary?.storeInfo.slug}\n(مرفق صورة إشعار التحويل)`
    );
    window.open(`https://wa.me/${platformConfig.supportWhatsApp}?text=${text}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-center py-20 text-slate-500">
        تعذر تحميل بيانات المتجر. يرجى إعادة تسجيل الدخول.
      </div>
    );
  }

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const storeUrl = `${appUrl}/s/${summary.storeInfo.slug}`;
  const qrUrl = `${appUrl}/m/${summary.storeInfo.publicCode}`;
  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(qrUrl)}&format=png`;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Welcome Card */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-300" />
                <span>باقة المتجر: {summary.storeInfo.planType}</span>
              </span>
              {summary.storeInfo.planType === 'Free' && (
                <button
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="text-[11px] font-black bg-amber-400 hover:bg-amber-300 text-slate-950 px-2.5 py-0.5 rounded-full shadow transition-all"
                >
                  ترقية الباقة 💎
                </button>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">
              أهلاً بك، {summary.storeInfo.ownerName}! 👋
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1">
              إليك أحدث مؤشرات مبيعات متجر &quot;{summary.storeInfo.storeName}&quot; في {summary.storeInfo.city}.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-2xl font-black text-xs sm:text-sm shadow-md flex items-center gap-1.5 transition-all hover:scale-105"
            >
              <Crown className="w-4 h-4 text-amber-900" />
              <span>ترقية الباقة</span>
            </button>
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-2xl font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all hover:scale-105"
            >
              <span>زيارة المتجر الحي</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Metric 1 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block">إجمالي المنتجات</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">
                {summary.totalProducts}
              </span>
              {summary.storeInfo.planType === 'Free' && (
                <span className="text-xs font-bold text-slate-400">/ 15 متاح</span>
              )}
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <Receipt className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block">إجمالي الطلبات المسجلة</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 block mt-0.5">
              {summary.totalOrders}
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block">إجمالي قيمة المبيعات</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 block mt-0.5">
              {summary.totalRevenue.toFixed(2)}{' '}
              <span className="text-xs font-bold text-slate-500">{summary.storeInfo.currency}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Downloadable Store QR Code Card & Sharing Links */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">رمز QR الدائم وبطاقة المطبوعات</h2>
              <p className="text-xs text-slate-500">
                الرمز الدائم لا يتغير أبداً حتى لو قمت بتغيير اسم المتجر أو رابطه مستقبلاً.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownloadQr(qrImageSrc, summary.storeInfo.storeName)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>تحميل رمز الـ QR للطباعة</span>
            </button>
            <button
              onClick={() => copyToClipboard(storeUrl, 'link')}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'تم النسخ' : 'نسخ رابط المتجر'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center pt-2">
          {/* QR Visual Preview */}
          <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200/80 flex flex-col items-center text-center space-y-3">
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
              <img
                src={qrImageSrc}
                alt="Store QR Code"
                className="w-36 h-36 object-contain"
              />
            </div>
            <div className="space-y-1">
              <span className="font-extrabold text-slate-900 text-xs block">{summary.storeInfo.storeName}</span>
              <span className="text-[10px] text-slate-400 font-mono block">كود دائم: {summary.storeInfo.publicCode}</span>
            </div>
          </div>

          {/* Links Inputs */}
          <div className="md:col-span-2 space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-xs font-bold text-slate-700 block">رابط المتجر الحي الكامل (Online Web Store):</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={storeUrl}
                  className="w-full text-xs font-mono text-slate-700 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200"
                />
                <button
                  onClick={() => copyToClipboard(storeUrl, 'link')}
                  className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shrink-0 flex items-center gap-1.5"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'تم' : 'نسخ'}</span>
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-xs font-bold text-slate-700 block">رابط التحويل الدائم المختصر (للبطاقات والملصقات):</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={qrUrl}
                  className="w-full text-xs font-mono text-slate-700 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200"
                />
                <button
                  onClick={() => copyToClipboard(qrUrl, 'qr')}
                  className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 shrink-0 flex items-center gap-1.5"
                >
                  {copiedQr ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedQr ? 'تم' : 'نسخ'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders List */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Receipt className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">سجل أحدث الطلبات (آخر 20 طلب)</h2>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {summary.recentOrders.length} طلب
          </span>
        </div>

        {summary.recentOrders.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6 stroke-1" />
            </div>
            <p className="text-xs text-slate-500">لا توجد طلبات مسجلة حتى الآن. ستظهر الطلبات فور قيام زبائنك بالطلب من المتجر.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold">
                  <th className="py-3 px-2">رقم الطلب</th>
                  <th className="py-3 px-2">العميل والهاتف</th>
                  <th className="py-3 px-2">طريقة الدفع</th>
                  <th className="py-3 px-2">عنوان التوصيل</th>
                  <th className="py-3 px-2">المنتجات المطلوبة</th>
                  <th className="py-3 px-2">الإجمالي</th>
                  <th className="py-3 px-2">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {summary.recentOrders.map((order) => {
                  let items: any[] = [];
                  try {
                    items = JSON.parse(order.itemsJson);
                  } catch {
                    items = [];
                  }

                  return (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-2 font-black text-emerald-600">
                        #{order.orderNumber}
                      </td>
                      <td className="py-3 px-2">
                        <div className="font-bold text-slate-900">{order.customerName}</div>
                        <div className="text-slate-400 dir-ltr text-right">{order.customerPhone}</div>
                      </td>
                      <td className="py-3 px-2">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 font-bold text-[11px] text-slate-800 border border-slate-200">
                          {order.paymentMethod || 'الدفع عند الاستلام'}
                        </span>
                      </td>
                      <td className="py-3 px-2 max-w-[160px] truncate">
                        {order.customerAddress}
                      </td>
                      <td className="py-3 px-2">
                        <div className="space-y-0.5">
                          {items.map((it: any, i: number) => (
                            <div key={i} className="text-[11px]">
                              <span className="font-semibold">{it.productName}</span>{' '}
                              <span className="text-slate-400">({it.quantity}x)</span>
                              {it.selectedVariants && (
                                <span className="text-emerald-600 text-[10px] mr-1">
                                  [{Object.values(it.selectedVariants).join(', ')}]
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-2 font-black text-slate-900">
                        {order.totalAmount.toFixed(2)} {summary.storeInfo.currency}
                      </td>
                      <td className="py-3 px-2 text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString('ar-EG', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Floating WhatsApp Support Button */}
      <a
        href={`https://wa.me/${platformConfig.supportWhatsApp}?text=${encodeURIComponent(
          `مرحباً Masar Tech، أحتاج إلى دعم فني أو استفسار حول متجري (${summary.storeInfo.storeName}) على منصة WatsStore.`
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-40 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-2.5 transition-all hover:scale-105 border-2 border-white"
      >
        <MessageCircle className="w-5 h-5 fill-white stroke-emerald-600" />
        <span className="font-black text-xs hidden sm:inline">💬 دعم Masar Tech وتفعيل الباقات</span>
      </a>

      {/* Plan Upgrade Modal */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 border border-slate-200 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-black text-slate-900">ترقية باقة المتجر — Masar Tech</h3>
              </div>
              <button
                onClick={() => setIsUpgradeModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Plans Tabs */}
            <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setSelectedPlan('pro')}
                className={`py-3 px-4 rounded-xl font-black text-xs sm:text-sm transition-all ${
                  selectedPlan === 'pro'
                    ? 'bg-white text-emerald-700 shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                باقة Pro (149 ج.م/شهر) ⭐
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlan('vip')}
                className={`py-3 px-4 rounded-xl font-black text-xs sm:text-sm transition-all ${
                  selectedPlan === 'vip'
                    ? 'bg-white text-emerald-700 shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                باقة VIP (299 ج.م/شهر) 👑
              </button>
            </div>

            {/* Plan Details Card */}
            {selectedPlan === 'pro' ? (
              <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                <div className="flex items-baseline justify-between">
                  <h4 className="font-extrabold text-emerald-950 text-base">باقة المحترفين (Pro)</h4>
                  <span className="text-xl font-black text-emerald-700">149 ج.م <span className="text-xs font-semibold">/ شهرياً</span></span>
                </div>
                <ul className="text-xs text-emerald-900 space-y-2 pt-2">
                  {platformConfig.pricing.pro.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
                <div className="flex items-baseline justify-between">
                  <h4 className="font-extrabold text-amber-950 text-base">باقة النخبة (VIP)</h4>
                  <span className="text-xl font-black text-amber-700">299 ج.م <span className="text-xs font-semibold">/ شهرياً</span></span>
                </div>
                <ul className="text-xs text-amber-900 space-y-2 pt-2">
                  {platformConfig.pricing.vip.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Payment Details Box */}
            <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3">
              <span className="text-xs font-bold text-slate-400 block">طريقة الدفع والتفعيل المباشر:</span>
              <p className="text-xs text-slate-300 leading-relaxed">
                يرجى تحويل مبلغ الاشتراك عبر <b>فودافون كاش أو إنستاباي</b> إلى الرقم الرسمي التالي التابع لإدارة <b>Masar Tech</b>:
              </p>
              
              <div className="p-3 bg-white/10 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Wallet className="w-5 h-5 text-emerald-400" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">رقم فودافون كاش وإنستاباي الموحد:</span>
                    <span className="font-mono font-black text-base tracking-wider text-amber-300">
                      {platformConfig.subscriptionWalletNumber}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => copyToClipboard(platformConfig.subscriptionWalletNumber, 'wallet')}
                  className="px-3 py-1.5 bg-white text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0"
                >
                  {copiedWallet ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedWallet ? 'تم النسخ' : 'نسخ الرقم'}</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => openWhatsAppUpgrade(selectedPlan)}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                <MessageCircle className="w-5 h-5" />
                <span>إرسال إيصال التحويل لتفعيل الباقة فوراً عبر واتساب</span>
              </button>
              <p className="text-center text-[11px] text-slate-400">
                فريق Masar Tech متواجد على مدار اليوم لتأكيد وتفعيل باقتك خلال 15 دقيقة.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
