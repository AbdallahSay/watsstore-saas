'use client';
import { useEffect, useState } from 'react';
import { commerceApi, CommerceSettings, merchantToken, ShippingZone } from '@/lib/commerce-api';
import { STORE_THEMES, StoreThemeId } from '@/lib/store-themes';
import { BUSINESS_CATEGORIES, LEGACY_THEME_CATEGORIES, type BusinessThemeCategory } from '@/lib/theme-marketplace';
import { Store } from '@/types';
import { api } from '@/lib/api';
import CommerceStorefront from '@/components/commerce/CommerceStorefront';

export default function ThemesPage() {
  const [settings, setSettings] = useState<CommerceSettings | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [preview, setPreview] = useState<StoreThemeId | 'pure-beauty' | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [category, setCategory] = useState<BusinessThemeCategory>('all');
  const [themeSearch, setThemeSearch] = useState('');
  const visibleThemes = Object.values(STORE_THEMES).filter(theme => (category === 'all' || LEGACY_THEME_CATEGORIES[theme.id].includes(category)) && (theme.name.toLowerCase().includes(themeSearch.trim().toLowerCase()) || theme.description.toLowerCase().includes(themeSearch.trim().toLowerCase())));
  async function load() {
    const result = await commerceApi<CommerceSettings>('/merchant/commerce/settings', merchantToken());
    setSettings(result); setStore(await api.getPublicStore(result.slug)); setDirty(false);
  }
  useEffect(() => {load().catch(e => setMessage(e.message));}, []);
  function update(changes: Partial<CommerceSettings>) {setSettings(s => s ? {...s, ...changes} : s); setDirty(true);}
  async function action(type: 'save' | 'publish' | 'restore') {
    if (!settings) return; setBusy(true); setMessage('');
    try {
      if (type === 'save') await commerceApi('/merchant/commerce/settings', merchantToken(), 'PUT', settings);
      else await commerceApi(`/merchant/commerce/theme/${type}`, merchantToken(), 'POST');
      await load(); setMessage(type === 'save' ? 'تم الحفظ. القالب المنشور لم يتغير.' : 'تم تحديث القالب المنشور.');
    } catch(e) {setMessage((e as Error).message);} finally {setBusy(false);}
  }
  function zoneChange(index: number, changes: Partial<ShippingZone>) {
    if (settings) update({shippingZones:settings.shippingZones.map((z,i) => i === index ? {...z,...changes} : z)});
  }
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold">القوالب وإعدادات التجارة</h1><p className="mt-2 text-sm text-slate-500">معاينة منتجاتك الحقيقية، حفظ مسودة القالب، ثم النشر.</p></div>
    {message && <p role="status" className="p-4 border rounded-xl">{message}</p>}
    {!settings ? <p>جاري تحميل الإعدادات…</p> : <>
      <div className="flex flex-wrap gap-3 items-end"><label className="text-sm">بحث عن قالب<input className="block w-full rounded-lg border p-3 bg-white text-slate-900 dark:bg-slate-900 dark:text-white" type="search" value={themeSearch} onChange={e => setThemeSearch(e.target.value)}/></label><label className="text-sm">النشاط<select className="block rounded-lg border p-3 bg-white text-slate-900 dark:bg-slate-900 dark:text-white" value={category} onChange={e => setCategory(e.target.value as BusinessThemeCategory)}>{BUSINESS_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.ar}</option>)}</select></label></div>
      {visibleThemes.length === 0 && category !== 'beauty' && <p role="status">لا توجد قوالب متاحة لهذا النشاط حاليًا.</p>}
      {(category === 'all' || category === 'beauty') && <article className="rounded-xl border border-rose-200 dark:border-rose-900 p-5 space-y-3 bg-rose-50 text-rose-950 dark:bg-slate-900 dark:text-rose-100"><div className="rounded-lg h-24 p-5 flex items-center bg-[#f6e9e6] text-[#733347] font-serif text-2xl">Pure Beauty</div><h2 className="font-bold">Pure Beauty — معاينة تجريبية</h2><p className="text-sm">تصميم تجميل وعناية قيد التطوير. المعاينة فقط؛ غير متاح للحفظ أو النشر حتى اكتمال اختبارات الشراء والأمان.</p><button type="button" className="min-h-11 border border-rose-700 dark:border-rose-300 rounded-lg px-4 py-2" onClick={()=>setPreview('pure-beauty')}>معاينة التصميم</button></article>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{visibleThemes.map(theme => <article key={theme.id} className={`p-6 border rounded-xl ${settings.draftTheme === theme.id ? 'border-emerald-600' : 'border-slate-300 dark:border-slate-700'}`}><div className="h-28 mb-5 p-5 flex items-center" style={{background:theme.id === 'streetwear' ? '#101010' : theme.id === 'editorial' ? '#f7f2ea' : '#e8d9c6',color:theme.id === 'streetwear' ? '#fb5b16' : '#392d25'}}><span className={theme.id === 'streetwear' ? 'text-3xl font-black uppercase' : 'text-2xl font-serif'}>{theme.name}</span></div><h2 className="font-bold">{theme.name}</h2><p className="text-xs leading-6 mt-2">{theme.description}</p><p className="text-xs mt-2">{settings.publishedTheme === theme.id ? 'القالب المنشور' : 'متاح'}</p><div className="flex gap-3 mt-4"><button className="border rounded-lg p-3 text-xs" onClick={() => setPreview(theme.id)}>معاينة</button><button className="border rounded-lg p-3 text-xs" disabled={busy} onClick={() => update({draftTheme:theme.id})}>اختيار للمسودة</button></div></article>)}</div>
      <div className="flex flex-wrap gap-3"><button className="bg-emerald-700 text-white rounded-lg p-3" disabled={busy || !dirty} onClick={() => action('save')}>حفظ المسودة والإعدادات</button><button className="border rounded-lg p-3" disabled={busy || dirty} onClick={() => action('publish')}>نشر القالب المحفوظ</button><button className="border rounded-lg p-3" disabled={busy || dirty} onClick={() => action('restore')}>استعادة القالب السابق</button></div>
      <section className="p-5 border rounded-xl space-y-5"><h2 className="font-bold">الدفع وإتمام الطلب</h2><label className="block">وضع إتمام الطلب<select className="block border rounded p-3 bg-white dark:bg-slate-900 mt-2" value={settings.checkoutMode} onChange={e => update({checkoutMode:e.target.value as CommerceSettings['checkoutMode']})}><option value="online">طلبات الموقع فقط</option><option value="whatsapp">واتساب فقط</option><option value="both">الموقع وواتساب</option></select></label><div className="flex flex-wrap gap-6">{(['cashOnDelivery','instaPay','mobileWallet'] as const).map((key,i) => <label className="flex gap-2 items-center" key={key}><input type="checkbox" checked={settings[key]} onChange={e => update({[key]:e.target.checked})}/>{['الدفع عند الاستلام','إنستاباي','المحفظة الإلكترونية'][i]}</label>)}</div><p className="text-xs text-slate-500">أضف حسابات التحويل في إعدادات المتجر. التحويلات لا تصبح مدفوعة حتى تتحقق منها من تفاصيل الطلب.</p></section>
      <section className="p-5 border rounded-xl space-y-5"><h2 className="font-bold">مناطق الشحن والاستلام</h2><p className="text-xs">إذا لم تضف مناطق، تُستخدم رسوم التوصيل الحالية للمتجر.</p>{settings.shippingZones.map((zone,index) => <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 border-b pb-5" key={zone.id}><label className="text-xs">المحافظة<input className="w-full border rounded p-3 bg-transparent mt-1" value={zone.governorate} maxLength={100} onChange={e => zoneChange(index,{governorate:e.target.value})}/></label><label className="text-xs">المنطقة<input className="w-full border rounded p-3 bg-transparent mt-1" value={zone.name} maxLength={100} onChange={e => zoneChange(index,{name:e.target.value})}/></label><label className="text-xs">الرسوم (ج.م)<input className="w-full border rounded p-3 bg-transparent mt-1" type="number" min={0} step="0.01" value={zone.fee} disabled={zone.pickup} onChange={e => zoneChange(index,{fee:Number(e.target.value)})}/></label><label className="text-xs">موعد التوصيل التقديري<input className="w-full border rounded p-3 bg-transparent mt-1" value={zone.estimate || ''} maxLength={150} onChange={e => zoneChange(index,{estimate:e.target.value})}/></label><div className="text-xs space-y-3"><label className="flex gap-2"><input type="checkbox" checked={zone.pickup} onChange={e => zoneChange(index,{pickup:e.target.checked,...(e.target.checked ? {fee:0} : {})})}/>استلام من المتجر</label><button className="border rounded p-3" onClick={() => update({shippingZones:settings.shippingZones.filter((_,i) => i !== index)})}>حذف المنطقة</button></div></div>)}<button className="border rounded p-3" onClick={() => update({shippingZones:[...settings.shippingZones,{id:crypto.randomUUID(),governorate:'',name:'',fee:0,pickup:false}]})}>إضافة منطقة</button></section>
      {preview && store && <section className="border-2 border-emerald-600 rounded-xl overflow-hidden"><div className="p-3 flex justify-between items-center"><h2 className="font-bold">معاينة القالب — {preview === 'pure-beauty' ? 'Pure Beauty (Preview)' : STORE_THEMES[preview].name}</h2><button onClick={() => setPreview(null)} className="border p-3 rounded">إغلاق المعاينة</button></div><CommerceStorefront store={store} preview previewTheme={preview}/></section>}
    </>}
  </div>;
}
