'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { CreateOrderResponse } from '@/types';
import { commerceApi, TrackingOrder } from '@/lib/commerce-api';
import { orderLabel } from '@/lib/order-status';

export default function OrderConfirmation({result,slug,english,currency,continueShopping,preview=false}:{preview?:boolean;result:CreateOrderResponse;slug:string;english:boolean;currency:string;continueShopping:()=>void}) {
  const [snapshot,setSnapshot]=useState<TrackingOrder|null>(null);const [error,setError]=useState(false);
  const tr=(ar:string,en:string)=>english?en:ar;
  useEffect(()=>{
    if(result.items?.length||!result.trackingToken)return;
    let live=true;
    commerceApi<TrackingOrder>(`/public/stores/${encodeURIComponent(slug)}/orders/track/${result.trackingToken}`).then(data=>{if(live)setSnapshot(data);}).catch(()=>{if(live)setError(true);});
    return()=>{live=false;};
  },[slug,result]);
  const items=result.items?.length?result.items:snapshot?.items;
  const payment=result.paymentMethod||snapshot?.paymentMethod;
  const shipping=result.shippingSummary||snapshot?.shippingSummary;
  const money=(value:number)=>`${value.toFixed(2)} ${result.currency||snapshot?.currency||currency}`;
  return <div className="ws-confirmation" role="status">
    <CheckCircle2 size={44} aria-hidden="true"/><div><p className="ws-eyebrow">{preview?tr('معاينة فقط — لم يتم إرسال طلب','PREVIEW ONLY — NO ORDER SUBMITTED'):tr('طلبك اتسجل بنجاح','ORDER RECEIVED')}</p>{!preview&&<h3>#{result.orderNumber}</h3>}</div>
    <p className="ws-confirmed-status">{preview?tr('لا توجد عملية دفع أو خصم مخزون في المعاينة.','Preview does not create an order, take payment or change stock.'):orderLabel(snapshot?.status||result.status,english)}</p>
    <p>{preview?tr('هذه قيمة توضيحية للعرض فقط.','Illustrative preview total only.'):tr('المتجر استلم طلبك. التحويلات بتتأكد بعد مراجعة المتجر.','The store has received your order. Manual transfers require merchant verification.')}</p>
    <strong className="text-2xl">{money(result.totalAmount)}</strong><p className="text-sm">{payment&&`${orderLabel(payment,english)} · `}{orderLabel(snapshot?.paymentStatus||result.paymentStatus,english)}</p>
    {items?<ul>{items.map((item,i)=><li key={i} className="flex justify-between gap-3 border-b py-3 text-sm"><div><strong>{item.productName}</strong><small className="block">{Object.values(item.selectedVariants||{}).join(' / ')}</small><small>{item.quantity} × {money(item.unitPrice)}</small></div><span>{money(item.subtotal)}</span></li>)}</ul>:<p className="text-sm">{error?tr('تفاصيل المنتجات متاحة من صفحة متابعة الطلب.','Item details are available on the tracking page.'):tr('بنحمّل تفاصيل الطلب المؤكدة…','Loading confirmed order details…')}</p>}
    <p className="text-sm">{shipping||`${tr('رسوم التوصيل','Delivery fee')}: ${money(result.deliveryFee)}`}</p>
    {result.trackingToken&&<Link prefetch={false} className="ws-primary-action" href={`/s/${encodeURIComponent(slug)}/orders/${result.trackingToken}`}>{tr('متابعة الطلب','Track order')}</Link>}
    {!preview&&<Link prefetch={false} className="ws-secondary-action" href={`/s/${encodeURIComponent(slug)}/my-orders`}>{tr('طلباتي على الجهاز ده','My orders on this device')}</Link>}
    {!preview&&result.whatsAppRedirectUrl&&<a className="ws-secondary-action ws-theme-whatsapp-btn ws-theme-whatsapp-btn--filled" href={result.whatsAppRedirectUrl} target="_blank" rel="noreferrer">{tr('إرسال الطلب عبر واتساب (اختياري)','Send on WhatsApp (optional)')}</a>}
    <button className="ws-secondary-action" onClick={continueShopping}>{tr('متابعة التسوق','Continue shopping')}</button>
    <small>{tr('رابط المتابعة بيتحفظ على الجهاز ده لو المتصفح بيسمح بالتخزين.','The tracking link is saved on this device when browser storage is available.')}</small>
  </div>;
}
