'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { readDeviceOrders, removeDeviceOrder, type SavedOrder } from '@/lib/customer-orders';
import { ClipboardList, ShieldCheck, Trash2 } from 'lucide-react';

export default function CustomerOrdersPage() {
  const params = useParams<{storeSlug:string}>();
  const slug = params.storeSlug;
  const [orders, setOrders] = useState<SavedOrder[]>([]);
  useEffect(() => {if (slug) setOrders(readDeviceOrders(slug));},[slug]);
  const remove = (token:string) => {
    removeDeviceOrder(slug,token);
    setOrders(readDeviceOrders(slug));
  };
  return <main dir="rtl" className="min-h-screen bg-stone-50 text-stone-900 p-4 sm:p-8">
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center gap-3"><Link href={`/s/${encodeURIComponent(slug)}`} className="underline text-sm font-semibold">العودة للمتجر</Link><span className="text-xs text-stone-500">WatsStore</span></div>
      <header className="rounded-2xl bg-white border border-stone-200 p-6">
        <h1 className="text-3xl font-black flex items-center gap-3"><ClipboardList size={28}/> طلباتي</h1>
        <p className="text-stone-600 mt-3 text-sm leading-7">طلباتك المحفوظة على هذا الجهاز والمتصفح فقط. اضغط على أي طلب لمتابعة حالته الحالية.</p>
      </header>
      <section className="rounded-xl p-4 border border-amber-200 bg-amber-50 text-amber-950 text-sm leading-7 flex gap-3"><ShieldCheck className="shrink-0" size={23}/>
        <p>دي مش قائمة طلبات مرتبطة بحساب مسجّل. لو فتحت المتجر من جهاز تاني أو مسحت بيانات المتصفح، الطلبات هنا مش هتظهر. احتفظ بروابط المتابعة في مكان آمن، لأن أي شخص معاه الرابط يقدر يشوف تفاصيل الطلب غير الحساسة.</p>
      </section>
      {orders.length ? <ul className="space-y-3">{orders.map(o=><li key={o.token} className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-wrap gap-4 justify-between items-center">
        <div><p className="font-bold text-xl" dir="ltr">#{o.number}</p><time className="text-xs text-stone-500" dateTime={o.createdAt}>{new Date(o.createdAt).toLocaleString('ar-EG',{timeZone:'Africa/Cairo'})}</time></div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/s/${encodeURIComponent(slug)}/orders/${o.token}`} className="min-h-11 inline-flex items-center px-4 rounded-xl bg-stone-900 text-white text-sm font-bold">متابعة الطلب</Link>
          <button type="button" onClick={()=>remove(o.token)} className="min-h-11 inline-flex items-center gap-2 px-3 rounded-xl border border-stone-300 text-stone-700 text-xs" aria-label={`حذف الطلب ${o.number} من هذا الجهاز`}><Trash2 size={16}/> إزالة</button>
        </div>
      </li>)}</ul> : <div className="bg-white border border-stone-200 p-10 text-center rounded-2xl"><ClipboardList className="mx-auto text-stone-400 mb-3" size={40}/><p className="font-bold">لسه مفيش طلبات محفوظة على الجهاز ده.</p><Link className="mt-5 inline-flex bg-stone-900 text-white px-5 py-3 rounded-xl" href={`/s/${encodeURIComponent(slug)}`}>ابدأ التسوق</Link></div>}
    </div>
  </main>;
}
