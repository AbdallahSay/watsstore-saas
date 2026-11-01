import { readDeviceOrders, updateDeviceOrder } from './customer-orders';
import { orderLabel } from './order-status';

export async function notifyOrderChange(slug: string, token: string, status: string, version: string, english: boolean) {
  const run = async () => {
    const order = readDeviceOrders(slug).find(x => x.token === token);
    if (!order || order.notifiedVersion === version) return;
    if (localStorage.getItem(`ws_foreground_${slug}`) !== 'enabled' || !('Notification' in window) || Notification.permission !== 'granted') return;
    // Claim before display; Web Locks serialize visible tabs when supported.
    updateDeviceOrder(slug, token, {notifiedVersion: version});
    const title=english ? 'Order update · WatsStore' : 'تحديث طلبك · WatsStore';
    const options={body:orderLabel(status,english),tag:`ws-order-${version}`,data:{url:`/s/${encodeURIComponent(slug)}/my-orders`}};
    try { new Notification(title,options); }
    catch {
      // Mobile browsers may require service-worker display even for foreground alerts.
      try {
        if ('serviceWorker' in navigator && window.isSecureContext) {
          await navigator.serviceWorker.register('/order-notifications-sw.js',{scope:'/'});
          const registration=await navigator.serviceWorker.ready;
          await registration.showNotification(title,options);
        }
      } catch { /* in-page unread indicator remains available */ }
    }
  };
  try {
    if (navigator.locks) await navigator.locks.request(`ws-order-notice-${slug}-${token}`, {ifAvailable:true}, lock => lock ? run() : undefined);
    else await run();
  } catch { /* browser storage or notifications may be unavailable */ }
}
