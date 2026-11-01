'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { getStoreTheme } from '@/lib/store-themes';
import { useLanguage } from '@/context/LanguageContext';
import '@/styles/store-themes.css';
import '@/styles/customer-commerce.css';
export default function CustomerFrame({slug,children}:{slug:string;children:React.ReactNode}) {
  const [brand,setBrand] = useState({name:slug,theme:'editorial'});
  const {language}=useLanguage(); const english=language!=='ar';
  useEffect(()=>{let live=true;api.getPublicStore(slug).then(s=>{if(live)setBrand({name:s.storeName,theme:s.themeId||'editorial'});}).catch(()=>{});return()=>{live=false;};},[slug]);
  return <main dir={english?'ltr':'rtl'} lang={english?'en':'ar'} className={`ws-storefront cc-shell ${getStoreTheme(brand.theme).cssClass}`}>
    <div className="cc-container"><header className="cc-masthead"><Link href={`/s/${encodeURIComponent(slug)}`} className="ws-brand">{brand.name}</Link><Link href={`/s/${encodeURIComponent(slug)}/my-orders`}>{english?'My orders':'طلباتي'}</Link></header>{children}<footer className="cc-footer">{english?'Your private order details stay on this device.':'بيانات متابعة طلباتك خاصة بالجهاز ده.'} · WatsStore</footer></div>
  </main>;
}
