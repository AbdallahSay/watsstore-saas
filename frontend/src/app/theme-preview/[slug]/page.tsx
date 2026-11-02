'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import type { Store } from '@/types';
import { STORE_THEME_IDS, STORE_THEMES, parseStoreTheme, parseThemeCustomization, type ThemeCustomization, type StoreThemeId } from '@/lib/store-themes';
import CommerceStorefront from '@/components/commerce/CommerceStorefront';
import '@/styles/store-themes.css';

function StoreThemePreviewContent() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const initialTheme = searchParams.get('theme') ? parseStoreTheme(searchParams.get('theme')) : 'editorial-luxe';
  const [store, setStore] = useState<Store | null>(null);
  const [themeId, setThemeId] = useState<StoreThemeId>(initialTheme);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const embedded=searchParams.get('embed')==='1';
  const [customization,setCustomization]=useState<ThemeCustomization>();
  useEffect(()=>{if(!embedded)return;const receive=(event:MessageEvent)=>{if(event.origin!==location.origin||event.source!==window.parent||event.data?.type!=='watsstore:preview-design')return;setCustomization(parseThemeCustomization(JSON.stringify(event.data.customization)));setThemeId(parseStoreTheme(event.data.theme));};const key=(event:KeyboardEvent)=>{if(event.key==='Escape'&&!document.querySelector('[role="dialog"]'))window.parent.postMessage({type:'watsstore:preview-close'},location.origin)};window.addEventListener('message',receive);document.addEventListener('keydown',key);window.parent.postMessage({type:'watsstore:preview-ready'},location.origin);return()=>{window.removeEventListener('message',receive);document.removeEventListener('keydown',key)}},[embedded]);

  useEffect(() => {
    if (!slug) return;
    let live = true;
    setLoading(true);
    api.getPublicStore(slug)
      .then((data) => {
        if (live) {
          setStore(data);
          setError('');
        }
      })
      .catch(() => {
        if (live) setError('تعذر تحميل المتجر. تأكد من الرابط وحاول مجدداً.');
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <main dir="rtl" className="min-h-screen grid place-items-center p-8 bg-slate-900 text-white" role="status">
        جاري تحميل المتجر...
      </main>
    );
  }

  if (error || !store) {
    return (
      <main dir="rtl" className="min-h-screen grid place-items-center p-8 bg-slate-900 text-white" role="alert">
        {error || 'المتجر غير متاح'}
      </main>
    );
  }

  if(embedded)return <CommerceStorefront key={themeId} store={store} preview previewTheme={themeId} previewCustomization={customization}/>;
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white">
      {/* Top sticky switcher bar */}
      <div
        className="bg-slate-900 border-b border-slate-800 px-4 py-3 sm:px-8 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-40"
        aria-label="معاينة الثيمات"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300">معاينة مباشرة للتصميم:</span>
          <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
            {STORE_THEMES[themeId]?.nameAr} ({STORE_THEMES[themeId]?.name})
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="اختر تصميم المتجر">
          {STORE_THEME_IDS.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={themeId === id}
              onClick={() => setThemeId(id)}
              className={`min-h-[44px] rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                themeId === id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {STORE_THEMES[id].nameAr}
            </button>
          ))}
        </div>
      </div>

      {/* Main Full Storefront Rendering */}
      <div className="flex-1">
        <CommerceStorefront
          key={themeId}
          store={store}
          preview
          previewTheme={themeId}
        />
      </div>
    </div>
  );
}

export default function StoreThemePreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center bg-slate-900 text-white">جاري التحميل...</div>}>
      <StoreThemePreviewContent />
    </Suspense>
  );
}
