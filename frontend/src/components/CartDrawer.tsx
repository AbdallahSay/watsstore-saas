'use client';

import { useState } from 'react';
import { Store, CartItem } from '../types';
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
  AlertCircle
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const deliveryFee = store.deliveryFee || 0;
  const totalAmount = subtotal + deliveryFee;

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

    if (!customerPhone.trim() || customerPhone.trim().length < 10) {
      setFormError('يرجى إدخال رقم هاتف واتساب صحيح');
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
            <p style="margin-bottom: 8px;"><strong>رقم الطلب:</strong> #${result.orderNumber}</p>
            <p style="margin-bottom: 8px;"><strong>الإجمالي:</strong> ${result.totalAmount.toFixed(2)} ${store.currency}</p>
            <p style="color: #059669; font-size: 14px; margin-top: 12px;">سيتم توجيهك الآن إلى الواتساب لإرسال الفاتورة وتأكيد الطلب مع المتجر مباشرة.</p>
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
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-base">سلة التسوق</h2>
              <span className="text-xs text-slate-500">{cartItems.length} منتج في السلة</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 text-slate-500 flex items-center justify-center border border-slate-200 transition-colors"
            aria-label="إغلاق السلة"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {cartItems.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-8 h-8 stroke-1" />
              </div>
              <h3 className="font-bold text-slate-700 text-base">السلة فارغة حالياً</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                تصفح المنتجات في المتجر وأضف ما يعجبك لإرسال الطلب بسهولة عبر الواتساب.
              </p>
            </div>
          ) : (
            <>
              {/* Items List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-600">المنتجات المختارة</span>
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
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex gap-3 items-center"
                    >
                      {item.product.imageUrl && (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-14 h-14 rounded-xl object-cover bg-white border border-slate-200 shrink-0"
                        />
                      )}

                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm truncate">
                          {item.product.name}
                        </h4>

                        {variants.length > 0 && (
                          <p className="text-[11px] text-emerald-700 font-medium truncate mt-0.5">
                            {variants.map(([k, v]) => `${k}: ${v}`).join(' | ')}
                          </p>
                        )}

                        <div className="text-xs font-bold text-slate-700 mt-1">
                          {lineTotal.toFixed(2)} {store.currency}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(idx, item.quantity - 1)}
                          className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
                          aria-label="إنقاص"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-black text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(idx, item.quantity + 1)}
                          className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
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

              {/* Customer Info Form */}
              <form onSubmit={handleSubmitOrder} className="space-y-4 pt-4 border-t border-slate-200">
                <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>بيانات استلام الطلب</span>
                </h3>

                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الاسم بالكامل *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="مثال: محمد أحمد"
                      className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    رقم هاتف الواتساب *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="مثال: 01012345678"
                      className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    عنوان التوصيل بالتفصيل *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="المحافظة، المنطقة، اسم الشارع، رقم العمارة أو علامة مميزة"
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ملاحظات إضافية (اختياري)
                  </label>
                  <input
                    type="text"
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="أي تعليمات خاصة للمتجر أو المندوب"
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </form>
            </>
          )}
        </div>

        {/* Drawer Footer / Summary */}
        {cartItems.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>المجموع الفرعي:</span>
                <span className="font-bold text-slate-800">{subtotal.toFixed(2)} {store.currency}</span>
              </div>
              <div className="flex justify-between">
                <span>رسوم التوصيل:</span>
                <span className="font-bold text-slate-800">
                  {deliveryFee > 0 ? `${deliveryFee.toFixed(2)} ${store.currency}` : 'مجاني'}
                </span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>الإجمالي النهائي:</span>
                <span className="text-emerald-600 text-base">{totalAmount.toFixed(2)} {store.currency}</span>
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
