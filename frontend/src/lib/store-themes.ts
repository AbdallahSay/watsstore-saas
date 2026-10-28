/**
 * WatsStore public storefront themes.
 * Deliberately isolated from the merchant dashboard and SaaS marketing pages.
 */
export const STORE_THEME_IDS = ['editorial', 'streetwear', 'lifestyle'] as const;
export type StoreThemeId = (typeof STORE_THEME_IDS)[number];

export interface StoreTheme {
  id: StoreThemeId;
  name: string;
  description: string;
  cssClass: string;
  colorScheme: 'light' | 'dark';
  fontMood: 'editorial' | 'bold' | 'warm';
}

export const STORE_THEMES: Record<StoreThemeId, StoreTheme> = {
  editorial: {
    id: 'editorial',
    name: 'Editorial Atelier',
    description: 'Quiet, editorial retail for beauty, scents and premium goods',
    cssClass: 'ws-theme--editorial',
    colorScheme: 'light',
    fontMood: 'editorial',
  },
  streetwear: {
    id: 'streetwear',
    name: 'Bold Streetwear',
    description: 'High-contrast commerce for fashion and sneakers',
    cssClass: 'ws-theme--streetwear',
    colorScheme: 'dark',
    fontMood: 'bold',
  },
  lifestyle: {
    id: 'lifestyle',
    name: 'Warm Lifestyle',
    description: 'Inviting, natural retail for home and everyday objects',
    cssClass: 'ws-theme--lifestyle',
    colorScheme: 'light',
    fontMood: 'warm',
  },
};

export function parseStoreTheme(value: string | null | undefined): StoreThemeId {
  return STORE_THEME_IDS.find((id) => id === value) ?? 'editorial';
}

export function getStoreTheme(value: string | null | undefined): StoreTheme {
  return STORE_THEMES[parseStoreTheme(value)];
}
