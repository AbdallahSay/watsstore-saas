'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { commerceApi, TrackingOrder } from '@/lib/commerce-api';
import { ORDER_STAGES, orderLabel, terminalOrder } from '@/lib/order-status';
import { rememberDeviceOrder, readDeviceOrders, updateDeviceOrder } from '@/lib/customer-orders';
import { notifyOrderChange } from '@/lib/foreground-notifications';
import { useLanguage } from '@/context/LanguageContext';
import CustomerFrame from './CustomerFrame';
import PushControls from './PushControls';
import { useVisiblePoll } from './useVisiblePoll';

export default function OrderTracking({initialOrder,storeSlug,token}:{initialOrder:TrackingOrder;storeSlug:string;token:string}) {
  const [order,setOrder]=useState(initialOrder);const [busy,setBusy]=useState(false);const lock=useRef(false);
  const [message,setMessage]=useState('');const [checked,setChecked]=useState('');
  const {language}=useLanguage();const en=language!=='ar';const tr=(ar:string,eng:string)=>en?eng:ar;
  useEffect(()=>{if(!readDeviceOrders(storeSlug).some(x=>x.token===token))rememberDeviceOrder(storeSlug,token,initialOrder.orderNumber);updateDeviceOrder(storeSlug,token,{unread:false,status:initialOrder.status,lastUpdatedAt:initialOrder.lastUpdatedAt||initialOrder.history.at(-1)?.createdAt||initialOrder.createdAt});},[storeSlug,token,initialOrder]);
  async function refresh() {
    if(lock.current||document.visibilityState!=='visible')return;lock.current=true;setBusy(true);
    try {
      const next=await commerceApi<TrackingOrder>(`/public/stores/${encodeURIComponent(storeSlug)}/orders/track/${token}`);
      const version=next.lastUpdatedAt||next.history.at(-1)?.createdAt||next.createdAt;
      if(next.status!==order.status)await notifyOrderChange(storeSlug,token,next.status,`${next.status}:${version}`,en);
      setOrder(next);updateDeviceOrder(storeSlug,token,{status:next.status,lastUpdatedAt:version,unread:false});
      setChecked(new Date().toISOString());setMessage('');
    }catch{setMessage(tr('تعذر تحديث الحالة مؤقتاً. آخر حالة مؤكدة لسه ظاهرة؛ جرّب تاني.','Unable to refresh right now. Your last confirmed status is preserved.'));}
    finally{lock.current=false;setBusy(false);}
  }
  useVisiblePoll(refresh,!terminalOrder(order.status));
  const end=order.status==='Cancelled'||order.status==='Rejected';const active=ORDER_STAGES.findIndex(x=>x===order.status);
  const last=order.lastUpdatedAt||order.history.at(-1)?.createdAt||order.createdAt;
  const money=(value:number)=>`${value.toFixed(2)} ${order.currency||'ج.م'}`;
  return <CustomerFrame slug={storeSlug}><div className="cc-page">
    <div className="cc-title"><div><p className="ws-eyebrow">{tr('متابعة الطلب','ORDER TRACKING')}</p><h1 dir="ltr">#{order.orderNumber}</h1></div><span role="status" className="cc-status" data-terminal={terminalOrder(order.status)}>{orderLabel(order.status,en)}</span></div>
    <section className="cc-panel"><h2>{tr('رحلة طلبك','Your order journey')}</h2>{end?<p className="cc-notice">{orderLabel(order.status,en)}. {tr('تواصل مع المتجر لو محتاج تفاصيل.','Contact the store for details.')}</p>:<ol className="cc-progress">{ORDER_STAGES.map((status,i)=><li key={status} data-complete={active>=i} aria-current={active===i?'step':undefined}><b>{active>i?'✓':String(i+1).padStart(2,'0')}</b><span>{orderLabel(status,en)}</span></li>)}</ol>}<p className="cc-muted mt-5">{tr('آخر تحديث للحالة: ','Last status update: ')}<time dateTime={last}>{new Date(last).toLocaleString(en?'en-GB':'ar-EG',{timeZone:'Africa/Cairo'})}</time></p><p className="cc-muted">{terminalOrder(order.status)?tr('الطلب وصل لحالة نهائية، والتحديث التلقائي اتوقف.','This order is final. Automatic refresh has stopped.'):tr('بنتحقق كل ٣٠ ثانية والصفحة ظاهرة.','Checks every 30 seconds while this page is visible.')}{checked&&` · ${new Date(checked).toLocaleTimeString(en?'en-GB':'ar-EG')}`}</p><div className="cc-actions"><button className="cc-button" disabled={busy} onClick={()=>void refresh()}>{busy?tr('جاري التحديث…','Refreshing…'):tr('تحديث حالة الطلب','Refresh status')}</button><button className="cc-button" onClick={()=>{navigator.clipboard.writeText(window.location.href).then(()=>setMessage(tr('تم نسخ الرابط. احتفظ بيه بأمان.','Link copied. Keep it private.'))).catch(()=>setMessage(tr('انسخ الرابط من شريط العنوان.','Copy the link from your address bar.')));}}>{tr('حفظ رابط المتابعة','Copy tracking link')}</button></div>{message&&<p role="status" className="cc-notice mt-4">{message}</p>}</section>
    <div className="cc-columns"><section className="cc-panel"><h2>{tr('المنتجات','Order items')}</h2><ul>{order.items.map((item,i)=><li className="cc-line" key={i}><div><strong>{item.productName}</strong><small>{Object.values(item.selectedVariants||{}).join(' / ')}</small><small>{item.quantity} × {money(item.unitPrice)}</small></div><strong>{money(item.subtotal)}</strong></li>)}</ul></section><section className="cc-panel"><h2>{tr('ملخص الدفع والتوصيل','Payment & delivery')}</h2><dl className="cc-totals">{[[tr('المنتجات','Subtotal'),order.subtotal],[tr('الخصم','Discount'),-order.discountAmount],[tr('الشحن','Delivery'),order.deliveryFee],[tr('الإجمالي','Total'),order.totalAmount]].map(([name,value])=><div key={name}><dt>{name}</dt><dd>{money(Number(value))}</dd></div>)}</dl><p className="mt-5 text-sm">{order.paymentMethod&&`${orderLabel(order.paymentMethod,en)} · `}{orderLabel(order.paymentStatus,en)}</p>{order.shippingSummary&&<p className="cc-muted mt-3">{order.shippingSummary}</p>}</section></div>
    <section className="cc-panel"><h2>{tr('سجل تحديثات الطلب','Order history')}</h2><ol>{order.history.map((entry,i)=><li className="cc-line" key={`${entry.createdAt}-${i}`}><span>{orderLabel(entry.status,en)}</span><time className="cc-muted" dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleString(en?'en-GB':'ar-EG',{timeZone:'Africa/Cairo'})}</time></li>)}</ol></section>
    <PushControls slug={storeSlug} token={token} english={en}/><p className="cc-muted">{tr('الرابط خاص. الصفحة مش بتعرض رقمك أو عنوانك الكامل أو ملاحظات المتجر.','Keep this link private. Your phone, street address and merchant notes are not displayed.')}</p><Link className="cc-button" href={`/s/${encodeURIComponent(storeSlug)}/my-orders`}>{tr('كل طلباتي على الجهاز ده','All orders on this device')}</Link>
  </div></CustomerFrame>;
}
