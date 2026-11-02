/**
 * Pure Beauty visual specification — unreleased.
 *
 * Design identity is independent of the merchant dashboard appearance.
 * This module is intentionally NOT registered as publishable yet.
 * Backend persistence, full component layout and checkout QA must land first.
 */
export const PURE_BEAUTY = {
  id: 'pure-beauty',
  status: 'in-development',
  categories: ['beauty', 'skincare', 'perfume'],
  visualLanguage: 'soft editorial skincare',
  assets: {hero: 'merchant-cover', products: 'merchant-catalog'},
  tokens: {
    background: '#fff9f6',
    foreground: '#322525',
    surface: '#ffffff',
    softSurface: '#f6e9e6',
    accent: '#9a4c60',
    accentContrast: '#ffffff',
    muted: '#715e62',
    border: '#e2cdd0',
    focus: '#7544a5',
  },
  layout: {
    hero: 'split-portrait',
    categoryNavigation: 'horizontal-pills',
    catalog: 'airy-product-grid',
    productImageRatio: '4/5',
    desktopColumns: 3,
    mobileColumns: 2,
    productDetail: 'gallery-with-sticky-purchase-panel',
  },
} as const;
