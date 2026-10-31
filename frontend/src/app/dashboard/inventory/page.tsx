'use client';
import { useEffect, useState } from 'react';
import { Product } from '@/types';
import { api } from '@/lib/api';
import { commerceApi, merchantToken } from '@/lib/commerce-api';
interface Stock {id:string;productId:string;variantKey:string;quantity:number;lowStockThreshold:number;selectedVariantsJson:string}
export default function InventoryPage() {
  const [products,setProducts] = useState<Product[]>([]);
  const [stocks,setStocks] = useState<Stock[]>([]);
  const [id,setId] = useState('');
  const [variants,setVariants] = useState<Record<string,string>>({});
  const [trackVariant,setTrackVariant] = useState(false);
  const [message,setMessage] = useState('');
  const [busy,setBusy] = useState(false);
  async function load() {const token=merchantToken();const [p,s]=await Promise.all([api.getProducts(token),commerceApi<Stock[]>('/merchant/commerce/inventory',token)]);setProducts(p);setStocks(s);}
  useEffect(() => {load().catch(e => setMessage(e.message));},[]);
  const product=products.find(p=>p.id===id);
  let groups:{name:string;options:string[]}[]=[];
  try {groups=JSON.parse(product?.variantsJson || '[]');}catch { /* validation on server */ }
  async function adjust(e:React.FormEvent<HTMLFormElement>) {
    e.preventDefault();const form=e.currentTarget;const data=new FormData(form);setBusy(true);setMessage('');
    try {await commerceApi(`/merchant/commerce/inventory/${id}`,merchantToken(),'POST',{selectedVariants:trackVariant?variants:{},adjustment:Number(data.get('adjustment')),lowStockThreshold:Number(data.get('threshold')),reason:String(data.get('reason'))});await load();setMessage('تم تسجيل تعديل المخزون.');form.reset();}
    catch(e){setMessage((e as Error).message);}finally{setBusy(false);}
  }
  return <div className="space-y-6"><h1 className="text-2xl font-bold">إدارة المخزون</h1><p className="text-sm">المنتجات بدون سجل مخزون لا تخضع لتتبع الكمية. عند إنشاء سجل يبدأ التتبع فوراً، ويُخصم المخزون عند تسجيل الطلب ويُستعاد عند الإلغاء المؤهل.</p><p role="status">{message}</p>
    <form onSubmit={adjust} className="grid sm:grid-cols-2 gap-4 p-5 border rounded-xl"><label className="grid gap-2 text-sm">المنتج<select required className="p-3 border rounded bg-white dark:bg-slate-900" value={id} onChange={e=>{setId(e.target.value);setVariants({});setTrackVariant(false);}}><option value="">اختر منتجاً</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      {!!groups.length&&<label className="flex gap-2 items-center"><input type="checkbox" checked={trackVariant} onChange={e=>{setTrackVariant(e.target.checked);setVariants(Object.fromEntries(groups.map(g=>[g.name,g.options[0]])));}}/>تتبع اختيار محدد بدلاً من إجمالي المنتج</label>}
      {trackVariant&&groups.map(g=><label className="grid gap-2 text-sm" key={g.name}>{g.name}<select className="p-3 border rounded bg-white dark:bg-slate-900" value={variants[g.name]||''} onChange={e=>setVariants(v=>({...v,[g.name]:e.target.value}))}>{g.options.map(o=><option key={o}>{o}</option>)}</select></label>)}
      <label className="grid gap-2 text-sm">التعديل (+ إضافة / − خصم)<input type="number" name="adjustment" required min={-1000000} max={1000000} className="p-3 border rounded bg-transparent"/></label><label className="grid gap-2 text-sm">حد تنبيه المخزون المنخفض<input type="number" name="threshold" min={0} max={1000000} defaultValue={5} required className="p-3 border rounded bg-transparent"/></label><label className="grid gap-2 text-sm">سبب التعديل<input name="reason" minLength={3} maxLength={500} required className="p-3 border rounded bg-transparent"/></label><button disabled={busy||!id} className="bg-emerald-700 text-white p-3 rounded self-end">تسجيل التعديل</button></form>
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{stocks.map(s=><article key={s.id} className={`border p-5 rounded-xl ${s.quantity<=s.lowStockThreshold?'border-amber-600':''}`}><h2 className="font-bold">{products.find(p=>p.id===s.productId)?.name||s.productId}</h2><p className="text-xs my-2">{Object.values(JSON.parse(s.selectedVariantsJson)).join(' / ')||'إجمالي المنتج'}</p><p className="text-2xl">{s.quantity}</p>{s.quantity<=s.lowStockThreshold&&<p className="text-amber-700 dark:text-amber-400">{s.quantity===0?'نفد المخزون':'مخزون منخفض'}</p>}</article>)}</div>
  </div>;
}
