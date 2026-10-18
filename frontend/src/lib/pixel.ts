/**
 * Meta Pixel Tracking Utility for Dual Meta Pixel Architecture:
 * 1. Platform Pixel (WatsStore SaaS Owner) -> tracks PageView, Lead, CompleteRegistration
 * 2. Merchant Store Pixel (Individual store if Pro/VIP) -> tracks ViewContent, AddToCart, Purchase
 */

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
  }
}

export const pixel = {
  pageView: (pixelId?: string) => {
    if (typeof window !== 'undefined' && window.fbq) {
      if (pixelId) {
        window.fbq('trackSingle', pixelId, 'PageView');
      } else {
        window.fbq('track', 'PageView');
      }
    }
  },

  viewContent: (pixelId: string | undefined, data: {
    content_name: string;
    content_ids: string[];
    content_type: string;
    value?: number;
    currency?: string;
  }) => {
    if (typeof window !== 'undefined' && window.fbq) {
      if (pixelId) {
        window.fbq('trackSingle', pixelId, 'ViewContent', data);
      } else {
        window.fbq('track', 'ViewContent', data);
      }
    }
  },

  addToCart: (pixelId: string | undefined, data: {
    content_name: string;
    content_ids: string[];
    content_type: string;
    value: number;
    currency: string;
  }) => {
    if (typeof window !== 'undefined' && window.fbq) {
      if (pixelId) {
        window.fbq('trackSingle', pixelId, 'AddToCart', data);
      } else {
        window.fbq('track', 'AddToCart', data);
      }
    }
  },

  lead: (pixelId: string | undefined, data?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.fbq) {
      if (pixelId) {
        window.fbq('trackSingle', pixelId, 'Lead', data || {});
      } else {
        window.fbq('track', 'Lead', data || {});
      }
    }
  },

  purchase: (pixelId: string | undefined, data: {
    content_ids: string[];
    content_type: string;
    value: number;
    currency: string;
    num_items: number;
  }) => {
    if (typeof window !== 'undefined' && window.fbq) {
      if (pixelId) {
        window.fbq('trackSingle', pixelId, 'Purchase', data);
      } else {
        window.fbq('track', 'Purchase', data);
      }
    }
  },
};
