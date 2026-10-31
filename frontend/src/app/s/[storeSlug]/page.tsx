import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import StoreCatalogClient from './StoreCatalogClient';
import MetaPixel from '@/components/MetaPixel';

interface PageProps {
  params: Promise<{
    storeSlug: string;
  }>;
}

export async function generateMetadata({ params: pendingParams }: PageProps): Promise<Metadata> {
  const params = await pendingParams;
  try {
    const store = await api.getPublicStore(params.storeSlug);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://frontend-bay-ten-58.vercel.app';
    const canonicalUrl = `${appUrl}/s/${store.slug}`;
    const images = store.coverUrl ? [store.coverUrl] : store.logoUrl ? [store.logoUrl] : [];

    return {
      title: store.seoTitle || `${store.storeName} | متجر ومنيو واتساب في ${store.city}`,
      description: store.seoDescription || `تصفح كتالوج ومنتجات ${store.storeName} في ${store.city}. اطلب مباشرة عبر الواتساب.`,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: store.seoTitle || store.storeName,
        description: store.seoDescription || `تصفح كتالوج ${store.storeName} في ${store.city}`,
        url: canonicalUrl,
        type: 'website',
        locale: 'ar_EG',
        images: images.length > 0 ? images.map((url) => ({ url })) : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: store.seoTitle || store.storeName,
        description: store.seoDescription || `تصفح كتالوج ${store.storeName}`,
      },
    };
  } catch {
    return {
      title: 'المتجر غير موجود | WatsStore',
      description: 'المتجر المطلوب غير متوفر حالياً.',
    };
  }
}

export default async function StorePage({ params: pendingParams }: PageProps) {
  const params = await pendingParams;
  let store;
  try {
    store = await api.getPublicStore(params.storeSlug);
  } catch (err) {
    notFound();
  }

  // Schema.org Structured Data for Google Rich Snippets (LocalBusiness + Products)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://frontend-bay-ten-58.vercel.app';
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: store.storeName,
    description: store.seoDescription,
    url: `${appUrl}/s/${store.slug}`,
    telephone: store.whatsAppNumber,
    image: store.logoUrl || store.coverUrl,
    address: {
      '@type': 'PostalAddress',
      addressLocality: store.city,
      streetAddress: store.addressDetails || store.city,
      addressCountry: 'EG',
    },
    currenciesAccepted: 'EGP',
    paymentAccepted: [store.cashOnDelivery !== false ? 'Cash on Delivery' : '', store.instaPay ? 'Manual InstaPay' : '', store.mobileWallet ? 'Manual Mobile Wallet' : ''].filter(Boolean).join(', '),
    priceRange: '$$',
    aggregateRating: (store.totalReviews && store.totalReviews > 0) ? {
      '@type': 'AggregateRating',
      ratingValue: store.averageRating ? store.averageRating.toFixed(1) : '5.0',
      reviewCount: store.totalReviews,
      bestRating: '5',
      worstRating: '1',
    } : undefined,
    review: (store.reviews && store.reviews.length > 0) ? store.reviews.map(r => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: r.customerName,
      },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: r.rating,
        bestRating: '5',
        worstRating: '1',
      },
      reviewBody: r.comment,
    })) : undefined,
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `قائمة منتجات ${store.storeName}`,
      itemListElement: store.products.map((product, idx) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Product',
          name: product.name,
          description: product.description,
          image: product.imageUrl,
          offers: {
            '@type': 'Offer',
            price: product.price,
            priceCurrency: 'EGP',
            availability: product.isAvailable
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          },
        },
        position: idx + 1,
      })),
    },
  };

  return (
    <>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\u003c") }}
      />

      {/* Merchant Dual Meta Pixel (Injected only if configured and Pro/VIP) */}
      {store.metaPixelId && <MetaPixel pixelId={store.metaPixelId} />}

      {/* Main Interactive Store Catalog */}
      <StoreCatalogClient store={store} />
    </>
  );
}
