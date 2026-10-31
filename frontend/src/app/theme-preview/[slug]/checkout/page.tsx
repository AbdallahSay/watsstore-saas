'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { readPreviewCart, clearPreviewCart, type PreviewCartLine } from '@/lib/preview-cart';
import type { Store, Product, CreateOrderResponse } from '@/types';
import { ShoppingBag, CheckCircle2, ArrowRight } from 'lucide-react';

export default function PreviewCheckoutPage() {
  const { slug } = useParams<{ slug: string }>();
  const search = useSearchParams();
  const productId = search.get('product');
  const cartMode = search.get('cart') === '1';
  const [cartLines, setCartLines] = useState<PreviewCartLine[]>([]);
  useEffect(() => { if (slug && cartMode) setCartLines(readPreviewCart(slug)); }, [slug, cartMode]);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState<CreateOrderResponse | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [form, setForm] = useState({ customerName: '', customerPhone: '', customerAddress: '', customerNotes: '' });

  useEffect(() => {
    if (!slug) return;
    let active = true;
    api.getPublicStore(slug).then(data => { if (active) setStore(data); })
      .catch(() => { if (active) setError('تعذر جلب بيانات المتجر.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  const product: Product | undefined = store?.products.find(p => p.id === productId);
  const cartProducts = cartMode ? cartLines.map(l => ({ line: l, product: store?.products.find(p => p.id === l.productId) })).filter((x): x is {line: PreviewCartLine; product: Product} => !!x.product && x.product.isAvailable && !x.product.variantsJson) : [];
  const price = cartMode ? cartProducts.reduce((sum,x) => sum + x.line.quantity * x.product.price, 0) : (product ? product.price * quantity : 0);
  const estimatedDelivery = store?.deliveryFee ?? 0;

  async function submitOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!store || sending || success || (cartMode ? cartProducts.length === 0 : !product?.isAvailable)) return;
    if (!/^01[0125][0-9]{8}$/.test(form.customerPhone.trim())) {
      setError('من فضلك أدخل رقم موبايل مصري صحيح مكون من 11 رقم.');
      return;
    }
    setError('');
    setSending(true);
    try {
      const result = await api.createWhatsAppOrder(store.slug, {
        ...form,
        paymentMethod: 'الدفع عند الاستلام',
        items: cartMode ? cartProducts.map(x => ({ productId: x.product.id, quantity: x.line.quantity })) : [{ productId: product!.id, quantity }],
      });
      setSuccess(result);
      if (cartMode) { clearPreviewCart(store.slug); setCartLines([]); }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تسجيل الطلب. تأكد من الاتصال وحاول مرة أخرى.');
    } finally {
      setSending(false);
    }
  }

  if (loading) return <main dir="rtl" role="status" className="min-h-screen p-8 text-center">جاري تحميل الطلب...</main>;
  if (!store || (!success && (cartMode ? cartProducts.length === 0 : (!product || !productId)))) return <main dir="rtl" className="min-h-screen p-8 text-center">
    <p role="alert">{error || 'المنتج غير موجود أو لم يعد متاحاً.'}</p>
    <Link className="underline" href={`/theme-preview/${encodeURIComponent(slug)}`}>الرجوع للمتجر</Link>
  </main>;

  return <main dir="rtl" className="min-h-screen bg-[#f7f7f5] text-slate-900 px-4 py-8 sm:py-14">
    <div className="max-w-4xl mx-auto">
      <Link className="inline-flex items-center gap-2 text-sm text-slate-600 mb-8 hover:text-black" href={`/theme-preview/${encodeURIComponent(slug)}`}>
        <ArrowRight size={16}/> العودة إلى {store.storeName}
      </Link>
      {success ? <section role="status" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-12 text-center">
        <CheckCircle2 className="mx-auto text-emerald-600" size={52}/>
        <h1 className="text-2xl font-extrabold mt-4">تم تسجيل طلبك بنجاح</h1>
        <p className="text-slate-600 mt-2">رقم الطلب: <b dir="ltr">{success.orderNumber}</b></p>
        <p className="text-sm text-slate-500 mt-4">تم إرسال الطلب إلى المتجر. احتفظ برقم الطلب للرجوع إليه عند التواصل مع التاجر.</p>
        <p className="text-lg font-bold mt-6">{success.totalAmount.toLocaleString('ar-EG')} {store.currency}</p>
        {success.whatsAppRedirectUrl && <a className="inline-flex mt-6 min-h-11 items-center rounded-xl bg-slate-900 text-white px-6 font-semibold" href={success.whatsAppRedirectUrl} target="_blank" rel="noopener noreferrer">التواصل اختياريًا عبر واتساب</a>}
      </section> :
      <>
        <div className="mb-8"><p className="text-xs uppercase tracking-widest text-slate-500">WatsStore · تجربة الطلب المباشر</p><h1 className="text-3xl font-extrabold mt-2">إتمام طلبك أونلاين</h1><p className="text-slate-600 mt-2">الطلب بيتسجل من الموقع مباشرة من غير فتح واتساب. الدفع عند الاستلام.</p></div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
          <form onSubmit={submitOrder} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8 space-y-5">
            <h2 className="text-xl font-bold">بيانات استلام الطلب</h2>
            <label className="block text-sm font-bold">الاسم بالكامل
              <input required autoComplete="name" maxLength={120} value={form.customerName} onChange={e=>setForm({...form,customerName:e.target.value})} className="mt-2 w-full h-12 rounded-xl border border-slate-300 px-3 focus:outline-2 focus:outline-blue-600" placeholder="الاسم بالكامل"/>
            </label>
            <label className="block text-sm font-bold">رقم الموبايل
              <input required type="tel" dir="ltr" inputMode="tel" autoComplete="tel" maxLength={11} pattern="01[0125][0-9]{8}" value={form.customerPhone} onChange={e=>setForm({...form,customerPhone:e.target.value})} className="mt-2 w-full h-12 rounded-xl border border-slate-300 px-3 text-left focus:outline-2 focus:outline-blue-600" placeholder="01XXXXXXXXX"/>
            </label>
            <label className="block text-sm font-bold">عنوان التوصيل بالتفصيل
              <textarea required minLength={8} maxLength={500} rows={3} autoComplete="street-address" value={form.customerAddress} onChange={e=>setForm({...form,customerAddress:e.target.value})} className="mt-2 w-full rounded-xl border border-slate-300 p-3 focus:outline-2 focus:outline-blue-600" placeholder="المحافظة، المنطقة، الشارع، رقم العقار"/>
            </label>
            <label className="block text-sm font-bold">ملاحظات (اختياري)
              <textarea rows={2} maxLength={500} value={form.customerNotes} onChange={e=>setForm({...form,customerNotes:e.target.value})} className="mt-2 w-full rounded-xl border border-slate-300 p-3 focus:outline-2 focus:outline-blue-600"/>
            </label>
            <p className="text-sm text-slate-600">طريقة الدفع: <strong>الدفع عند الاستلام</strong></p>
            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <button disabled={sending || (cartMode ? !cartProducts.length : !product?.isAvailable)} type="submit" className="w-full min-h-12 rounded-xl bg-slate-900 text-white font-bold disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
              {sending ? 'جاري تسجيل الطلب...' : (cartMode ? !cartProducts.length : !product?.isAvailable) ? 'المنتج غير متوفر' : 'تأكيد الطلب أونلاين'}
            </button>
          </form>
          <aside className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 lg:sticky lg:top-6">
            <h2 className="font-bold text-lg mb-5 flex items-center gap-2"><ShoppingBag size={20}/> ملخص الطلب</h2>
            {cartMode ? <div className="space-y-4">{cartProducts.map(({line,product: item}) => <div key={item.id} className="flex gap-3 border-b pb-3">
              {item.imageUrl && <img src={item.imageUrl} alt="" className="w-16 h-20 object-cover rounded-lg"/>}
              <div className="flex-1"><p className="font-semibold text-sm">{item.name}</p><p className="text-sm text-slate-500">{item.price.toLocaleString('ar-EG')} {store.currency} × {line.quantity}</p></div>
            </div>)}</div> : <><div className="flex gap-3">
              {product?.imageUrl && <img src={product.imageUrl} alt="" className="w-20 h-24 object-cover rounded-lg"/>}
              <div className="min-w-0"><p className="font-semibold">{product?.name}</p><p className="text-sm text-slate-500">{product?.price.toLocaleString('ar-EG')} {store.currency}</p></div>
            </div>
            <label className="flex gap-3 items-center justify-between mt-6 text-sm font-semibold">الكمية
              <input type="number" min={1} max={99} value={quantity} onChange={e=>setQuantity(Math.max(1,Math.min(99,Math.floor(Number(e.target.value)||1))))} className="w-20 h-11 border border-slate-300 rounded-lg text-center" />
            </label></>}
            <div className="border-t border-slate-200 mt-5 pt-4 text-sm space-y-3">
              <div className="flex justify-between"><span>المنتجات</span><span>{price.toLocaleString('ar-EG')} {store.currency}</span></div>
              <div className="flex justify-between"><span>التوصيل (تقديري)</span><span>{estimatedDelivery.toLocaleString('ar-EG')} {store.currency}</span></div>
              <div className="flex justify-between font-bold text-lg border-t pt-4"><span>الإجمالي التقديري</span><span>{(price+estimatedDelivery).toLocaleString('ar-EG')} {store.currency}</span></div>
              <p className="text-xs leading-5 text-slate-500">الإجمالي النهائي والخصومات يحسبهم السيرفر عند تسجيل الطلب.</p>
            </div>
          </aside>
        </div>
      </>}
    </div>
  </main>;
}
