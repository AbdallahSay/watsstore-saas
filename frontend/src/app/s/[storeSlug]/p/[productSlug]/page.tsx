import { cache } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import CommerceStorefront from '@/components/commerce/CommerceStorefront';
import { Product } from '@/types';

interface Props { params: Promise<{ storeSlug: string; productSlug: string }> }
const getStore = cache((slug: string) => api.getPublicStore(slug));
function findProduct(products: Product[], routeSlug: string) {
  let slug: string;
  try { slug = decodeURIComponent(routeSlug); } catch { return undefined; }
  return products.find(product => product.slug === slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { storeSlug, productSlug } = await params;
  try {
    const store = await getStore(storeSlug);
    const product = findProduct(store.products, productSlug);
    if (!product) return { title: 'Product unavailable' };
    return { title: `${product.name} | ${store.storeName}`, description: product.description,
      alternates: { canonical: `/s/${encodeURIComponent(store.slug)}/p/${encodeURIComponent(product.slug)}` },
      openGraph: { title: product.name, images: product.imageUrl ? [product.imageUrl] : [] } };
  } catch { return { title: 'Product unavailable' }; }
}

export default async function ProductPage({ params }: Props) {
  const { storeSlug, productSlug } = await params;
  const store = await getStore(storeSlug).catch(() => null);
  if (!store) notFound();
  const product = findProduct(store.products, productSlug);
  if (!product) notFound();
  return <CommerceStorefront key={product.id} store={store} detailProduct={product}/>;
}
