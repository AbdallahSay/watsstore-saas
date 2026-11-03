/**
 * Business-category theme discovery metadata.
 * All 20 themes are fully implemented, art-directed and available for production merchants.
 */
export const BUSINESS_CATEGORIES = [
  { id: 'all', ar: 'كل الأنشطة', en: 'All industries' },
  { id: 'fashion', ar: 'أزياء وموضة', en: 'Fashion & Luxury' },
  { id: 'streetwear', ar: 'ستريت وير وأحذية', en: 'Streetwear & Sneakers' },
  { id: 'beauty', ar: 'تجميل وعناية', en: 'Beauty & Skincare' },
  { id: 'electronics', ar: 'إلكترونيات', en: 'Electronics & Tech' },
  { id: 'grocery', ar: 'أغذية وسوبر ماركت', en: 'Grocery & Food' },
  { id: 'home', ar: 'منزل وأثاث', en: 'Home & Furniture' },
  { id: 'jewelry', ar: 'مجوهرات وساعات', en: 'Jewelry & Watches' },
  { id: 'sports', ar: 'رياضة ولياقة', en: 'Sports & Fitness' },
  { id: 'kids', ar: 'أطفال وألعاب', en: 'Kids & Toys' },
  { id: 'handmade', ar: 'هدايا وحرف يدوية', en: 'Handmade & Crafts' },
  { id: 'cafe', ar: 'مقاهي ومخبوزات', en: 'Cafés & Bakeries' },
  { id: 'pets', ar: 'حيوانات أليفة', en: 'Pet Supplies' },
  { id: 'flowers', ar: 'زهور وهدايا', en: 'Flowers & Gifts' },
  { id: 'automotive', ar: 'سيارات ومحركات', en: 'Automotive & Tuning' },
  { id: 'gaming', ar: 'ألعاب وملحقات', en: 'Gaming & Gear' },
  { id: 'books', ar: 'كتب وقرطاسية', en: 'Books & Stationery' },
  { id: 'optical', ar: 'نظارات وبصريات', en: 'Eyewear & Optical' },
  { id: 'outdoor', ar: 'تخييم ورحلات', en: 'Outdoor & Adventure' },
  { id: 'travel', ar: 'سفر وأمتعة', en: 'Travel & Luggage' },
  { id: 'office', ar: 'مكاتب وشركات', en: 'Office & Business' },
] as const;

export type BusinessThemeCategory = (typeof BUSINESS_CATEGORIES)[number]['id'];

export const THEME_DESIGN_ROADMAP = [
  { id: 'editorial-luxe', name: 'Editorial Luxe', category: 'fashion', legacy: 'editorial', status: 'available' },
  { id: 'street-pulse', name: 'Street Pulse', category: 'streetwear', legacy: 'streetwear', status: 'available' },
  { id: 'pure-beauty', name: 'Pure Beauty', category: 'beauty', status: 'available' },
  { id: 'tech-grid', name: 'Tech Grid', category: 'electronics', status: 'available' },
  { id: 'fresh-market', name: 'Fresh Market', category: 'grocery', status: 'available' },
  { id: 'living-space', name: 'Living Space', category: 'home', legacy: 'lifestyle', status: 'available' },
  { id: 'golden-atelier', name: 'Golden Atelier', category: 'jewelry', status: 'available' },
  { id: 'active-motion', name: 'Active Motion', category: 'sports', status: 'available' },
  { id: 'little-joy', name: 'Little Joy', category: 'kids', status: 'available' },
  { id: 'crafted-story', name: 'Crafted Story', category: 'handmade', status: 'available' },
  { id: 'cafe-ritual', name: 'Café Ritual', category: 'cafe', status: 'available' },
  { id: 'pet-haven', name: 'Pet Haven', category: 'pets', status: 'available' },
  { id: 'bloom-studio', name: 'Bloom Studio', category: 'flowers', status: 'available' },
  { id: 'auto-circuit', name: 'Auto Circuit', category: 'automotive', status: 'available' },
  { id: 'game-arena', name: 'Game Arena', category: 'gaming', status: 'available' },
  { id: 'book-gallery', name: 'Book Gallery', category: 'books', status: 'available' },
  { id: 'optical-studio', name: 'Optical Studio', category: 'optical', status: 'available' },
  { id: 'outdoor-trail', name: 'Outdoor Trail', category: 'outdoor', status: 'available' },
  { id: 'travel-atelier', name: 'Travel Atelier', category: 'travel', status: 'available' },
  { id: 'office-pro', name: 'Office Pro', category: 'office', status: 'available' },
] as const;

/** Category mappings for theme recommendations */
export const LEGACY_THEME_CATEGORIES: Record<string, readonly BusinessThemeCategory[]> = {
  editorial: ['fashion', 'beauty', 'jewelry', 'handmade'],
  streetwear: ['streetwear', 'sports', 'electronics', 'gaming'],
  'pure-beauty': ['beauty', 'jewelry', 'flowers'],
  lifestyle: ['home', 'kids', 'grocery', 'handmade', 'cafe'],
  'cafe-ritual': ['cafe', 'grocery'],
  'pet-haven': ['pets', 'home'],
  'bloom-studio': ['flowers', 'handmade'],
  'auto-circuit': ['automotive', 'electronics'],
  'game-arena': ['gaming', 'electronics'],
  'book-gallery': ['books', 'office'],
  'optical-studio': ['optical', 'fashion'],
  'outdoor-trail': ['outdoor', 'sports'],
  'travel-atelier': ['travel', 'fashion'],
  'office-pro': ['office', 'electronics'],
};
