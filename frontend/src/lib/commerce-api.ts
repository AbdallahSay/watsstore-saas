import { Store, CreateOrderRequest, CreateOrderResponse } from '@/types';
import type { StoreThemeId } from './store-themes';
import { API_BASE_URL } from './api-base';

export interface ShippingZone {
  id: string; governorate: string; name: string; fee: number; pickup: boolean; estimate?: string;
}
export interface CommerceSettings {
  publishedTheme: StoreThemeId; draftTheme: StoreThemeId; previousTheme: StoreThemeId;
  checkoutMode: 'online' | 'whatsapp' | 'both'; cashOnDelivery: boolean;
  instaPay: boolean; mobileWallet: boolean; shippingZones: ShippingZone[]; slug: string;
}
export interface OrderSnapshot {
  productId: string; productName: string; quantity: number; unitPrice: number;
  subtotal: number; imageUrl?: string; selectedVariants?: Record<string, string>;
}
export interface TrackingOrder {
  orderNumber: number; status: string; paymentStatus: string; items: OrderSnapshot[];
  subtotal: number; discountAmount: number; deliveryFee: number; totalAmount: number;
  shippingSummary?: string; createdAt: string; history: {status: string; createdAt: string}[];
}
export class CommerceApiError extends Error {
  constructor(message: string, public readonly status?: number, public readonly uncertain = false) {
    super(message);
    this.name = 'CommerceApiError';
  }
}

export async function commerceApi<T>(path: string, token?: string, method = 'GET', data?: unknown): Promise<T> {
  let res: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method, cache: 'no-store', redirect: 'error', signal: controller.signal,
      headers: { ...(data === undefined ? {} : {'Content-Type': 'application/json'}), ...(token ? {Authorization: `Bearer ${token}`} : {}) },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
  } catch {
    throw new CommerceApiError('تعذر تأكيد استلام الطلب بسبب مشكلة في الاتصال. قد يكون الطلب قد سُجّل بالفعل. اضغط «إعادة التحقق من نفس الطلب» دون إنشاء طلب جديد.', undefined, method !== 'GET');
  } finally { clearTimeout(timeout); }
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    const validation = error?.errors && typeof error.errors === 'object'
      ? Object.values(error.errors).flat().filter((value): value is string => typeof value === 'string').join('، ') : '';
    const uncertain = method !== 'GET' && (res.status >= 500 || [408, 409].includes(res.status));
    const fallback = uncertain ? 'تعذر تأكيد حالة الطلب. أعد التحقق بنفس بيانات الطلب لتجنب التكرار.' : res.status === 429 ? 'طلبات كثيرة في وقت قصير. انتظر دقيقة ثم حاول بنفس الطلب.' : `تعذر إتمام الطلب (${res.status}). يرجى مراجعة البيانات.`;
    throw new CommerceApiError(error?.message || validation || fallback, res.status, uncertain);
  }
  try { return await res.json(); }
  catch { throw new CommerceApiError('وصل رد غير مكتمل من الخادم. أعد التحقق من نفس الطلب.', res.status, method !== 'GET'); }
}
export function createOrder(slug: string, data: CreateOrderRequest) {
  return commerceApi<CreateOrderResponse>(`/public/stores/${encodeURIComponent(slug)}/orders`, undefined, 'POST', data);
}
export function merchantToken() {
  return localStorage.getItem('watsstore_merchant_token') || localStorage.getItem('watsstore_token') || '';
}
export function paymentOptions(store: Store) {
  return [
    ...(store.cashOnDelivery !== false ? [{id: 'cod', ar: 'الدفع عند الاستلام', en: 'Cash on delivery'}] : []),
    ...((store.instaPay ?? !!store.instaPayAddress) && store.instaPayAddress ? [{id: 'instapay', ar: 'إنستاباي', en: 'InstaPay'}] : []),
    ...((store.mobileWallet ?? !!store.vodafoneCashNumber) && store.vodafoneCashNumber ? [{id: 'wallet', ar: 'محفظة إلكترونية', en: 'Mobile wallet'}] : []),
  ];
}
