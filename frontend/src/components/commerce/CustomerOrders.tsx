'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { readDeviceOrders, removeDeviceOrder, updateDeviceOrder, SavedOrder } from '@/lib/customer-orders';
import { commerceApi, TrackingOrder } from '@/lib/commerce-api';
import { orderLabel, terminalOrder } from '@/lib/order-status';
import { notifyOrderChange } from '@/lib/foreground-notifications';
import { useLanguage } from '@/context/LanguageContext';
import CustomerFrame from './CustomerFrame';
import { useVisiblePoll } from './useVisiblePoll';

export default function CustomerOrders() {
  const {storeSlug:slug}=useParams<{storeSlug:string}>(); const {language}=useLanguage(); const en=language!=='ar';
  const tr=(ar:string,english:string)=>en?english:ar;
  const [orders,setOrders]=useState<SavedOrder[]>([]); const [loaded,setLoaded]=useState(false);
  const [checking,setChecking]=useState(false);const checkingRef=useRef(false);
  const [errors,setErrors]=useState<Record<string,string>>({});const [notice,setNotice]=useState('');
  const [notifications,setNotifications]=useState(false);
  useEffect(()=>{
    const sync=()=>{setOrders(readDeviceOrders(slug));setLoaded(true);};sync();
    try{setNotifications(localStorage.getItem(`ws_foreground_${slug}`)==='enabled'&&'Notification'in window&&Notification.permission==='granted');}catch{}
    window.addEventListener('storage',sync);window.addEventListener('ws-orders-changed',sync);
    return()=>{window.removeEventListener('storage',sync);window.removeEventListener('ws-orders-changed',sync);};
  },[slug]);
  async function refresh(manual=false) {
    if(document.visibilityState!=='visible'||checkingRef.current)return;
    const saved=readDeviceOrders(slug).filter(x=>manual||!terminalOrder(x.status));if(!saved.length)return;
    checkingRef.current=true;setChecking(true);
    const failures:Record<string,string>={};
    try {
      for(let offset=0;offset<saved.length;offset+=4)await Promise.all(saved.slice(offset,offset+4).map(async previous=>{
        try {
          const next=await commerceApi<TrackingOrder>(`/public/stores/${encodeURIComponent(slug)}/orders/track/${previous.token}`);
          const updated=next.lastUpdatedAt||next.history.at(-1)?.createdAt||next.createdAt;
          const changed=!!previous.status&&previous.status!==next.status;
          updateDeviceOrder(slug,previous.token,{status:next.status,lastUpdatedAt:updated,...(changed?{unread:true}:{})});
          if(changed){setNotice(tr('فيه تحديث جديد على طلبك.','Your order has a new update.'));await notifyOrderChange(slug,previous.token,next.status,`${next.status}:${updated}`,en);}
        }catch{failures[previous.token]=tr('مش قادرين نحدّث الحالة دلوقتي. آخر حالة محفوظة لسه ظاهرة.','Unable to refresh. Your last known status is preserved.');}
      }));
      setErrors(failures);setOrders(readDeviceOrders(slug));
    }finally{checkingRef.current=false;setChecking(false);}
  }
  useVisiblePoll(()=>refresh(),loaded&&orders.some(x=>!terminalOrder(x.status)),60000);
  async function toggleNotifications() {
    if(notifications){try{localStorage.removeItem(`ws_foreground_${slug}`);}catch{}setNotifications(false);setNotice(tr('تم إيقاف تنبيهات المتصفح.','Browser alerts disabled.'));return;}
    if(!('Notification'in window)){setNotice(tr('المتصفح مش بيدعم التنبيهات دي. تحديثات الطلب هتفضل ظاهرة هنا.','Browser alerts are unsupported. In-page order updates still work.'));return;}
    try {
      const permission=await Notification.requestPermission();
      if(permission==='granted'){localStorage.setItem(`ws_foreground_${slug}`,'enabled');setNotifications(true);setNotice(tr('التنبيهات مفعلة أثناء فتح الصفحة. إشعارات الخلفية لها اشتراك منفصل داخل متابعة الطلب.','Alerts enabled while this page is open. Background push has a separate opt-in on the tracking page.'));}
      else setNotice(tr('مش هنطلب الإذن تاني تلقائياً. تقدر تغيّره من إعدادات المتصفح.','We will not prompt again automatically. You can change permission in browser settings.'));
    }catch{setNotice(tr('تعذر تفعيل التنبيهات. تحديثات الصفحة متاحة.','Unable to enable alerts. In-page updates remain available.'));}
  }
  return <CustomerFrame slug={slug}><div className="cc-page">
    <div className="cc-title"><div><p className="ws-eyebrow">{tr('متابعة مشترياتك','YOUR PURCHASES')}</p><h1>{tr('طلباتي','My orders')}</h1></div><Link className="cc-button" href={`/s/${encodeURIComponent(slug)}`}>{tr('كمّل تسوّق','Continue shopping')}</Link></div>
    <aside className="cc-notice">{tr('القائمة دي محفوظة على الجهاز والمتصفح ده فقط، ومش حساب مسجّل. مش هتظهر على جهاز تاني، ومسح بيانات المتصفح بيمسحها. روابط المتابعة خاصة؛ احتفظ بيها بأمان.','This is history on this device and browser, not a signed-in account. It does not sync across devices. Clearing browser data removes it. Keep tracking links private.')}</aside>
    <section className="cc-panel"><p className="cc-muted">{tr('بنحدّث الطلبات النشطة كل دقيقة والصفحة ظاهرة. الطلبات المكتملة مش بتتراجع تلقائياً.','Active orders refresh every minute while visible. Completed orders stop automatic checks.')}</p><div className="cc-actions"><button className="cc-button" disabled={checking||!orders.length} onClick={()=>void refresh(true)}>{checking?tr('جاري التحديث…','Refreshing…'):tr('تحديث الآن','Refresh now')}</button><button className="cc-button" onClick={()=>void toggleNotifications()}>{notifications?tr('إيقاف تنبيهات المتصفح','Disable browser alerts'):tr('تفعيل تنبيهات المتصفح','Enable browser alerts')}</button></div></section>
    {notice&&<p role="status" className="cc-notice">{notice}</p>}
    {!loaded?<div role="status" className="cc-loading">{tr('بنحمّل طلباتك…','Loading your orders…')}</div>:orders.length?<ul className="grid gap-4">{orders.map(order=><li className="cc-panel cc-order-row" key={order.token}><div><h2 dir="ltr">#{order.number}</h2><span className="cc-status" data-terminal={terminalOrder(order.status)}>{order.status?orderLabel(order.status,en):tr('بنراجع الحالة…','Checking status…')}</span>{order.unread&&<strong className="ms-3 text-sm" aria-label={tr('تحديث غير مقروء','Unread update')}>● {tr('جديد','New')}</strong>}<p className="cc-muted mt-2">{order.lastUpdatedAt?tr('آخر تحديث: ','Last update: '):tr('تاريخ الطلب: ','Order date: ')}<time dateTime={order.lastUpdatedAt||order.createdAt}>{new Date(order.lastUpdatedAt||order.createdAt).toLocaleString(en?'en-GB':'ar-EG',{timeZone:'Africa/Cairo'})}</time></p>{errors[order.token]&&<p role="status" className="cc-muted">{errors[order.token]}</p>}</div><div className="cc-actions"><Link className="ws-primary-action" href={`/s/${encodeURIComponent(slug)}/orders/${order.token}`} onClick={()=>updateDeviceOrder(slug,order.token,{unread:false})}>{tr('متابعة الطلب','Track order')}</Link><button className="cc-button" aria-label={tr(`إزالة الطلب ${order.number} من الجهاز`,`Remove order ${order.number} from this device`)} onClick={()=>{removeDeviceOrder(slug,order.token);setOrders(readDeviceOrders(slug));}}>{tr('إزالة من الجهاز','Remove from device')}</button></div></li>)}</ul>:<section className="cc-panel text-center"><h2>{tr('لسه مفيش طلبات محفوظة هنا','No orders saved here yet')}</h2><p className="cc-muted">{tr('بعد إتمام أول طلب، هتلاقي رابط متابعته على الجهاز ده.','After checkout, your secure tracking link will appear on this device.')}</p><Link className="ws-primary-action mt-5" href={`/s/${encodeURIComponent(slug)}`}>{tr('ابدأ التسوق','Start shopping')}</Link></section>}
  </div></CustomerFrame>;
}
