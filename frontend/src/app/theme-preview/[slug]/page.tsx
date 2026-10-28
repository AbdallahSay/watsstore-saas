'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Search, ShoppingBag, SlidersHorizontal, ImageOff } from 'lucide-react';
import { api } from '@/lib/api';
import type { Store, Product } from '@/types';
import { getStoreTheme, STORE_THEME_IDS, STORE_THEMES, type StoreThemeId } from '@/lib/store-themes';
import '@/styles/store-themes.css';

const labels: Record<StoreThemeId, { eyebrow: string; headline: string; subtitle: string }> = {
  editorial: { eyebrow: 'مختارات بعناية', headline: 'تفاصيل تصنع الفرق', subtitle: 'اكتشف منتجات مختارة بعناية لتناسب أسلوبك.' },
  streetwear: { eyebrow: 'COLLECTION / 2026', headline: 'أسلوبك يبدأ هنا', subtitle: 'قطع مميزة تعبر عن شخصيتك.' },
  lifestyle: { eyebrow: 'بيت يحمل ذوقك', headline: 'مساحات أجمل، حياة أدفأ', subtitle: 'كل ما يضيف لمسة جميلة إلى يومك.' },
};

export default function StoreThemePreviewPage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const [store, setStore] = useState<Store | null>(null);
  const [themeId, setThemeId] = useState<StoreThemeId>('editorial');
  const [categoryId, setCategoryId] = useState<number | 'all'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!slug) return;
    let live = true;
    setLoading(true);
    api.getPublicStore(slug)
      .then((data) => { if (live) { setStore(data); setError(''); } })
      .catch(() => { if (live) setError('تعذر تحميل المتجر. تأكد من الرابط وحاول مجدداً.'); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [slug]);

  const theme = getStoreTheme(themeId);
  const copy = labels[themeId];
  const products = useMemo(() => (store?.products ?? [])
    .filter((p) => categoryId === 'all' || p.categoryId === categoryId)
    .filter((p) => p.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
    .sort((a, b) => a.sortOrder - b.sortOrder), [store, categoryId, search]);

  if (loading) return <main dir="rtl" className="min-h-screen grid place-items-center p-8" role="status">جاري تحميل المتجر...</main>;
  if (error || !store) return <main dir="rtl" className="min-h-screen grid place-items-center p-8" role="alert">{error || 'المتجر غير متاح'}</main>;

  return (
    <main dir="rtl" className={`ws-storefront ${theme.cssClass}`}>
      <div className="border-b border-current/10 px-4 py-3 sm:px-8 lg:px-12 flex flex-wrap items-center justify-between gap-3" aria-label="معاينة الثيمات">
        <span className="text-xs font-semibold opacity-70">WatsStore · معاينة التصميم — غير منشورة</span>
        <div className="flex flex-wrap gap-2" role="group" aria-label="اختر تصميم المتجر">
          {STORE_THEME_IDS.map(id => (
            <button key={id} type="button" aria-pressed={themeId === id}
              onClick={() => setThemeId(id)}
              className={`min-h-11 rounded-full px-3 text-xs border transition-colors ${themeId === id ? 'font-bold border-current' : 'border-current/20 opacity-75 hover:opacity-100'}`}>
              {STORE_THEMES[id].name}
            </button>
          ))}
        </div>
      </div>

      <header className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-5 flex items-center gap-4 justify-between">
        <a href="#products" className="text-xl sm:text-2xl font-black tracking-tight">{store.storeName}</a>
        <nav className="hidden md:flex items-center gap-7 text-sm" aria-label="القائمة الرئيسية">
          <a href="#products" className="hover:underline">المنتجات</a>
          <a href="#categories" className="hover:underline">الأقسام</a>
          <a href="#about" className="hover:underline">عن المتجر</a>
        </nav>
        <span className="flex gap-3 items-center" aria-label="أدوات المتجر"><Search size={19} aria-hidden="true" /><ShoppingBag size={19} aria-hidden="true" /></span>
      </header>

      <section className="relative overflow-hidden border-y" style={{borderColor:'var(--ws-border)',background:'var(--ws-card)'}}>
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 min-h-[360px] md:min-h-[480px]">
          <div className="px-6 sm:px-12 lg:px-20 py-16 md:py-24 flex flex-col justify-center items-start">
            <p className="text-sm uppercase tracking-widest mb-5" style={{color:'var(--ws-muted)'}}>{copy.eyebrow}</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight max-w-xl">{copy.headline}</h1>
            <p className="mt-5 text-base max-w-md leading-8" style={{color:'var(--ws-muted)'}}>{copy.subtitle}</p>
            <a className="ws-primary-action mt-8 inline-flex gap-3 items-center px-7 py-3 font-bold" href="#products">تسوق المجموعة <ArrowLeft size={18}/></a>
          </div>
          <div className="relative min-h-[260px] md:min-h-full bg-black/5">
            {store.coverUrl ? <img src={store.coverUrl} alt={`صورة غلاف ${store.storeName}`} className="absolute w-full h-full object-cover" /> :
            <div className="absolute inset-0 flex justify-center items-center opacity-40 gap-3"><ImageOff size={30}/> صورة غلاف المتجر</div>}
          </div>
        </div>
      </section>

      <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 pt-12">
        <div className="flex justify-between gap-3 items-center mb-5"><h2 className="font-bold text-xl md:text-2xl">تسوق حسب القسم</h2><SlidersHorizontal size={20} aria-hidden="true"/></div>
        <div className="flex flex-wrap gap-2">
          <button aria-pressed={categoryId === 'all'} onClick={() => setCategoryId('all')} className="min-h-11 px-5 rounded-full border" style={{borderColor:'var(--ws-border)',background: categoryId === 'all'?'var(--ws-card)':undefined}}>كل المنتجات</button>
          {store.categories.filter(c=>c.isActive!==false).sort((a,b)=>a.sortOrder-b.sortOrder).map(c=>
            <button key={c.id} aria-pressed={categoryId === c.id} onClick={() => setCategoryId(c.id)} className="min-h-11 px-5 rounded-full border" style={{borderColor:'var(--ws-border)',background: categoryId === c.id?'var(--ws-card)':undefined}}>{c.name}</button>)}
        </div>
      </section>

      <section id="products" className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-12 md:py-16">
        <div className="flex justify-between items-end gap-4 mb-7">
          <div><p className="text-sm mb-2" style={{color:'var(--ws-muted)'}}>منتجات من {store.storeName}</p><h2 className="font-black text-2xl sm:text-3xl">اكتشف المجموعة</h2></div>
          <label className="flex gap-2 items-center border rounded-lg px-3" style={{borderColor:'var(--ws-border)'}}>
            <Search size={18} aria-hidden="true"/>
            <input className="min-w-0 w-24 sm:w-44 h-11 bg-transparent outline-none text-sm" type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث عن منتج" aria-label="ابحث عن منتج"/>
          </label>
        </div>
        {products.length ? <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {products.map((p: Product) => <article key={p.id} className="ws-product-card overflow-hidden rounded-xl">
            <div className="aspect-[4/5] relative bg-black/5">
              {p.imageUrl ? <img src={p.imageUrl} loading="lazy" alt={p.name} className="h-full w-full object-cover"/> : <div className="h-full grid place-content-center opacity-50"><ImageOff size={28}/></div>}
              {!p.isAvailable && <span className="absolute top-3 right-3 bg-black text-white px-2 py-1 text-xs rounded">غير متوفر</span>}
            </div>
            <div className="p-3 sm:p-4">
              <h3 className="font-bold line-clamp-2 min-h-11">{p.name}</h3>
              <p className="font-bold mt-2" dir="auto">{p.price.toLocaleString('ar-EG')} {store.currency || 'EGP'}</p>
              {p.description && <p className="text-xs mt-2 line-clamp-2" style={{color:'var(--ws-muted)'}}>{p.description}</p>}
              {p.isAvailable && <a href={`/theme-preview/${encodeURIComponent(store.slug)}/checkout?product=${encodeURIComponent(p.id)}`} className="ws-primary-action mt-4 flex w-full items-center justify-center gap-2 px-3 py-2 text-center text-xs sm:text-sm font-bold">اطلب أونلاين <ShoppingBag size={16} aria-hidden="true"/></a>}

            </div>
          </article>)}
        </div> : <p className="rounded-lg border p-8 text-center" style={{borderColor:'var(--ws-border)'}}>لا توجد منتجات مطابقة للبحث.</p>}
      </section>
      <footer id="about" className="px-5 py-10 text-center border-t text-sm" style={{borderColor:'var(--ws-border)',color:'var(--ws-muted)'}}>متجر {store.storeName} · {store.city} · معاينة تصميم تجريبية، لا تدعم إتمام الطلبات</footer>
    </main>
  );
}
