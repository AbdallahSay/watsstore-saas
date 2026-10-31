import { Store, CreateOrderRequest, CreateOrderResponse } from '@/types';
import type { StoreThemeId } from './store-themes';

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
const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
export async function commerceApi<T>(path: string, token?: string, method = 'GET', data?: unknown): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    method, cache: 'no-store', headers: { 'Content-Type': 'application/json', ...(token ? {Authorization: `Bearer ${token}`} : {}) },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || (res.status === 404 ? 'غير موجود / Not found' : `تعذر إتمام الطلب (${res.status})`));
  }
  return res.json();
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
