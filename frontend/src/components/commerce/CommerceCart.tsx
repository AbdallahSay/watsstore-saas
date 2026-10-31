'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CartItem, Store, CreateOrderResponse } from '@/types';
import { createOrder, paymentOptions } from '@/lib/commerce-api';
import { api } from '@/lib/api';
import { useDialog } from './useDialog';

interface Props {
  store: Store; items: CartItem[]; open: boolean; english: boolean;
  close: () => void; update: (index: number, quantity: number) => void; clear: () => void;
}
export default function CommerceCart({store, items, open, english, close, update, clear}: Props) {
  const tr = (ar: string, en: string) => english ? en : ar;
  const ref = useDialog(open, close);
  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [couponBusy, setCouponBusy] = useState(false);
  const [result, setResult] = useState<CreateOrderResponse | null>(null);
  const [zoneId, setZoneId] = useState('');
  const methods = paymentOptions(store);
  const [payment, setPayment] = useState(methods[0]?.id || 'cod');
  const [channel, setChannel] = useState<'online' | 'whatsapp'>(store.checkoutMode === 'whatsapp' || !store.checkoutMode ? 'whatsapp' : 'online');
  const attempt = useRef<{hash: string; key: string} | null>(null);
  const submitting = useRef(false);
  const subtotal = items.reduce((n, x) => n + x.product.price * x.quantity, 0);
  const zone = store.shippingZones?.find(z => z.id === zoneId);
  const shipping = zone?.fee ?? store.deliveryFee;
  const money = (n: number) => `${n.toFixed(2)} ${store.currency}`;
  useEffect(() => { setDiscount(0); }, [subtotal, coupon]);
  if (!open) return null;

  async function applyCoupon() {
    setCouponBusy(true); setError('');
    try { const res = await api.applyCoupon(store.slug, {code: coupon, cartSubtotal: subtotal}); setDiscount(res.discountAmount); }
    catch (e) { setError((e as Error).message); setDiscount(0); }
    finally { setCouponBusy(false); }
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true; setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    const payload = {
      customerName: String(form.get('name')).trim(), customerPhone: String(form.get('phone')).trim(),
      customerAddress: String(form.get('address')).trim(), customerNotes: String(form.get('notes') || ''),
      paymentMethod: payment, transferReference: String(form.get('reference') || ''),
      shippingZoneId: zone?.id, governorate: zone?.governorate,
      couponCode: coupon.trim() || undefined, channel,
      items: items.map(x => ({productId: x.product.id, quantity: x.quantity, selectedVariants: x.selectedVariants})),
    };
    const hash = JSON.stringify(payload);
    // Reuse exactly the same key after a network failure, including across page reloads.
    const storageKey = `watsstore_attempt_${store.slug}`;
    try {
      let saved: {hash: string; key: string} | null = attempt.current;
      try { saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null'); } catch { /* storage unavailable */ }
      if (!saved || saved.hash !== hash) saved = {hash, key: crypto.randomUUID()};
      attempt.current = saved;
      try { sessionStorage.setItem(storageKey, JSON.stringify(saved)); } catch { /* in-memory fallback */ }
      const response = await createOrder(store.slug, {...payload, idempotencyKey: saved.key});
      setResult(response); clear();
      try { sessionStorage.removeItem(storageKey); } catch { /* optional storage */ }
      attempt.current = null;
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); submitting.current = false; }
  }

  return <div className="ws-overlay" onMouseDown={e => {if (e.target === e.currentTarget && !busy) close();}}>
    <div className="ws-cart ws-checkout" ref={ref} role="dialog" aria-modal="true" aria-labelledby="cart-title" dir={english ? 'ltr' : 'rtl'}>
      <header><h2 id="cart-title">{result ? tr('تم استلام طلبك', 'Order received') : step === 'cart' ? tr('حقيبة التسوق', 'Shopping bag') : tr('إتمام الطلب', 'Checkout')}</h2><button type="button" disabled={busy} onClick={close} aria-label={tr('إغلاق', 'Close')}>×</button></header>
      <div className="ws-cart-body">
        {result ? <div className="ws-confirmation" role="status">
          <p className="ws-eyebrow">{tr('شكراً لاختيارك', 'THANK YOU')}</p><h3>#{result.orderNumber}</h3>
          <p>{tr('طلبك بانتظار تأكيد المتجر. التحويلات تخضع للمراجعة.', 'Your order awaits merchant confirmation. Transfers require verification.')}</p>
          <strong>{money(result.totalAmount)}</strong>
          {result.trackingToken && <Link className="ws-primary-action" href={`/s/${store.slug}/orders/${result.trackingToken}`}>{tr('متابعة الطلب', 'Track order')}</Link>}
          {result.whatsAppRedirectUrl && <a className="ws-secondary-action" href={result.whatsAppRedirectUrl} target="_blank" rel="noreferrer">{tr('إرسال الطلب عبر واتساب', 'Send order on WhatsApp')}</a>}
          <button onClick={() => {setResult(null); setStep('cart'); close();}}>{tr('متابعة التسوق', 'Continue shopping')}</button>
        </div> : <>
          {items.length === 0 ? <p>{tr('حقيبتك فارغة. اكتشف منتجات المتجر.', 'Your bag is empty. Explore the collection.')}</p> : <>
            <ul className="ws-cart-items">{items.map((item, index) => <li key={`${item.product.id}-${index}`}>
              {item.product.imageUrl && <img src={item.product.imageUrl} alt="" width="64" height="80" loading="lazy"/>}
              <div><h3>{item.product.name}</h3><small>{Object.values(item.selectedVariants).join(' / ')}</small><p>{money(item.product.price)}</p>
                <div className="ws-quantity"><button disabled={busy} onClick={() => update(index, item.quantity - 1)} aria-label={tr('تقليل الكمية', 'Decrease quantity')}>−</button><span>{item.quantity}</span><button disabled={busy || item.quantity >= 1000} onClick={() => update(index, item.quantity + 1)} aria-label={tr('زيادة الكمية', 'Increase quantity')}>+</button><button disabled={busy} onClick={() => update(index, 0)}>{tr('حذف', 'Remove')}</button></div>
              </div>
            </li>)}</ul>
            <div className="ws-coupon"><label htmlFor="coupon">{tr('كود الخصم', 'Discount code')}</label><div><input id="coupon" value={coupon} maxLength={50} onChange={e => setCoupon(e.target.value)} disabled={busy}/><button onClick={applyCoupon} disabled={busy || couponBusy || !coupon.trim()}>{tr('تطبيق', 'Apply')}</button></div></div>
            <dl className="ws-totals"><div><dt>{tr('المنتجات', 'Subtotal')}</dt><dd>{money(subtotal)}</dd></div>{discount > 0 && <div><dt>{tr('الخصم', 'Discount')}</dt><dd>−{money(discount)}</dd></div>}<div><dt>{tr('التوصيل التقديري', 'Estimated delivery')}</dt><dd>{store.shippingZones?.length && !zone ? tr('يحدد عند إتمام الطلب', 'Select at checkout') : money(shipping)}</dd></div><div><dt>{tr('الإجمالي التقديري', 'Estimated total')}</dt><dd>{money(Math.max(0, subtotal - discount) + shipping)}</dd></div></dl>
            {step === 'cart' ? <button className="ws-primary-action" disabled={store.isTrialExpired} onClick={() => setStep('checkout')}>{tr('المتابعة لإتمام الطلب', 'Continue to checkout')}</button> : <form onSubmit={submit} className="ws-checkout-form">
              <button type="button" onClick={() => setStep('cart')} disabled={busy}>{tr('← العودة للحقيبة', '← Back to bag')}</button>
              <label>{tr('الاسم', 'Full name')}<input name="name" autoComplete="name" required minLength={2} maxLength={100}/></label>
              <label>{tr('رقم الموبايل المصري', 'Egyptian mobile number')}<input name="phone" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" required pattern="(?:\+?20|0020|0)?1[0125][0-9]{8}" placeholder="01012345678"/></label>
              <label>{tr('العنوان بالتفصيل', 'Delivery address')}<textarea name="address" autoComplete="street-address" required minLength={5} maxLength={300}/></label>
              {!!store.shippingZones?.length && <label>{tr('المحافظة ومنطقة التوصيل', 'Governorate & delivery zone')}<select value={zoneId} onChange={e => setZoneId(e.target.value)} required><option value="">{tr('اختر المنطقة', 'Select zone')}</option>{store.shippingZones.map(z => <option key={z.id} value={z.id}>{z.governorate} · {z.name} · {money(z.fee)}</option>)}</select>{zone?.estimate && <small>{zone.estimate}</small>}</label>}
              <label>{tr('طريقة الدفع', 'Payment method')}<select value={payment} onChange={e => setPayment(e.target.value)}>{methods.map(m => <option key={m.id} value={m.id}>{english ? m.en : m.ar}</option>)}</select></label>
              {payment !== 'cod' && <><p className="ws-transfer-info">{tr('حوّل إلى:', 'Transfer to:')} <b dir="ltr">{payment === 'instapay' ? store.instaPayAddress : store.vodafoneCashNumber}</b><br/>{tr('لن يتم تأكيد الدفع قبل مراجعة المتجر.', 'Payment is confirmed only after merchant verification.')}</p><label>{tr('مرجع التحويل', 'Transfer reference')}<input name="reference" required minLength={3} maxLength={100}/></label></>}
              <label>{tr('ملاحظات (اختياري)', 'Notes (optional)')}<textarea name="notes" maxLength={500}/></label>
              {store.checkoutMode === 'both' && <label>{tr('إتمام الطلب', 'Checkout with')}<select value={channel} onChange={e => setChannel(e.target.value as 'online' | 'whatsapp')}><option value="online">{tr('طلب مباشر من الموقع', 'Order online')}</option><option value="whatsapp">WhatsApp</option></select></label>}
              <p><small>{tr('تُراجع الأسعار والمخزون والشحن على الخادم عند إرسال الطلب.', 'Prices, stock and delivery are validated when you place your order.')}</small></p>
              <button className="ws-primary-action" disabled={busy || store.isTrialExpired || methods.length === 0} type="submit">{busy ? tr('جارٍ تسجيل الطلب…', 'Placing order…') : tr('تأكيد الطلب', 'Place order')}</button>
            </form>}
          </>}
        </>}
        {error && <p className="ws-error" role="alert">{error}</p>}
      </div>
    </div>
  </div>;
}
