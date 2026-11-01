'use client';
import { useEffect, useState } from 'react';
import { commerceApi } from '@/lib/commerce-api';
type DeviceSubscription={id:string;revokeKey:string};
const storage='ws_push_subscriptions_v1';
function records():Record<string,DeviceSubscription>{try{return JSON.parse(localStorage.getItem(storage)||'{}');}catch{return {};}}
export default function PushControls({slug,token,english=false}:{slug:string;token:string;english?:boolean}) {
  const key=`${slug}:${token}`;const tr=(ar:string,en:string)=>english?en:ar;
  const [config,setConfig]=useState<{enabled:boolean;publicKey?:string}|null>(null);
  const [sub,setSub]=useState<DeviceSubscription|null>(null);const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);
  useEffect(()=>{let live=true;setSub(records()[key]||null);commerceApi<{enabled:boolean;publicKey?:string}>(`/public/stores/${encodeURIComponent(slug)}/notifications/config`).then(c=>{if(live)setConfig(c);}).catch(()=>{if(live)setConfig({enabled:false});});return()=>{live=false;};},[slug,key]);
  async function enable() {
    if(!config?.enabled||!config.publicKey)return;
    if(!window.isSecureContext||!('serviceWorker'in navigator)||!('PushManager'in window)||!('Notification'in window)){setMessage(tr('المتصفح مش بيدعم إشعارات الخلفية هنا. على iPhone قد تحتاج تضيف الموقع للشاشة الرئيسية وتفتحه منها.','Background push is unsupported here. On iPhone, you may need to add this site to the Home Screen and open it there.'));return;}
    setBusy(true);setMessage('');
    try {
      const permission=await Notification.requestPermission(); // Only in this explicit user gesture.
      if(permission!=='granted'){setMessage(tr('مش هنفعّل إشعارات الخلفية بدون إذنك.','Background notifications remain off without your permission.'));return;}
      const registration=await navigator.serviceWorker.register('/order-notifications-sw.js',{scope:'/'});
      await navigator.serviceWorker.ready;
      const base64=config.publicKey.replace(/-/g,'+').replace(/_/g,'/');
      const raw=atob(base64+'='.repeat((4-base64.length%4)%4));
      const applicationServerKey=Uint8Array.from(raw,c=>c.charCodeAt(0));
      const subscription=await registration.pushManager.getSubscription()||await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey});
      const json=subscription.toJSON();
      const result=await commerceApi<DeviceSubscription>(`/public/stores/${encodeURIComponent(slug)}/notifications/subscriptions`,undefined,'POST',{trackingToken:token,endpoint:json.endpoint,p256dh:json.keys?.p256dh,auth:json.keys?.auth});
      const next=records();next[key]=result;
      try{localStorage.setItem(storage,JSON.stringify(next));}catch{await commerceApi(`/public/stores/${encodeURIComponent(slug)}/notifications/subscriptions/${result.id}`,undefined,'DELETE',{revokeKey:result.revokeKey});throw Error(tr('تعذر حفظ إعدادات الاشتراك، فتم إلغاؤه.','Subscription cancelled because its controls could not be saved.'));}
      setSub(result);setMessage(tr('تم الاشتراك في تحديثات الطلب. وصولها يعتمد على دعم المتصفح والجهاز.','Subscribed to order updates. Delivery depends on browser and device support.'));
    }catch(e){setMessage((e as Error).message||tr('تعذر تفعيل الإشعارات.','Unable to enable notifications.'));}finally{setBusy(false);}
  }
  async function disable() {
    if(!sub)return;setBusy(true);setMessage('');
    try {
      await commerceApi(`/public/stores/${encodeURIComponent(slug)}/notifications/subscriptions/${sub.id}`,undefined,'DELETE',{revokeKey:sub.revokeKey});
      const next=records();delete next[key];localStorage.setItem(storage,JSON.stringify(next));setSub(null);
      if(!Object.keys(next).length){const reg=await navigator.serviceWorker.getRegistration('/');const subscription=await reg?.pushManager.getSubscription();await subscription?.unsubscribe();}
      setMessage(tr('تم إلغاء اشتراك إشعارات الطلب.','Order notification subscription removed.'));
    }catch{setMessage(tr('تعذر تأكيد إلغاء الاشتراك. حاول تاني أو اقفل الإذن من إعدادات المتصفح.','Unable to confirm unsubscribe. Try again or revoke permission in browser settings.'));}finally{setBusy(false);}
  }
  return <section className="cc-panel"><h2>{tr('إشعارات الخلفية','Background notifications')}</h2><p className="cc-muted">{config?.enabled?tr('اشتراك اختياري لتحديثات حالة الطلب حتى بعد مغادرة الموقع.','Optional order updates after leaving the website.'):tr('إشعارات الخلفية غير مفعلة حالياً. تقدر تتابع التحديثات هنا وفي طلباتي أثناء فتح الصفحة.','Background push is not enabled. Updates remain available here and in My orders while the page is open.')}</p><div className="cc-actions">{sub?<button className="cc-button" disabled={busy} onClick={()=>void disable()}>{tr('إلغاء اشتراك إشعارات الطلب','Unsubscribe from order notifications')}</button>:config?.enabled&&<button className="cc-button" disabled={busy} onClick={()=>void enable()}>{tr('تفعيل إشعارات الخلفية لهذا الطلب','Enable background updates for this order')}</button>}</div>{message&&<p role="status" className="cc-notice mt-4">{message}</p>}</section>;
}
