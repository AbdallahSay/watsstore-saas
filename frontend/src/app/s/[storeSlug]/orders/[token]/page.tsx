import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { commerceApi, TrackingOrder } from '@/lib/commerce-api';

export const metadata: Metadata = {title:'متابعة الطلب | Order tracking',robots:{index:false,follow:false},referrer:'no-referrer'};
export const dynamic = 'force-dynamic';
const labels:Record<string,string>={Pending:'بانتظار التأكيد',Confirmed:'تم التأكيد',Preparing:'قيد التجهيز',Shipped:'تم الشحن',Delivered:'تم التسليم',Cancelled:'ملغي',Rejected:'مرفوض',PaymentVerified:'تم التحقق من الدفع',Unpaid:'غير مدفوع',AwaitingVerification:'بانتظار مراجعة التحويل',Paid:'تم الدفع'};
export default async function TrackingPage({params:pendingParams}:{params:Promise<{storeSlug:string;token:string}>}) {
  const params=await pendingParams;
  if (!/^[a-f0-9]{64}$/.test(params.token)) notFound();
  let order:TrackingOrder;
  try {order=await commerceApi<TrackingOrder>(`/public/stores/${encodeURIComponent(params.storeSlug)}/orders/track/${params.token}`);}catch {notFound();}
  return <main dir="rtl" className="min-h-screen bg-stone-50 text-stone-900 px-4 py-12"><div className="max-w-2xl mx-auto space-y-8"><Link href={`/s/${params.storeSlug}`} className="underline">العودة للمتجر / Back to store</Link><header className="border-b border-stone-300 pb-6"><p className="text-xs mb-4">متابعة الطلب · ORDER TRACKING</p><h1 className="text-4xl font-bold">#{order.orderNumber}</h1><p className="mt-4">{labels[order.status]||order.status}</p><p className="text-sm mt-2">الدفع: {labels[order.paymentStatus]||order.paymentStatus}</p></header>
    <section><h2 className="font-bold mb-4">المنتجات / Items</h2><ul className="space-y-4">{order.items.map((item,i)=><li className="flex justify-between gap-4 border-b border-stone-200 pb-4" key={i}><div><h3>{item.productName}</h3><p className="text-xs mt-1">{Object.values(item.selectedVariants||{}).join(' / ')}</p><p className="text-sm">{item.quantity} × {item.unitPrice.toFixed(2)}</p></div><strong>{item.subtotal.toFixed(2)} ج.م</strong></li>)}</ul></section>
    <dl className="space-y-3 text-sm">{[['المنتجات',order.subtotal],['الخصم',-order.discountAmount],['التوصيل',order.deliveryFee],['الإجمالي',order.totalAmount]].map(([name,value])=><div className="flex justify-between" key={name}><dt>{name}</dt><dd>{Number(value).toFixed(2)} ج.م</dd></div>)}</dl>{order.shippingSummary&&<p className="border p-4 text-sm">{order.shippingSummary}</p>}
    <section><h2 className="font-bold mb-5">مسار الطلب / Timeline</h2><ol className="space-y-5 border-r border-stone-300 pr-5">{order.history.map((entry,i)=><li key={i}><p>{labels[entry.status]||entry.status}</p><time className="text-xs text-stone-600" dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleString('ar-EG',{timeZone:'Africa/Cairo'})}</time></li>)}</ol></section><p className="text-xs text-stone-500">احتفظ بهذا الرابط بشكل خاص. لا تعرض الصفحة اسمك أو رقمك أو عنوانك.</p>
  </div></main>;
}
