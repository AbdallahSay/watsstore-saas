'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, ArrowUpRight, Search, MessageCircle } from 'lucide-react';
import { Store, Product, CartItem } from '@/types';
import ProductModal from '@/components/ProductModal';
import CommerceCart from './CommerceCart';
import { getStoreTheme, StoreThemeId } from '@/lib/store-themes';
import { useLanguage } from '@/context/LanguageContext';
import { api } from '@/lib/api';
import { pixel } from '@/lib/pixel';
import '@/styles/store-themes.css';

interface Props { store: Store; previewTheme?: StoreThemeId; preview?: boolean }
export default function CommerceStorefront({store, previewTheme, preview = false}: Props) {
  const {language, setLanguage} = useLanguage();
  const english = language !== 'ar';
  const tr = (ar: string, en: string) => english ? en : ar;
  const theme = getStoreTheme(previewTheme || store.themeId);
  const [category, setCategory] = useState<number | 'all'>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('featured');
  const [maximumPrice, setMaximumPrice] = useState('');
  const [available, setAvailable] = useState(false);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);
  const cartKey = `watsstore_cart_${store.slug}`;
  useEffect(() => {
    setLoaded(false);
    try {
      const saved = JSON.parse(localStorage.getItem(cartKey) || '[]');
      setItems(Array.isArray(saved) ? saved.flatMap((x: CartItem) => {
        const current = store.products.find(p => p.id === x.product?.id);
        return current && Number.isInteger(x.quantity) && x.quantity > 0 && x.quantity <= 1000 && x.selectedVariants && typeof x.selectedVariants === 'object' ? [{...x, product: current}] : [];
      }) : []);
    } catch { setItems([]); }
    setLoaded(true);
  }, [cartKey, store.products]);
  useEffect(() => {if (loaded && !preview) {try {localStorage.setItem(cartKey, JSON.stringify(items));} catch { /* optional storage */ }}}, [items, loaded, cartKey, preview]);
  useEffect(() => {setPage(1);}, [category, search, sort, maximumPrice, available]);
  const products = useMemo(() => {
    const list = store.products.filter(p => (category === 'all' || p.categoryId === category)
      && `${p.name} ${p.description || ''}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
      && (!maximumPrice || p.price <= Number(maximumPrice)) && (!available || p.isAvailable));
    if (sort === 'price-up') list.sort((a,b) => a.price - b.price);
    if (sort === 'price-down') list.sort((a,b) => b.price - a.price);
    if (sort === 'newest') list.sort((a,b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return list;
  }, [store.products, category, search, maximumPrice, available, sort]);
  const totalItems = items.reduce((n,x) => n + x.quantity, 0);
  const wa = `https://wa.me/${store.whatsAppNumber.replace(/\D/g, '').replace(/^0/, '20')}`;
  const heroProduct = store.products.find(p => p.imageUrl);
  const heroImage = store.coverUrl || heroProduct?.imageUrl;
  const money = (n: number) => `${n.toLocaleString(english ? 'en-EG' : 'ar-EG', {maximumFractionDigits: 2})} ${store.currency}`;
  function add(p: Product, quantity: number, selections: Record<string,string>) {
    if (!p.isAvailable || preview || store.isTrialExpired) return;
    const key = (v: Record<string,string>) => JSON.stringify(Object.entries(v).sort(([a],[b]) => a.localeCompare(b)));
    setItems(old => {
      const index = old.findIndex(x => x.product.id === p.id && key(x.selectedVariants) === key(selections));
      return index < 0 ? [...old, {product:p, quantity, selectedVariants:selections}] : old.map((x,i) => i === index ? {...x, quantity:Math.min(1000, x.quantity + quantity)} : x);
    });
    if (store.metaPixelId) pixel.addToCart(store.metaPixelId, {content_name:p.name, content_ids:[p.id], content_type:'product', value:p.price * quantity, currency:'EGP'});
    setProduct(null); setCartOpen(true);
  }
  async function review(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = e.currentTarget; const data = new FormData(form); setReviewBusy(true); setReviewMessage('');
    try { const r = await api.submitReview(store.slug, {customerName:String(data.get('name')), rating:Number(data.get('rating')), comment:String(data.get('comment'))}); setReviewMessage(r.message); form.reset(); }
    catch(e) {setReviewMessage((e as Error).message);} finally {setReviewBusy(false);}
  }
  return <div className={`ws-storefront ${theme.cssClass}`} dir={english ? 'ltr' : 'rtl'} lang={english ? 'en' : 'ar'} data-theme={theme.id}>
    <a className="ws-skip" href="#catalog">{tr('انتقل للمنتجات', 'Skip to products')}</a>
    {preview && <div className="ws-preview-banner">{tr('معاينة فقط — المتجر المنشور لم يتغير', 'Preview only — published storefront is unchanged')}</div>}
    <div className="ws-announcement"><span>{store.city} · {store.businessCategory}</span><span>{tr('تسوق من', 'Shop from')} {store.storeName}</span><button onClick={() => setLanguage(english ? 'ar' : 'en')}>{english ? 'العربية' : 'English'}</button></div>
    <header className="ws-header"><a className="ws-brand" href={`/s/${store.slug}`}>{store.logoUrl && <img src={store.logoUrl} alt="" width="38" height="38"/>}<span>{store.storeName}</span></a>
      <nav aria-label={tr('التنقل', 'Main navigation')}><a href="#catalog">{tr('تسوق المجموعة', 'Shop collection')}</a><a href="#reviews">{tr('آراء العملاء', 'Reviews')}</a><a href={wa} target="_blank" rel="noreferrer">{tr('تواصل معنا', 'Contact')}</a></nav>
      <button className="ws-bag" aria-label={tr(`حقيبة التسوق، ${totalItems} منتجات`, `Shopping bag, ${totalItems} items`)} onClick={() => setCartOpen(true)} disabled={preview}><ShoppingBag size={19}/><span>{tr('الحقيبة', 'Bag')} ({totalItems})</span></button>
    </header>
    {store.isTrialExpired && <p className="ws-error ws-store-alert" role="status">{tr('استقبال الطلبات متوقف مؤقتاً لانتهاء اشتراك المتجر.', 'Orders are temporarily unavailable while the store renews its subscription.')}</p>}
    <main><section className="ws-hero" aria-labelledby="store-heading"><div className="ws-hero-copy"><p className="ws-eyebrow">{store.businessCategory} / {store.city}</p>
      <h1 id="store-heading">{store.storeName}<span>{theme.id === 'editorial' ? tr('تفاصيل تستحق الاقتناء.', 'The art of choosing well.') : theme.id === 'streetwear' ? tr('اختياراتك. قواعدك.', 'YOUR STYLE. YOUR RULES.') : tr('أشياء تحب أن تعيش معها.', 'Objects for a life well lived.')}</span></h1>
      {store.seoDescription && <p className="ws-hero-description">{store.seoDescription}</p>}<a className="ws-primary-action" href="#catalog">{tr('اكتشف المجموعة', 'Explore the collection')}<ArrowUpRight size={20}/></a><p className="ws-hero-caption">{tr('منتجات', 'PRODUCTS')} {String(store.products.length).padStart(2,'0')} <span>— {store.city}</span></p></div>
      <div className="ws-hero-art">{heroImage ? <img src={heroImage} alt={store.coverUrl ? store.storeName : heroProduct?.name || store.storeName} fetchPriority="high" width="1000" height="1000"/> : <div className="ws-empty-art">{store.storeName}</div>}{heroProduct && <a href="#catalog" className="ws-photo-caption"><span>{heroProduct.name}</span><span>{money(heroProduct.price)}</span></a>}</div>
      {theme.id === 'lifestyle' && <p className="ws-side-note">{tr('مساحة لما تحب', 'MAKE ROOM FOR WHAT YOU LOVE')}</p>}</section>
      <section id="catalog" className="ws-catalog" aria-labelledby="collection-title"><div className="ws-section-heading"><div><p className="ws-eyebrow">{tr('من متجرنا إليك', 'FROM OUR STORE TO YOU')}</p><h2 id="collection-title">{category === 'all' ? tr('المجموعة', 'The collection') : store.categories.find(c => c.id === category)?.name}<sup>{products.length}</sup></h2></div><a href={wa} target="_blank" rel="noreferrer">{tr('تحتاج مساعدة؟', 'Need a hand?')} ↗</a></div>
      <div className="ws-catalog-layout"><aside className="ws-catalog-sidebar"><p className="ws-eyebrow">{tr('تسوق حسب القسم', 'SHOP BY CATEGORY')}</p><div className="ws-categories"><button aria-pressed={category === 'all'} onClick={() => setCategory('all')}>{tr('جميع المنتجات', 'All products')} <span>{store.products.length}</span></button>{store.categories.map(c => <button key={c.id} aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>{c.name}<span>{store.products.filter(p => p.categoryId === c.id).length}</span></button>)}</div></aside>
      <div className="ws-products-area"><div className="ws-filters"><label className="ws-search"><Search size={16}/><input aria-label={tr('البحث عن منتج', 'Search products')} type="search" placeholder={tr('ابحث في المجموعة…', 'Search the collection…')} value={search} onChange={e => setSearch(e.target.value)}/></label><label><span className="sr-only">{tr('الترتيب', 'Sort by')}</span><select value={sort} onChange={e => setSort(e.target.value)}><option value="featured">{tr('اختيارات المتجر', 'Featured')}</option><option value="newest">{tr('الأحدث', 'New arrivals')}</option><option value="price-up">{tr('السعر: الأقل أولاً', 'Price: low to high')}</option><option value="price-down">{tr('السعر: الأعلى أولاً', 'Price: high to low')}</option></select></label><label className="ws-max-price">{tr('أقصى سعر', 'Max price')}<input type="number" min="0" value={maximumPrice} onChange={e => setMaximumPrice(e.target.value)}/></label><label className="ws-stock-filter"><input type="checkbox" checked={available} onChange={e => setAvailable(e.target.checked)}/>{tr('المتوفر فقط', 'In stock')}</label></div>
      <div className="ws-product-grid">{products.slice(0, page * 16).map((p,i) => <article className="ws-catalog-product" key={p.id}><button className="ws-product-image" onClick={() => {setProduct(p); if(store.metaPixelId) pixel.viewContent(store.metaPixelId,{content_name:p.name,content_ids:[p.id],content_type:'product',value:p.price,currency:'EGP'});}} aria-label={tr(`عرض ${p.name}`, `View ${p.name}`)}>{p.imageUrl ? <img src={p.imageUrl} alt={p.name} loading="lazy" width="600" height="750"/> : <div className="ws-empty-art">{p.name}</div>}<span className="ws-product-index">{String(i+1).padStart(2,'0')}</span>{!p.isAvailable && <span className="ws-stock-badge">{tr('غير متوفر', 'Sold out')}</span>}<span className="ws-view-product">{tr('اكتشف المنتج', 'Discover')} ↗</span></button><div className="ws-product-info"><h3><button onClick={() => setProduct(p)}>{p.name}</button></h3><p>{money(p.price)}{p.compareAtPrice != null && p.compareAtPrice > p.price && <del>{money(p.compareAtPrice)}</del>}</p><span>{store.categories.find(c => c.id === p.categoryId)?.name}</span></div></article>)}</div>
      {products.length === 0 && <div className="ws-empty-state"><h3>{tr('لا توجد منتجات مطابقة', 'No matching products')}</h3><p>{tr('جرّب قسماً أو كلمات بحث أخرى.', 'Try another category or search.')}</p><button onClick={() => {setCategory('all');setSearch('');setMaximumPrice('');setAvailable(false);}}>{tr('إعادة ضبط الفلاتر', 'Reset filters')}</button></div>}{products.length > page * 16 && <button className="ws-secondary-action ws-load-more" onClick={() => setPage(p => p+1)}>{tr('عرض المزيد', 'Load more')}</button>}</div></div></section>
      <section id="reviews" className="ws-reviews"><div><p className="ws-eyebrow">{tr('تجارب من مجتمعنا', 'FROM OUR COMMUNITY')}</p><h2>{tr('آراء العملاء', 'Customer stories')}</h2>{(store.totalReviews || 0) > 0 && <p>{store.averageRating?.toFixed(1)} / 5 · {store.totalReviews} {tr('تقييم', 'reviews')}</p>}{store.reviews?.length ? <div className="ws-review-list">{store.reviews.map(r => <blockquote key={r.id}><p>“{r.comment}”</p><footer>{r.customerName} · {r.rating}/5</footer></blockquote>)}</div> : <p>{tr('شارك تجربتك الأولى مع المتجر.', 'Be the first to share your experience.')}</p>}</div>
      <form className="ws-review-form" onSubmit={review}><h3>{tr('شاركنا تجربتك', 'Share your experience')}</h3><label>{tr('الاسم', 'Name')}<input name="name" required minLength={2} maxLength={100}/></label><label>{tr('التقييم', 'Rating')}<select name="rating" defaultValue="5">{[5,4,3,2,1].map(n => <option value={n} key={n}>{n} / 5</option>)}</select></label><label>{tr('رأيك', 'Your review')}<textarea name="comment" required minLength={3} maxLength={1000}/></label><button className="ws-secondary-action" disabled={reviewBusy || preview}>{reviewBusy ? '…' : tr('إرسال للمراجعة', 'Submit for moderation')}</button><p role="status">{reviewMessage}</p></form></section>
    </main><footer className="ws-footer"><div><span className="ws-brand">{store.storeName}</span><p>{store.addressDetails || store.city}</p></div><a href={wa} target="_blank" rel="noreferrer"><MessageCircle size={18}/>{tr('تواصل عبر واتساب', 'Talk to us on WhatsApp')}</a><Link href="/">Powered by WatsStore</Link></footer>
    <ProductModal product={product} currency={store.currency} isOpen={!!product} onClose={() => setProduct(null)} onAddToCart={add}/>
    <CommerceCart store={store} items={items} open={cartOpen} english={english} close={() => setCartOpen(false)} update={(index, quantity) => setItems(old => quantity <= 0 ? old.filter((_,i) => i !== index) : old.map((x,i) => i === index ? {...x, quantity:Math.min(1000, quantity)} : x))} clear={() => setItems([])}/>
  </div>;
}
