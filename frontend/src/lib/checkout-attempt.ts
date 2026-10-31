import type { CreateOrderRequest } from '@/types';

export type CheckoutPayload = Omit<CreateOrderRequest, 'idempotencyKey'>;
export interface CheckoutAttempt {
  key: string;
  hash: string;
  payload: CheckoutPayload;
  pending: boolean;
}

export function readCheckoutAttempt(value: string | null): CheckoutAttempt | null {
  try {
    if (!value) return null;
    const saved = JSON.parse(value);
    // Recover attempts saved by the previous checkout; its hash contains the payload.
    const payload = saved.payload || JSON.parse(saved.hash);
    if (typeof saved.key !== 'string' || saved.key.length < 16 || !payload ||
        typeof payload.customerName !== 'string' || typeof payload.customerPhone !== 'string' ||
        typeof payload.customerAddress !== 'string' || !Array.isArray(payload.items) || !payload.items.length) return null;
    return {key: saved.key, hash: JSON.stringify(payload), payload, pending: saved.pending !== false};
  } catch { return null; }
}

export function prepareCheckoutAttempt(payload: CheckoutPayload, saved: CheckoutAttempt | null, key: () => string): CheckoutAttempt {
  // A transport failure is not proof of rejection. Never change the request or key
  // until the original outcome is known, even if the cart changes or the page reloads.
  if (saved?.pending) return saved;
  const hash = JSON.stringify(payload);
  return {key: saved?.hash === hash ? saved.key : key(), hash, payload, pending: true};
}

export function checkoutKey(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
}
