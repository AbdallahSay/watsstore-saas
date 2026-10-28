import type { Product } from '@/types';
export type PreviewCartLine = { productId: string; quantity: number };
const key = (slug: string) => 'ws_preview_cart_' + slug;
export function readPreviewCart(slug: string): PreviewCartLine[] {
  if (typeof window === 'undefined') return [];
  try {
    const input: unknown = JSON.parse(localStorage.getItem(key(slug)) || '[]');
    if (!Array.isArray(input)) return [];
    return input.filter((x): x is PreviewCartLine => typeof x === 'object' && x !== null && typeof x.productId === 'string' && Number.isInteger(x.quantity) && x.quantity > 0 && x.quantity <= 99).slice(0, 100);
  } catch { return []; }
}
export function writePreviewCart(slug: string, items: PreviewCartLine[]): void {
  localStorage.setItem(key(slug), JSON.stringify(items));
}
export function addPreviewCartItem(slug: string, product: Product): number {
  if (!product.isAvailable || product.variantsJson) return readPreviewCart(slug).length;
  const lines = readPreviewCart(slug);
  const existing = lines.find(x => x.productId === product.id);
  if (existing) existing.quantity = Math.min(99, existing.quantity + 1);
  else lines.push({ productId: product.id, quantity: 1 });
  writePreviewCart(slug, lines);
  return lines.length;
}
export function clearPreviewCart(slug: string): void {
  localStorage.removeItem(key(slug));
}
