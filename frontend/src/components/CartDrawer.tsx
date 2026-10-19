'use client';

import { useState } from 'react';
import { Store, CartItem, ApplyCouponResponse } from '../types';
import { api } from '../lib/api';
import { pixel } from '../lib/pixel';
import Swal from 'sweetalert2';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Send, 
  MapPin, 
  User, 
  Phone, 
  FileText,
  AlertCircle,
  Wallet,
  Building2,
  Copy,
  Check,
  CreditCard,
  Tag
} from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  store: Store;
  cartItems: CartItem[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  store,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}: CartDrawerProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('الدفع عند الاستلام');
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [copiedInstaPay, setCopiedInstaPay] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<ApplyCouponResponse | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [showCouponInput, setShowCouponInput] = useState(false);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const deliveryFee = store.deliveryFee || 0;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const totalAmount = Math.max(0, subtotal - discountAmount) + deliveryFee;

  const handleApplyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!couponCodeInput.trim()) return;
    setIsApplyingCoupon(true);
    setCouponError(null);
    try {
      const res = await api.applyCoupon(store.slug, {
        code: couponCodeInput.trim(),
        cartSubtotal: subtotal
      });
      setAppliedCoupon(res);
      setCouponCodeInput(res.code);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: res.message || 'تم تفعيل كود الخصم بنجاح!',
        showConfirmButton: false,
        timer: 2500,
      });
    } catch (err: any) {
      setCouponError(err.message || 'كود الخصم غير صالح أو منتهي الصلاحية');
      setAppliedCoupon(null);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput('');
    setCouponError(null);
  };

  const copyNumber = (text: string, type: 'wallet' | 'instapay') => {
    navigator.clipboard.writeText(text);
    if (type === 'wallet') {
      setCopiedWallet(true);
      setTimeout(() => setCopiedWallet(false), 2000);
    } else {
      setCopiedInstaPay(true);
      setTimeout(() => setCopiedInstaPay(false), 2000);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (cartItems.length === 0) {
      setFormError('سلة المشتريات فارغة');
      return;
    }

    if (!customerName.trim()) {
      setFormError('يرجى إدخال اسم العميل');
      return;
    }

    const cleanPhone = customerPhone.replace(/[\s-+]/g, '');
    const isEgyptianMobile = /^(?:01[0125]\d{8}|201[0125]\d{8}|00201[0125]\d{8}|1[0125]\d{8})$/.test(cleanPhone);
    if (!isEgyptianMobile) {
      setFormError('يرجى إدخال رقم هاتف محمول مصري صحيح (مثال: 01012345678)');
      return;
    }

    if (!customerAddress.trim()) {
      setFormError('يرجى إدخال عنوان التوصيل بالتفصيل');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        customerNotes: customerNotes.trim() ? customerNotes.trim() : undefined,
        paymentMethod: paymentMethod,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        items: cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          selectedVariants: Object.keys(item.selectedVariants).length > 0 
            ? item.selectedVariants 
            : undefined,
        })),
      };

      const result = await api.createWhatsAppOrder(store.slug, orderPayload);

      // Fire Meta Pixel Purchase event for merchant pixel
      if (store.metaPixelId) {
        pixel.purchase(store.metaPixelId, {
          content_ids: cartItems.map((i) => i.product.id),
          content_type: 'product',
          value: totalAmount,
          currency: 'EGP',
          num_items: cartItems.reduce((acc, i) => acc + i.quantity, 0),
        });
      }

      // Also fire on platform pixel if present
      const platformPixelId = process.env.NEXT_PUBLIC_PLATFORM_META_PIXEL_ID;
      if (platformPixelId) {
        pixel.lead(platformPixelId, {
          order_id: result.orderId,
          value: totalAmount,
        });
      }

      // SweetAlert2 confirmation
      await Swal.fire({
        title: 'تم تسجيل طلبك بنجاح! 🎉',
        html: `
          <div style="direction: rtl; text-align: right; font-family: inherit;">
            <p style="margin-bottom: 6px;"><strong>رقم الطلب:</strong> #${result.orderNumber}</p>
            <p style="margin-bottom: 6px;"><strong>طريقة الدفع:</strong> ${paymentMethod}</p>
            <p style="margin-bottom: 6px;"><strong>الإجمالي:</strong> ${result.totalAmount.toFixed(2)} ${store.currency}</p>
            <p style="color: #059669; font-size: 13px; margin-top: 10px;">سيتم توجيهك الآن إلى الواتساب لإرسال الفاتورة وتأكيد الطلب مع المتجر مباشرة.</p>
          </div>
        `,
        icon: 'success',
        confirmButtonText: 'الانتقال إلى الواتساب 💬',
        confirmButtonColor: '#10B981',
        allowOutsideClick: false,
      });

      onClearCart();
      onClose();

      // Redirect customer to merchant WhatsApp
      if (typeof window !== 'undefined' && result.whatsAppRedirectUrl) {
        window.location.href = result.whatsAppRedirectUrl;
      }
    } catch (err: any) {
      setFormError(err.message || 'حدث خطأ أثناء تجهيز الطلب. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 h-full shadow-2xl flex flex-col justify-between overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 dark:text-white text-base">سلة التسوق</h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">{cartItems.length} منتج في السلة</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700 transition-colors"
            aria-label="إغلاق السلة"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {cartItems.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-8 h-8 stroke-1" />
              </div>
              <h3 className="font-bold text-slate-700 dark:text-slate-200 text-base">السلة فارغة حالياً</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                تصفح المنتجات في المتجر وأضف ما يعجبك لإرسال الطلب بسهولة عبر الواتساب.
              </p>
            </div>
          ) : (
            <>
              {/* Items List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">المنتجات المختارة</span>
                  <button
                    onClick={onClearCart}
                    className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>إفراغ السلة</span>
                  </button>
                </div>

                {cartItems.map((item, idx) => {
                  const lineTotal = item.product.price * item.quantity;
                  const variants = Object.entries(item.selectedVariants);

                  return (
                    <div
                      key={`${item.product.id}-${idx}`}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex gap-3 items-center"
                    >
                      {item.product.imageUrl && (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-14 h-14 rounded-xl object-cover bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                      )}

                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                          {item.product.name}
                        </h4>

                        {variants.length > 0 && (
                          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium truncate mt-0.5">
                            {variants.map(([k, v]) => `${k}: ${v}`).join(' | ')}
                          </p>
                        )}

                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">
                          {lineTotal.toFixed(2)} {store.currency}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(idx, item.quantity - 1)}
                          className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold"
                          aria-label="إنقاص"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-black text-slate-900 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(idx, item.quantity + 1)}
                          className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold"
                          aria-label="زيادة"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(idx)}
                        className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                        aria-label="حذف المنتج"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Customer Info & Payment Method Form */}
              <form onSubmit={handleSubmitOrder} className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>بيانات استلام الطلب</span>
                </h3>

                {formError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2 font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الاسم بالكامل *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="مثال: محمد أحمد"
                    className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    رقم هاتف الواتساب *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="مثال: 01012345678"
                    className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    عنوان التوصيل بالتفصيل *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="المحافظة، المنطقة، اسم الشارع، رقم العمارة أو علامة مميزة"
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>طريقة الدفع المفضلة *</span>
                  </label>

                  <div className="space-y-2">
                    {/* 1. Cash on Delivery */}
                    <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'الدفع عند الاستلام'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="الدفع عند الاستلام"
                        checked={paymentMethod === 'الدفع عند الاستلام'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 dark:text-white block">💵 الدفع عند الاستلام (Cash on Delivery)</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">الدفع نقداً للمندوب عند استلام ومعاينة الطلب.</span>
                      </div>
                    </label>

                    {/* 2. Vodafone Cash / E-Wallets */}
                    {store.vodafoneCashNumber && (
                      <label className={`flex flex-col gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                        paymentMethod === 'محفظة إلكترونية (فودافون كاش / محافظ الجوال)'
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}>
                        <div className="flex items-start gap-2.5">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="محفظة إلكترونية (فودافون كاش / محافظ الجوال)"
                            checked={paymentMethod === 'محفظة إلكترونية (فودافون كاش / محافظ الجوال)'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                          />
                          <div className="text-xs flex-1">
                            <span className="font-bold text-slate-900 dark:text-white block flex items-center gap-1">
                              <span>📱 محفظة إلكترونية (فودافون كاش / محافظ الجوال)</span>
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">تحويل سريع عبر محافظ الجوال قبل أو بعد تأكيد الطلب.</span>
                          </div>
                        </div>

                        {paymentMethod === 'محفظة إلكترونية (فودافون كاش / محافظ الجوال)' && (
                          <div className="mr-6 p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-emerald-200 dark:border-emerald-800 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">رقم المحفظة للتحويل:</span>
                              <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 dark:text-white">
                                <span>{store.vodafoneCashNumber}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    copyNumber(store.vodafoneCashNumber!, 'wallet');
                                  }}
                                  className="p-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"
                                  title="نسخ الرقم"
                                >
                                  {copiedWallet ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                            <p className="text-[10px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-1.5 rounded leading-relaxed border border-amber-200/60 dark:border-amber-800/60">
                              ⚠️ يرجى تحويل المبلغ وإرسال صورة التحويل في محادثة الواتساب بعد إتمام الطلب لتأكيد الحجز فوراً.
                            </p>
                          </div>
                        )}
                      </label>
                    )}

                    {/* 3. InstaPay */}
                    {store.instaPayAddress && (
                      <label className={`flex flex-col gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                        paymentMethod === 'إنستاباي (InstaPay)'
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}>
                        <div className="flex items-start gap-2.5">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="إنستاباي (InstaPay)"
                            checked={paymentMethod === 'إنستاباي (InstaPay)'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                          />
                          <div className="text-xs flex-1">
                            <span className="font-bold text-slate-900 dark:text-white block flex items-center gap-1">
                              <span>🏦 إنستاباي (InstaPay)</span>
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">تحويل فوري ومجاني عبر تطبيق InstaPay.</span>
                          </div>
                        </div>

                        {paymentMethod === 'إنستاباي (InstaPay)' && (
                          <div className="mr-6 p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-emerald-200 dark:border-emerald-800 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">معرف / رقم إنستاباي:</span>
                              <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 dark:text-white">
                                <span>{store.instaPayAddress}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    copyNumber(store.instaPayAddress!, 'instapay');
                                  }}
                                  className="p-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"
                                  title="نسخ المعرف"
                                >
                                  {copiedInstaPay ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                            <p className="text-[10px] text-purple-800 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 p-1.5 rounded leading-relaxed border border-purple-200/60 dark:border-purple-800/60">
                              ⚠️ يرجى تحويل المبلغ وإرسال صورة التحويل في محادثة الواتساب بعد إتمام الطلب لتأكيد الحجز فوراً.
                            </p>
                          </div>
                        )}
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ملاحظات إضافية (اختياري)
                  </label>
                  <input
                    type="text"
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="أي تعليمات خاصة للمتجر أو المندوب"
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </form>
            </>
          )}
        </div>

        {/* Drawer Footer / Summary */}
        {cartItems.length > 0 && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 space-y-3">
            {/* Promo Code Box */}
            <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              {!appliedCoupon ? (
                showCouponInput ? (
                  <form onSubmit={handleApplyCoupon} className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <div className="relative flex-1">
                        <Tag className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={couponCodeInput}
                          onChange={(e) => {
                            setCouponCodeInput(e.target.value.toUpperCase());
                            if (couponError) setCouponError(null);
                          }}
                          placeholder="كود الخصم (مثل MASAR10)"
                          className="w-full text-xs font-mono font-bold pr-7 pl-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 uppercase tracking-wider"
                          disabled={isApplyingCoupon}
                          autoFocus
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isApplyingCoupon || !couponCodeInput.trim()}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all"
                      >
                        {isApplyingCoupon ? 'تحقق...' : 'تطبيق'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowCouponInput(false); setCouponError(null); }}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg text-xs"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        <span>{couponError}</span>
                      </p>
                    )}
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCouponInput(true)}
                    className="w-full flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-bold group"
                  >
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:rotate-12 transition-transform" />
                      <span>لديك كود خصم أو كوبون تخفيض؟</span>
                    </span>
                    <span className="text-[11px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      أدخل الكود
                    </span>
                  </button>
                )
              ) : (
                <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                      ✓
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-emerald-900 dark:text-emerald-200 text-xs tracking-wider">
                          {appliedCoupon.code}
                        </span>
                        <span className="text-[10px] bg-emerald-200/80 dark:bg-emerald-800/80 text-emerald-800 dark:text-emerald-100 font-bold px-1.5 py-0.5 rounded">
                          {appliedCoupon.discountType === 'Percentage' ? `خصم ${appliedCoupon.discountValue}%` : `خصم ${appliedCoupon.discountValue} ${store.currency}`}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block">
                        وفّرت {appliedCoupon.discountAmount.toFixed(2)} {store.currency}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-[11px] text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 font-bold px-2 py-1 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>المجموع الفرعي:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{subtotal.toFixed(2)} {store.currency}</span>
              </div>
              {appliedCoupon && appliedCoupon.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50/70 dark:bg-emerald-950/40 px-2 py-1 rounded">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    <span>الخصم ({appliedCoupon.code}):</span>
                  </span>
                  <span>-{appliedCoupon.discountAmount.toFixed(2)} {store.currency}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>رسوم التوصيل:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {deliveryFee > 0 ? `${deliveryFee.toFixed(2)} ${store.currency}` : 'مجاني'}
                </span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                <span>الإجمالي النهائي:</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-base">{totalAmount.toFixed(2)} {store.currency}</span>
              </div>
            </div>

            <button
              onClick={handleSubmitOrder}
              disabled={isSubmitting}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'جاري تجهيز الطلب...' : 'إرسال الطلب عبر الواتساب 💬'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
