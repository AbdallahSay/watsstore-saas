/**
 * Device-only order history. Tracking tokens are bearer capabilities; never send them
 * to analytics, expose them in third-party links, or assume this is an authenticated account.
 */
export type SavedOrder = { token: string; number: number; createdAt: string; status?: string; lastUpdatedAt?: string; unread?: boolean; notifiedVersion?: string };
const storageKey = (slug: string) => `ws_customer_orders_${slug}`;
const valid = (x: unknown): x is SavedOrder => {
  if (!x || typeof x !== 'object') return false;
  const y = x as Partial<SavedOrder>;
  return typeof y.token === 'string' && /^[a-f0-9]{64}$/.test(y.token) &&
    Number.isSafeInteger(y.number) && typeof y.createdAt === 'string' && Number.isFinite(Date.parse(y.createdAt)) &&
    (y.status === undefined || (typeof y.status === 'string' && y.status.length <= 30)) &&
    (y.lastUpdatedAt === undefined || (typeof y.lastUpdatedAt === 'string' && Number.isFinite(Date.parse(y.lastUpdatedAt)))) &&
    (y.unread === undefined || typeof y.unread === 'boolean') &&
    (y.notifiedVersion === undefined || (typeof y.notifiedVersion === 'string' && y.notifiedVersion.length <= 128));
};
export function readDeviceOrders(slug: string): SavedOrder[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(storageKey(slug)) || '[]');
    return Array.isArray(raw) ? raw.filter(valid).slice(0, 30) : [];
  } catch { return []; }
}
export function rememberDeviceOrder(slug: string, token: string, number: number): void {
  if (!/^[a-f0-9]{64}$/.test(token) || !Number.isSafeInteger(number)) return;
  try {
    const history = readDeviceOrders(slug);
    const existing = history.find(x => x.token === token);
    const next = [{...existing, token, number, createdAt: existing?.createdAt || new Date().toISOString()}, ...history.filter(x => x.token !== token)].slice(0, 30);
    localStorage.setItem(storageKey(slug), JSON.stringify(next));
  } catch { /* browser may disallow storage */ }
}
export function removeDeviceOrder(slug: string, token: string): void {
  try {localStorage.setItem(storageKey(slug), JSON.stringify(readDeviceOrders(slug).filter(x=>x.token!==token)));} catch {}
}

export function updateDeviceOrder(slug: string, token: string, patch: Partial<Pick<SavedOrder,'status'|'lastUpdatedAt'|'unread'|'notifiedVersion'>>): void {
  try {
    const previous = readDeviceOrders(slug);
    const next = previous.map(order => order.token === token ? {...order,...patch} : order);
    if (JSON.stringify(next) !== JSON.stringify(previous)) {
      localStorage.setItem(storageKey(slug), JSON.stringify(next));
      window.dispatchEvent(new Event('ws-orders-changed'));
    }
  } catch { /* no account or cross-device persistence is implied */ }
}
