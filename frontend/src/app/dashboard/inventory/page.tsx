'use client';

import { useEffect, useState } from 'react';
import { Product } from '@/types';
import { api } from '@/lib/api';
import { commerceApi, merchantToken } from '@/lib/commerce-api';
import {
  Package,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Minus,
  Sliders,
  Layers,
  ArrowUpDown,
  Search,
} from 'lucide-react';

interface Stock {
  id: string;
  productId: string;
  variantKey: string;
  quantity: number;
  lowStockThreshold: number;
  selectedVariantsJson: string;
}

export default function InventoryManagementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [variants, setVariants] = useState<Record<string, string>>({});
  const [trackVariant, setTrackVariant] = useState(false);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const token = merchantToken();
    const [p, s] = await Promise.all([
      api.getProducts(token),
      commerceApi<Stock[]>('/merchant/commerce/inventory', token),
    ]);
    setProducts(p);
    setStocks(s);
  }

  useEffect(() => {
    load().catch((e) => setMessage({ text: (e as Error).message, type: 'error' }));
  }, []);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  let groups: { name: string; options: string[] }[] = [];
  try {
    groups = JSON.parse(selectedProduct?.variantsJson || '[]');
  } catch {
    /* ignore json parse */
  }

  async function adjustStock(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setMessage(null);
    try {
      await commerceApi(
        `/merchant/commerce/inventory/${selectedProductId}`,
        merchantToken(),
        'POST',
        {
          selectedVariants: trackVariant ? variants : {},
          adjustment: Number(data.get('adjustment')),
          lowStockThreshold: Number(data.get('threshold')),
          reason: String(data.get('reason')),
        }
      );
      await load();
      setMessage({ text: 'تم تسجيل تعديل المخزون بنجاح.', type: 'success' });
      form.reset();
    } catch (e) {
      setMessage({ text: (e as Error).message, type: 'error' });
    } finally {
      setBusy(false);
    }
  }

  const filteredStocks = stocks.filter((s) => {
    const p = products.find((prod) => prod.id === s.productId);
    const q = search.trim().toLowerCase();
    return !q || p?.name.toLowerCase().includes(q) || s.variantKey.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Package className="w-5 h-5" />
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">إدارة المخزون وتتبع الكميات</h1>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          تتبع دقيق لمخزون المنتجات والمتغيرات، تنبيهات عند اقتراب النفاد، والخصم التلقائي مع كل طلب جديد.
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

      {/* Adjustment Form Card */}
      <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
        <div>
          <h2 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <ArrowUpDown className="w-5 h-5 text-emerald-500" />
            <span>تسجيل حركة مخزون جديدة (+ إضافة / − خصم)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            أدخل قيمة موجبة للإضافة (مثلاً +20) أو سالبة للخصم اليدوي (مثلاً -5).
          </p>
        </div>

        <form onSubmit={adjustStock} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            اختر المنتج المطلوب
            <select
              required
              className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs mt-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                setVariants({});
                setTrackVariant(false);
              }}
            >
              <option value="">اختر منتجاً من القائمة...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.price} ج.م)
                </option>
              ))}
            </select>
          </label>

          {!!groups.length && (
            <div className="sm:col-span-2 flex items-center gap-2 pt-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer min-h-[44px]">
                <input
                  type="checkbox"
                  checked={trackVariant}
                  onChange={(e) => {
                    setTrackVariant(e.target.checked);
                    setVariants(Object.fromEntries(groups.map((g) => [g.name, g.options[0]])));
                  }}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>تتبع كمية اختيار/متغير محدد بدلاً من إجمالي المنتج (مثلاً مقاس L ولون أسود)</span>
              </label>
            </div>
          )}

          {trackVariant &&
            groups.map((g) => (
              <label key={g.name} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {g.name}
                <select
                  className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs mt-1.5"
                  value={variants[g.name] || ''}
                  onChange={(e) => setVariants((v) => ({ ...v, [g.name]: e.target.value }))}
                >
                  {g.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </label>
            ))}

          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            مقدار التعديل (+ إضافة / − خصم)
            <input
              type="number"
              name="adjustment"
              required
              min={-1000000}
              max={1000000}
              placeholder="مثال: 50 أو -10"
              className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs mt-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>

          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            حد تنبيه المخزون المنخفض
            <input
              type="number"
              name="threshold"
              min={0}
              max={1000000}
              defaultValue={5}
              required
              className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs mt-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>

          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 sm:col-span-2">
            سبب الحركة والملاحظات
            <input
              name="reason"
              minLength={3}
              maxLength={500}
              required
              placeholder="مثال: توريد شحنة جديدة من المصنع أو تصحيح جرد دوري"
              className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs mt-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>

          <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={busy || !selectedProductId}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs min-h-[44px] transition-colors disabled:opacity-50 shadow-sm"
            >
              {busy ? 'جاري التسجيل...' : 'تسجيل وتحديث المخزون'}
            </button>
          </div>
        </form>
      </section>

      {/* Inventory Stock Cards List */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-500" />
            <span>سجلات المخزون الحالية ({stocks.length})</span>
          </h2>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 rtl:right-3 ltr:left-3 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث في المخزون..."
              className="w-full min-h-[38px] py-2 rtl:pr-9 ltr:pl-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none"
            />
          </div>
        </div>

        {filteredStocks.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <Package className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-bold text-xs text-slate-600 dark:text-slate-300">لا توجد سجلات مخزون مسجلة</p>
            <p className="text-[11px] text-slate-400">
              اختر منتجاً أعلاه وسجل أول كمية لتفعيل تتبع المخزون والخصم التلقائي.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStocks.map((s) => {
              const prod = products.find((p) => p.id === s.productId);
              const isLow = s.quantity <= s.lowStockThreshold;
              const isOut = s.quantity === 0;

              let variantText = 'إجمالي المنتج';
              try {
                const parsed = JSON.parse(s.selectedVariantsJson);
                if (Object.keys(parsed).length > 0) {
                  variantText = Object.entries(parsed)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(' · ');
                }
              } catch {
                /* default text */
              }

              return (
                <article
                  key={s.id}
                  className={`p-5 rounded-2xl border bg-white dark:bg-slate-900 flex flex-col justify-between transition-all ${
                    isOut
                      ? 'border-rose-500/60 ring-2 ring-rose-500/10'
                      : isLow
                      ? 'border-amber-500/60 ring-2 ring-amber-500/10'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                        {prod?.name || s.productId}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                          isOut
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            : isLow
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}
                      >
                        {isOut ? 'نفد المخزون' : isLow ? 'مخزون منخفض' : 'متوفر'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 mt-1">{variantText}</p>

                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900 dark:text-white">
                        {s.quantity}
                      </span>
                      <span className="text-xs text-slate-400">قطعة متوفرة</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span>حد التنبيه: {s.lowStockThreshold} قطع</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProductId(s.productId);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                    >
                      تعديل الكمية ↗
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
