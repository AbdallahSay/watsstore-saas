'use client';
import { useEffect, useRef, useState } from 'react';
import OrderConfirmation from './OrderConfirmation';
import { CartItem, Store, CreateOrderResponse } from '@/types';
import { createOrder, paymentOptions, CommerceApiError } from '@/lib/commerce-api';
import { CheckoutAttempt, checkoutKey, prepareCheckoutAttempt, readCheckoutAttempt } from '@/lib/checkout-attempt';
import { useBrowserReady } from '@/hooks/useBrowserStorage';
import { api } from '@/lib/api';
import { useDialog } from './useDialog';
import { rememberDeviceOrder } from '@/lib/customer-orders';

interface Props {
  directCheckout?: boolean; store: Store; items: CartItem[]; open: boolean; english: boolean;
  preview?: boolean;
  close: () => void; update: (index: number, quantity: number) => void; clear: () => void;
}
export default function CommerceCart({directCheckout = false, store, items, open, english, preview = false, close, update, clear}: Props) {
  const tr = (ar: string, en: string) => english ? en : ar;
  const submitting = useRef(false);
  const requestClose = () => { if (!submitting.current) close(); };
  const ref = useDialog(open, requestClose);
  const [step, setStep] = useState<'cart' | 'checkout'>(directCheckout ? 'checkout' : 'cart');
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [details, setDetails] = useState({name:'', phone:'', address:'', notes:'', reference:''});
  const [couponBusy, setCouponBusy] = useState(false);
  const couponRequest = useRef(0);
  const [result, setResult] = useState<CreateOrderResponse | null>(null);
  if (result && items.length) { setResult(null); setStep(directCheckout ? 'checkout' : 'cart'); }
  const [zoneId, setZoneId] = useState('');
  const methods = paymentOptions(store);
  const [payment, setPayment] = useState(methods[0]?.id || 'cod');
  const [channel, setChannel] = useState<'online' | 'whatsapp'>(store.checkoutMode === 'whatsapp' || !store.checkoutMode ? 'whatsapp' : 'online');
  const attempt = useRef<CheckoutAttempt | null>(null);
  const storageKey = `watsstore_attempt_${store.slug}`;
  const browserReady = useBrowserReady();
  const [restoredKey, setRestoredKey] = useState<string | null>(null);
  if (browserReady && restoredKey !== storageKey) {
    setRestoredKey(storageKey);
    let restoredAttempt: CheckoutAttempt | null = null;
    try { restoredAttempt = readCheckoutAttempt(sessionStorage.getItem(storageKey)); } catch { /* Optional browser persistence. */ }
    if (restoredAttempt) {
      const p = restoredAttempt.payload;
      setDetails({name:p.customerName, phone:p.customerPhone, address:p.customerAddress, notes:p.customerNotes || '', reference:p.transferReference || ''});
      setPayment(p.paymentMethod || 'cod'); setZoneId(p.shippingZoneId || ''); setChannel(p.channel || 'whatsapp'); setCoupon(p.couponCode || '');
      if (restoredAttempt.pending) { setUncertain(true); setStep('checkout'); setError('هناك محاولة طلب لم يتم تأكيد نتيجتها. أعد التحقق من نفس الطلب؛ لا تُنشئ طلباً جديداً.'); }
    }
  }
  useEffect(() => {
    try { attempt.current = readCheckoutAttempt(sessionStorage.getItem(storageKey)); } catch { attempt.current = null; }
  }, [storageKey]);
  const openMode = `${open}:${directCheckout}`;
  const [previousOpen, setPreviousOpen] = useState(openMode);
  if (openMode !== previousOpen) { setPreviousOpen(openMode); if (open && !uncertain) setStep(directCheckout ? 'checkout' : 'cart'); }
  const subtotal = items.reduce((n, x) => n + x.product.price * x.quantity, 0);
  const zone = store.shippingZones?.find(z => z.id === zoneId);
  const shipping = zone?.fee ?? store.deliveryFee;
  const shippingKnown = !store.shippingZones?.length || !!zone;
  const totalItems = items.reduce((count, item) => count + item.quantity, 0);
  const money = (n: number) => `${n.toFixed(2)} ${store.currency}`;
  const discountKey = JSON.stringify([subtotal, coupon]);
  const [previousDiscountKey, setPreviousDiscountKey] = useState(discountKey);
  if (previousDiscountKey !== discountKey) { setPreviousDiscountKey(discountKey); setDiscount(0); setCouponBusy(false); }
  useEffect(() => { couponRequest.current++; }, [subtotal, coupon]);
  useEffect(() => {
    if (!open || step !== 'checkout' || result || uncertain) return;
    ref.current?.querySelector<HTMLElement>('.ws-cart-body')?.scrollTo({top:0});
    ref.current?.querySelector<HTMLInputElement>('input[name="name"]')?.focus({preventScroll:true});
  }, [open, step, result, uncertain, ref]);
  if (!open) return null;

  async function applyCoupon() {
    const request = ++couponRequest.current;
    setCouponBusy(true); setError('');
    try { const res = await api.applyCoupon(store.slug, {code: coupon, cartSubtotal: subtotal}); if (request === couponRequest.current) setDiscount(res.discountAmount); }
    catch (e) { if (request === couponRequest.current) { setError((e as Error).message); setDiscount(0); } }
    finally { if (request === couponRequest.current) setCouponBusy(false); }
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || couponBusy) return;
    submitting.current = true; setBusy(true); setError('');
    if (preview) {
      // Safe preview simulation: verifies theme checkout/confirmation UX without modifying production database
      const simulated: CreateOrderResponse = {
        orderId: 'preview-simulated-order',
        orderNumber: Math.floor(100000 + Math.random() * 900000),
        status: 'Pending',
        paymentStatus: 'Pending',
        subtotal,
        discountAmount: discount,
        couponCode: coupon.trim() || undefined,
        totalAmount: Math.max(0, subtotal - discount) + shipping,
        deliveryFee: shipping,
        currency: store.currency || 'EGP',
        items: items.map(x => ({
          productId: x.product.id,
          productName: x.product.name,
          quantity: x.quantity,
          unitPrice: x.product.price,
          subtotal: x.product.price * x.quantity,
          selectedVariants: x.selectedVariants
        })),
        paymentMethod: payment,
        shippingSummary: zone ? `${zone.governorate} (${zone.name})` : undefined,
        whatsAppRedirectUrl: store.whatsAppNumber ? `https://wa.me/${store.whatsAppNumber.replace(/\D/g, '')}?text=${encodeURIComponent(`[معاينة تجريبية] طلب استعراض للقالب ${store.storeName}`)}` : '',
        formattedMessage: `[معاينة تجريبية] طلب استعراض للقالب ${store.storeName}`,
      };
      setResult(simulated);
      clear();
      setBusy(false);
      submitting.current = false;
      return;
    }
    const payload = {
      customerName: details.name.trim(), customerPhone: details.phone.trim(),
      customerAddress: details.address.trim(), customerNotes: details.notes,
      paymentMethod: payment, transferReference: details.reference,
      shippingZoneId: zone?.id, governorate: zone?.governorate,
      couponCode: coupon.trim() || undefined, channel,
      items: items.map(x => ({productId: x.product.id, quantity: x.quantity, selectedVariants: x.selectedVariants})),
    };
    try {
      const previous = attempt.current || readCheckoutAttempt(sessionStorage.getItem(storageKey));
      const saved = prepareCheckoutAttempt(payload, previous, checkoutKey);
      // Persist BEFORE sending. If private-browser storage is unavailable, do not
      // send an order whose retry key cannot be recovered after a reload.
      try { sessionStorage.setItem(storageKey, JSON.stringify(saved)); }
      catch { throw new CommerceApiError(previous?.pending ? 'تعذر حفظ بيانات إعادة المحاولة. تظل نتيجة الطلب السابق غير مؤكدة؛ لا تُنشئ طلباً جديداً.' : 'تعذر حفظ بيانات إعادة المحاولة بأمان. اسمح بتخزين بيانات الموقع ثم أعد المحاولة. لم يتم إرسال الطلب.', undefined, !!previous?.pending); }
      attempt.current = saved; setUncertain(true);
      const response = await createOrder(store.slug, {...saved.payload, idempotencyKey: saved.key});
      setResult(response);
      if (response.trackingToken) rememberDeviceOrder(store.slug, response.trackingToken, response.orderNumber);
      clear();
      try { sessionStorage.removeItem(storageKey); } catch { /* optional storage */ }
      attempt.current = null; setUncertain(false);
    } catch (e) {
      const pending = e instanceof CommerceApiError && e.uncertain;
      setUncertain(pending);
      if (attempt.current) {
        attempt.current.pending = pending;
        try { sessionStorage.setItem(storageKey, JSON.stringify(attempt.current)); } catch { /* existing saved key remains */ }
      }
      setError((e as Error).message);
    }
    finally { setBusy(false); submitting.current = false; }
  }

  return <div className="ws-overlay" onMouseDown={e => {if (e.target === e.currentTarget) requestClose();}}>
    <div className="ws-cart ws-checkout" ref={ref} role="dialog" tabIndex={-1} aria-modal="true" aria-busy={busy} aria-labelledby="cart-title" dir={english ? 'ltr' : 'rtl'}>
      <header><h2 id="cart-title">{result ? tr('تم استلام طلبك', 'Order received') : step === 'cart' ? tr('حقيبة التسوق', 'Shopping bag') : tr('إتمام الطلب', 'Checkout')}</h2><button type="button" disabled={busy} onClick={requestClose} aria-label={tr('إغلاق', 'Close')}>×</button></header>
      <div className="ws-cart-body">
        {result ? <OrderConfirmation result={result} slug={store.slug} english={english} currency={store.currency} continueShopping={() => {setResult(null);setStep('cart');close();}}/> : <>
          {items.length === 0 ? <p>{tr('حقيبتك فارغة. اكتشف منتجات المتجر.', 'Your bag is empty. Explore the collection.')}</p> : <>
            <nav className="ws-checkout-progress" aria-label={tr("خطوات الطلب", "Order steps")}><ol><li><a href="#checkout-items">1. {tr("مراجعة الحقيبة", "Review bag")}</a></li><li><a href="#checkout-customer" aria-current={step === "checkout" ? "step" : undefined} onClick={() => setStep("checkout")}>2. {tr("بيانات التوصيل", "Delivery details")}</a></li><li><a href="#checkout-payment" onClick={() => setStep("checkout")}>3. {tr("الدفع", "Payment")}</a></li><li><a href="#checkout-confirm" onClick={() => setStep("checkout")}>4. {tr("التأكيد", "Confirmation")}</a></li></ol></nav><ul id="checkout-items" className="ws-cart-items">{items.map((item, index) => <li key={`${item.product.id}-${index}`}>
              {item.product.imageUrl && <img src={item.product.imageUrl} alt="" width="64" height="80" loading="lazy"/>}
              <div><h3>{item.product.name}</h3><small>{Object.values(item.selectedVariants).join(' / ')}</small><p>{money(item.product.price)}</p>
                <div className="ws-quantity"><button disabled={busy || uncertain} onClick={() => update(index, item.quantity - 1)} aria-label={tr('تقليل الكمية', 'Decrease quantity')}>−</button><span>{item.quantity}</span><button disabled={busy || uncertain || item.quantity >= 1000} onClick={() => update(index, item.quantity + 1)} aria-label={tr('زيادة الكمية', 'Increase quantity')}>+</button><button disabled={busy || uncertain} onClick={() => update(index, 0)}>{tr('حذف', 'Remove')}</button></div>
              </div>
            </li>)}</ul>
            <div className="ws-coupon"><label htmlFor="coupon">{tr('كود الخصم', 'Discount code')}</label><div><input id="coupon" value={coupon} maxLength={50} onChange={e => setCoupon(e.target.value)} disabled={busy || uncertain}/><button onClick={applyCoupon} disabled={busy || uncertain || couponBusy || !coupon.trim()}>{tr('تطبيق', 'Apply')}</button></div></div>
            <dl className="ws-totals"><div><dt>{tr('المنتجات', 'Subtotal')}</dt><dd>{money(subtotal)}</dd></div>{discount > 0 && <div><dt>{tr('الخصم', 'Discount')}</dt><dd>−{money(discount)}</dd></div>}<div><dt>{tr('التوصيل التقديري', 'Estimated delivery')}</dt><dd>{!shippingKnown ? tr('يحدد عند إتمام الطلب', 'Select at checkout') : money(shipping)}</dd></div><div><dt>{tr('الإجمالي التقديري', 'Estimated total')}</dt><dd>{shippingKnown ? money(Math.max(0, subtotal - discount) + shipping) : tr('يظهر بعد اختيار منطقة التوصيل', 'Shown after selecting delivery zone')}</dd></div></dl>
            {step === 'cart' ? <button className="ws-primary-action" disabled={store.isTrialExpired} onClick={() => setStep('checkout')}>{tr('المتابعة لإتمام الطلب', 'Continue to checkout')}</button> : <form onSubmit={submit} className="ws-checkout-form">
              <button type="button" onClick={() => setStep('cart')} disabled={busy || uncertain}>{tr('← العودة للحقيبة', '← Back to bag')}</button>
              <fieldset id="checkout-customer" className="ws-checkout-fields" disabled={busy || uncertain}><legend>{tr("٢. العميل والتوصيل", "2. Customer & delivery")}</legend><label>{tr('الاسم', 'Full name')}<input name="name" value={details.name} onChange={e => setDetails(d => ({...d, name:e.target.value}))} autoComplete="name" required minLength={2} maxLength={100}/></label>
              <label>{tr('رقم الموبايل المصري', 'Egyptian mobile number')}<input name="phone" value={details.phone} onChange={e => setDetails(d => ({...d, phone:e.target.value}))} type="tel" inputMode="tel" autoComplete="tel" dir="ltr" required pattern="(?:\+?20|0020|0)?1[0125][0-9]{8}" placeholder="01012345678"/></label>
              <label>{tr('العنوان بالتفصيل', 'Delivery address')}<textarea name="address" value={details.address} onChange={e => setDetails(d => ({...d, address:e.target.value}))} autoComplete="street-address" required minLength={5} maxLength={300}/></label>
              {!!store.shippingZones?.length && <label>{tr('المحافظة ومنطقة التوصيل', 'Governorate & delivery zone')}<select value={zoneId} onChange={e => setZoneId(e.target.value)} required><option value="">{tr('اختر المنطقة', 'Select zone')}</option>{store.shippingZones.map(z => <option key={z.id} value={z.id}>{z.governorate} · {z.name} · {money(z.fee)}</option>)}</select>{zone?.estimate && <small>{zone.estimate}</small>}</label>}
              </fieldset><fieldset id="checkout-payment" className="ws-checkout-fields" disabled={busy || uncertain}><legend>{tr('٣. طريقة الدفع', '3. Payment method')}</legend><label>{tr('طريقة الدفع', 'Payment method')}<select value={payment} onChange={e => setPayment(e.target.value)}>{methods.map(m => <option key={m.id} value={m.id}>{english ? m.en : m.ar}</option>)}</select></label>
              {payment !== 'cod' && <><p className="ws-transfer-info">{tr('حوّل إلى:', 'Transfer to:')} <b dir="ltr">{payment === 'instapay' ? store.instaPayAddress : store.vodafoneCashNumber}</b><br/>{tr('لن يتم تأكيد الدفع قبل مراجعة المتجر.', 'Payment is confirmed only after merchant verification.')}</p><label>{tr('مرجع التحويل', 'Transfer reference')}<input name="reference" value={details.reference} onChange={e => setDetails(d => ({...d, reference:e.target.value}))} required minLength={3} maxLength={100}/></label></>}
              <label>{tr('ملاحظات (اختياري)', 'Notes (optional)')}<textarea name="notes" value={details.notes} onChange={e => setDetails(d => ({...d, notes:e.target.value}))} maxLength={500}/></label>
              {store.checkoutMode === 'both' && <label>{tr('إتمام الطلب', 'Checkout with')}<select value={channel} onChange={e => setChannel(e.target.value as 'online' | 'whatsapp')}><option value="online">{tr('طلب مباشر من الموقع', 'Order online')}</option><option value="whatsapp">WhatsApp</option></select></label>}
              </fieldset><p><small>{tr('تُراجع الأسعار والمخزون والشحن على الخادم عند إرسال الطلب.', 'Prices, stock and delivery are validated when you place your order.')}</small></p>
              <section id="checkout-confirm" className="ws-checkout-review" aria-label={tr('راجع طلبك قبل التأكيد', 'Review before placing your order')}>
                <h3>{uncertain ? tr('التحقق من الطلب السابق', 'Checking your previous order') : tr('مراجعة الطلب', 'Order review')}</h3>
                {uncertain ? <p>{tr('هنستخدم نفس بيانات المحاولة الأصلية المحفوظة. تفاصيل الطلب والقيمة المؤكدة هتظهر بعد التحقق من الخادم.', 'We will reuse the saved original request. Confirmed items and totals appear after verification with the server.')}</p> : <>
                <p className="ws-checkout-customer-summary">{details.name}<br/>{details.address}<br/><span dir="ltr">{details.phone}</span></p><p>{totalItems} {tr('منتجات', 'items')} · {methods.find(method => method.id === payment)?.[english ? 'en' : 'ar']}</p>
                {zone && <p>{zone.governorate} · {zone.name}</p>}
                <dl className="ws-totals"><div><dt>{tr('المنتجات', 'Subtotal')}</dt><dd>{money(subtotal)}</dd></div>{discount > 0 && <div><dt>{tr('الخصم', 'Discount')}</dt><dd>−{money(discount)}</dd></div>}<div><dt>{tr('التوصيل', 'Delivery')}</dt><dd>{shippingKnown ? money(shipping) : tr('اختر منطقة التوصيل', 'Select delivery zone')}</dd></div><div><dt>{tr('الإجمالي التقديري', 'Estimated total')}</dt><dd>{shippingKnown ? money(Math.max(0, subtotal - discount) + shipping) : '—'}</dd></div></dl>
                <small>{tr('القيمة النهائية المؤكدة هتظهر بعد تسجيل الطلب.', 'The confirmed final total appears after the order is created.')}</small></>}
              </section>
              <button className="ws-primary-action" disabled={busy || couponBusy || store.isTrialExpired || methods.length === 0} type="submit">{busy ? tr('جارٍ التحقق من الطلب…', 'Checking order…') : uncertain ? tr('إعادة التحقق من نفس الطلب', 'Check the same order again') : tr('تأكيد الطلب', 'Place order')}</button>
            </form>}
          </>}
        </>}
        {error && <p className="ws-error" role="alert">{error}</p>}
      </div>
    </div>
  </div>;
}
