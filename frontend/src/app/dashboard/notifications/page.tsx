'use client';

import { useEffect, useState } from 'react';
import { commerceApi, merchantToken } from '@/lib/commerce-api';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Smartphone,
  RefreshCw,
  Send,
  Radio,
} from 'lucide-react';

interface Delivery {
  id: string;
  orderNumber: number;
  orderStatus: string;
  state: string;
  attempts: number;
  manualRetries: number;
  lastHttpStatus?: number;
  createdAt: string;
  acceptedAt?: string;
}

interface Summary {
  enabled: boolean;
  configured: boolean;
  optedIn: number;
  deliveries: Delivery[];
}

export default function NotificationsAuditPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {

      return commerceApi<Summary>('/merchant/notifications', merchantToken()).then(async (res) => {
      setData(res);
    }).catch((_error: any) => {
      setMessage({
        text: 'إدارة إشعارات الخلفية غير متاحة حالياً. يلزم نشر إعدادات الخادم والموزّع الآمن أولاً.',
        type: 'error',
      });
    });
  }

  useEffect(() => {
    load();
  }, []);

  async function change(id?: string) {
    if (!data) return;
    setBusy(true);
    setMessage(null);
    try {
      await commerceApi(
        id ? `/merchant/notifications/deliveries/${id}/retry` : '/merchant/notifications/settings',
        merchantToken(),
        id ? 'POST' : 'PUT',
        id ? undefined : { enabled: !data.enabled }
      );
      await load();
      setMessage({
        text: id ? 'تمت إضافة محاولة الإشعار لطابور الإرسال بنجاح.' : 'تم تحديث حالة القناة بنجاح.',
        type: 'success',
      });
    } catch (e) {
      setMessage({ text: (e as Error).message, type: 'error' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Bell className="w-5 h-5" />
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">إشعارات الطلبات وتدقيق التسليم</h1>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          تنبيهات فورية للمتجر وسجل كامل بتسليم إشعارات الويب ودفع الإشعارات للطلبات الجديدة.
        </p>
      </div>

      {message && (
        <div
          role="status"
          className={`p-4 rounded-xl text-xs font-bold border transition-all ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {data && (
        <>
          {/* Channel Card */}
          <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Radio className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-extrabold text-base text-slate-900 dark:text-white">قناة Web Push الموثوقة</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {data.configured
                      ? data.enabled
                        ? 'القناة مفعلة وجاهزة لإرسال التنبيهات للأجهزة المشتركة'
                        : 'القناة مجهزة على الخادم ولكنها متوقفة مؤقتاً لهذا المتجر'
                      : 'قناة الإرسال غير مهيأة على المنصة بعد (يلزم إعداد مفاتيح VAPID)'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={busy || (!data.configured && !data.enabled)}
                  onClick={() => void change()}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold min-h-[44px] transition-colors shadow-sm ${
                    data.enabled
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {data.enabled ? 'إيقاف إشعارات القناة' : 'تفعيل إشعارات القناة'}
                </button>

                <button
                  disabled={busy}
                  onClick={() => load().catch(() => setMessage({ text: 'تعذر التحديث.', type: 'error' }))}
                  className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
                  title="تحديث التقرير"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">الأجهزة المشتركة بالمتجر:</span>
                <span className="font-bold text-slate-900 dark:text-white">{data.optedIn} جهاز</span>
              </div>
            </div>
          </section>

          {/* Delivery Audit Log */}
          <section className="space-y-4">
            <h2 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-500" />
              <span>سجل محاولات الإرسال والتدقيق ({data.deliveries.length})</span>
            </h2>

            {data.deliveries.length === 0 ? (
              <div className="py-16 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                <Bell className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="font-bold text-xs text-slate-600 dark:text-slate-300">لا توجد عمليات إرسال مسجلة لهذا المتجر</p>
                <p className="text-[11px] text-slate-400">ستظهر هنا تفاصيل تسليم إشعارات الطلبات الجديدة فور حدوثها.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.deliveries.map((d) => (
                  <article
                    key={d.id}
                    className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-xs text-slate-900 dark:text-white">
                          إشعار طلب #{d.orderNumber}
                        </h3>
                        <span className="text-[11px] font-semibold text-slate-500">({d.orderStatus})</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            d.state === 'AcceptedByProvider'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                          }`}
                        >
                          {d.state === 'AcceptedByProvider' ? 'قَبِلها المزوّد بنجاح' : d.state}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span>محاولات الإرسال: {d.attempts}</span>
                        <span>·</span>
                        <time>{new Date(d.createdAt).toLocaleString('ar-EG')}</time>
                        {d.lastHttpStatus && (
                          <>
                            <span>·</span>
                            <span>استجابة السيرفر: HTTP {d.lastHttpStatus}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {d.state === 'Failed' &&
                      d.manualRetries < 2 &&
                      (d.lastHttpStatus === 429 || (d.lastHttpStatus || 0) >= 500) && (
                        <button
                          disabled={busy || !data.configured}
                          onClick={() => void change(d.id)}
                          className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold min-h-[44px] flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>إعادة المحاولة المؤهلة</span>
                        </button>
                      )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
