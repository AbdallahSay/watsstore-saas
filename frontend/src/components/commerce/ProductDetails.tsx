'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import StoreImage from './StoreImage';
import ThemeWhatsAppButton from './ThemeWhatsAppButton';
import { Product, ProductVariantGroup, Store } from '@/types';

interface Props {
  store: Store; product: Product; english: boolean; disabled: boolean;
  add: (product: Product, quantity: number, variants: Record<string, string>, buyNow?: boolean) => void;
  themeQuery?: string;
}

export default function ProductDetails({ store, product, english, disabled, add, themeQuery }: Props) {
  const tr = (ar: string, en: string) => english ? en : ar;
  const themeSuffix = themeQuery ? `?theme=${encodeURIComponent(themeQuery)}` : '';
  const groups = useMemo<ProductVariantGroup[]>(() => {
    try {
      const parsed: unknown = JSON.parse(product.variantsJson || '[]');
      return Array.isArray(parsed) ? parsed.filter((g): g is ProductVariantGroup =>
        !!g && typeof g.name === 'string' && Array.isArray(g.options) && g.options.length > 0 && g.options.every((o: unknown) => typeof o === 'string')) : [];
    } catch { return []; }
  }, [product.variantsJson]);
  const [variants, setVariants] = useState<Record<string, string>>(() => Object.fromEntries(groups.map(g => [g.name, g.options[0]])));
  const [quantity, setQuantity] = useState(1);
  const [active, setActive] = useState(0);
  const images = useMemo<string[]>(() => {
    let candidates: unknown = product.images;
    if (!Array.isArray(candidates) || !candidates.length) {
      try { candidates = JSON.parse(product.imagesJson || '[]'); } catch { candidates = []; }
    }
    const valid = Array.isArray(candidates) ? candidates.filter((x): x is string => typeof x === 'string' && !!x) : [];
    return valid.length ? valid : product.imageUrl ? [product.imageUrl] : [];
  }, [product]);
  const max = Math.max(1, Math.min(1000, product.stockQuantity ?? 1000));
  const unavailable = disabled || !product.isAvailable || product.stockQuantity === 0;
  const money = (value: number) => `${value.toLocaleString(english ? 'en-EG' : 'ar-EG')} ${store.currency}`;
  const related = store.products.filter(p => p.id !== product.id && p.isAvailable && p.categoryId === product.categoryId).slice(0, 4);
  return <>
    <nav className="ws-product-breadcrumb" aria-label={tr('مسار التصفح', 'Breadcrumb')}><Link prefetch={false} href={`/s/${encodeURIComponent(store.slug)}${themeSuffix}`}>{store.storeName}</Link><span aria-hidden="true"> / </span><span>{product.name}</span></nav>
    <section className="ws-product-detail" aria-labelledby="product-title">
      <div className="ws-product-gallery">
        {images.length ? <StoreImage sizes="(max-width: 767px) 100vw, 55vw" className="ws-product-main-image" src={images[active]} alt={product.name} width="900" height="1000" fetchPriority="high"/> : <div className="ws-empty-art">{product.name}</div>}
        {images.length > 1 && <div className="ws-product-thumbnails" aria-label={tr('صور المنتج', 'Product images')}>{images.map((src, index) => <button key={`${src}-${index}`} aria-label={`${tr('صورة', 'Image')} ${index + 1}`} aria-pressed={index === active} onClick={() => setActive(index)}><img src={src} alt="" width="80" height="80" loading="lazy"/></button>)}</div>}
      </div>
      <div className="ws-product-information"><p className="ws-eyebrow">{store.categories.find(c => c.id === product.categoryId)?.name}</p><h1 id="product-title">{product.name}</h1>
        <p className="ws-product-detail-price">{money(product.price)} {product.compareAtPrice && product.compareAtPrice > product.price ? <del>{money(product.compareAtPrice)}</del> : null}</p>
        <p role="status">{unavailable ? tr('غير متوفر حالياً', 'Currently unavailable') : tr('متاح للطلب', 'Available to order')}</p>
        <form onSubmit={event => { event.preventDefault(); if (!unavailable) add(product, quantity, variants); }}>
          {groups.map(group => <fieldset key={group.name}><legend>{group.name}</legend><div className="ws-product-options">{group.options.map(option => <button type="button" key={option} aria-pressed={variants[group.name] === option} onClick={() => setVariants(old => ({...old, [group.name]: option}))}>{option}</button>)}</div></fieldset>)}
          <label className="ws-product-quantity">{tr('الكمية', 'Quantity')}<input type="number" name="quantity" min="1" max={max} required value={quantity} onChange={event => setQuantity(Math.max(1, Math.min(max, Number(event.target.value) || 1)))}/></label>
          <div className="ws-product-actions">
            <button className="ws-primary-action" disabled={unavailable} type="submit">{tr('أضف إلى الحقيبة', 'Add to bag')}</button>
            <button className="ws-secondary-action" disabled={unavailable} type="button" onClick={() => add(product, quantity, variants, true)}>{tr('اشترِ الآن', 'Buy now')}</button>
            {store.whatsAppNumber && (
              <ThemeWhatsAppButton
                phone={store.whatsAppNumber}
                variant="product"
                appearance="outlined"
                english={english}
                text={tr(
                  `مرحباً ${store.storeName}، أود الاستفسار عن منتج "${product.name}" المعروض بسعر ${money(product.price)}.`,
                  `Hello ${store.storeName}, I would like to inquire about "${product.name}" priced at ${money(product.price)}.`
                )}
                label={tr('استفسار عبر واتساب', 'Inquire via WhatsApp')}
              />
            )}
          </div>
          <p className="ws-product-stock-note">{tr('نتحقق من مخزون الاختيارات والسعر النهائي على الخادم عند تأكيد الطلب.', 'Variant stock and the final price are checked when your order is confirmed.')}</p>
        </form>
        {product.description && <p className="ws-product-description">{product.description}</p>}
      </div>
    </section>
    {!!related.length && <section className="ws-related"><h2>{tr('من نفس المجموعة', 'From the same collection')}</h2><div className="ws-product-grid">{related.map(p => <article className="ws-product-card" key={p.id}><Link prefetch={false} href={`/s/${encodeURIComponent(store.slug)}/p/${encodeURIComponent(p.slug)}${themeSuffix}`}>{p.imageUrl && <StoreImage sizes="(max-width: 767px) 50vw, 25vw" src={p.imageUrl} alt={p.name} loading="lazy" width="400" height="500"/>}<h3>{p.name}</h3><p>{money(p.price)}</p></Link></article>)}</div></section>}
  </>;
}

