'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ShoppingBag, ArrowUpRight, Search, MessageCircle, Plus, Minus, Sparkles } from 'lucide-react';
import { Store, Product, CartItem } from '@/types';
import ProductDetails from './ProductDetails';
import StoreImage from './StoreImage';
import { getStoreTheme, parseThemeCustomization, StoreThemeId, ThemeCustomization } from '@/lib/store-themes';
import { useLanguage } from '@/context/LanguageContext';
import { api } from '@/lib/api';
import { pixel } from '@/lib/pixel';
import '@/styles/store-themes.css';
import '@/styles/themes/pure-beauty.css';
import ThemeWhatsAppButton from './ThemeWhatsAppButton';

const CommerceCart = dynamic(() => import('./CommerceCart'));

interface Props {
  store: Store;
  previewTheme?: StoreThemeId;
  previewCustomization?: ThemeCustomization;
  preview?: boolean;
  detailProduct?: Product;
}

export default function CommerceStorefront({
  store,
  previewTheme,
  previewCustomization,
  preview = false,
  detailProduct,
}: Props) {
  const { language, setLanguage } = useLanguage();
  const router = useRouter();
  const english = language !== 'ar';
  const tr = (ar: string, en: string) => (english ? en : ar);

  const theme = getStoreTheme(previewTheme || store.themeId);
  const customization: ThemeCustomization = useMemo(() => {
    return {
      ...(parseThemeCustomization(store.customizationJson) || {}),
      ...(store.customization || {}),
      ...(previewCustomization || {}),
    };
  }, [store.customizationJson, store.customization, previewCustomization]);

  const [category, setCategory] = useState<number | 'all'>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('featured');
  const [maximumPrice, setMaximumPrice] = useState('');
  const [available, setAvailable] = useState(false);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [directCheckout, setDirectCheckout] = useState(false);
  const [previewDetail, setPreviewDetail] = useState<Product | null>(null);
  const activeDetailProduct = detailProduct || (preview ? previewDetail : null);
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);

  const cartKey = `watsstore_cart_${store.slug}`;
  const productHref = (item: Product) => `/s/${encodeURIComponent(store.slug)}/p/${encodeURIComponent(item.slug)}${previewTheme && !preview ? `?theme=${encodeURIComponent(previewTheme)}` : ''}`;

  useEffect(() => {
    if (cartOpen) setCartLoaded(true);
  }, [cartOpen]);

  useEffect(() => {
    setLoaded(false);
    try {
      const saved = JSON.parse(localStorage.getItem(cartKey) || '[]');
      setItems(
        Array.isArray(saved)
          ? saved.flatMap((x: CartItem) => {
              const current = store.products.find((p) => p.id === x.product?.id);
              return current &&
                Number.isInteger(x.quantity) &&
                x.quantity > 0 &&
                x.quantity <= 1000 &&
                x.selectedVariants &&
                typeof x.selectedVariants === 'object'
                ? [{ ...x, product: current }]
                : [];
            })
          : []
      );
    } catch {
      setItems([]);
    }
    setLoaded(true);
  }, [cartKey, store.products]);

  useEffect(() => {
    if (loaded && !preview) {
      try {
        localStorage.setItem(cartKey, JSON.stringify(items));
      } catch {
        /* optional local storage failure */
      }
    }
  }, [items, loaded, cartKey, preview]);

  useEffect(() => {
    setPage(1);
  }, [category, search, sort, maximumPrice, available]);

  const products = useMemo(() => {
    const list = store.products.filter(
      (p) =>
        (category === 'all' || p.categoryId === category) &&
        `${p.name} ${p.description || ''}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()) &&
        (!maximumPrice || p.price <= Number(maximumPrice)) &&
        (!available || p.isAvailable)
    );
    if (sort === 'price-up') list.sort((a, b) => a.price - b.price);
    if (sort === 'price-down') list.sort((a, b) => b.price - a.price);
    if (sort === 'newest') list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return list;
  }, [store.products, category, search, maximumPrice, available, sort]);

  const totalItems = items.reduce((n, x) => n + x.quantity, 0);
  const wa = `https://wa.me/${store.whatsAppNumber.replace(/\D/g, '').replace(/^0/, '20')}`;
  const heroProduct = store.products.find((p) => p.imageUrl);
  const heroImage = store.coverUrl || heroProduct?.imageUrl;
  const money = (n: number) =>
    `${n.toLocaleString(english ? 'en-EG' : 'ar-EG', { maximumFractionDigits: 2 })} ${store.currency}`;

  function add(p: Product, quantity: number, selections: Record<string, string>, buyNow = false) {
    if (!p.isAvailable || store.isTrialExpired) return;
    const key = (v: Record<string, string>) => JSON.stringify(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)));
    setItems((old) => {
      const index = old.findIndex((x) => x.product.id === p.id && key(x.selectedVariants) === key(selections));
      return index < 0
        ? [...old, { product: p, quantity, selectedVariants: selections }]
        : old.map((x, i) => (i === index ? { ...x, quantity: Math.min(1000, x.quantity + quantity) } : x));
    });
    if (store.metaPixelId) {
      pixel.addToCart(store.metaPixelId, {
        content_name: p.name,
        content_ids: [p.id],
        content_type: 'product',
        value: p.price * quantity,
        currency: 'EGP',
      });
    }
    setDirectCheckout(buyNow);
    setCartOpen(true);
  }

  function quickAddNoVariants(p: Product, delta: number) {
    if (!p.isAvailable || store.isTrialExpired) return;
    if (p.variantsJson && p.variantsJson !== '[]' && p.variantsJson !== '{}') {
      if (preview) setPreviewDetail(p);
      else router.push(productHref(p));
      return;
    }
    const currentItem = items.find((x) => x.product.id === p.id && Object.keys(x.selectedVariants).length === 0);
    const currentQty = currentItem?.quantity || 0;
    const nextQty = currentQty + delta;

    if (nextQty <= 0) {
      setItems((old) => old.filter((x) => !(x.product.id === p.id && Object.keys(x.selectedVariants).length === 0)));
    } else if (currentItem) {
      setItems((old) =>
        old.map((x) =>
          x.product.id === p.id && Object.keys(x.selectedVariants).length === 0
            ? { ...x, quantity: Math.min(1000, nextQty) }
            : x
        )
      );
    } else {
      add(p, 1, {});
    }
  }

  async function review(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setReviewBusy(true);
    setReviewMessage('');
    try {
      const r = await api.submitReview(store.slug, {
        customerName: String(data.get('name')),
        rating: Number(data.get('rating')),
        comment: String(data.get('comment')),
      });
      setReviewMessage(r.message);
      form.reset();
    } catch (e) {
      setReviewMessage((e as Error).message);
    } finally {
      setReviewBusy(false);
    }
  }

  // Dynamic CSS variables from customizer
  const dynamicStyles: Record<string, string> = {};
  if (customization.primaryColor) {
    dynamicStyles['--ws-accent'] = customization.primaryColor;
  }
  if (customization.secondaryColor) {
    dynamicStyles['--ws-border'] = customization.secondaryColor;
  }

  const gridDensityClass =
    customization.gridDensity === 'compact'
      ? 'ws-grid--compact'
      : customization.gridDensity === 'spacious'
      ? 'ws-grid--spacious'
      : '';

  return (
    <div
      className={`ws-storefront ${theme.cssClass} ${gridDensityClass}`}
      dir={english ? 'ltr' : 'rtl'}
      lang={english ? 'en' : 'ar'}
      data-theme={theme.id}
      data-button-shape={customization.buttonShape || 'rounded'}
      data-card-ratio={customization.cardAspectRatio || '4/5'}
      data-font={customization.fontPreset || 'cairo'}
      style={dynamicStyles as React.CSSProperties}
    >
      <a className="ws-skip" href={activeDetailProduct ? '#product-title' : '#catalog'}>
        {tr('انتقل للمنتجات', 'Skip to products')}
      </a>

      {preview && (
        <div className="ws-preview-banner">
          {tr('معاينة حية — المتجر المنشور لم يتغير', 'Live preview — published storefront is unchanged')}
        </div>
      )}

      {/* Street Pulse Top Drop Marquee */}
      {theme.id === 'street-pulse' && (
        <div className="ws-street-marquee" aria-hidden="true">
          <div className="ws-street-marquee-track">
            {[0, 1].map((copy) => (
              <div className="ws-street-marquee-group" key={copy}>
                <span>🔥 NEW DROP EXCLUSIVE · LIMITED QUANTITIES · IMMEDIATE DELIVERY 🔥</span>
                <span>🔥 إصدارات حصرية لا تُفوّت · كميات محدودة للغاية · شحن فوري 🔥</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Announcement Bar */}
      <div className="ws-announcement">
        <span>
          {customization.announcementText || `${store.city} · ${store.businessCategory}`}
        </span>
        <span>
          {tr('تسوق مباشرة من', 'Shop directly from')} {store.storeName}
        </span>
        <button className="ws-announcement-lang-btn" onClick={() => setLanguage(english ? 'ar' : 'en')}>
          {english ? 'العربية' : 'English'}
        </button>
      </div>

      {/* Store Header */}
      <header className="ws-header">
        <a className="ws-brand" href={preview ? '#top' : `/s/${store.slug}`} onClick={preview ? (e) => e.preventDefault() : undefined}>
          {store.logoUrl && <img src={store.logoUrl} alt="" width="38" height="38" />}
          <span>{store.storeName}</span>
        </a>

        <nav aria-label={tr('التنقل', 'Main navigation')}>
          <a href={activeDetailProduct ? `/s/${store.slug}#catalog` : '#catalog'}>
            {tr('المجموعة والمنتجات', 'Collection')}
          </a>
          <a href={activeDetailProduct ? `/s/${store.slug}#reviews` : '#reviews'}>
            {tr('آراء العملاء', 'Reviews')}
          </a>
          <a href={wa} target="_blank" rel="noreferrer">
            {tr('تواصل معنا', 'Contact')}
          </a>
        </nav>

        <div className="ws-header-actions">
          <Link
            prefetch={false}
            href={preview ? '#my-orders' : `/s/${encodeURIComponent(store.slug)}/my-orders`}
            onClick={preview ? (e) => e.preventDefault() : undefined}
            className="ws-my-orders-link"
          >
            {tr('طلباتي', 'My orders')}
          </Link>
          <button
            className="ws-bag"
            aria-label={tr(`حقيبة التسوق، ${totalItems} منتجات`, `Shopping bag, ${totalItems} items`)}
            onClick={() => {
              setDirectCheckout(false);
              setCartOpen(true);
            }}
          >
            <ShoppingBag size={18} />
            <span>
              {tr('الحقيبة', 'Bag')} ({totalItems})
            </span>
          </button>
        </div>
      </header>

      {store.isTrialExpired && (
        <p className="ws-error ws-store-alert" role="status">
          {tr(
            'استقبال الطلبات متوقف مؤقتاً لانتهاء اشتراك المتجر.',
            'Orders are temporarily unavailable while the store renews its subscription.'
          )}
        </p>
      )}

      <main>
        {preview && previewDetail && (
          <button
            type="button"
            className="ws-preview-product-back"
            onClick={() => setPreviewDetail(null)}
          >
            {tr('العودة لجميع المنتجات', 'Back to all products')}
          </button>
        )}
        {activeDetailProduct ? (
          <ProductDetails
            key={activeDetailProduct.id}
            store={store}
            product={activeDetailProduct}
            english={english}
            disabled={!!store.isTrialExpired}
            add={add}
            themeQuery={previewTheme && !preview ? previewTheme : undefined}
          />
        ) : (
          <>
            {/* Hero Section */}
            <section className="ws-hero" aria-labelledby="store-heading">
              <div className="ws-hero-copy">
                <p className="ws-eyebrow">
                  {theme.categoryLabelAr} · {store.city}
                </p>
                <h1 id="store-heading">
                  {store.storeName}
                  <span>{tr(theme.heroHeadlineAr, theme.heroHeadlineEn)}</span>
                </h1>
                <p className="ws-hero-description">
                  {store.seoDescription || tr(theme.heroSubheadlineAr, theme.heroSubheadlineEn)}
                </p>
                <a className="ws-primary-action" href="#catalog">
                  {tr('اكتشف المجموعة الآن', 'Explore Collection')}
                  <ArrowUpRight size={18} />
                </a>
              </div>

              <div className="ws-hero-art">
                {heroImage ? (
                  <StoreImage
                    sizes="(max-width: 767px) 100vw, 50vw"
                    src={heroImage}
                    alt={store.coverUrl ? store.storeName : heroProduct?.name || store.storeName}
                    fetchPriority="high"
                    width="1000"
                    height="1000"
                  />
                ) : (
                  <div className="ws-empty-art">
                    <Sparkles size={32} style={{ marginBottom: 12, opacity: 0.7 }} />
                    <span>{store.storeName}</span>
                  </div>
                )}
                {heroProduct && (
                  <a href="#catalog" className="ws-photo-caption">
                    <span>{heroProduct.name}</span>
                    <span>{money(heroProduct.price)}</span>
                  </a>
                )}
              </div>
            </section>

            {/* Theme-Specific Artisan Story Banner */}
            {theme.id === 'crafted-story' && (
              <aside className="ws-artisan-quote-card">
                <p>
                  “{tr(
                    'كل قطعة في هذا المتجر صُنعت بشغف وصبر لتكون فريدة وتحمل لمسة إنسانية دافئة تدوم.',
                    'Every piece is handmade with devotion and patience to carry warmth and lasting soul.'
                  )}”
                </p>
                <cite>— {tr('صناع الحرف في', 'The Makers at')} {store.storeName}</cite>
              </aside>
            )}

            {/* Product Catalog Section */}
            <section id="catalog" className="ws-catalog" aria-labelledby="collection-title">
              <div className="ws-section-heading">
                <div>
                  <p className="ws-eyebrow">{tr('من تشكيلتنا الحصرية', 'FROM OUR CATALOG')}</p>
                  <h2 id="collection-title">
                    {category === 'all'
                      ? tr('جميع المنتجات', 'All Products')
                      : store.categories.find((c) => c.id === category)?.name}
                    <span className="ws-product-count" aria-label={tr(`عدد المنتجات: ${products.length}`, `Products: ${products.length}`)}>{products.length}</span>
                  </h2>
                </div>
                <ThemeWhatsAppButton
                  phone={store.whatsAppNumber}
                  variant="catalog"
                  appearance="outlined"
                  english={english}
                  text={tr(
                    `مرحباً ${store.storeName}، أود الاستفسار عن تفصيل طلب خاص.`,
                    `Hello ${store.storeName}, I would like to inquire about a custom order.`
                  )}
                />
              </div>

              <div className="ws-catalog-layout">
                {/* Category Filter Sidebar */}
                <aside className="ws-catalog-sidebar">
                  <p className="ws-eyebrow">{tr('الأقسام والتصنيفات', 'CATEGORIES')}</p>
                  <div className="ws-categories">
                    <button aria-pressed={category === 'all'} onClick={() => setCategory('all')}>
                      {tr('جميع المنتجات', 'All products')}{' '}
                      <span>{store.products.length}</span>
                    </button>
                    {store.categories.map((c) => (
                      <button key={c.id} aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>
                        {c.name}
                        <span>{store.products.filter((p) => p.categoryId === c.id).length}</span>
                      </button>
                    ))}
                  </div>
                </aside>

                {/* Products Area */}
                <div className="ws-products-area">
                  {/* Filter controls */}
                  <div className="ws-filters">
                    <label className="ws-search">
                      <Search size={16} />
                      <input
                        aria-label={tr('البحث عن منتج', 'Search products')}
                        type="search"
                        placeholder={tr('ابحث في الكتالوج…', 'Search the catalog…')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </label>
                    <label>
                      <span className="sr-only">{tr('الترتيب', 'Sort by')}</span>
                      <select value={sort} onChange={(e) => setSort(e.target.value)}>
                        <option value="featured">{tr('اختيارات المتجر', 'Featured')}</option>
                        <option value="newest">{tr('الأحدث وصولاً', 'New arrivals')}</option>
                        <option value="price-up">{tr('السعر: الأقل أولاً', 'Price: low to high')}</option>
                        <option value="price-down">{tr('السعر: الأعلى أولاً', 'Price: high to low')}</option>
                      </select>
                    </label>
                    <label className="ws-max-price">
                      {tr('أقصى سعر', 'Max price')}
                      <input
                        type="number"
                        min="0"
                        value={maximumPrice}
                        onChange={(e) => setMaximumPrice(e.target.value)}
                      />
                    </label>
                    <label className="ws-stock-filter">
                      <input
                        type="checkbox"
                        checked={available}
                        onChange={(e) => setAvailable(e.target.checked)}
                      />
                      {tr('المتوفر فقط', 'In stock')}
                    </label>
                  </div>

                  {/* Product Cards Grid */}
                  <div className="ws-product-grid">
                    {products.slice(0, page * 16).map((p, i) => {
                      const cardItem = items.find(
                        (x) => x.product.id === p.id && Object.keys(x.selectedVariants).length === 0
                      );
                      const inCartQty = cardItem?.quantity || 0;

                      return (
                        <article className="ws-catalog-product" key={p.id}>
                          <Link
                            prefetch={false}
                            className="ws-product-image"
                            href={preview ? '#product-details' : productHref(p)}
                            onClick={(event) => {
                              if (preview) {
                                event.preventDefault();
                                setPreviewDetail(p);
                              }
                              if (store.metaPixelId && !preview) {
                                pixel.viewContent(store.metaPixelId, {
                                  content_name: p.name,
                                  content_ids: [p.id],
                                  content_type: 'product',
                                  value: p.price,
                                  currency: 'EGP',
                                });
                              }
                            }}
                            aria-label={tr(
                              `فتح صفحة ${p.name}`,
                              `Open product page for ${p.name}`
                            )}
                          >
                            {p.imageUrl ? (
                              <StoreImage
                                sizes="(max-width: 767px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                src={p.imageUrl}
                                alt={p.name}
                                loading="lazy"
                                width="600"
                                height="750"
                              />
                            ) : (
                              <div className="ws-empty-art">{p.name}</div>
                            )}
                            <span className="ws-product-index">{String(i + 1).padStart(2, '0')}</span>

                            {!p.isAvailable && (
                              <span className="ws-stock-badge">{tr('نفدت الكمية', 'Sold out')}</span>
                            )}

                            <span className="ws-view-product">{tr('صفحة المنتج', 'Product page')} ↗</span>
                          </Link>

                          <div className="ws-product-info">
                            <h3>
                              <Link prefetch={false} href={preview ? '#product-details' : productHref(p)} onClick={preview ? (event) => { event.preventDefault(); setPreviewDetail(p); } : undefined}>{p.name}</Link>
                            </h3>
                            <Link
                              prefetch={false}
                              className="ws-product-page-link"
                              href={preview ? '#product-details' : productHref(p)}
                              onClick={preview ? (e) => { e.preventDefault(); setPreviewDetail(p); } : undefined}
                              style={{ fontSize: '11px', color: 'var(--ws-accent)', fontWeight: 600, textDecoration: 'none' }}
                            >
                              {tr('صفحة المنتج', 'Product page')} ↗
                            </Link>
                            <p className="ws-product-price">
                              {money(p.price)}
                              {p.compareAtPrice != null && p.compareAtPrice > p.price && (
                                <del>{money(p.compareAtPrice)}</del>
                              )}
                            </p>
                            <span className="ws-product-category">
                              {store.categories.find((c) => c.id === p.categoryId)?.name}
                            </span>

                            {/* Theme Badges */}
                            {theme.id === 'tech-grid' && (
                              <span className="ws-spec-chip">{tr('ضمان معتمد 100%', 'Certified Warranty')}</span>
                            )}
                            {theme.id === 'golden-atelier' && (
                              <span className="ws-gold-chip">{tr('عيار أصلي موثق', 'Certified Hallmark')}</span>
                            )}
                            {theme.id === 'pure-beauty' && (
                              <span className="ws-beauty-chip">{tr('تركيبة نباتية لطيفة', 'Pure Formula')}</span>
                            )}
                            {theme.id === 'living-space' && (
                              <span className="ws-furniture-chip">{tr('خامات طبيعية متينة', 'Natural Materials')}</span>
                            )}
                            {theme.id === 'crafted-story' && (
                              <span className="ws-artisan-chip">{tr('صُنع يدوياً بحب', 'Handmade')}</span>
                            )}
                            {theme.id === 'active-motion' && (
                              <span className="ws-sport-chip">{tr('أداء رياضي فائق', 'Pro Performance')}</span>
                            )}
                            {theme.id === 'little-joy' && (
                              <span className="ws-kid-chip">{tr('آمن للأطفال 100%', 'Child Safe')}</span>
                            )}

                            {/* Fresh Market In-Card Quantity Stepper */}
                            {theme.id === 'fresh-market' && p.isAvailable && !store.isTrialExpired && (
                              <div className="ws-card-stepper">
                                <button
                                  aria-label={tr('تقليل الكمية', 'Decrease')}
                                  onClick={() => quickAddNoVariants(p, -1)}
                                  disabled={inCartQty === 0}
                                >
                                  <Minus size={14} />
                                </button>
                                <span>{inCartQty > 0 ? inCartQty : tr('أضف', 'Add')}</span>
                                <button
                                  aria-label={tr('زيادة الكمية', 'Increase')}
                                  onClick={() => quickAddNoVariants(p, 1)}
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {products.length === 0 && (
                    <div className="ws-empty-state">
                      <h3>{tr('لا توجد منتجات مطابقة للبحث', 'No matching products')}</h3>
                      <p>{tr('جرّب اختيار قسم آخر أو تغيير معايير البحث.', 'Try another category or search.')}</p>
                      <button
                        onClick={() => {
                          setCategory('all');
                          setSearch('');
                          setMaximumPrice('');
                          setAvailable(false);
                        }}
                      >
                        {tr('إعادة ضبط الفلاتر', 'Reset filters')}
                      </button>
                    </div>
                  )}

                  {products.length > page * 16 && (
                    <button className="ws-secondary-action ws-load-more" onClick={() => setPage((p) => p + 1)}>
                      {tr('عرض المزيد من المنتجات', 'Load more products')}
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* Customer Reviews Section */}
            <section id="reviews" className="ws-reviews">
              <div>
                <p className="ws-eyebrow">{tr('تجارب حقيقية', 'COMMUNITY STORIES')}</p>
                <h2>{tr('آراء العملاء وتقييماتهم', 'Customer Reviews')}</h2>
                {(store.totalReviews || 0) > 0 && (
                  <p>
                    {store.averageRating?.toFixed(1)} / 5 · {store.totalReviews} {tr('تقييم', 'reviews')}
                  </p>
                )}
                {store.reviews?.length ? (
                  <div className="ws-review-list">
                    {store.reviews.map((r) => (
                      <blockquote key={r.id}>
                        <p>“{r.comment}”</p>
                        <footer>
                          {r.customerName} · {r.rating} / 5
                        </footer>
                      </blockquote>
                    ))}
                  </div>
                ) : (
                  <p>{tr('كن أول من يشارك تجربته مع هذا المتجر!', 'Be the first to review this store!')}</p>
                )}
              </div>

              <form className="ws-review-form" onSubmit={review}>
                <h3>{tr('أضف تقييمك وتجربتك', 'Leave a review')}</h3>
                <label>
                  {tr('اسمك الكريم', 'Name')}
                  <input name="name" required minLength={2} maxLength={100} />
                </label>
                <label>
                  {tr('تقييمك للمتجر', 'Rating')}
                  <select name="rating" defaultValue="5">
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option value={n} key={n}>
                        {n} / 5
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {tr('رأيك بالتفصيل', 'Your review')}
                  <textarea name="comment" required minLength={3} maxLength={1000} />
                </label>
                <button className="ws-secondary-action" disabled={reviewBusy || preview}>
                  {reviewBusy ? '…' : tr('إرسال التقييم للمراجعة', 'Submit review')}
                </button>
                <p role="status">{reviewMessage}</p>
              </form>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="ws-footer">
        <div>
          <span className="ws-brand">{store.storeName}</span>
          <p>{store.addressDetails || store.city}</p>
        </div>
        <ThemeWhatsAppButton
          phone={store.whatsAppNumber}
          variant="footer"
          appearance="filled"
          english={english}
          text={tr(
            `مرحباً ${store.storeName}، أود التواصل معكم بخصوص المتجر.`,
            `Hello ${store.storeName}, I would like to get in touch regarding your store.`
          )}
        />
        <Link prefetch={false} href="/">Powered by WatsStore</Link>
      </footer>

      {/* Modals & Cart */}
      {(cartOpen || cartLoaded) && (
        <CommerceCart
          directCheckout={directCheckout}
          store={store}
          items={items}
          open={cartOpen}
          english={english}
          preview={preview}
          close={() => setCartOpen(false)}
          update={(index, quantity) =>
            setItems((old) =>
              quantity <= 0
                ? old.filter((_, i) => i !== index)
                : old.map((x, i) => (i === index ? { ...x, quantity: Math.min(1000, quantity) } : x))
            )
          }
          clear={() => setItems([])}
        />
      )}

      {/* Floating Theme-Adaptive WhatsApp Contact Pill */}
      <ThemeWhatsAppButton
        phone={store.whatsAppNumber}
        variant="floating"
        appearance="filled"
        english={english}
        hidden={cartOpen}
        text={tr(
          `مرحباً ${store.storeName}، أود الاستفسار عن المنتجات المتاحة في المتجر.`,
          `Hello ${store.storeName}, I would like to inquire about products in your store.`
        )}
      />
    </div>
  );
}
